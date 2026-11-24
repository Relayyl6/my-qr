import { prisma } from '@/lib/prisma';

export interface DomainPricingConfig {
  mode: 'auto_buffered' | 'manual_override';
  liveMarketRate: number;      // e.g., 1333.50 (real-time from APILayer or ExchangeRate API)
  bufferPercent: number;       // e.g., 5.0% buffer spread against payment processor rate cuts
  bufferedRate: number;         // e.g., 1400 (scaled-up buffered rate)
  manualOverrideRate: number;  // e.g., 1450 (if admin opts to freeze an explicit FX rate)
  platformMarkupNgn: number;   // e.g., 2500 platform fee added to wholesale cost
  tldOverrides: Record<string, number>; // Specific fixed retail prices in NGN (e.g., { com: 19500 })
  lastFetchedAt: string;
  source: string;              // 'apilayer' | 'open_er_api' | 'fallback_env'
}

export const DEFAULT_PRICING_CONFIG: DomainPricingConfig = {
  mode: 'auto_buffered',
  liveMarketRate: 1333.33,
  bufferPercent: 5.0,
  bufferedRate: 1400,
  manualOverrideRate: 1500,
  platformMarkupNgn: 2500,
  tldOverrides: {},
  lastFetchedAt: new Date().toISOString(),
  source: 'open_er_api',
};

const CACHE_KEY = 'domain_pricing_config';

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
 * Fetch live USD to NGN rate from APILayer (if key configured) or Open Exchange Rates API
 */
export async function fetchLiveUsdToNgnRate(): Promise<{ rate: number; source: string }> {
  const apilayerKey = process.env.APILAYER_API_KEY || process.env.EXCHANGE_RATE_API_KEY;

  // 1. Try APILayer if API Key provided
  if (apilayerKey) {
    try {
      const res = await fetch('https://api.apilayer.com/exchangerates_data/latest?base=USD&symbols=NGN', {
        headers: { apikey: apilayerKey },
        next: { revalidate: 3600 }, // 1 hour Next.js cache
      });
      const data = await res.json();
      if (data && data.success && data.rates?.NGN) {
        return { rate: Number(data.rates.NGN), source: 'apilayer' };
      }
    } catch (err) {
      console.warn('[FX Engine] APILayer call failed, trying backup API:', err);
    }
  }

  // 2. Fallback to Open Exchange Rates / Open-ER API (High availability, no API key required)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    if (data && data.result === 'success' && data.rates?.NGN) {
      return { rate: Number(data.rates.NGN), source: 'open_er_api' };
    }
  } catch (err) {
    console.warn('[FX Engine] Backup FX API failed:', err);
  }

  // 3. Environment variable fallback or safe static base
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
      return { ...DEFAULT_PRICING_CONFIG, ...(record.value as any) };
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

  return next;
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
  
  // 1. Check if admin set an explicit NGN price override for this specific TLD
  if (config.tldOverrides && typeof config.tldOverrides[cleanTld] === 'number') {
    const overridePrice = config.tldOverrides[cleanTld];
    const effectiveRate = config.mode === 'manual_override' ? config.manualOverrideRate : config.bufferedRate;
    const wholesaleNgn = Math.ceil(wholesaleUsd * effectiveRate);
    return {
      wholesaleUsd,
      wholesaleNgn,
      effectiveFxRate: effectiveRate,
      platformMarkupNgn: Math.max(0, overridePrice - wholesaleNgn),
      finalPriceNgn: overridePrice,
      isOverride: true,
    };
  }

  // 2. Standard calculation using scaled-up buffered FX rate or manual override
  const effectiveRate = config.mode === 'manual_override' ? config.manualOverrideRate : config.bufferedRate;
  const wholesaleNgn = Math.ceil(wholesaleUsd * effectiveRate);
  const rawTotal = wholesaleNgn + config.platformMarkupNgn;
  const finalPriceNgn = Math.ceil(rawTotal / 100) * 100;

  return {
    wholesaleUsd,
    wholesaleNgn,
    effectiveFxRate: effectiveRate,
    platformMarkupNgn: config.platformMarkupNgn,
    finalPriceNgn,
    isOverride: false,
  };
}
