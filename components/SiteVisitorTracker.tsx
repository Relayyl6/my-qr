'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function SiteVisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Only track if pathname is available and changed
    if (!pathname) return;
    const fullPath = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    if (lastTrackedPath.current === fullPath) return;
    lastTrackedPath.current = fullPath;

    // Do not track internal api / admin assets
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return;

    try {
      const utmSource = searchParams?.get('utm_source') || null;
      const utmMedium = searchParams?.get('utm_medium') || null;
      const utmCampaign = searchParams?.get('utm_campaign') || null;

      const payload = {
        path: pathname,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        utmSource,
        utmMedium,
        utmCampaign,
      };

      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/telemetry/visit', blob);
      } else {
        fetch('/api/telemetry/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    } catch (e) {
      // Telemetry should never crash client UI
    }
  }, [pathname, searchParams]);

  return null;
}
