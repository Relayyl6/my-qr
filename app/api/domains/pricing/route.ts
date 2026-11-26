import { NextResponse } from 'next/server';
import { calculateNgnPricing, WHOLESALE_USD_PRICING, SUPPORTED_TLDS } from '@/lib/domains/namelaunch';
import { getDomainPricingConfig } from '@/lib/domains/fxEngine';

export const dynamic = 'force-dynamic';

const STOREFRONT_TLD_METADATA: Record<string, string> = {
  xyz: 'Modern & startups',
  site: 'Portfolios & creators',
  online: 'Everyday identity',
  store: 'E-commerce & retail',
  com: 'Global standard',
  net: 'Networks & infrastructure',
  org: 'Communities & NGOs',
  co: 'Startups & modern brands',
  io: 'Tech & SaaS',
};

export async function GET() {
  try {
    const config = await getDomainPricingConfig().catch(() => null);

    const priceMap: Record<string, number> = {};
    const tlds = SUPPORTED_TLDS.map((tld) => {
      const baseUsd = WHOLESALE_USD_PRICING[tld] || 10.5;
      const pricing = calculateNgnPricing(baseUsd, tld, config || undefined);
      priceMap[tld] = pricing.totalNgn;
      return {
        tld,
        tagline: STOREFRONT_TLD_METADATA[tld] || 'Custom domain',
        priceNgn: pricing.totalNgn,
      };
    });

    return NextResponse.json(
      {
        tlds,
        priceMap,
        extraEmailPriceNgn: config?.extraEmailPriceNgn ?? 1500,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ tlds: [], priceMap: {}, extraEmailPriceNgn: 1500 });
  }
}
