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
  xyz: 3000,    // Starts from 3,000 as added retail
  online: 3000, // Starts from 3,000
  site: 3000,   // Starts from 3,000
  store: 3800,  // +₦800 step
  com: 4800,    // +₦1,000 step
  org: 5800,    // +₦1,000 step
  co: 6800,     // +₦1,000 step
  net: 7500,    // +₦700 step
  io: 8000,     // Reaches ₦8,000 for higher priced domains
};

export const DEFAULT_PRICING_CONFIG: DomainPricingConfig = {
  mode: 'auto_buffered',
  liveMarketRate: 1333.33,
  bufferPercent: 5.0,
  bufferedRate: 1400,
  manualOverrideRate: 1500,
  platformMarkupNgn: 3000,
  budgetMarkupNgn: 3000,
  standardMarkupNgn: 5500,
  premiumMarkupNgn: 8000,
  tldMargins: { ...DEFAULT_TLD_MARGIN_PROGRESSION },
  tldOverrides: {},
  roundingStep: 1000,
  extraEmailPriceNgn: 1500,
  lastFetchedAt: new Date().toISOString(),
  source: 'currency_api_cdn',
};

const CACHE_KEY = 'domain_pricing_config';

// Active in-memory cache of the admin's database configuration to guarantee synchronous calls never use stale static seeds
let activeAdminPricingConfig: DomainPricingConfig | null = null;

export function getActivePricingConfigSync(): DomainPricingConfig {
  return activeAdminPricingConfig || DEFAULT_PRICING_CONFIG;
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
 * Get current Domain Pricing Configuration from persistent database cache
 */
export async function getDomainPricingConfig(): Promise<DomainPricingConfig> {
  try {
    const record = await prisma.aiCache.findUnique({
      where: { key: CACHE_KEY },
    });

    if (record && record.value) {
      const val = record.value as any;
      const merged: DomainPricingConfig = { ...DEFAULT_PRICING_CONFIG, ...val };
      if (!merged.tldMargins || Object.keys(merged.tldMargins).length === 0) {
        merged.tldMargins = { ...DEFAULT_TLD_MARGIN_PROGRESSION };
      }
      if (!merged.budgetMarkupNgn || merged.budgetMarkupNgn < 3000) {
        merged.budgetMarkupNgn = 3000;
      }
      if (typeof merged.extraEmailPriceNgn !== 'number' || merged.extraEmailPriceNgn <= 0) {
        merged.extraEmailPriceNgn = 1500;
      }
      activeAdminPricingConfig = merged;
      return merged;
    }
  } catch (err) {
    console.warn('[FX Engine] Could not read pricing config cache:', err);
  }

  // If uninitialized, fetch live rate once and populate
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

  activeAdminPricingConfig = next;
  return next;
}

/**
 * Clean retail price rounding / progression step (e.g. 500, 800, 1000, 900 charm, or 100)
 * Uses Math.round to round to the nearest progression step so a ₦3 variance does not jump a full ₦1,000!
 */
export function applyRoundingStep(rawAmount: number, step: RoundingStep = 1000): number {
  if (step === 900) {
    const roundedThousand = Math.round(rawAmount / 1000) * 1000;
    const charm = roundedThousand - 100;
    return charm > 0 ? charm : 900;
  }
  const s = step || 1000;
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
  const roundingStep = config.roundingStep || 500;
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
  const discounted = rawSubtotal * (1 - discountPercent / 100);
  const finalPriceNgn = applyRoundingStep(discounted, config.roundingStep || 500);
  const savingsNgn = Math.max(0, rawSubtotal - finalPriceNgn);
  const founderProfitNgn = Math.max(0, finalPriceNgn - totalWholesaleNgn);

  return {
    periodYears,
    discountPercent,
    wholesaleUsd: totalWholesaleUsd,
    wholesaleNgn: totalWholesaleNgn,
    yearlyPriceNgn: Math.round(finalPriceNgn / periodYears),
    finalPriceNgn,
    savingsNgn,
    founderProfitNgn,
  };
}
