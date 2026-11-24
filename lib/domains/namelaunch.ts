import dns from 'dns';
import { promisify } from 'util';
import { getDomainPricingConfig, calculateDomainPrice, DomainPricingConfig } from './fxEngine';

const resolveNs = promisify(dns.resolveNs);
const resolveSoa = promisify(dns.resolveSoa);

export interface DomainPricing {
  wholesaleUsd: number;
  wholesaleNgn: number;
  platformFeeNgn: number;
  totalNgn: number;
}

export interface DomainSearchResult {
  domain: string;
  tld: string;
  available: boolean;
  pricing: DomainPricing | null;
}

export const SUPPORTED_TLDS = ['xyz', 'site', 'store', 'online', 'com', 'net', 'org', 'co', 'io'] as const;
export const BUDGET_TLDS = new Set(['xyz', 'site', 'store', 'online']);

// Base wholesale USD pricing per TLD
export const WHOLESALE_USD_PRICING: Record<string, number> = {
  xyz: 2.10,
  site: 2.40,
  store: 2.80,
  online: 2.30,
  com: 10.50,
  net: 11.80,
  org: 10.90,
  co: 11.50,
  io: 34.00,
};

export function calculateNgnPricing(
  wholesaleUsd: number,
  tld: string = 'xyz',
  config?: DomainPricingConfig
): DomainPricing {
  if (config) {
    const calc = calculateDomainPrice(wholesaleUsd, tld, config);
    return {
      wholesaleUsd,
      wholesaleNgn: calc.wholesaleNgn,
      platformFeeNgn: calc.platformMarkupNgn,
      totalNgn: calc.finalPriceNgn,
    };
  }

  // Fallback buffered rate calculation
  const fxRate = Number(process.env.USD_TO_NGN_RATE || 1400);
  const platformFeeNgn = Number(process.env.PLATFORM_MARKUP_NGN || 2500);
  const wholesaleNgn = Math.ceil(wholesaleUsd * fxRate);
  const totalNgn = Math.ceil((wholesaleNgn + platformFeeNgn) / 100) * 100;

  return {
    wholesaleUsd,
    wholesaleNgn,
    platformFeeNgn,
    totalNgn,
  };
}

/**
 * Check if a domain has active DNS nameservers or SOA record
 */
async function checkDnsRegistered(domain: string): Promise<boolean> {
  try {
    await resolveNs(domain);
    return true; // Nameservers resolved -> domain is taken
  } catch (err: any) {
    if (err.code === 'ENOTFOUND' || err.code === 'NODATA') {
      try {
        await resolveSoa(domain);
        return true;
      } catch {
        return false; // Neither NS nor SOA -> likely available
      }
    }
    return false;
  }
}

/**
 * Searches domain availability across TLDs using live Registrar API or DNS probing
 */
export async function searchDomains(rawQuery: string): Promise<DomainSearchResult[]> {
  const cleaned = rawQuery.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '');
  if (!cleaned || cleaned.length < 2) {
    return [];
  }

  const parts = cleaned.split('.');
  const label = parts[0];
  const requestedTld = parts[1];

  const tldsToCheck = requestedTld
    ? Array.from(new Set([requestedTld, ...SUPPORTED_TLDS]))
    : [...SUPPORTED_TLDS];

  // Check if live Domain Name API is configured
  const dnaUsername = process.env.DNA_USERNAME;
  const dnaPassword = process.env.DNA_PASSWORD;

  // Load active dynamic pricing & scaled FX configuration
  const pricingConfig = await getDomainPricingConfig().catch(() => null);

  if (dnaUsername && dnaPassword) {
    try {
      const dnaRes = await fetch('https://api.domainnameapi.com/api/Domain/CheckAvailability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          UserName: dnaUsername,
          Password: dnaPassword,
          DomainList: tldsToCheck.map((tld) => `${label}.${tld}`),
          Period: 1,
        }),
      });
      const dnaData = await dnaRes.json();
      if (dnaData && Array.isArray(dnaData.data)) {
        return dnaData.data.map((item: any) => {
          const tld = item.TLD || item.DomainName.split('.').pop() || 'xyz';
          const available = item.Status?.toLowerCase() === 'available' || item.IsAvailable === true;
          const wholesaleUsd = Number(item.Price || WHOLESALE_USD_PRICING[tld] || 10.0);
          return {
            domain: item.DomainName || `${label}.${tld}`,
            tld,
            available,
            pricing: available ? calculateNgnPricing(wholesaleUsd, tld, pricingConfig || undefined) : null,
          };
        });
      }
    } catch (err) {
      console.warn('Domain Name API query failed, falling back to DNS resolution check:', err);
    }
  }

  // Fallback: Check DNS resolution for each TLD concurrently
  const results = await Promise.all(
    tldsToCheck.map(async (tld) => {
      const domain = `${label}.${tld}`;
      const isTaken = await checkDnsRegistered(domain);
      const available = !isTaken;
      const wholesaleUsd = WHOLESALE_USD_PRICING[tld] || 12.0;

      return {
        domain,
        tld,
        available,
        pricing: available ? calculateNgnPricing(wholesaleUsd, tld, pricingConfig || undefined) : null,
      };
    })
  );

  return results;
}
