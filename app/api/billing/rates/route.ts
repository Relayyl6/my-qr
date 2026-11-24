import { NextResponse } from 'next/server';
import { getDomainPricingConfig } from '@/lib/domains/fxEngine';
import { PLANS } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getDomainPricingConfig().catch(() => null);
    const effectiveRate = config
      ? config.mode === 'manual_override'
        ? config.manualOverrideRate
        : config.bufferedRate
      : 1400;

    return NextResponse.json({
      effectiveFxRate: effectiveRate,
      currency: 'NGN',
      plans: {
        pro: {
          monthlyUsd: PLANS.pro.monthlyPrice,
          yearlyUsd: PLANS.pro.yearlyPrice,
          monthlyNgn: Math.ceil((PLANS.pro.monthlyPrice * effectiveRate) / 100) * 100,
          yearlyNgn: Math.ceil((PLANS.pro.yearlyPrice * effectiveRate) / 100) * 100,
        },
        plus: {
          monthlyUsd: PLANS.plus.monthlyPrice,
          yearlyUsd: PLANS.plus.yearlyPrice,
          monthlyNgn: Math.ceil((PLANS.plus.monthlyPrice * effectiveRate) / 100) * 100,
          yearlyNgn: Math.ceil((PLANS.plus.yearlyPrice * effectiveRate) / 100) * 100,
        },
        ultra: {
          monthlyUsd: PLANS.ultra.monthlyPrice,
          yearlyUsd: PLANS.ultra.yearlyPrice,
          monthlyNgn: Math.ceil((PLANS.ultra.monthlyPrice * effectiveRate) / 100) * 100,
          yearlyNgn: Math.ceil((PLANS.ultra.yearlyPrice * effectiveRate) / 100) * 100,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ effectiveFxRate: 1400, currency: 'NGN' });
  }
}
