import { NextRequest, NextResponse } from 'next/server';
import { recordSiteVisit } from '@/lib/telemetry/trackVisit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === 'string' ? body.path : '/';
    const referrer = typeof body.referrer === 'string' ? body.referrer : req.headers.get('referer');
    const userAgent = req.headers.get('user-agent') || '';
    const country =
      req.headers.get('x-vercel-ip-country') ||
      req.headers.get('cf-ipcountry') ||
      null;
    const city = req.headers.get('x-vercel-ip-city') || null;
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      null;

    const utmSource = typeof body.utmSource === 'string' ? body.utmSource : null;
    const utmMedium = typeof body.utmMedium === 'string' ? body.utmMedium : null;
    const utmCampaign = typeof body.utmCampaign === 'string' ? body.utmCampaign : null;

    // Fire and forget (don't await indefinitely)
    recordSiteVisit({
      path,
      referrer,
      userAgent,
      country,
      city,
      ip,
      utmSource,
      utmMedium,
      utmCampaign,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
