'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Sparkles, ArrowRight, ShieldCheck, Lock, QrCode } from 'lucide-react';
import AuthModal from './AuthModal';
import { APP_URL } from '@/lib/config';

export default function WorkspaceLocked() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');
  const [demoUrl, setDemoUrl] = useState(`${APP_URL}/demo`);
  const [qrColor, setQrColor] = useState('#11140F');

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <>
      <div className="w-full rounded-lg border border-[#11140F]/15 dark:border-white/10 bg-white dark:bg-[#11140F] shadow-xs overflow-hidden transition-colors duration-200">
        {/* Top Header */}
        <div className="bg-[#11140F] dark:bg-[#161B13] text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[12px] font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
              Interactive Demo Sandbox
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Test Generating a Dynamic QR Code Live
            </h3>
            <p className="text-[13.5px] text-white/70 max-w-[55ch]">
              Enter any URL below to preview the code. Claim a free account to ensure your printed flyers never break if this link changes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => openAuth('signup')}
              className="rounded-xl bg-white dark:bg-[#34D399] px-5 py-2.5 text-[13.5px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] dark:hover:bg-[#34D399]/90 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              Sign Up Free (5 Links)
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => openAuth('login')}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-[13.5px] font-medium text-white/80 hover:text-white hover:border-white/40 transition-colors cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Interactive Workspace Body */}
        <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center bg-[#F7F8F5] dark:bg-[#0D0F0C]">
          {/* Interactive Input Form */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[13px] font-semibold text-[#11140F] dark:text-white">
                Type Destination URL to Preview:
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://yourbrand.com/spring-sale"
                  className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#161B13] px-4 py-3 text-[14px] outline-hidden focus:border-[#34D399] focus:ring-1 focus:ring-[#34D399] transition-all font-mono text-[#11140F] dark:text-white placeholder:text-[#11140F]/40 dark:placeholder:text-white/40"
                />
              </div>
              <p className="text-[12px] text-[#11140F]/55 dark:text-white/60">
                Try typing your website, Instagram, PDF menu, or YouTube link to see it update live.
              </p>
            </div>

            {/* Color Palette Switcher */}
            <div className="space-y-2">
              <label className="block text-[12.5px] font-medium text-[#11140F]/70 dark:text-white/70">
                Contrast Color Scheme:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { color: '#11140F', label: 'Classic Onyx' },
                  { color: '#2F6B4F', label: 'Forest Emerald' },
                  { color: '#1E3A8A', label: 'Navy Blue' },
                  { color: '#7C2D12', label: 'Deep Amber' },
                ].map((item) => (
                  <button
                    key={item.color}
                    onClick={() => setQrColor(item.color)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-all cursor-pointer ${
                      qrColor === item.color
                        ? 'border-[#11140F] dark:border-[#34D399] bg-white dark:bg-[#1E251A] font-semibold text-[#11140F] dark:text-white shadow-xs'
                        : 'border-[#11140F]/10 dark:border-white/10 bg-white/50 dark:bg-white/5 text-[#11140F]/60 dark:text-white/70 hover:bg-white dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comparison Callout */}
            <div className="rounded-lg border border-amber-200/80 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-4 space-y-2 text-[13px] text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-300">
                <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                The Physical Flyer Dilemma:
              </div>
              <p className="leading-relaxed text-amber-900/85 dark:text-amber-200/80">
                Standard static QR codes permanently hardcode this link. If your destination changes next week, you must throw away and reprint all physical flyers.
              </p>
              <div className="pt-1 flex items-center gap-1 text-[12.5px] font-semibold text-emerald-800 dark:text-[#34D399]">
                <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-[#34D399]" />
                With DynamicQR: Print once, update destination in 1 second.
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => openAuth('signup')}
                className="rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] px-6 py-3.5 text-[14px] font-semibold hover:bg-[#2A2E25] dark:hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#34D399] dark:text-[#2F6B4F]" />
                Claim 5 Free Dynamic Links
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => openAuth('login')}
                className="rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/5 px-5 py-3.5 text-[14px] font-medium text-[#11140F] dark:text-white hover:bg-white/80 dark:hover:bg-white/10 transition-colors text-center cursor-pointer"
              >
                Sign In to Existing Account
              </button>
            </div>
          </div>

          {/* Live Interactive QR Code Canvas */}
          <div className="flex flex-col items-center justify-center bg-white dark:bg-[#161B13] rounded-lg border border-[#11140F]/10 dark:border-white/10 p-6 sm:p-8 space-y-4 shadow-xs text-center">
            <div className="p-4 rounded-md border border-[#11140F]/10 dark:border-white/15 bg-white shadow-xs inline-block">
              <QRCodeSVG
                value={demoUrl || APP_URL}
                size={200}
                fgColor={qrColor}
                bgColor="#FFFFFF"
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[12px] font-mono font-medium text-[#2F6B4F] dark:text-[#34D399]">
                <QrCode className="w-3.5 h-3.5" />
                Live Scannable Demo
              </span>
              <p className="text-[12px] text-[#11140F]/55 dark:text-white/60 max-w-[28ch]">
                Point your phone's camera at this screen to test scan right now.
              </p>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
}
