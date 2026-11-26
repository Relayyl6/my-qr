export const PRIMARY_TLDS = [
  'com', 'xyz', 'site', 'online', 'store', 'net', 'org', 'co', 'io', 'tech'
] as const;

export const EXTENDED_TLDS = [
  // Batch 1 (Primary 10)
  'com', 'xyz', 'site', 'online', 'store', 'net', 'org', 'co', 'io', 'tech',
  // Batch 2 (Dev, Creators & App)
  'app', 'dev', 'me', 'space', 'design', 'art', 'live', 'link', 'shop', 'cloud',
  // Batch 3 (Business & Modern Identity)
  'biz', 'club', 'pro', 'agency', 'digital', 'vip', 'one', 'fit', 'global', 'work',
] as const;

export const SUPPORTED_TLDS = EXTENDED_TLDS;

export const BUDGET_TLDS = new Set([
  'xyz', 'site', 'store', 'online', 'space', 'live', 'club', 'work', 'fit', 'art', 'design', 'biz', 'link', 'pro', 'shop'
]);
export const STANDARD_TLDS = new Set([
  'com', 'net', 'org', 'tech', 'app', 'dev', 'me', 'cloud', 'digital', 'agency', 'one', 'global', 'vip'
]);
export const PREMIUM_TLDS = new Set(['co', 'io']);

export type TldTier = 'budget' | 'standard' | 'premium';

export function getTldTier(tld: string): TldTier {
  const clean = tld.toLowerCase().replace(/^\./, '');
  if (PREMIUM_TLDS.has(clean)) return 'premium';
  if (STANDARD_TLDS.has(clean)) return 'standard';
  return 'budget';
}

// Base wholesale USD pricing per TLD (standard registrar wholesale registry costs - safe against loss)
export const WHOLESALE_USD_PRICING: Record<string, number> = {
  xyz: 2.10,
  space: 2.00,
  site: 2.50,
  online: 2.50,
  store: 2.80,
  club: 3.00,
  work: 3.00,
  live: 3.00,
  fit: 3.00,
  biz: 3.50,
  art: 4.00,
  link: 4.00,
  design: 4.50,
  shop: 4.50,
  pro: 4.50,
  vip: 5.00,
  cloud: 5.00,
  digital: 5.50,
  agency: 6.00,
  one: 6.00,
  tech: 7.50,
  global: 8.00,
  me: 10.00,
  com: 10.50,
  org: 10.90,
  co: 11.50,
  net: 11.80,
  app: 12.00,
  dev: 12.00,
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
  tierCategory?: 'exact' | 'prefix' | 'extension' | 'recommended';
  matchedPrefix?: string;
}
