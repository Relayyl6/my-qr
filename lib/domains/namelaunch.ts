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

  const parts = cleaned.split('.').filter(Boolean);

  interface SearchCandidate {
    domain: string;
    tld: string;
    tierCategory?: 'exact' | 'prefix' | 'extension' | 'recommended';
    matchedPrefix?: string;
  }

  let candidates: SearchCandidate[] = [];
  let hasMore = false;
  let nextOffset: number | null = null;
  let totalAvailableTlds: number = SUPPORTED_TLDS.length;

  if (parts.length >= 2) {
    // Multi-segment query: e.g. "yemuel.it" or "yemuel.it.xyz"
    const lastPart = parts[parts.length - 1];
    const isSupportedLast = (SUPPORTED_TLDS as readonly string[]).includes(lastPart);

    if (parts.length >= 3 && isSupportedLast) {
      // e.g. "yemuel.it.xyz" -> prefix is "yemuel.it", tld is "xyz"
      const prefixRaw = parts.slice(0, parts.length - 1).join('.');
      const prefixJoined = prefixRaw.replace(/[^a-z0-9]/g, '');
      const prefixHyphen = prefixRaw.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

      candidates.push({ domain: `${prefixJoined}.${lastPart}`, tld: lastPart, tierCategory: 'exact', matchedPrefix: prefixRaw });
      candidates.push({ domain: `${prefixHyphen}.${lastPart}`, tld: lastPart, tierCategory: 'prefix', matchedPrefix: prefixRaw });

      // Add popular supported extensions with this prefix
      const coreTlds = ['xyz', 'com', 'store', 'site', 'online', 'tech', 'co', 'io', 'app', 'dev'].filter(t => t !== lastPart);
      for (const t of coreTlds) {
        candidates.push({ domain: `${prefixJoined}.${t}`, tld: t, tierCategory: 'prefix', matchedPrefix: prefixRaw });
        candidates.push({ domain: `${prefixHyphen}.${t}`, tld: t, tierCategory: 'prefix', matchedPrefix: prefixRaw });
      }
    } else {
      // e.g. "yemuel.it"
      const label = parts[0];
      const suffix = parts[1];
      const prefixString = `${label}.${suffix}`;
      const joinedPrefix = `${label}${suffix}`;
      const hyphenPrefix = `${label}-${suffix}`;

      // 1. Exact match for the typed domain
      candidates.push({
        domain: `${label}.${suffix}`,
        tld: suffix,
        tierCategory: 'exact',
        matchedPrefix: prefixString,
      });

      // 2. Prefix / compound combinations with our popular TLDs (e.g. yemuelit.xyz, yemuel-it.xyz, yemuelit.com)
      const popularTlds = ['xyz', 'com', 'site', 'online', 'store', 'tech', 'net', 'org', 'co', 'io', 'app', 'dev'];
      for (const t of popularTlds) {
        candidates.push({
          domain: `${joinedPrefix}.${t}`,
          tld: t,
          tierCategory: 'prefix',
          matchedPrefix: prefixString,
        });
        candidates.push({
          domain: `${hyphenPrefix}.${t}`,
          tld: t,
          tierCategory: 'prefix',
          matchedPrefix: prefixString,
        });
      }

      // 3. Alternative extensions for base brand (yemuel.xyz, yemuel.com, etc.)
      for (const t of popularTlds) {
        if (!candidates.some(c => c.domain === `${label}.${t}`)) {
          candidates.push({
            domain: `${label}.${t}`,
            tld: t,
            tierCategory: 'extension',
          });
        }
      }
    }

    // Deduplicate candidates by domain
    const seen = new Set<string>();
    candidates = candidates.filter(c => {
      if (seen.has(c.domain)) return false;
      seen.add(c.domain);
      return true;
    });

    const offset = Math.max(0, options?.offset || 0);
    const limit = Math.max(1, Math.min(10, options?.limit || 10));
    totalAvailableTlds = candidates.length;
    hasMore = offset + limit < candidates.length;
    nextOffset = hasMore ? offset + limit : null;
    candidates = candidates.slice(offset, offset + limit);
  } else {
    // Normal single-word label (e.g. "yemuel")
    const label = parts[0];
    const offset = Math.max(0, options?.offset || 0);
    const limit = Math.max(1, Math.min(10, options?.limit || 10));
    const tldsToCheck = (SUPPORTED_TLDS as readonly string[]).slice(offset, offset + limit);
    hasMore = offset + limit < SUPPORTED_TLDS.length;
    nextOffset = hasMore ? offset + limit : null;
    candidates = tldsToCheck.map(tld => ({
      domain: `${label}.${tld}`,
      tld,
      tierCategory: 'extension',
    }));
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
      const searchPromises = candidates.map(async (c) => {
        try {
          const res = await fetch('https://api.domainresellerapi.com/api/v1/domains/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': dnaApiKey,
              '__reseller': dnaResellerId,
            },
            body: JSON.stringify({ domainName: c.domain }),
          });
          const data = await res.json();
          const available = data.info?.status === 'AVAILABLE' || data.status === 'AVAILABLE' || data.isAvailable === true;
          const wholesaleUsd = Number(data.info?.price || WHOLESALE_USD_PRICING[c.tld] || 10.0);
          return {
            domain: c.domain,
            tld: c.tld,
            available,
            pricing: available ? calculateNgnPricing(wholesaleUsd, c.tld, pricingConfig || undefined) : null,
            tierCategory: c.tierCategory,
            matchedPrefix: c.matchedPrefix,
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
          DomainList: candidates.map((c) => c.domain),
          Period: 1,
        }),
      });
      const dnaData = await dnaRes.json();
      if (dnaData && Array.isArray(dnaData.data)) {
        results = dnaData.data.map((item: any, idx: number) => {
          const c = candidates[idx] || { domain: item.DomainName, tld: item.TLD || 'xyz' };
          const tld = item.TLD || c.tld;
          const available = item.Status?.toLowerCase() === 'available' || item.IsAvailable === true;
          const wholesaleUsd = Number(item.Price || WHOLESALE_USD_PRICING[tld] || 10.0);
          return {
            domain: item.DomainName || c.domain,
            tld,
            available,
            pricing: available ? calculateNgnPricing(wholesaleUsd, tld, pricingConfig || undefined) : null,
            tierCategory: c.tierCategory,
            matchedPrefix: c.matchedPrefix,
          };
        });
      }
    } catch (err) {
      console.warn('Domain Name API query failed, falling back to DNS resolution check:', err);
    }
  }

  // Fallback: Check DNS resolution for each candidate domain concurrently
  if (results.length === 0) {
    results = await Promise.all(
      candidates.map(async (c) => {
        const isTaken = await checkDnsRegistered(c.domain);
        const available = !isTaken;
        const wholesaleUsd = WHOLESALE_USD_PRICING[c.tld] || 10.0;

        return {
          domain: c.domain,
          tld: c.tld,
          available,
          pricing: available ? calculateNgnPricing(wholesaleUsd, c.tld, pricingConfig || undefined) : null,
          tierCategory: c.tierCategory,
          matchedPrefix: c.matchedPrefix,
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
