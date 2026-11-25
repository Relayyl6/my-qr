import { getDomainPricingConfig, calculateDomainPrice, DomainPricingConfig } from './fxEngine';
import {
  SUPPORTED_TLDS,
  BUDGET_TLDS,
  WHOLESALE_USD_PRICING,
  DomainPricing,
  DomainSearchResult,
} from './constants';

export * from './constants';

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
 * Check if a domain is registered using DNS-over-HTTPS (Cloudflare 1.1.1.1).
 * Uses fetch so this file remains bundlable in both server and edge runtimes.
 */
async function checkDnsRegistered(domain: string): Promise<boolean> {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`;
    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Status 0 = NOERROR with answers means NS records found (domain is taken)
    if (data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0) {
      return true;
    }
    // Status 3 = NXDOMAIN -> domain does not exist (available)
    if (data.Status === 3) return false;
    // Fallback: try SOA lookup
    const soaUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=SOA`;
    const soaRes = await fetch(soaUrl, {
      headers: { Accept: 'application/dns-json' },
      next: { revalidate: 300 },
    });
    if (soaRes.ok) {
      const soaData = await soaRes.json();
      if (soaData.Status === 0 && Array.isArray(soaData.Answer) && soaData.Answer.length > 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false; // Fail open — treat as available if DoH unreachable
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
