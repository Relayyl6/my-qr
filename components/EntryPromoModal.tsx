'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';

export default function EntryPromoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Exclude admin, checkout, login pages
    if (
      pathname?.startsWith('/admin') ||
      pathname?.startsWith('/checkout') ||
      pathname?.startsWith('/login') ||
      pathname?.startsWith('/newsletter')
    ) {
      return;
    }

    // 7-day frequency cap check
    try {
      const lastDismissed = localStorage.getItem('dynamicqr_promo_modal_seen');
      if (lastDismissed) {
        const diffDays = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          return;
        }
      }

      // Show after 2.5s delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);

      return () => clearTimeout(timer);
    } catch (e) {
      // Ignore localStorage unavailable errors
    }
  }, [pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      localStorage.setItem('dynamicqr_promo_modal_seen', Date.now().toString());
    } catch (e) {}
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'promo_modal' }),
      });
      setSubmitted(true);
      setTimeout(() => {
        handleDismiss();
      }, 2500);
    } catch (err) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#0F120E] text-white border border-white/15 rounded-3xl p-7 sm:p-9 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-[#2F6B4F]/25 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-full transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2F6B4F]/20 border border-[#34D399]/30 text-[#34D399] font-mono text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Black Friday Special
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Unlock 40% Off DynamicQR Pro
            </h2>
            <p className="text-[14px] text-white/70 leading-relaxed">
              Never reprint flyers again. Get autonomous time-scheduled routing, device-level app redirects, branded custom domains, and our new customer mailing list engine.
            </p>
          </div>

          {/* Promo code badge */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="text-xs text-white/60">Promo Code:</div>
            <div className="font-mono text-sm font-bold text-[#34D399] tracking-wider bg-black/40 px-3 py-1 rounded-lg border border-[#34D399]/20">
              BLACKFRIDAY40
            </div>
          </div>

          {/* Email Subscription Capture / CTA */}
          {submitted ? (
            <div className="p-4 rounded-xl bg-[#2F6B4F]/20 border border-[#34D399]/30 text-[#34D399] text-center text-sm font-medium flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Check your email for your confirmation and discount link!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email for instant discount..."
                  required
                  className="flex-1 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-hidden focus:border-[#34D399] transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-xl bg-[#34D399] text-[#11140F] font-semibold text-sm hover:bg-[#34D399]/90 transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Sending...' : 'Get Code'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <Link
                  href="/pricing"
                  onClick={handleDismiss}
                  className="text-[12px] text-white/50 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Or jump directly to pricing plans &rarr;
                </Link>
              </div>
            </form>
          )}

          <div className="pt-2 text-[11px] text-white/40 text-center font-mono">
            Applies to all annual plans. Dismiss stays valid for 7 days.
          </div>
        </div>
      </div>
    </div>
  );
}
