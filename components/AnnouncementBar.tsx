'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag, ArrowRight, X } from 'lucide-react';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in session
    const dismissed = sessionStorage.getItem('dynamicqr_announcement_dismissed');
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('dynamicqr_announcement_dismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className="relative isolate z-40 bg-gradient-to-r from-[#11140F] via-[#1a2218] to-[#11140F] text-white px-4 py-2.5 text-xs sm:text-[13px] border-b border-white/10 shadow-xs flex items-center justify-between">
      <div className="max-w-[1240px] mx-auto w-full flex items-center justify-center gap-3 text-center pr-6">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2F6B4F]/40 border border-[#34D399]/30 text-[#34D399] font-mono text-[11px] font-bold uppercase tracking-wider">
          <Tag className="w-3 h-3" />
          Black Friday
        </span>
        <span className="text-white/90">
          Save <strong>40% OFF</strong> all annual plans with code{' '}
          <code className="font-mono bg-white/15 px-1.5 py-0.5 rounded text-white font-bold">
            BLACKFRIDAY40
          </code>
        </span>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 font-semibold text-[#34D399] hover:text-[#34D399]/80 transition-colors ml-1 underline underline-offset-4"
        >
          Claim Offer
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-3 text-white/50 hover:text-white transition-colors p-1 rounded-md"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
