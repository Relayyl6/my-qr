import { NextRequest, NextResponse } from 'next/server';
import {
  recordSiteVisit,
  resolveGeo,
  upsertVisitorSession,
  reverseGeocodeCoords,
  updateSessionPrecisionGeo,
  GeoData,
} from '@/lib/telemetry/trackVisit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;

    // Check for precision geo update from client-side GPS/Wi-Fi triangulation
    const clientLat = typeof body.clientLat === 'number' ? body.clientLat : null;
    const clientLng = typeof body.clientLng === 'number' ? body.clientLng : null;

    if (body.type === 'geo_update' && sessionId && clientLat !== null && clientLng !== null) {
      updateSessionPrecisionGeo(sessionId, clientLat, clientLng).catch(() => {});
      return NextResponse.json({ ok: true, triangulated: true });
    }

    const path = typeof body.path === 'string' ? body.path : '/';
    const referrer = typeof body.referrer === 'string' ? body.referrer : req.headers.get('referer');
    const userAgent = req.headers.get('user-agent') || '';

    // Prefer x-forwarded-for first, then x-real-ip
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    // Vercel edge headers as quick fallback
    const vercelCountry = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || null;
    const vercelCity = req.headers.get('x-vercel-ip-city') || null;

    // Multi-source IP geolocation
    let geo: GeoData = await resolveGeo(ip, vercelCountry, vercelCity);

    // If client supplied precision GPS/Wi-Fi coordinates, reverse geocode to defeat mobile carrier central routing
    if (clientLat !== null && clientLng !== null) {
      const accurate = await reverseGeocodeCoords(clientLat, clientLng);
      geo = {
        ...geo,
        lat: clientLat,
        lng: clientLng,
        city: accurate.city || geo.city,
        region: accurate.region || geo.region,
        country: accurate.country || geo.country,
        source: 'gps_wifi',
      };
    }

    const utmSource = typeof body.utmSource === 'string' ? body.utmSource : null;
    const utmMedium = typeof body.utmMedium === 'string' ? body.utmMedium : null;
    const utmCampaign = typeof body.utmCampaign === 'string' ? body.utmCampaign : null;
    const screenWidth = typeof body.screenWidth === 'number' ? body.screenWidth : null;
    const screenHeight = typeof body.screenHeight === 'number' ? body.screenHeight : null;
    const language = typeof body.language === 'string' ? body.language : null;
    const clientTimezone = typeof body.timezone === 'string' ? body.timezone : null;

    const payload = {
      path,
      referrer,
      userAgent,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      lat: geo.lat,
      lng: geo.lng,
      timezone: clientTimezone || geo.timezone,
      isp: geo.isp,
      ip,
      utmSource,
      utmMedium,
      utmCampaign,
      sessionId,
      screenWidth,
      screenHeight,
      language,
      locationSource: geo.source,
    };

    // Fire-and-forget both — never block the visitor's page response
    if (sessionId) {
      upsertVisitorSession(sessionId, payload, geo).catch(() => {});
    }
    recordSiteVisit(payload).catch(() => {});

    return NextResponse.json({ ok: true, geo });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
