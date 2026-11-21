'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, ArrowRight, X } from 'lucide-react';
import { PROMO_DEFAULTS } from '@/lib/promo';

interface BannerData {
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

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);
  const [banner, setBanner] = useState<BannerData>(DEFAULT_BANNER);

  useEffect(() => {
    // Fetch live admin configuration
    fetch('/api/promo/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.banner && data.banner.enabled) {
          const effectiveBanner: BannerData = {
            enabled: true,
            badgeText: data.banner.badgeText?.trim() || PROMO_DEFAULTS.banner.badgeText,
            messageText: data.banner.messageText?.trim() || PROMO_DEFAULTS.banner.messageText,
            promoCode: data.banner.promoCode?.trim() || PROMO_DEFAULTS.banner.promoCode,
            ctaText: data.banner.ctaText?.trim() || PROMO_DEFAULTS.banner.ctaText,
            ctaUrl:
              data.banner.ctaUrl?.trim() ||
              (data.banner.promoCode?.trim()
                ? `/pricing?promo=${data.banner.promoCode.trim()}`
                : PROMO_DEFAULTS.banner.ctaUrl),
          };

          setBanner(effectiveBanner);

          // Check dismissal keyed to the active campaign so new promos surface immediately
          const dismissKey = `dynamicqr_announcement_dismissed_${effectiveBanner.promoCode || effectiveBanner.messageText}`;
          const isDismissed = sessionStorage.getItem(dismissKey) === 'true';

          if (!isDismissed) {
            setVisible(true);
          }
        } else {
          setVisible(false);
        }
      })
      .catch(() => {
        setVisible(false);
      });
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    const dismissKey = `dynamicqr_announcement_dismissed_${banner.promoCode || banner.messageText}`;
    try {
      sessionStorage.setItem(dismissKey, 'true');
    } catch (e) {}
  };

  if (!visible || !banner.enabled) return null;

  const targetUrl =
    banner.ctaUrl ||
    (banner.promoCode ? `/pricing?promo=${banner.promoCode}` : '/pricing');

  return (
    <div className="relative isolate z-40 bg-gradient-to-r from-[#11140F] via-[#1a2218] to-[#11140F] text-white px-4 py-2.5 text-xs sm:text-[13px] border-b border-white/10 shadow-xs flex items-center justify-between transition-all duration-300 ease-out animate-in fade-in">
      <div className="max-w-[1240px] mx-auto w-full flex items-center justify-center gap-3 text-center pr-6 flex-wrap">
        {banner.badgeText && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2F6B4F]/40 border border-[#34D399]/30 text-[#34D399] font-mono text-[11px] font-bold uppercase tracking-wider">
            <Tag className="w-3 h-3" />
            {banner.badgeText}
          </span>
        )}
        <span className="text-white/90">
          {banner.messageText}{' '}
          {banner.promoCode && (
            <code className="font-mono bg-white/15 px-1.5 py-0.5 rounded text-white font-bold select-all">
              {banner.promoCode}
            </code>
          )}
        </span>
        <Link
          href={targetUrl}
          className="inline-flex items-center gap-1 font-semibold text-[#34D399] hover:text-[#34D399]/80 transition-colors ml-1 underline underline-offset-4 cursor-pointer"
        >
          {banner.ctaText || 'Claim Offer'}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-3 text-white/50 hover:text-white transition-colors p-1 rounded-md cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
