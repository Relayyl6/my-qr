import {
  getDomainPricingConfig,
  calculateDomainPrice,
  DomainPricingConfig,
  DEFAULT_PRICING_CONFIG,
  getActivePricingConfigSync,
} from './fxEngine';
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
  // Rely strictly on Admin Sovereignty Console configuration (with active in-memory DB sync)
  const activeConfig = config || getActivePricingConfigSync();
  const calc = calculateDomainPrice(wholesaleUsd, tld, activeConfig);
  return {
    wholesaleUsd,
    wholesaleNgn: calc.wholesaleNgn,
    platformFeeNgn: calc.platformMarkupNgn,
    totalNgn: calc.finalPriceNgn,
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

export interface SearchDomainsOptions {
  offset?: number;
  limit?: number;
}

export type DomainSearchResponse = DomainSearchResult[] & {
  hasMore?: boolean;
  nextOffset?: number | null;
  totalAvailableTlds?: number;
};

/**
 * Searches domain availability across TLDs using live Registrar API or DNS probing
 * Safely fetches in batches of 10 to protect DNS rate limits and maintain fast search performance
 */
export async function searchDomains(
  rawQuery: string,
  options?: SearchDomainsOptions
): Promise<DomainSearchResponse> {
  const cleaned = rawQuery.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '');
  if (!cleaned || cleaned.length < 2) {
    const empty: any = [];
    empty.hasMore = false;
    empty.nextOffset = null;
    empty.totalAvailableTlds = 0;
    return empty;
  }

  const parts = cleaned.split('.');
  const label = parts[0];
  const requestedTld = parts[1];

  let tldsToCheck: string[];
  let hasMore = false;
  let nextOffset: number | null = null;
  const totalAvailableTlds = requestedTld ? 1 : SUPPORTED_TLDS.length;

  if (requestedTld) {
    tldsToCheck = [requestedTld];
    hasMore = false;
    nextOffset = null;
  } else {
    const offset = Math.max(0, options?.offset || 0);
    const limit = Math.max(1, Math.min(10, options?.limit || 10)); // strictly capped at 10 to protect DNS rate limits
    tldsToCheck = SUPPORTED_TLDS.slice(offset, offset + limit);
    hasMore = offset + limit < SUPPORTED_TLDS.length;
    nextOffset = hasMore ? offset + limit : null;
  }

  // Check if live Domain Name API is configured (either API Key or Username/Password)
  const dnaApiKey = process.env.DNA_API_KEY;
  const dnaResellerId = process.env.DNA_RESELLER_ID || 'e2087205-ac6f-d5c2-1edd-3a25248464f9';
  const dnaUsername = process.env.DNA_USERNAME;
  const dnaPassword = process.env.DNA_PASSWORD;

  // Load active dynamic pricing & scaled FX configuration
  const pricingConfig = await getDomainPricingConfig().catch(() => null);

  let results: DomainSearchResult[] = [];

  if (dnaApiKey) {
    try {
      const searchPromises = tldsToCheck.map(async (tld) => {
        const domain = `${label}.${tld}`;
        try {
          const res = await fetch('https://api.domainresellerapi.com/api/v1/domains/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': dnaApiKey,
              '__reseller': dnaResellerId,
            },
            body: JSON.stringify({ domainName: domain }),
          });
          const data = await res.json();
          const available = data.info?.status === 'AVAILABLE' || data.status === 'AVAILABLE' || data.isAvailable === true;
          const wholesaleUsd = Number(data.info?.price || WHOLESALE_USD_PRICING[tld] || 10.0);
          return {
            domain,
            tld,
            available,
            pricing: available ? calculateNgnPricing(wholesaleUsd, tld, pricingConfig || undefined) : null,
          };
        } catch {
          return null;
        }
      });
      const settled = await Promise.all(searchPromises);
      const valid = settled.filter(Boolean) as DomainSearchResult[];
      if (valid.length > 0) results = valid;
    } catch (err) {
      console.warn('[DomainResellerAPI] Live search error, falling back:', err);
    }
  } else if (dnaUsername && dnaPassword) {
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
        results = dnaData.data.map((item: any) => {
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
  if (results.length === 0) {
    results = await Promise.all(
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
  }

  const response: any = results;
  response.hasMore = hasMore;
  response.nextOffset = nextOffset;
  response.totalAvailableTlds = totalAvailableTlds;
  return response;
}
