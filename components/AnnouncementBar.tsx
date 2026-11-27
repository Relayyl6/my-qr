'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tag, ArrowRight, X } from 'lucide-react';

export interface BannerData {
  enabled: boolean;
  badgeText: string;
  messageText: string;
  promoCode: string;
  ctaText: string;
  ctaUrl: string;
}

const DEFAULT_BANNER: BannerData = {
  enabled: false,
  badgeText: '',
  messageText: '',
  promoCode: '',
  ctaText: '',
  ctaUrl: '',
};

interface AnnouncementBarProps {
  initialBanner?: BannerData | null;
}

export default function AnnouncementBar({ initialBanner }: AnnouncementBarProps) {
  const pathname = usePathname();

  // If initialBanner is provided via SSR, initialize state immediately (zero delay, zero jitter)
  const isExcludedRoute =
    pathname?.startsWith('/c/') ||
    pathname?.startsWith('/page/') ||
    pathname?.startsWith('/m/') ||
    pathname?.startsWith('/w/') ||
    pathname?.startsWith('/s/') ||
    pathname?.startsWith('/admin');

  const hasInitialContent =
    !isExcludedRoute &&
    initialBanner &&
    initialBanner.enabled &&
    Boolean(initialBanner.messageText?.trim() || initialBanner.badgeText?.trim());

  const [banner, setBanner] = useState<BannerData>(
    initialBanner || DEFAULT_BANNER
  );
  const [visible, setVisible] = useState(Boolean(hasInitialContent));
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isExcludedRoute) {
      setVisible(false);
      return;
    }

    // Live update check to keep bar reactive when admin toggles without hard refresh
    fetch('/api/promo/config', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // Suppress promo banner for logged-in paid subscribers
        if (data?.isPaidUser) {
          setVisible(false);
          return;
        }

        if (
          data &&
          data.banner &&
          data.banner.enabled &&
          (data.banner.messageText?.trim() || data.banner.badgeText?.trim())
        ) {
          setBanner(data.banner);
          setVisible(true);
        } else {
          setVisible(false);
        }
      })
      .catch(() => {
        // Fall back to SSR state
      });
  }, [pathname, isExcludedRoute]);

  // Synchronize CSS variable --announcement-bar-height so any sticky child below it adjusts without clipping
  useEffect(() => {
    const isShowing = visible && banner.enabled && Boolean(banner.messageText?.trim() || banner.badgeText?.trim());
    if (isShowing && barRef.current) {
      const updateHeight = () => {
        if (barRef.current) {
          document.documentElement.style.setProperty(
            '--announcement-bar-height',
            `${barRef.current.offsetHeight}px`
          );
        }
      };
      updateHeight();
      window.addEventListener('resize', updateHeight);
      return () => {
        window.removeEventListener('resize', updateHeight);
        document.documentElement.style.setProperty('--announcement-bar-height', '0px');
      };
    } else {
      document.documentElement.style.setProperty('--announcement-bar-height', '0px');
    }
  }, [visible, banner]);

  const handleDismiss = () => {
    setVisible(false);
    document.documentElement.style.setProperty('--announcement-bar-height', '0px');
  };

  if (!visible || !banner.enabled || (!banner.messageText?.trim() && !banner.badgeText?.trim())) {
    return null;
  }

  const targetUrl =
    banner.ctaUrl?.trim() ||
    (banner.promoCode?.trim() ? `/pricing?promo=${banner.promoCode.trim()}` : '/pricing');

  return (
    <aside
      ref={barRef}
      aria-label="Announcement"
      className="sticky top-0 isolate z-50 w-full bg-gradient-to-r from-[#11140F] via-[#1a2218] to-[#11140F] text-white px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-[12.5px] border-b border-white/10 shadow-xs flex items-center justify-between"
    >
      <div className="max-w-[1240px] mx-auto w-full flex items-center justify-center gap-2 sm:gap-3 text-center pr-6 sm:pr-8 overflow-hidden">
        {banner.badgeText?.trim() && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2F6B4F]/40 border border-[#34D399]/30 text-[#34D399] font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shrink-0">
            <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            {banner.badgeText.trim()}
          </span>
        )}
        <div className="flex items-center gap-1.5 sm:gap-2 truncate font-medium">
          {banner.badgeText?.trim() && (
            <span className="sm:hidden text-[#34D399] font-bold shrink-0">
              🏷️
            </span>
          )}
          <span className="text-white/90 truncate">
            {banner.messageText.trim()}{' '}
            {banner.promoCode?.trim() && (
              <code className="font-mono bg-white/15 px-1.5 py-0.5 rounded text-white font-bold select-all text-[10px] sm:text-[11px]">
                {banner.promoCode.trim()}
              </code>
            )}
          </span>
          {(banner.ctaText?.trim() || banner.ctaUrl) && (
            <Link
              href={targetUrl}
              className="inline-flex items-center gap-0.5 sm:gap-1 font-semibold text-[#34D399] hover:text-[#34D399]/80 transition-colors shrink-0 underline underline-offset-2 ml-0.5 sm:ml-1"
            >
              <span>{banner.ctaText?.trim() || 'Claim'}</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Link>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 sm:right-3 text-white/50 hover:text-white transition-colors p-1 rounded-md cursor-pointer shrink-0"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </aside>
  );
}
