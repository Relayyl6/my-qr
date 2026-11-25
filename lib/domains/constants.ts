export const SUPPORTED_TLDS = ['xyz', 'site', 'store', 'online', 'com', 'net', 'org', 'co', 'io'] as const;
export const BUDGET_TLDS = new Set(['xyz', 'site', 'store', 'online']);
export const STANDARD_TLDS = new Set(['com', 'net', 'org']);
export const PREMIUM_TLDS = new Set(['co', 'io']);

export type TldTier = 'budget' | 'standard' | 'premium';

export function getTldTier(tld: string): TldTier {
  const clean = tld.toLowerCase().replace(/^\./, '');
  if (PREMIUM_TLDS.has(clean)) return 'premium';
  if (STANDARD_TLDS.has(clean)) return 'standard';
  return 'budget';
}

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
