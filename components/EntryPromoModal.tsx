'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Sparkles, ArrowRight, Check } from 'lucide-react';

interface ModalConfig {
  enabled: boolean;
  badgeText: string;
  headline: string;
  bodyText: string;
  discountPercent: number;
  promoCode: string;
  ctaText: string;
  frequencyDays: number;
}

const DEFAULT_MODAL: ModalConfig = {
  enabled: true,
  badgeText: 'BLACK FRIDAY SPECIAL',
  headline: 'Unlock 40% Off DynamicQR Pro & Plus',
  bodyText: 'Never reprint flyers again. Get autonomous time-scheduled routing, device-level app redirects, branded custom domains, and our new customer mailing list engine.',
  discountPercent: 40,
  promoCode: 'BLACKFRIDAY40',
  ctaText: 'Claim 40% Discount',
  frequencyDays: 7,
};

export default function EntryPromoModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ModalConfig>(DEFAULT_MODAL);
  const pathname = usePathname();

  useEffect(() => {
    // Exclude admin, checkout, login pages
    if (
      pathname?.startsWith('/admin') ||
      pathname?.startsWith('/checkout') ||
      pathname?.startsWith('/login') ||
      pathname?.startsWith('/newsletter') ||
      pathname?.startsWith('/pricing')
    ) {
      return;
    }

    // Fetch live config
    fetch('/api/promo/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.modal) {
          setConfig(data.modal);
          if (data.modal.enabled === false) {
            return;
          }
          checkFrequencyAndShow(data.modal.frequencyDays || 7);
        } else {
          checkFrequencyAndShow(7);
        }
      })
      .catch(() => {
        checkFrequencyAndShow(7);
      });

    function checkFrequencyAndShow(days: number) {
      try {
        const lastDismissed = localStorage.getItem('dynamicqr_promo_modal_seen');
        if (lastDismissed) {
          const diffDays = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
          if (diffDays < days) {
            return;
          }
        }

        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2500);

        return () => clearTimeout(timer);
      } catch (e) {}
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

  if (!isOpen || !config.enabled) return null;

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
          className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2F6B4F]/20 border border-[#34D399]/30 text-[#34D399] font-mono text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            {config.badgeText}
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {config.headline}
            </h2>
            <p className="text-[14px] text-white/70 leading-relaxed">
              {config.bodyText}
            </p>
          </div>

          {/* Promo code badge */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-white/60 block">Promo Code:</span>
              <strong className="font-mono text-sm font-bold text-[#34D399] tracking-wider select-all">
                {config.promoCode}
              </strong>
            </div>
            <span className="text-xs font-bold bg-[#34D399] text-[#0F120E] px-2.5 py-1 rounded-lg">
              {config.discountPercent}% OFF
            </span>
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
                  placeholder="Enter email to lock in code..."
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
              <div className="text-center pt-1">
                <Link
                  href={`/pricing?promo=${config.promoCode}`}
                  onClick={handleDismiss}
                  className="text-[12px] text-white/60 hover:text-white underline underline-offset-4 transition-colors font-medium inline-flex items-center gap-1"
                >
                  <span>Or apply {config.promoCode} directly on Pricing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </form>
          )}

          <div className="pt-2 text-[11px] text-white/40 text-center font-mono">
            Applies to all annual plans. Cooldown: {config.frequencyDays} days.
          </div>
        </div>
      </div>
    </div>
  );
}
