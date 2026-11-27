import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { getTldTier } from './constants';

export type RoundingStep = 100 | 500 | 800 | 1000 | 900;

export interface DomainPricingConfig {
  mode: 'auto_buffered' | 'manual_override';
  liveMarketRate: number;      // e.g., 1333.50 (real-time from APILayer or ExchangeRate API)
  bufferPercent: number;       // e.g., 5.0% buffer spread against payment processor rate cuts
  bufferedRate: number;         // e.g., 1400 (scaled-up buffered rate)
  manualOverrideRate: number;  // e.g., 1450 (if admin opts to freeze an explicit FX rate)
  platformMarkupNgn: number;   // e.g., 3000 fallback global platform fee added to wholesale cost
  
  // Tiered Profit Margins (NGN)
  budgetMarkupNgn?: number;    // Starts from 3000 as added retail for budget TLDs (.xyz, .site, .store, .online)
  standardMarkupNgn?: number;  // Mid-tier standard TLDs (.com, .net, .org)
  premiumMarkupNgn?: number;   // Top-tier high-price TLDs (.co, .io, up to 8000)
  
  // Per-TLD custom profit margins (NGN) - e.g. starts from 3000 and increases by 800-1000
  tldMargins?: Record<string, number>;
  
  // Per-TLD fixed retail price overrides (NGN)
  tldOverrides: Record<string, number>; // Specific fixed retail prices in NGN (e.g., { com: 19500 })
  
  // Clean pricing progression / rounding step (nearest 100, 500, 800, 1000, or 900 charm)
  roundingStep?: RoundingStep;

  // Additional provisioned email forwarding addresses (NGN/yr per extra email beyond 1st free)
  extraEmailPriceNgn?: number;
  
  lastFetchedAt: string;
  source: string;              // 'apilayer' | 'open_er_api' | 'fallback_env'
}

export const DEFAULT_TLD_MARGIN_PROGRESSION: Record<string, number> = {
  // Budget entry: Base profit margin starts at ₦4,000 (user's exact setting)
  xyz: 4200,     // wholesale $2.10 (₦3,003) + ₦4,200 margin = ₦7,200 storefront (user's exact configuration)
  space: 4000,   // wholesale $2.00 (₦2,860) + ₦4,000 margin = ₦6,900 storefront
  site: 4000,    // wholesale $2.50 (₦3,575) + ₦4,000 margin = ₦7,600 storefront
  online: 4000,  // wholesale $2.50 (₦3,575) + ₦4,000 margin = ₦7,600 storefront
  store: 4100,   // wholesale $2.80 (₦4,004) + ₦4,100 margin = ₦8,100 storefront
  club: 4000,    // wholesale $3.00 (₦4,290) + ₦4,000 margin = ₦8,300 storefront
  work: 4000,    // wholesale $3.00 (₦4,290) + ₦4,000 margin = ₦8,300 storefront
  live: 4000,    // wholesale $3.00 (₦4,290) + ₦4,000 margin = ₦8,300 storefront
  fit: 4000,     // wholesale $3.00 (₦4,290) + ₦4,000 margin = ₦8,300 storefront
  biz: 4100,     // wholesale $3.50 (₦5,005) + ₦4,100 margin = ₦9,100 storefront

  // Standard mid-tier: steps up to ₦4,200 - ₦5,200
  art: 4200,     // wholesale $4.00 (₦5,720) + ₦4,200 margin = ₦9,900 storefront
  link: 4200,    // wholesale $4.00 (₦5,720) + ₦4,200 margin = ₦9,900 storefront
  design: 4500,  // wholesale $4.50 (₦6,435) + ₦4,500 margin = ₦10,900 storefront
  shop: 4500,    // wholesale $4.50 (₦6,435) + ₦4,500 margin = ₦10,900 storefront
  pro: 4500,     // wholesale $4.50 (₦6,435) + ₦4,500 margin = ₦10,900 storefront
  vip: 4800,     // wholesale $5.00 (₦7,150) + ₦4,800 margin = ₦12,000 storefront
  cloud: 4800,   // wholesale $5.00 (₦7,150) + ₦4,800 margin = ₦12,000 storefront
  digital: 5000, // wholesale $5.50 (₦7,865) + ₦5,000 margin = ₦12,900 storefront
  agency: 5200,  // wholesale $6.00 (₦8,580) + ₦5,200 margin = ₦13,800 storefront
  one: 5200,     // wholesale $6.00 (₦8,580) + ₦5,200 margin = ₦13,800 storefront

  // Tech, Developer & Commercial: steps up to ₦5,500 - ₦7,500
  global: 5500,  // wholesale $8.00 (₦11,440) + ₦5,500 margin = ₦16,900 storefront
  tech: 5500,    // wholesale $7.50 (₦10,725) + ₦5,500 margin = ₦16,200 storefront
  me: 5500,      // wholesale $10.00 (₦14,300) + ₦5,500 margin = ₦19,800 storefront
  com: 5800,     // wholesale $10.50 (₦15,015) + ₦5,800 margin = ₦20,800 storefront
  org: 6800,     // wholesale $10.90 (₦15,587) + ₦6,800 margin = ₦22,400 storefront
  app: 5500,     // wholesale $12.00 (₦17,160) + ₦5,500 margin = ₦22,700 storefront
  dev: 5500,     // wholesale $12.00 (₦17,160) + ₦5,500 margin = ₦22,700 storefront
  co: 7000,      // wholesale $11.50 (₦16,445) + ₦7,000 margin = ₦23,400 storefront
  net: 7500,     // wholesale $11.80 (₦16,874) + ₦7,500 margin = ₦24,400 storefront

  // Premium: reaches ₦8,000
  io: 8000,      // wholesale $34.00 (₦48,620) + ₦8,000 margin = ₦56,600 storefront
};

