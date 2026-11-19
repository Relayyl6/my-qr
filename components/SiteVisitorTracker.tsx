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
  const isFlushing = useRef(false);
  const rrwebRecordRef = useRef<any>(null);

  // Automatically bypass automated headless runners, preview bots, and webdrivers
  if (typeof navigator !== 'undefined' && (navigator.webdriver || !navigator.cookieEnabled)) {
    return null;
  }

  // Resilient flush: sends buffered events in safe batches
  const flush = async () => {
    if (isFlushing.current) return;
    if (eventBuffer.current.length === 0 || !sessionId.current) return;

    // Send in chunks of up to 150 events so each request is fast and well within server limits
    const batch = eventBuffer.current.splice(0, 150);
    isFlushing.current = true;

    try {
      const res = await fetch('/api/telemetry/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, events: batch }),
      });

      if (!res.ok) {
        // If HTTP error, restore events to buffer to retry
        eventBuffer.current.unshift(...batch);
      }
    } catch {
      // Restore events to buffer on network failure
      eventBuffer.current.unshift(...batch);
    } finally {
      isFlushing.current = false;
      // If there are still events in the buffer (e.g. initial full snapshot + moves > 150), flush again
      if (eventBuffer.current.length > 0) {
        setTimeout(flush, 250);
      }
    }
  };

  // Attempt client-side GPS/Wi-Fi triangulation and user-gesture location prompt
  const attemptPrecisionTriangulation = (sid: string) => {
    if (geoTriangulated.current || typeof navigator === 'undefined') return;

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

    const requestPosition = () => {
      if (!navigator.geolocation || geoTriangulated.current) return;
      navigator.geolocation.getCurrentPosition(onGeoSuccess, () => {}, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000,
      });
    };

    // 1. If permission is already granted, query immediately
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((status) => {
          if (status.state === 'granted') {
            requestPosition();
          }
        })
        .catch(() => {});
    }

    // 2. Attach a one-time user gesture trigger (click/touch/keydown).
    // In Chromium and Microsoft Edge (especially in Incognito mode),
    // calling getCurrentPosition inside a user gesture guarantees that the permission prompt
    // is NOT suppressed by the browser's permission quieting engine!
    const onUserInteraction = () => {
      document.removeEventListener('click', onUserInteraction);
      document.removeEventListener('touchstart', onUserInteraction);
      document.removeEventListener('keydown', onUserInteraction);
      requestPosition();
    };

    document.addEventListener('click', onUserInteraction, { once: true, passive: true });
    document.addEventListener('touchstart', onUserInteraction, { once: true, passive: true });
    document.addEventListener('keydown', onUserInteraction, { once: true, passive: true });
  };

  // Start rrweb recording with full DOM capture and automatic snapshots
  const startRecording = () => {
    if (recordingStarted.current) return;
    recordingStarted.current = true;

    import('rrweb')
      .then(({ record }) => {
        rrwebRecordRef.current = record;

        record({
          emit(event: unknown) {
            eventBuffer.current.push(event);
          },
          // Periodic checkout ensures player can always reconstruct full DOM
          checkoutEveryNms: 60 * 1000, // full snapshot every 60s
          checkoutEveryNth: 200, // or every 200 events
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

        // Flush the initial FullSnapshot immediately (600ms) so DOM structure is saved at once!
        setTimeout(flush, 600);

        // Regular interval flusher every 8 seconds
        flushTimer.current = setInterval(flush, 8_000);
      })
      .catch(() => {
        // rrweb unavailable — continue without recording
      });
  };

  // Page-level visit beacon and route tracking
  useEffect(() => {
    if (!pathname) return;
    const fullPath = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    if (lastTrackedPath.current === fullPath) return;
    const isNavigation = lastTrackedPath.current !== null;
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

    // Send visit ingress
    fetch('/api/telemetry/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    // Attempt precision location triangulation
    attemptPrecisionTriangulation(sessionId.current);

    // If already recording and navigating between routes, take a fresh full snapshot for the new page
    if (isNavigation && rrwebRecordRef.current?.takeFullSnapshot) {
      try {
        rrwebRecordRef.current.takeFullSnapshot(true);
        setTimeout(flush, 600);
      } catch {
        // non-blocking
      }
    } else {
      // Start session recording on first page hit
      startRecording();
    }
  }, [pathname, searchParams]);

  // Flush remaining buffer on tab hide or unload
  useEffect(() => {
    const handleUnload = () => {
      if (eventBuffer.current.length === 0 || !sessionId.current) return;
      const batch = eventBuffer.current.splice(0);
      const payload = JSON.stringify({ sessionId: sessionId.current, events: batch });

      // Only use sendBeacon if under the 60KB browser quota limit
      if (typeof navigator !== 'undefined' && navigator.sendBeacon && payload.length < 60_000) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/telemetry/session', blob);
      } else {
        // Otherwise use standard fetch (keepalive only if under 60KB to prevent browser TypeError)
        fetch('/api/telemetry/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: payload.length < 60_000,
        }).catch(() => {});
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };

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
