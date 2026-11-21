'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, ArrowRight, X } from 'lucide-react';

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
    // Fetch live admin configuration — strictly display what the admin set
    fetch('/api/promo/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          data &&
          data.banner &&
          data.banner.enabled &&
          (data.banner.messageText?.trim() || data.banner.badgeText?.trim())
        ) {
          setBanner(data.banner);

          const dismissKey = `dynamicqr_announcement_dismissed_${data.banner.promoCode || data.banner.messageText || 'active'}`;
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
    const dismissKey = `dynamicqr_announcement_dismissed_${banner.promoCode || banner.messageText || 'active'}`;
    try {
      sessionStorage.setItem(dismissKey, 'true');
    } catch (e) {}
  };

  if (!visible || !banner.enabled || (!banner.messageText?.trim() && !banner.badgeText?.trim())) {
    return null;
  }

  const targetUrl =
    banner.ctaUrl ||
    (banner.promoCode ? `/pricing?promo=${banner.promoCode}` : '/pricing');

  return (
    <div className="relative isolate z-40 bg-gradient-to-r from-[#11140F] via-[#1a2218] to-[#11140F] text-white px-4 py-2.5 text-xs sm:text-[13px] border-b border-white/10 shadow-xs flex items-center justify-between transition-all duration-300 ease-out animate-in fade-in">
      <div className="max-w-[1240px] mx-auto w-full flex items-center justify-center gap-3 text-center pr-6 flex-wrap">
        {banner.badgeText?.trim() && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2F6B4F]/40 border border-[#34D399]/30 text-[#34D399] font-mono text-[11px] font-bold uppercase tracking-wider">
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
        onClick={handleDismiss}
        className="absolute right-3 text-white/50 hover:text-white transition-colors p-1 rounded-md cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
