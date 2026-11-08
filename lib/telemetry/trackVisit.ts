import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export interface VisitPayload {
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
  country?: string | null;
  city?: string | null;
  ip?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
}

export function parseUserAgent(ua: string) {
  const uaLower = ua.toLowerCase();
  
  // Device
  let device = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'tablet';
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    if (/iphone|ipod/i.test(ua)) {
      device = 'ios';
    } else if (/android/i.test(ua)) {
      device = 'android';
    } else {
      device = 'mobile';
    }
  }

  // Browser
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

  // OS
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

export async function recordSiteVisit(payload: VisitPayload): Promise<void> {
  try {
    const ua = payload.userAgent || '';
    
    // Ignore internal prefetch / bot scrapers if known
    if (
      /bot|crawler|spider|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit/i.test(
        ua
      )
    ) {
      return;
    }

    const { device, browser, os } = parseUserAgent(ua);

    // 1-way non-reversible hash of IP for unique count without privacy violations
    const ipHash = payload.ip
      ? crypto.createHash('sha256').update(payload.ip + (process.env.AUTH_SECRET || 'qr-salt')).digest('hex').slice(0, 16)
      : null;

    // Clean paths
    const cleanPath = (payload.path || '/').split('?')[0].slice(0, 200);

    await prisma.siteVisit.create({
      data: {
        path: cleanPath,
        referrer: payload.referrer ? payload.referrer.slice(0, 300) : null,
        userAgent: ua ? ua.slice(0, 300) : null,
        device,
        browser,
        os,
        country: payload.country ? payload.country.slice(0, 10) : null,
        city: payload.city ? payload.city.slice(0, 50) : null,
        ipHash,
        utmSource: payload.utmSource ? payload.utmSource.slice(0, 50) : null,
        utmMedium: payload.utmMedium ? payload.utmMedium.slice(0, 50) : null,
        utmCampaign: payload.utmCampaign ? payload.utmCampaign.slice(0, 50) : null,
      },
    });
  } catch (err) {
    // Non-blocking silently ignored to protect user-facing latency
    console.warn('[Telemetry] recordSiteVisit failed:', err);
  }
}
