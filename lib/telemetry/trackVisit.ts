import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface VisitPayload {
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  timezone?: string | null;
  isp?: string | null;
  ip?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  sessionId?: string | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
  language?: string | null;
  locationSource?: 'gps_wifi' | 'ip_triangulated' | 'edge_header' | null;
}

export interface GeoData {
  country: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
  isp: string | null;
  source?: 'gps_wifi' | 'ip_triangulated' | 'edge_header';
}

export interface EdgeGeoHeaders {
  country?: string | null;
  region?: string | null;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  timezone?: string | null;
}

/**
 * Robust bot and automated crawler detector to prevent crawlers,
 * headless preview runners, and datacenter scrapers from cluttering analytics.
 */
export function isBot(ua?: string | null): boolean {
  if (!ua) return false;
  return /bot|crawler|spider|bingbot|googlebot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|headlesschrome|headless|phantomjs|puppeteer|playwright|selenium|prerender|vercel|lighthouse|postmanruntime|ahrefs|semrush|curl|wget|python|node-fetch/i.test(
    ua
  );
}

/**
 * Reverse geocodes exact coordinates (from client GPS or Wi-Fi triangulation)
 * using BigDataCloud reverse geocode client API (fast, free, no key required).
 * Accurately extracts Nigerian states and cities (e.g. Benin City, Abuja, Ibadan, Enugu, etc.)
 * rather than misattributing to cell carrier data centers in Lagos/Port Harcourt.
 */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number
): Promise<{ city: string | null; region: string | null; country: string | null }> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      {
        signal: AbortSignal.timeout(3000),
        headers: { Accept: 'application/json' },
      }
    );
    if (!res.ok) return { city: null, region: null, country: null };
    const data = await res.json();
    const city = data.city || data.locality || null;
    const region = data.principalSubdivision || null;
    const country = data.countryCode || data.countryName || null;
    return { city, region, country };
  } catch {
    return { city: null, region: null, country: null };
  }
}

/**
 * Multi-layer precision IP geolocation.
 * 1. Queries ipinfo.io
 * 2. Fallbacks to freeipapi.com
 * 3. Fallbacks to ipapi.co
 * 4. Fallbacks to Vercel/Cloudflare edge network headers
 */
export async function resolveGeo(
  ip: string | null,
  edgeInput?: EdgeGeoHeaders | string | null,
  vercelCityLegacy?: string | null
): Promise<GeoData> {
  const edge: EdgeGeoHeaders =
    typeof edgeInput === 'object' && edgeInput !== null
      ? edgeInput
      : {
          country: typeof edgeInput === 'string' ? edgeInput : null,
          city: vercelCityLegacy || null,
        };

  const fallback: GeoData = {
    country: edge.country || null,
    region: edge.region || null,
    city: edge.city || null,
    lat: edge.lat ?? null,
    lng: edge.lng ?? null,
    timezone: edge.timezone || null,
    isp: null,
    source: 'edge_header',
  };

  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return fallback;
  }

  // 1. Try ipinfo.io
  try {
    const token = process.env.IPINFO_TOKEN;
    const url = token
      ? `https://ipinfo.io/${ip}?token=${token}`
      : `https://ipinfo.io/${ip}/json`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(2000),
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = await res.json();
      let lat: number | null = null;
      let lng: number | null = null;
      if (data.loc && typeof data.loc === 'string') {
        const parts = data.loc.split(',');
        lat = parseFloat(parts[0]) || null;
        lng = parseFloat(parts[1]) || null;
      }

      if (data.country || data.city) {
        return {
          country: data.country || edge.country || null,
          region: data.region || edge.region || null,
          city: data.city || edge.city || null,
          lat: lat ?? edge.lat ?? null,
          lng: lng ?? edge.lng ?? null,
          timezone: data.timezone || edge.timezone || null,
          isp: data.org || null,
          source: 'ip_triangulated',
        };
      }
    }
  } catch {
    // continue to secondary
  }

  // 2. Try freeipapi.com (reliable, high accuracy, free, no key required)
  try {
    const resFree = await fetch(`https://freeipapi.com/api/json/${ip}`, {
      signal: AbortSignal.timeout(2000),
      headers: { Accept: 'application/json' },
    });
    if (resFree.ok) {
      const d = await resFree.json();
      if (d && (d.cityName || d.countryCode)) {
        return {
          country: d.countryCode || edge.country || null,
          region: d.regionName || edge.region || null,
          city: d.cityName || edge.city || null,
          lat: typeof d.latitude === 'number' ? d.latitude : edge.lat ?? null,
          lng: typeof d.longitude === 'number' ? d.longitude : edge.lng ?? null,
          timezone: d.timeZone || edge.timezone || null,
          isp: null,
          source: 'ip_triangulated',
        };
      }
    }
  } catch {
    // continue to ipapi.co
  }

  // 3. Try ipapi.co fallback
  try {
    const res2 = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(2000),
      headers: { 'User-Agent': 'DynamicQR-Telemetry/1.0' },
    });
    if (res2.ok) {
      const d = await res2.json();
      if (!d.error) {
        return {
          country: d.country_code || edge.country || null,
          region: d.region || edge.region || null,
          city: d.city || edge.city || null,
          lat: typeof d.latitude === 'number' ? d.latitude : edge.lat ?? null,
          lng: typeof d.longitude === 'number' ? d.longitude : edge.lng ?? null,
          timezone: d.timezone || edge.timezone || null,
          isp: d.org || null,
          source: 'ip_triangulated',
        };
      }
    }
  } catch {
    // continue to fallback
  }

  return fallback;
}

