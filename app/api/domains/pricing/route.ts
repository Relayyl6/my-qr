import { NextResponse } from 'next/server';
import { calculateNgnPricing, WHOLESALE_USD_PRICING } from '@/lib/domains/namelaunch';
import { getDomainPricingConfig } from '@/lib/domains/fxEngine';

export const dynamic = 'force-dynamic';

const FEATURED_TLDS = [
  { tld: 'xyz', tagline: 'Modern & startups' },
  { tld: 'com', tagline: 'Global standard' },
  { tld: 'com.ng', tagline: 'Nigerian brands' },
  { tld: 'ng', tagline: 'Direct local identity' },
  { tld: 'org', tagline: 'Communities & NGOs' },
  { tld: 'io', tagline: 'Tech & SaaS' },
];

export async function GET() {
  try {
    const config = await getDomainPricingConfig().catch(() => null);

    const tlds = FEATURED_TLDS.map((item) => {
      const baseUsd = WHOLESALE_USD_PRICING[item.tld] || 10.5;
      const pricing = calculateNgnPricing(baseUsd, item.tld, config || undefined);
      return {
        tld: item.tld,
        tagline: item.tagline,
        priceNgn: pricing.totalNgn,
      };
    });

    return NextResponse.json(
      {
        tlds,
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
    return NextResponse.json({ tlds: [], extraEmailPriceNgn: 1500 });
  }
}
