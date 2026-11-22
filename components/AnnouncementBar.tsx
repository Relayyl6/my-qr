'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  // If initialBanner is provided via SSR, initialize state immediately (zero delay, zero jitter)
  const hasInitialContent =
    initialBanner &&
    initialBanner.enabled &&
    Boolean(initialBanner.messageText?.trim() || initialBanner.badgeText?.trim());

  const [banner, setBanner] = useState<BannerData>(
    initialBanner || DEFAULT_BANNER
  );
  const [visible, setVisible] = useState(Boolean(hasInitialContent));
  const barRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Live update check to keep bar reactive when admin toggles without hard refresh
    fetch('/api/promo/config', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
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
  }, []);

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
      className="sticky top-0 isolate z-50 w-full bg-gradient-to-r from-[#11140F] via-[#1a2218] to-[#11140F] text-white px-4 py-2.5 text-xs sm:text-[13px] border-b border-white/10 shadow-xs flex items-center justify-between"
    >
      <div className="max-w-[1240px] mx-auto w-full flex items-center justify-center gap-3 text-center pr-6 flex-wrap">
        {banner.badgeText?.trim() && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2F6B4F]/40 border border-[#34D399]/30 text-[#34D399] font-mono text-[11px] font-bold uppercase tracking-wider">
            <Tag className="w-3 h-3" />
            {banner.badgeText.trim()}
          </span>
        )}
        {banner.messageText?.trim() && (
          <span className="text-white/90">
            {banner.messageText.trim()}{' '}
            {banner.promoCode?.trim() && (
              <code className="font-mono bg-white/15 px-1.5 py-0.5 rounded text-white font-bold select-all">
                {banner.promoCode.trim()}
              </code>
            )}
          </span>
        )}
        {(banner.ctaText?.trim() || banner.ctaUrl) && (
          <Link
            href={targetUrl}
            className="inline-flex items-center gap-1 font-semibold text-[#34D399] hover:text-[#34D399]/80 transition-colors ml-1 underline underline-offset-4 cursor-pointer"
          >
            {banner.ctaText?.trim() || 'Claim Offer'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 text-white/50 hover:text-white transition-colors p-1 rounded-md cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </aside>
  );
}