export const DEFAULT_PRICING_CONFIG: DomainPricingConfig = {
  mode: 'auto_buffered',
  liveMarketRate: 1450.0,
  bufferPercent: 5.0,
  bufferedRate: 1550,
  manualOverrideRate: 1550,
  platformMarkupNgn: 3500,
  budgetMarkupNgn: 3500,
  standardMarkupNgn: 6000,
  premiumMarkupNgn: 8500,
  tldMargins: { ...DEFAULT_TLD_MARGIN_PROGRESSION },
  tldOverrides: {},
  roundingStep: 100,
  extraEmailPriceNgn: 1500,
  lastFetchedAt: new Date().toISOString(),
  source: 'currency_api_cdn',
};

const CACHE_KEY = 'domain_pricing_config';
const FALLBACK_FILE_PATH = path.join(process.cwd(), 'lib', 'domains', 'db-pricing-fallback.json');

// Write latest admin configuration to local persistent file so server reboots or DB outages never revert to stale seeds
function syncDiskFallback(config: DomainPricingConfig) {
  try {
    const dir = path.dirname(FALLBACK_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[FX Engine] Unable to persist pricing config disk fallback:', err);
  }
}

// Read latest configuration from disk fallback if database is temporarily unavailable
function readDiskFallback(): DomainPricingConfig | null {
  try {
    if (fs.existsSync(FALLBACK_FILE_PATH)) {
      const raw = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.bufferedRate === 'number') {
        return parsed as DomainPricingConfig;
      }
    }
  } catch (err) {
    console.warn('[FX Engine] Unable to load pricing config disk fallback:', err);
  }
  return null;
}

// Active in-memory cache of the admin's database configuration to guarantee synchronous calls never use stale static seeds
let activeAdminPricingConfig: DomainPricingConfig | null = null;

export function getActivePricingConfigSync(): DomainPricingConfig {
  if (activeAdminPricingConfig) return activeAdminPricingConfig;
  const disk = readDiskFallback();
  if (disk) {
    activeAdminPricingConfig = disk;
    return disk;
  }
  return DEFAULT_PRICING_CONFIG;
}

/**
 * Scale up a raw market rate with safety buffer (e.g. 1333 -> 1400)
 */
export function scaleBufferedRate(rawRate: number, bufferPercent: number = 5.0): number {
  if (!rawRate || rawRate <= 0) return 1400;
  const scaled = rawRate * (1 + bufferPercent / 100);
  // Round up to nearest 10 or 50 for clean storefront math
  return Math.ceil(scaled / 10) * 10;
}

/**
 * Fetch live USD to NGN rate from free, unlimited-volume exchange rate APIs (no API key or monthly quota).
 */
export async function fetchLiveUsdToNgnRate(): Promise<{ rate: number; source: string }> {
  // 1. Primary: FawazAhmed0 Currency API on jsDelivr CDN (unlimited req/mo, no key, global edge)
  try {
    const res = await fetch(
      'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data && data.usd?.ngn) {
      return { rate: Number(data.usd.ngn), source: 'currency_api_cdn' };
    }
  } catch (err) {
    console.warn('[FX Engine] Primary currency CDN call failed, trying mirror:', err);
  }

  // 2. Mirror: FawazAhmed0 Currency API Pages mirror (unlimited req/mo, no key)
  try {
    const res = await fetch(
      'https://latest.currency-api.pages.dev/v1/currencies/usd.json',
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    if (data && data.usd?.ngn) {
      return { rate: Number(data.usd.ngn), source: 'currency_api_mirror' };
    }
  } catch (err) {
    console.warn('[FX Engine] Mirror currency API failed, trying Open-ER API:', err);
  }

  // 3. Secondary Fallback: Open Exchange Rates / Open-ER API (free, no key required)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (data && data.result === 'success' && data.rates?.NGN) {
      return { rate: Number(data.rates.NGN), source: 'open_er_api' };
    }
  } catch (err) {
    console.warn('[FX Engine] Backup Open-ER FX API failed:', err);
  }

  // 4. Environment variable fallback or safe static base
  const envRate = Number(process.env.USD_TO_NGN_RATE || 1400);
  return { rate: envRate, source: 'fallback_env' };
}

