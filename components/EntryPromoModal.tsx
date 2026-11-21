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
  enabled: false,
  badgeText: '',
  headline: '',
  bodyText: '',
  discountPercent: 0,
  promoCode: '',
  ctaText: 'Claim Discount',
  frequencyDays: 7,
};

interface EntryPromoModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function EntryPromoModal({ forceOpen = false, onClose }: EntryPromoModalProps = {}) {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ModalConfig>(DEFAULT_MODAL);
  const pathname = usePathname();

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      fetch('/api/promo/config')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.modal) {
            setConfig({
              ...data.modal,
              enabled: true,
              headline: data.modal.headline || 'Exclusive Limited-Time Special',
              badgeText: data.modal.badgeText || 'SPECIAL OFFER',
              bodyText: data.modal.bodyText || 'Unlock instant dynamic QR codes, 307 speed handoff, and full lead routing.',
              ctaText: data.modal.ctaText || 'Claim Discount',
            });
          }
        })
        .catch(() => {});
      return;
    }

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

    // Fetch live config from server — strictly display what the admin set
    fetch('/api/promo/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.modal && data.modal.enabled && data.modal.headline?.trim()) {
          setConfig(data.modal);
          checkFrequencyAndShow(data.modal);
        } else {
          setIsOpen(false);
        }
      })
      .catch(() => {
        setIsOpen(false);
      });

    function checkFrequencyAndShow(modalCfg: ModalConfig) {
      try {
        const seenKey = `dynamicqr_promo_modal_seen_${modalCfg.promoCode || 'active'}`;
        const lastDismissed = localStorage.getItem(seenKey);
        if (lastDismissed) {
          const diffDays = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
          if (diffDays < (modalCfg.frequencyDays || 7)) {
            return;
          }
        }

        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2000);

        return () => clearTimeout(timer);
      } catch (e) {}
    }
  }, [pathname]);

  const handleDismiss = () => {
    setIsOpen(false);
    onClose?.();
    if (!forceOpen) {
      try {
        const seenKey = `dynamicqr_promo_modal_seen_${config.promoCode || 'active'}`;
        localStorage.setItem(seenKey, Date.now().toString());
      } catch (e) {}
    }
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

  if (!isOpen || !config.enabled || !config.headline?.trim()) return null;

  const pricingTargetUrl = config.promoCode ? `/pricing?promo=${config.promoCode}` : '/pricing';

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
          {config.badgeText?.trim() && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2F6B4F]/20 border border-[#34D399]/30 text-[#34D399] font-mono text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {config.badgeText.trim()}
            </div>
          )}

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {config.headline.trim()}
            </h2>
            {config.bodyText?.trim() && (
              <p className="text-[14px] text-white/70 leading-relaxed">
                {config.bodyText.trim()}
              </p>
            )}
          </div>

          {/* Promo code badge */}
          {config.promoCode?.trim() && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-white/60 block">Promo Code:</span>
                <strong className="font-mono text-sm font-bold text-[#34D399] tracking-wider select-all">
                  {config.promoCode.trim()}
                </strong>
              </div>
              {config.discountPercent > 0 && (
                <span className="text-xs font-bold bg-[#34D399] text-[#0F120E] px-2.5 py-1 rounded-lg">
                  {config.discountPercent}% OFF
                </span>
              )}
            </div>
          )}

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
                  href={pricingTargetUrl}
                  onClick={handleDismiss}
                  className="text-[12px] text-white/60 hover:text-white underline underline-offset-4 transition-colors font-medium inline-flex items-center gap-1"
                >
                  <span>{config.ctaText?.trim() || 'Or jump directly to pricing plans'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </form>
          )}

          <div className="pt-2 text-[11px] text-white/40 text-center font-mono">
            Cooldown: {config.frequencyDays || 7} days.
          </div>
        </div>
      </div>
    </div>
  );
}