export function parseUserAgent(ua: string) {
  const uaLower = ua.toLowerCase();

  let device = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'tablet';
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)
  ) {
    if (/iphone|ipod/i.test(ua)) {
      device = 'ios';
    } else if (/android/i.test(ua)) {
      device = 'android';
    } else {
      device = 'mobile';
    }
  }

  let browser = 'other';
  if (/edg/i.test(uaLower)) {
    browser = 'edge';
  } else if (/chrome|crios/i.test(uaLower) && !/opr|opera/i.test(uaLower)) {
    browser = 'chrome';
  } else if (/safari/i.test(uaLower) && !/chrome|crios/i.test(uaLower)) {
    browser = 'safari';
  } else if (/firefox|fxios/i.test(uaLower)) {
    browser = 'firefox';
  } else if (/opr|opera/i.test(uaLower)) {
    browser = 'opera';
  }

  let os = 'other';
  if (/iphone|ipad|ipod/i.test(uaLower)) {
    os = 'ios';
  } else if (/mac os x|macintosh/i.test(uaLower)) {
    os = 'macos';
  } else if (/windows/i.test(uaLower)) {
    os = 'windows';
  } else if (/android/i.test(uaLower)) {
    os = 'android';
  } else if (/linux/i.test(uaLower)) {
    os = 'linux';
  }

  return { device, browser, os };
}

export function hashIp(ip: string, date: Date | string = new Date()): string {
  const dateStr =
    typeof date === 'string'
      ? date.includes('T')
        ? date.split('T')[0]
        : date
      : date.toISOString().slice(0, 10);
  const secret = process.env.AUTH_SECRET || 'qr-salt';
  return crypto
    .createHash('sha256')
    .update(`${ip}-${dateStr}-${secret}`)
    .digest('hex')
    .slice(0, 16);
}

export async function recordSiteVisit(payload: VisitPayload): Promise<void> {
  try {
    const ua = payload.userAgent || '';

    // Ignore known bots, crawlers, and automated datacenter test runners
    const isDatacenterCrawler = Boolean(
      payload.isp &&
      /amazon|aws|google cloud|microsoft azure|digitalocean|hetzner|ovh|linode|oracle cloud|alibaba cloud/i.test(payload.isp) &&
      payload.screenWidth === 800 &&
      payload.screenHeight === 600
    );

    if (isBot(ua) || isDatacenterCrawler) {
      return;
    }

    const { device, browser, os } = parseUserAgent(ua);
    const ipHash = payload.ip ? hashIp(payload.ip) : null;
    const cleanPath = (payload.path || '/').split('?')[0].slice(0, 200);

    await prisma.siteVisit.create({
      data: {
        sessionId: payload.sessionId || null,
        path: cleanPath,
        referrer: payload.referrer ? payload.referrer.slice(0, 300) : null,
        userAgent: ua ? ua.slice(0, 300) : null,
        device,
        browser,
        os,
        country: payload.country ? payload.country.slice(0, 10) : null,
        region: payload.region ? payload.region.slice(0, 100) : null,
        city: payload.city ? payload.city.slice(0, 100) : null,
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        timezone: payload.timezone ? payload.timezone.slice(0, 60) : null,
        isp: payload.isp ? payload.isp.slice(0, 100) : null,
        ipHash,
        utmSource: payload.utmSource ? payload.utmSource.slice(0, 50) : null,
        utmMedium: payload.utmMedium ? payload.utmMedium.slice(0, 50) : null,
        utmCampaign: payload.utmCampaign ? payload.utmCampaign.slice(0, 50) : null,
        screenWidth: payload.screenWidth ?? null,
        screenHeight: payload.screenHeight ?? null,
        language: payload.language ? payload.language.slice(0, 20) : null,
      },
    });
  } catch (err) {
    console.warn('[Telemetry] recordSiteVisit failed:', err);
  }
}