/**
 * Get current Domain Pricing Configuration from persistent database cache, with memory + disk resilience.
 * Always prefers what admin configured in DB; updates local fallbacks so DB crashes never cause money loss.
 */
export async function getDomainPricingConfig(): Promise<DomainPricingConfig> {
  // 1. Primary: Attempt reading directly from Neon database
  try {
    const record = await prisma.aiCache.findUnique({
      where: { key: CACHE_KEY },
    });

    if (record && record.value) {
      const val = record.value as any;
      const merged: DomainPricingConfig = {
        ...DEFAULT_PRICING_CONFIG,
        ...val,
        tldMargins: {
          ...DEFAULT_TLD_MARGIN_PROGRESSION,
          ...(val.tldMargins || {}),
        },
      };
      if (!merged.budgetMarkupNgn || merged.budgetMarkupNgn < 3000) {
        merged.budgetMarkupNgn = 3000;
      }
      if (typeof merged.extraEmailPriceNgn !== 'number' || merged.extraEmailPriceNgn <= 0) {
        merged.extraEmailPriceNgn = 1500;
      }

      // Update in-memory cache and write to persistent disk fallback
      activeAdminPricingConfig = merged;
      syncDiskFallback(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[FX Engine] Database read failed for domain pricing config:', err);
  }

  // 2. Secondary: If DB failed, use active in-memory cache (holds what admin set in DB)
  if (activeAdminPricingConfig) {
    return activeAdminPricingConfig;
  }

  // 3. Tertiary: If memory empty, read the disk fallback file synced from previous DB writes
  const diskFallback = readDiskFallback();
  if (diskFallback) {
    activeAdminPricingConfig = diskFallback;
    return diskFallback;
  }

  // 4. Initial Bootstrap: Fetch live rate once and populate DB
  try {
    const { rate, source } = await fetchLiveUsdToNgnRate();
    const buffered = scaleBufferedRate(rate, 5.0);
    const initialConfig: DomainPricingConfig = {
      ...DEFAULT_PRICING_CONFIG,
      liveMarketRate: Number(rate.toFixed(2)),
      bufferedRate: buffered,
      source,
      lastFetchedAt: new Date().toISOString(),
    };

    activeAdminPricingConfig = initialConfig;
    syncDiskFallback(initialConfig);

    await prisma.aiCache.upsert({
      where: { key: CACHE_KEY },
      create: {
        key: CACHE_KEY,
        value: initialConfig as any,
        expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
      },
      update: {
        value: initialConfig as any,
      },
    }).catch(() => {});

    return initialConfig;
  } catch {
    return DEFAULT_PRICING_CONFIG;
  }
}

/**
 * Save updated Domain Pricing Configuration from Admin Sovereignty Console
 */
export async function saveDomainPricingConfig(updates: Partial<DomainPricingConfig>): Promise<DomainPricingConfig> {
  const current = await getDomainPricingConfig();
  const next: DomainPricingConfig = {
    ...current,
    ...updates,
    lastFetchedAt: updates.lastFetchedAt || current.lastFetchedAt,
  };

  // Recalculate bufferedRate if raw rate or buffer percent changed
  if (updates.liveMarketRate || updates.bufferPercent !== undefined) {
    const market = updates.liveMarketRate || current.liveMarketRate;
    const buf = updates.bufferPercent !== undefined ? updates.bufferPercent : current.bufferPercent;
    next.bufferedRate = scaleBufferedRate(market, buf);
  }

  await prisma.aiCache.upsert({
    where: { key: CACHE_KEY },
    create: {
      key: CACHE_KEY,
      value: next as any,
      expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
    },
    update: {
      value: next as any,
    },
  });

  // Keep in-memory and disk fallback in 100% lockstep with DB
  activeAdminPricingConfig = next;
  syncDiskFallback(next);
  return next;
}

/**
 * Clean retail price rounding / progression step (e.g. 500, 800, 1000, 900 charm, or 100)
 * Uses Math.round to round to the nearest progression step so a ₦3 variance does not jump a full ₦1,000!
 */
export function applyRoundingStep(rawAmount: number, step: RoundingStep = 100): number {
  if (step === 900) {
    const roundedThousand = Math.round(rawAmount / 1000) * 1000;
    const charm = roundedThousand - 100;
    return charm > 0 ? charm : 900;
  }
  const s = step || 100;
  return Math.max(s, Math.round(rawAmount / s) * s);
}

export interface CalculatedDomainPrice {
  wholesaleUsd: number;
  wholesaleNgn: number;
  effectiveFxRate: number;
  platformMarkupNgn: number;
  finalPriceNgn: number;
  isOverride: boolean;
}

/**
 * Calculate final price for any domain given wholesale USD and TLD
 */
export function calculateDomainPrice(
  wholesaleUsd: number,
  tld: string,
  config: DomainPricingConfig
): CalculatedDomainPrice {
  const cleanTld = tld.toLowerCase().replace(/^\./, '');
  const effectiveRate = config.mode === 'manual_override' ? config.manualOverrideRate : config.bufferedRate;
  const wholesaleNgn = Math.ceil(wholesaleUsd * effectiveRate);
  
  // 1. Check if admin set an explicit fixed retail price override for this specific TLD
  if (
    config.tldOverrides &&
    typeof config.tldOverrides[cleanTld] === 'number' &&
    config.tldOverrides[cleanTld] > 0
  ) {
    const overridePrice = config.tldOverrides[cleanTld];
    return {
      wholesaleUsd,
      wholesaleNgn,
      effectiveFxRate: effectiveRate,
      platformMarkupNgn: Math.max(0, overridePrice - wholesaleNgn),
      finalPriceNgn: overridePrice,
      isOverride: true,
    };
  }

  // 2. Determine target profit margin from Admin Console:
  // a) Check per-TLD margin override first
  let targetMargin = config.tldMargins?.[cleanTld];
  if (typeof targetMargin !== 'number' || targetMargin <= 0) {
    // b) Check tiered margin configured in admin console
    const tier = getTldTier(cleanTld);
    if (tier === 'premium') {
      targetMargin = typeof config.premiumMarkupNgn === 'number' && config.premiumMarkupNgn > 0 ? config.premiumMarkupNgn : 8000;
    } else if (tier === 'standard') {
      targetMargin = typeof config.standardMarkupNgn === 'number' && config.standardMarkupNgn > 0 ? config.standardMarkupNgn : 5500;
    } else {
      targetMargin = typeof config.budgetMarkupNgn === 'number' && config.budgetMarkupNgn > 0 ? config.budgetMarkupNgn : (config.platformMarkupNgn || 3000);
    }
  }

  // 3. Raw retail = wholesaleNgn + targetMargin
  const rawTotal = wholesaleNgn + targetMargin;
  const roundingStep = config.roundingStep || 100;
  const finalPriceNgn = applyRoundingStep(rawTotal, roundingStep);

  return {
    wholesaleUsd,
    wholesaleNgn,
    effectiveFxRate: effectiveRate,
    platformMarkupNgn: Math.max(0, finalPriceNgn - wholesaleNgn),
    finalPriceNgn,
    isOverride: false,
  };
}

export interface MultiYearDomainPrice {
  periodYears: 1 | 2 | 3;
  discountPercent: number; // 0 for 1yr, 5 for 2yr, 10 for 3yr
  wholesaleUsd: number;
  wholesaleNgn: number;
  yearlyPriceNgn: number;
  finalPriceNgn: number;
  savingsNgn: number;
  founderProfitNgn: number;
}

/**
 * Calculates multi-year bundled registration pricing with incentives:
 * - 1 Year: Standard base price
 * - 2 Years: 5% Bundle Discount
 * - 3 Years: 10% Bundle Discount
 */
export function calculateMultiYearDomainPrice(
  wholesaleUsd: number,
  tld: string,
  config: DomainPricingConfig,
  periodYears: 1 | 2 | 3 = 1
): MultiYearDomainPrice {
  const base1Year = calculateDomainPrice(wholesaleUsd, tld, config);
  const discountPercent = periodYears === 3 ? 10 : periodYears === 2 ? 5 : 0;
  const effectiveRate = config.mode === 'manual_override' ? config.manualOverrideRate : config.bufferedRate;

  const totalWholesaleUsd = wholesaleUsd * periodYears;
  const totalWholesaleNgn = Math.ceil(totalWholesaleUsd * effectiveRate);

  const rawSubtotal = base1Year.finalPriceNgn * periodYears;
  const savingsNgn = Math.round(rawSubtotal * (discountPercent / 100));
  const finalPriceNgn = rawSubtotal - savingsNgn;
  const founderProfitNgn = Math.max(0, finalPriceNgn - totalWholesaleNgn);

  return {
    periodYears,
    discountPercent,
    wholesaleUsd: totalWholesaleUsd,
    wholesaleNgn: totalWholesaleNgn,
    yearlyPriceNgn: base1Year.finalPriceNgn,
    finalPriceNgn,
    savingsNgn,
    founderProfitNgn,
  };
}
