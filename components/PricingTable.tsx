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

  // Prices
  // Pro: $5/mo, $4/mo annual ($48/yr)
  const proMonthly = calcPrice(5);
  const proAnnualMonthly = calcPrice(4);
  const proAnnualTotal = calcPrice(48);

  // Plus: $12/mo, $10/mo annual ($120/yr)
  const plusMonthly = calcPrice(12);
  const plusAnnualMonthly = calcPrice(10);
  const plusAnnualTotal = calcPrice(120);

  // Ultra: $20/mo, $16/mo annual ($200/yr)
  const ultraMonthly = calcPrice(20);
  const ultraAnnualMonthly = calcPrice(16);
  const ultraAnnualTotal = calcPrice(200);

  return (
    <div className="space-y-8">
      {/* Dynamic Promo Code Bar */}
      <div className="max-w-xl mx-auto p-3.5 sm:p-4 rounded-2xl border border-[#11140F]/10 bg-white shadow-xs">
        {appliedPromo ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-800 text-sm font-mono">
                    {appliedPromo.code}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10.5px] font-bold">
                    {appliedPromo.value}% OFF
                  </span>
                </div>
                <p className="text-[11.5px] text-[#11140F]/65 mt-0.5">
                  {appliedPromo.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline px-2.5 py-1 rounded cursor-pointer shrink-0"
            >
              Remove code
            </button>
          </div>
        ) : (
          <form onSubmit={handleApplyPromoSubmit} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#11140F]/40" />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Have a promo code? (e.g. BLACKFRIDAY40)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-medium rounded-xl border border-[#11140F]/15 bg-[#F7F8F5] focus:bg-white focus:outline-hidden focus:border-[#2F6B4F]"
              />
            </div>
            <button
              type="submit"
              disabled={validatingPromo || !promoInput.trim()}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {validatingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply Code'}
            </button>
          </form>
        )}
        {promoError && (
          <p className="text-[11.5px] text-red-600 mt-2 font-medium">
            ⚠️ {promoError}
          </p>
        )}
      </div>

      {/* Interval Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-[14px] font-medium transition-colors ${
            interval === 'month' ? 'text-[#11140F] font-semibold' : 'text-[#11140F]/50'
          }`}
        >
          Monthly Billing
        </span>
        <button
          onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
          className="relative inline-flex h-7 w-12 items-center rounded-full bg-[#11140F] p-1 transition-colors cursor-pointer"
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
              interval === 'year' ? 'text-[#11140F] font-semibold' : 'text-[#11140F]/50'
            }`}
          >
            Yearly Billing
          </span>
          <span className="rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F] text-[11px] font-bold px-2.5 py-0.5 tracking-wide uppercase font-mono">
            Save 20%
          </span>
        </div>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {/* FREE PLAN */}
        <div className="rounded-3xl border border-[#11140F]/10 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#11140F]">Free</h3>
                {current === 'free' && (
                  <span className="text-[11px] font-mono font-semibold bg-[#11140F]/5 text-[#11140F]/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-[#11140F]/60 min-h-[38px] leading-snug">
                Personal starter for permanent links, starter vCards & 10-contact customer mailing lists.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-[#11140F]">$0</span>
              <span className="text-[13px] text-[#11140F]/50">/month</span>
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-[#11140F]/8 bg-[#F7F8F5] p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Link Slots</span>
                <strong className="text-[#11140F] font-mono font-bold">5 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Monthly Scans</span>
                <strong className="text-[#11140F] font-mono font-bold">1,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Mailing Lists</span>
                <strong className="text-[#11140F] font-mono font-bold">1 list • 10 contacts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Broadcasts</span>
                <strong className="text-[#11140F] font-mono font-bold">2 / mo (Gmail)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">AI Budget</span>
                <strong className="text-[#11140F] font-mono font-bold">$0.50 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[12.5px] text-[#11140F]/75">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Instant 307 fast redirects</strong> with permanent short links</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>1 Customer Mailing List</strong> with up to 10 contacts (double opt-in)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Starter Micro-SaaS:</strong> 1 Link Shortener, 1 Digital vCard, 1 Wi-Fi QR</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>300 DPI PNG downloads</strong> with high contrast quiet zones</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Native 1-click unsubscribe</strong> RFC 8058 compliant headers</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('free')}
              disabled={current === 'free'}
              className="w-full rounded-xl border border-[#11140F]/15 py-3 text-[13.5px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {current === 'free' ? 'Current Plan' : 'Select Free'}
            </button>
          </div>
        </div>

        {/* PRO PLAN (Featured / Most Popular) */}
        <div className="rounded-3xl border-2 border-[#11140F] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-lg relative ring-4 ring-[#11140F]/5">
          {/* Most Popular Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 px-3.5 py-0.5 rounded-full bg-[#11140F] text-[#96A689] text-[10.5px] font-mono font-bold uppercase tracking-wider shadow-sm border border-white/20 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#96A689]" />
            Most Popular
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#11140F]">Pro</h3>
                {current === 'pro' && (
                  <span className="text-[11px] font-mono font-semibold bg-[#2F6B4F]/10 text-[#2F6B4F] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-[#11140F]/60 min-h-[38px] leading-snug">
                For businesses needing smart scheduled routing, menus, forms & 50-contact mailing lists.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F]">
                  ${interval === 'year' ? proAnnualMonthly.discounted : proMonthly.discounted}
                </span>
                {(interval === 'year' ? proAnnualMonthly.isDiscounted : proMonthly.isDiscounted) && (
                  <span className="text-lg line-through text-[#11140F]/40 font-medium">
                    ${interval === 'year' ? '4' : '5'}
                  </span>
                )}
                <span className="text-[13px] text-[#11140F]/50">/month</span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F]">
                  Billed annually (${proAnnualTotal.discounted}/yr
                  {proAnnualTotal.isDiscounted && <span className="line-through text-[#11140F]/40 ml-1">$48</span>})
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-[#2F6B4F]/20 bg-[#2F6B4F]/5 p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Link Slots</span>
                <strong className="text-[#2F6B4F] font-mono font-bold">50 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Monthly Scans</span>
                <strong className="text-[#2F6B4F] font-mono font-bold">25,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Mailing Lists</span>
                <strong className="text-[#2F6B4F] font-mono font-bold">2 lists • 50 contacts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Broadcasts</span>
                <strong className="text-[#2F6B4F] font-mono font-bold">5 / mo (Gmail)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">AI Budget</span>
                <strong className="text-[#2F6B4F] font-mono font-bold">$5.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[12.5px] text-[#11140F]/85">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Autonomous Ingress Matrix</strong> (Time-of-day scheduled switching)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>AI Device Routing</strong> (iOS vs Android app store redirects)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>2 Customer Mailing Lists</strong> (up to 50 subscribers, merge tags)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Micro-SaaS Suite:</strong> Restaurant Menu QR, Form Builder, Reviews, Coupons</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Configurable Print Studio:</strong> Slugs, vanity words & color presets</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Real-time Diurnal Heatmap</strong> (Peak hourly scanner diagnosis)</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('pro')}
              disabled={current === 'pro' || loadingPlan === 'pro'}
              className="w-full rounded-xl bg-[#11140F] py-3 text-[13.5px] font-semibold text-white hover:bg-[#2A2E25] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
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
        <div className="rounded-3xl border border-[#11140F]/10 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#11140F]">Plus</h3>
                {current === 'plus' && (
                  <span className="text-[11px] font-mono font-semibold bg-[#2F6B4F]/10 text-[#2F6B4F] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-[#11140F]/60 min-h-[38px] leading-snug">
                For scaling brands wanting custom domains, event tickets & 100-contact campaigns.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F]">
                  ${interval === 'year' ? plusAnnualMonthly.discounted : plusMonthly.discounted}
                </span>
                {(interval === 'year' ? plusAnnualMonthly.isDiscounted : plusMonthly.isDiscounted) && (
                  <span className="text-lg line-through text-[#11140F]/40 font-medium">
                    ${interval === 'year' ? '10' : '12'}
                  </span>
                )}
                <span className="text-[13px] text-[#11140F]/50">/month</span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F]">
                  Billed annually (${plusAnnualTotal.discounted}/yr
                  {plusAnnualTotal.isDiscounted && <span className="line-through text-[#11140F]/40 ml-1">$120</span>})
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Link Slots</span>
                <strong className="text-blue-900 font-mono font-bold">500 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Monthly Scans</span>
                <strong className="text-blue-900 font-mono font-bold">250,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Mailing Lists</span>
                <strong className="text-blue-900 font-mono font-bold">5 lists • 100 contacts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Broadcasts</span>
                <strong className="text-blue-900 font-mono font-bold">15 / mo (Gmail)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">AI Budget</span>
                <strong className="text-blue-900 font-mono font-bold">$15.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[12.5px] text-[#11140F]/85">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>1 Custom Branded Domain</strong> (Zero DynamicQR watermark)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>5 Customer Mailing Lists</strong> (up to 100 subscribers)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Extended Micro-SaaS:</strong> 10 Menus, 10 Forms, 10 Event Tickets, 15 Coupons</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Geo-Country Routing</strong> (Redirect scans by visitor nation)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Vector SVG Exports</strong> with CMYK physical printer profiles</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Webhook Ingress Stream</strong> (Pipe scans to external CRMs)</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('plus')}
              disabled={current === 'plus' || loadingPlan === 'plus'}
              className="w-full rounded-xl border border-[#11140F]/20 bg-white py-3 text-[13.5px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
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
        <div className="rounded-3xl border border-[#11140F]/10 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#11140F]">Ultra</h3>
                {current === 'ultra' && (
                  <span className="text-[11px] font-mono font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[13px] text-[#11140F]/60 min-h-[38px] leading-snug">
                For high-volume enterprises, agencies & max 500-contact mailing lists.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F]">
                  ${interval === 'year' ? ultraAnnualMonthly.discounted : ultraMonthly.discounted}
                </span>
                {(interval === 'year' ? ultraAnnualMonthly.isDiscounted : ultraMonthly.isDiscounted) && (
                  <span className="text-lg line-through text-[#11140F]/40 font-medium">
                    ${interval === 'year' ? '16' : '20'}
                  </span>
                )}
                <span className="text-[13px] text-[#11140F]/50">/month</span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F]">
                  Billed annually (${ultraAnnualTotal.discounted}/yr
                  {ultraAnnualTotal.isDiscounted && <span className="line-through text-[#11140F]/40 ml-1">$200</span>})
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5 space-y-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Link Slots</span>
                <strong className="text-purple-900 font-mono font-bold">Unlimited</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Monthly Scans</span>
                <strong className="text-purple-900 font-mono font-bold">Unlimited</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Mailing Lists</span>
                <strong className="text-purple-900 font-mono font-bold">10 lists • 500 contacts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Broadcasts</span>
                <strong className="text-purple-900 font-mono font-bold">30 / mo (Gmail Max)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">AI Budget</span>
                <strong className="text-purple-900 font-mono font-bold">$50.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[12.5px] text-[#11140F]/85">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Unlimited</strong> Active Links, Scans & Custom Domains</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>10 Customer Mailing Lists</strong> (up to 500 contacts, Gmail maximum)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Complete 10 Micro-SaaS Ecosystem</strong> with unlimited modules</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>AI QR Art Studio</strong> (Diffusion-style neural scannability)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Programmatic REST API & Scan Webhooks</strong> (120+ req/min)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Dedicated 99.99% Enterprise SLA</strong> & Priority 1h Slack lead</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('ultra')}
              disabled={current === 'ultra' || loadingPlan === 'ultra'}
              className="w-full rounded-xl border border-[#11140F]/20 bg-white py-3 text-[13.5px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
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