/**
 * Upsert a VisitorSession row for session-level aggregation.
 * Strictly ignores bots and automated crawlers to keep admin recordings pure.
 */
export async function upsertVisitorSession(
  sessionId: string,
  payload: VisitPayload,
  geo: GeoData
): Promise<string | null> {
  try {
    const ua = payload.userAgent || '';
    const isDatacenterCrawler = Boolean(
      (geo.isp || payload.isp) &&
      /amazon|aws|google cloud|microsoft azure|digitalocean|hetzner|ovh|linode|oracle cloud|alibaba cloud/i.test((geo.isp || payload.isp) || '') &&
      payload.screenWidth === 800 &&
      payload.screenHeight === 600
    );

    if (isBot(ua) || isDatacenterCrawler) {
      return null;
    }

    const { device, browser, os } = parseUserAgent(ua);
    const ipHash = payload.ip ? hashIp(payload.ip) : null;

    const existing = await prisma.visitorSession.findUnique({ where: { id: sessionId } });

    if (existing) {
      // If higher precision geo arrived (e.g. from client GPS), update session geo
      const shouldUpdateGeo =
        (!existing.lat && geo.lat) ||
        (geo.source === 'gps_wifi' && existing.city !== geo.city);

      await prisma.visitorSession.update({
        where: { id: sessionId },
        data: {
          pageCount: { increment: 1 },
          updatedAt: new Date(),
          ...(shouldUpdateGeo && {
            country: geo.country || existing.country,
            region: geo.region || existing.region,
            city: geo.city || existing.city,
            lat: geo.lat ?? existing.lat,
            lng: geo.lng ?? existing.lng,
          }),
        },
      });
      return sessionId;
    }

    await prisma.visitorSession.create({
      data: {
        id: sessionId,
        ipHash,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        lat: geo.lat,
        lng: geo.lng,
        timezone: geo.timezone,
        isp: geo.isp,
        device,
        browser,
        os,
        userAgent: ua.slice(0, 300),
        screenWidth: payload.screenWidth ?? null,
        screenHeight: payload.screenHeight ?? null,
        language: payload.language ?? null,
        referrer: payload.referrer ? payload.referrer.slice(0, 300) : null,
        utmSource: payload.utmSource ?? null,
        utmMedium: payload.utmMedium ?? null,
        utmCampaign: payload.utmCampaign ?? null,
        entryPath: (payload.path || '/').split('?')[0].slice(0, 200),
      },
    });
  } catch (err) {
    console.warn('[Telemetry] upsertVisitorSession failed:', err);
  }
  return sessionId;
}

/**
 * Direct precision geolocation triangulation update when coordinates arrive from client GPS/Wi-Fi
 */
export async function updateSessionPrecisionGeo(
  sessionId: string,
  lat: number,
  lng: number
): Promise<void> {
  try {
    const location = await reverseGeocodeCoords(lat, lng);
    if (!location.city && !location.region && !location.country) return;

    await prisma.visitorSession.update({
      where: { id: sessionId },
      data: {
        lat,
        lng,
        city: location.city,
        region: location.region,
        country: location.country,
        updatedAt: new Date(),
      },
    });

    // Also update recent visits for this session
    await prisma.siteVisit.updateMany({
      where: { sessionId },
      data: {
        lat,
        lng,
        city: location.city,
        region: location.region,
        country: location.country,
      },
    });
  } catch (err) {
    console.warn('[Telemetry] updateSessionPrecisionGeo failed:', err);
  }
}
