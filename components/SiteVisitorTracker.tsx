'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Persistent session ID scoped to the browser tab
function getOrCreateSessionId(): string {
  if (typeof sessionStorage === 'undefined') return crypto.randomUUID();
  const existing = sessionStorage.getItem('dqr_sid');
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem('dqr_sid', id);
  return id;
}

export default function SiteVisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);
  const sessionId = useRef<string>('');
  const eventBuffer = useRef<unknown[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStarted = useRef(false);
  const geoTriangulated = useRef(false);

  // Flush buffered rrweb events to server
  const flush = async () => {
    const events = eventBuffer.current.splice(0);
    if (events.length === 0 || !sessionId.current) return;
    try {
      const blob = new Blob(
        [JSON.stringify({ sessionId: sessionId.current, events })],
        { type: 'application/json' }
      );
      navigator.sendBeacon?.('/api/telemetry/session', blob) ||
        fetch('/api/telemetry/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sessionId.current, events }),
          keepalive: true,
        }).catch(() => {});
    } catch {
      // non-blocking
    }
  };

  // Attempt client-side GPS/Wi-Fi triangulation to defeat telco PGW / proxy misrouting
  const attemptPrecisionTriangulation = (sid: string) => {
    if (geoTriangulated.current || typeof navigator === 'undefined' || !navigator.geolocation) return;

    const onGeoSuccess = (pos: GeolocationPosition) => {
      geoTriangulated.current = true;
      const { latitude, longitude } = pos.coords;
      fetch('/api/telemetry/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'geo_update',
          sessionId: sid,
          clientLat: latitude,
          clientLng: longitude,
        }),
      }).catch(() => {});
    };

    // If permission API is present, check permission state
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') {
            navigator.geolocation.getCurrentPosition(onGeoSuccess, () => {}, {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 300000,
            });
          }
        })
        .catch(() => {});
    }
  };

  // Start rrweb recording once per session
  const startRecording = () => {
    if (recordingStarted.current) return;
    recordingStarted.current = true;

    import('rrweb')
      .then(({ record }) => {
        record({
          emit(event: unknown) {
            eventBuffer.current.push(event);
          },
          maskInputOptions: { password: true },
          maskInputFn: (text: string, element: Element | null) => {
            const el = element as HTMLInputElement | null;
            if (
              el?.type === 'password' ||
              el?.dataset?.sensitive === 'true' ||
              el?.name?.toLowerCase().includes('password') ||
              el?.name?.toLowerCase().includes('secret')
            ) {
              return '••••••••';
            }
            return text;
          },
          recordCrossOriginIframes: false,
          sampling: {
            mousemove: 50,
            mouseInteraction: true,
            scroll: 150,
            media: 800,
            input: 'last',
          },
        });

        flushTimer.current = setInterval(flush, 10_000);
      })
      .catch(() => {
        // rrweb unavailable — continue without recording
      });
  };

  // Page-level visit beacon on each route change
  useEffect(() => {
    if (!pathname) return;
    const fullPath = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    if (lastTrackedPath.current === fullPath) return;
    lastTrackedPath.current = fullPath;

    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) return;

    // Lazy-init session ID
    if (!sessionId.current) {
      sessionId.current = getOrCreateSessionId();
    }

    const utmSource = searchParams?.get('utm_source') || null;
    const utmMedium = searchParams?.get('utm_medium') || null;
    const utmCampaign = searchParams?.get('utm_campaign') || null;

    let clientTimezone: string | null = null;
    try {
      clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
      // fallback
    }

    const payload = {
      path: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      sessionId: sessionId.current,
      utmSource,
      utmMedium,
      utmCampaign,
      screenWidth: typeof window !== 'undefined' ? window.screen.width : null,
      screenHeight: typeof window !== 'undefined' ? window.screen.height : null,
      language: typeof navigator !== 'undefined' ? navigator.language || null : null,
      timezone: clientTimezone,
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

    // Attempt precision location triangulation
    attemptPrecisionTriangulation(sessionId.current);

    // Start session recording on first real page hit
    startRecording();
  }, [pathname, searchParams]);

  // Flush on tab hide / close
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    const handleUnload = () => flush();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handleUnload);
      if (flushTimer.current) clearInterval(flushTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
