'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Sparkles, ArrowRight, Loader2, Tag, X } from 'lucide-react';

interface PricingTableProps {
  currentTier: string;
  isLoggedIn: boolean;
}

interface AppliedPromo {
  code: string;
  type: string;
  value: number;
  description: string;
}

function PricingTableContent({ currentTier, isLoggedIn }: PricingTableProps) {
  const searchParams = useSearchParams();
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [fxRate, setFxRate] = useState<number>(1400);

  // Fetch live buffered FX rate for Paystack NGN pricing
  useEffect(() => {
    fetch('/api/billing/rates')
      .then((res) => res.json())
      .then((data) => {
        if (data?.effectiveFxRate) setFxRate(data.effectiveFxRate);
      })
      .catch(() => {});
  }, []);

  // Promo code states
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Check URL query param ?promo=...
  useEffect(() => {
    const queryPromo = searchParams.get('promo');
    if (queryPromo) {
      setPromoInput(queryPromo.toUpperCase());
      validateAndApplyPromo(queryPromo.toUpperCase());
    }
  }, [searchParams]);

  const validateAndApplyPromo = async (codeToTest: string) => {
    if (!codeToTest.trim()) return;
    setValidatingPromo(true);
    setPromoError(null);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToTest.trim(), plan: 'pro' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || 'Invalid promo code');
        setAppliedPromo(null);
      } else {
        setAppliedPromo({
          code: data.code,
          type: data.type,
          value: Number(data.value),
          description: data.description || `${data.value}% discount applied`,
        });
        setPromoError(null);
      }
    } catch (err: any) {
      setPromoError('Validation network error');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleApplyPromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndApplyPromo(promoInput);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
  };

  const handleCheckout = async (planId: string) => {
    if (planId === 'free') {
      window.location.href = '/';
      return;
    }

    if (!isLoggedIn) {
      alert(`Please sign in to your DynamicQR account to activate the ${planId.toUpperCase()} plan.`);
      window.location.href = '/#workspace';
      return;
    }

    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          interval,
          promoCode: appliedPromo?.code || undefined,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to start checkout');
      }
    } catch (err: any) {
      alert('Checkout error: ' + err.message);
    } finally {
      setLoadingPlan(null);
    }
  };

  const current = currentTier.toLowerCase();

  // Helper for discounted prices
  const calcPrice = (base: number) => {
    if (!appliedPromo) return { discounted: base, isDiscounted: false };
    if (appliedPromo.type === 'percent') {
      const discounted = Number((base * (1 - appliedPromo.value / 100)).toFixed(2));
      return { discounted, isDiscounted: true };
    }
    const discounted = Math.max(1, base - appliedPromo.value);
    return { discounted, isDiscounted: true };
  };

  // Prices with $1 markup across paid tiers
  // Pro: $6/mo, $5/mo annual ($60/yr)
  const proMonthly = calcPrice(6);
  const proAnnualMonthly = calcPrice(5);
  const proAnnualTotal = calcPrice(60);

  // Plus: $13/mo, $11/mo annual ($132/yr)
  const plusMonthly = calcPrice(13);
  const plusAnnualMonthly = calcPrice(11);
  const plusAnnualTotal = calcPrice(132);

  // Ultra: $21/mo, $17/mo annual ($212/yr)
  const ultraMonthly = calcPrice(21);
  const ultraAnnualMonthly = calcPrice(17);
  const ultraAnnualTotal = calcPrice(212);

  // Naira conversions rounded to 100 NGN
  const calcNgn = (usdAmount: number) => Math.ceil((usdAmount * fxRate) / 100) * 100;

  return (
    <div className="space-y-8">
      {/* Dynamic Promo Code Bar */}
      <div className="max-w-xl mx-auto p-3.5 sm:p-4 rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] shadow-xs">
        {appliedPromo ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm font-mono">
                    {appliedPromo.code}
                  </span>
                  <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10.5px] font-bold">
                    {appliedPromo.value}% OFF
                  </span>
                </div>
                <p className="text-[11.5px] text-[#11140F]/65 dark:text-white/70 mt-0.5">
                  {appliedPromo.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 hover:underline px-2.5 py-1 rounded cursor-pointer shrink-0"
            >
              Remove code
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyPromoSubmit} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#11140F]/40 dark:text-white/40" />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Have a promo code? (e.g. BLACKFRIDAY40)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-[#161B13] text-[#11140F] dark:text-white focus:bg-white dark:focus:bg-[#161B13] focus:outline-hidden focus:border-[#34D399]"
              />
            </div>
            <button
              type="submit"
              disabled={validatingPromo || !promoInput.trim()}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-xs font-semibold hover:bg-[#2A2E25] dark:hover:bg-white/90 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {validatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply Code'}
            </button>
          </form>
        )}
        {promoError && (
          <p className="text-[11.5px] text-red-600 dark:text-red-400 mt-2 font-medium">
            ⚠️ {promoError}
          </p>
        )}
      </div>

      {/* Interval Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-[14px] font-medium transition-colors ${
            interval === 'month' ? 'text-[#11140F] dark:text-white font-semibold' : 'text-[#11140F]/50 dark:text-white/40'
          }`}
        >
          Monthly Billing
        </span>
        <button
          onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
          className="relative inline-flex h-7 w-12 items-center rounded-full bg-[#11140F] dark:bg-white/20 p-1 transition-colors cursor-pointer"
          aria-label="Toggle annual billing"
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${
              interval === 'year' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`text-[14px] font-medium transition-colors ${
              interval === 'year' ? 'text-[#11140F] dark:text-white font-semibold' : 'text-[#11140F]/50 dark:text-white/40'
            }`}
          >
            Yearly Billing
          </span>
          <span className="rounded-full bg-[#2F6B4F]/10 dark:bg-[#34D399]/20 text-[#2F6B4F] dark:text-[#34D399] text-[11px] font-bold px-2.5 py-0.5 tracking-wide uppercase font-mono">
            Save 20%
          </span>
        </div>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {/* FREE PLAN */}
        <div className="rounded-3xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#11140F] dark:text-white">Free</h3>
                {current === 'free' && (
                  <span className="text-[11px] font-mono font-semibold bg-[#11140F]/5 dark:bg-white/10 text-[#11140F]/70 dark:text-white/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-[#11140F]/60 dark:text-white/60 min-h-[38px] leading-snug">
                Personal starter for permanent links, starter vCards & 10-contact customer mailing lists.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-[#11140F] dark:text-white">$0</span>
              <span className="text-[13px] text-[#11140F]/50 dark:text-white/50">/month</span>
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-[#11140F]/8 dark:border-white/10 bg-[#F7F8F5] dark:bg-white/5 p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Link Slots</span>
                <strong className="text-[#11140F] dark:text-white font-mono font-bold">5 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Monthly Scans</span>
                <strong className="text-[#11140F] dark:text-white font-mono font-bold">1,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Mailing Lists</span>
                <strong className="text-[#11140F] dark:text-white font-mono font-bold">1 list • 10 contacts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Broadcasts</span>
                <strong className="text-[#11140F] dark:text-white font-mono font-bold">2 / mo (Gmail)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">AI Budget</span>
                <strong className="text-[#11140F] dark:text-white font-mono font-bold">$0.50 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[12.5px] text-[#11140F]/75 dark:text-white/80">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Instant 307 fast redirects</strong> with permanent short links</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>1 Customer Mailing List</strong> with up to 10 contacts (double opt-in)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Starter Micro-SaaS:</strong> 1 Link Shortener, 1 Digital vCard, 1 Wi-Fi QR</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>300 DPI PNG downloads</strong> with high contrast quiet zones</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Native 1-click unsubscribe</strong> RFC 8058 compliant headers</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>1 Mobile Landing Page</strong> with curated WCAG palettes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>1-Year Domain Registration</strong> &amp; 1 business email alias</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('free')}
              disabled={current === 'free'}
              className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 py-3 text-[13.5px] font-semibold text-[#11140F] dark:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {current === 'free' ? 'Current Plan' : 'Select Free'}
            </button>
          </div>
        </div>

        {/* PRO PLAN (Featured / Most Popular) */}
        <div className="rounded-3xl border-2 border-[#11140F] dark:border-[#34D399] bg-white dark:bg-[#121811] p-6 sm:p-7 flex flex-col justify-between shadow-lg relative ring-4 ring-[#11140F]/5 dark:ring-[#34D399]/20">
          {/* Most Popular Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 px-3.5 py-0.5 rounded-full bg-[#11140F] dark:bg-[#34D399] text-[#96A689] dark:text-[#11140F] text-[10.5px] font-mono font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#96A689] dark:text-[#11140F]" />
            Most Popular
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#11140F] dark:text-white">Pro</h3>
                {current === 'pro' && (
                  <span className="text-[11px] font-mono font-semibold bg-[#2F6B4F]/10 dark:bg-[#34D399]/20 text-[#2F6B4F] dark:text-[#34D399] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-[#11140F]/60 dark:text-white/60 min-h-[38px] leading-snug">
                For businesses needing smart scheduled routing, menus, forms & 50-contact mailing lists.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F] dark:text-white">
                  ${interval === 'year' ? proAnnualMonthly.discounted : proMonthly.discounted}
                </span>
                {(interval === 'year' ? proAnnualMonthly.isDiscounted : proMonthly.isDiscounted) && (
                  <span className="text-lg line-through text-[#11140F]/40 dark:text-white/40 font-medium">
                    ${interval === 'year' ? '5' : '6'}
                  </span>
                )}
                <span className="text-[13px] text-[#11140F]/50 dark:text-white/50">/month</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#2F6B4F]/10 dark:bg-[#34D399]/15 text-[#2F6B4F] dark:text-[#34D399] font-mono text-[11px] font-bold">
                  ₦{calcNgn(interval === 'year' ? proAnnualTotal.discounted : proMonthly.discounted).toLocaleString()} {interval === 'year' ? '/yr' : '/mo'}
                </span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F] dark:text-[#34D399]">
                  Billed annually (${proAnnualTotal.discounted}/yr
                  {proAnnualTotal.isDiscounted && <span className="line-through text-[#11140F]/40 dark:text-white/40 ml-1">$60</span>})
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-[#2F6B4F]/20 dark:border-[#34D399]/30 bg-[#2F6B4F]/5 dark:bg-[#34D399]/10 p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Link Slots</span>
                <strong className="text-[#2F6B4F] dark:text-[#34D399] font-mono font-bold">50 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Monthly Scans</span>
                <strong className="text-[#2F6B4F] dark:text-[#34D399] font-mono font-bold">25,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Mailing Lists</span>
                <strong className="text-[#2F6B4F] dark:text-[#34D399] font-mono font-bold">2 lists • 50 contacts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Broadcasts</span>
                <strong className="text-[#2F6B4F] dark:text-[#34D399] font-mono font-bold">5 / mo (Gmail)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">AI Budget</span>
                <strong className="text-[#2F6B4F] dark:text-[#34D399] font-mono font-bold">$5.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[12.5px] text-[#11140F]/85 dark:text-white/90">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Autonomous Ingress Matrix</strong> (Time-of-day scheduled switching)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>AI Device Routing</strong> (iOS vs Android app store redirects)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>2 Customer Mailing Lists</strong> (up to 50 subscribers, merge tags)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Micro-SaaS Suite:</strong> Restaurant Menu QR, Form Builder, Reviews, Coupons</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Configurable Print Studio:</strong> Slugs, vanity words & color presets</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Real-time Diurnal Heatmap</strong> (Peak hourly scanner diagnosis)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>3 Mobile Landing Pages</strong> with AI copy generation</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>2-Year Domain Bundle</strong> with 5% multi-year discount</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('pro')}
              disabled={current === 'pro' || loadingPlan === 'pro'}
              className="w-full rounded-xl bg-[#11140F] dark:bg-[#34D399] py-3 text-[13.5px] font-semibold text-white dark:text-[#11140F] hover:bg-[#2A2E25] dark:hover:bg-[#34D399]/90 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loadingPlan === 'pro' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : current === 'pro' ? (
                'Current Plan'
              ) : (
                <>
                  Upgrade to Pro
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* PLUS PLAN */}
        <div className="rounded-3xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#11140F] dark:text-white">Plus</h3>
                {current === 'plus' && (
                  <span className="text-[11px] font-mono font-semibold bg-[#2F6B4F]/10 dark:bg-[#34D399]/20 text-[#2F6B4F] dark:text-[#34D399] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-[#11140F]/60 dark:text-white/60 min-h-[38px] leading-snug">
                For scaling brands wanting custom domains, event tickets & 100-contact campaigns.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F] dark:text-white">
                  ${interval === 'year' ? plusAnnualMonthly.discounted : plusMonthly.discounted}
                </span>
                {(interval === 'year' ? plusAnnualMonthly.isDiscounted : plusMonthly.isDiscounted) && (
                  <span className="text-lg line-through text-[#11140F]/40 dark:text-white/40 font-medium">
                    ${interval === 'year' ? '11' : '13'}
                  </span>
                )}
                <span className="text-[13px] text-[#11140F]/50 dark:text-white/50">/month</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-mono text-[11px] font-bold">
                  ₦{calcNgn(interval === 'year' ? plusAnnualTotal.discounted : plusMonthly.discounted).toLocaleString()} {interval === 'year' ? '/yr' : '/mo'}
                </span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F] dark:text-[#34D399]">
                  Billed annually (${plusAnnualTotal.discounted}/yr
                  {plusAnnualTotal.isDiscounted && <span className="line-through text-[#11140F]/40 dark:text-white/40 ml-1">$132</span>})
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Link Slots</span>
                <strong className="text-blue-900 dark:text-blue-300 font-mono font-bold">500 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Monthly Scans</span>
                <strong className="text-blue-900 dark:text-blue-300 font-mono font-bold">250,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Mailing Lists</span>
                <strong className="text-blue-900 dark:text-blue-300 font-mono font-bold">5 lists • 100 contacts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Broadcasts</span>
                <strong className="text-blue-900 dark:text-blue-300 font-mono font-bold">15 / mo (Gmail)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">AI Budget</span>
                <strong className="text-blue-900 dark:text-blue-300 font-mono font-bold">$15.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[12.5px] text-[#11140F]/85 dark:text-white/90">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>1 Custom Branded Domain</strong> (Zero DynamicQR watermark)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>5 Customer Mailing Lists</strong> (up to 100 subscribers)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Extended Micro-SaaS:</strong> 10 Menus, 10 Forms, 10 Event Tickets, 15 Coupons</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Geo-Country Routing</strong> (Redirect scans by visitor nation)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Vector SVG Exports</strong> with CMYK physical printer profiles</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Webhook Ingress Stream</strong> (Pipe scans to external CRMs)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>10 Mobile Landing Pages</strong> with 6 WCAG AA curated palettes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Instant 1-Click Bio &amp; vCard Page</strong> with lead capture</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>2–3 Year Domain Bundles</strong> with up to 10% discount</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('plus')}
              disabled={current === 'plus' || loadingPlan === 'plus'}
              className="w-full rounded-xl border border-[#11140F]/20 dark:border-white/20 bg-white dark:bg-white/5 py-3 text-[13.5px] font-semibold text-[#11140F] dark:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loadingPlan === 'plus' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : current === 'plus' ? (
                'Current Plan'
              ) : (
                <>
                  Upgrade to Plus
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* ULTRA PLAN */}
        <div className="rounded-3xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#11140F] dark:text-white">Ultra</h3>
                {current === 'ultra' && (
                  <span className="text-[11px] font-mono font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-[#11140F]/60 dark:text-white/60 min-h-[38px] leading-snug">
                For high-volume enterprises, agencies & max 500-contact mailing lists.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F] dark:text-white">
                  ${interval === 'year' ? ultraAnnualMonthly.discounted : ultraMonthly.discounted}
                </span>
                {(interval === 'year' ? ultraAnnualMonthly.isDiscounted : ultraMonthly.isDiscounted) && (
                  <span className="text-lg line-through text-[#11140F]/40 dark:text-white/40 font-medium">
                    ${interval === 'year' ? '17' : '21'}
                  </span>
                )}
                <span className="text-[13px] text-[#11140F]/50 dark:text-white/50">/month</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 font-mono text-[11px] font-bold">
                  ₦{calcNgn(interval === 'year' ? ultraAnnualTotal.discounted : ultraMonthly.discounted).toLocaleString()} {interval === 'year' ? '/yr' : '/mo'}
                </span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F] dark:text-[#34D399]">
                  Billed annually (${ultraAnnualTotal.discounted}/yr
                  {ultraAnnualTotal.isDiscounted && <span className="line-through text-[#11140F]/40 dark:text-white/40 ml-1">$212</span>})
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-purple-100 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20 p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Link Slots</span>
                <strong className="text-purple-900 dark:text-purple-300 font-mono font-bold">Unlimited</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Monthly Scans</span>
                <strong className="text-purple-900 dark:text-purple-300 font-mono font-bold">Unlimited</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Mailing Lists</span>
                <strong className="text-purple-900 dark:text-purple-300 font-mono font-bold">10 lists • 500 contacts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">Broadcasts</span>
                <strong className="text-purple-900 dark:text-purple-300 font-mono font-bold">30 / mo (Gmail Max)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 dark:text-white/70 font-medium">AI Budget</span>
                <strong className="text-purple-900 dark:text-purple-300 font-mono font-bold">$50.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[12.5px] text-[#11140F]/85 dark:text-white/90">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Unlimited</strong> Active Links, Scans & Custom Domains</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>10 Customer Mailing Lists</strong> (up to 500 contacts, Gmail maximum)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Complete 10 Micro-SaaS Ecosystem</strong> with unlimited modules</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>AI QR Art Studio</strong> (Diffusion-style neural scannability)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Programmatic REST API & Scan Webhooks</strong> (120+ req/min)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Dedicated 99.99% Enterprise SLA</strong> & Priority 1h Slack lead</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Wildcard Catch-All Email Routing</strong> (*@yourbrand.com)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Automated Deliverability Shield</strong> (SPF + DMARC quarantine)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Unlimited Instant Bio Pages</strong> with live RFC 6350 vCard &amp; CRM leads</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399] shrink-0 mt-0.5" />
                <span><strong>Unlimited Mobile Landing Pages</strong> + Fast /r/ redirect tracking</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('ultra')}
              disabled={current === 'ultra' || loadingPlan === 'ultra'}
              className="w-full rounded-xl border border-[#11140F]/20 dark:border-white/20 bg-white dark:bg-white/5 py-3 text-[13.5px] font-semibold text-[#11140F] dark:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {loadingPlan === 'ultra' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : current === 'ultra' ? (
                'Current Plan'
              ) : (
                <>
                  Upgrade to Ultra
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Trust & Currency Guarantee */}
      <div className="max-w-2xl mx-auto text-center p-4 rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-white/5 space-y-1.5">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#11140F] dark:text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Instant Automated Activation</span>
        </div>
        <p className="text-[12px] text-[#11140F]/65 dark:text-white/65 leading-relaxed">
          Accepting Debit &amp; Credit Cards (Mastercard, Visa, Verve), Bank Transfers, USSD, and Apple Pay with zero hidden fees.
        </p>
      </div>
    </div>
  );
}

export default function PricingTable(props: PricingTableProps) {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-[#11140F]/50">Loading pricing plans...</div>}>
      <PricingTableContent {...props} />
    </Suspense>
  );
}
