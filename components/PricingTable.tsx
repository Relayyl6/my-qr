'use client';

import { useState } from 'react';
import { Check, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface PricingTableProps {
  currentTier: string;
  isLoggedIn: boolean;
}

export default function PricingTable({ currentTier, isLoggedIn }: PricingTableProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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
        body: JSON.stringify({ planId, interval }),
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

  return (
    <div className="space-y-10">
      {/* Interval Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-[14px] font-medium transition-colors ${interval === 'month' ? 'text-[#11140F] font-semibold' : 'text-[#11140F]/50'}`}>
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
          <span className={`text-[14px] font-medium transition-colors ${interval === 'year' ? 'text-[#11140F] font-semibold' : 'text-[#11140F]/50'}`}>
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
                Personal starter for permanent links & basic redirects.
              </p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold tracking-tight text-[#11140F]">$0</span>
              <span className="text-[13px] text-[#11140F]/50">/month</span>
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-[#11140F]/8 bg-[#F7F8F5] p-3.5 space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/60">Link Slots</span>
                <strong className="text-[#11140F] font-mono">5 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/60">Monthly Scans</span>
                <strong className="text-[#11140F] font-mono">1,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/60">AI Budget</span>
                <strong className="text-[#11140F] font-mono">$0.50 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[13px] text-[#11140F]/75">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>Instant 307 fast redirects</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>300 DPI PNG downloads</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>One-click AI URL enricher</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>Recycle slots anytime</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('free')}
              disabled={current === 'free'}
              className="w-full rounded-xl border border-[#11140F]/15 py-3 text-[13.5px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                For marketers needing conditional smart routing & physical print kits.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F]">
                  ${interval === 'year' ? '4' : '5'}
                </span>
                <span className="text-[13px] text-[#11140F]/50">/month</span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F]">
                  Billed annually ($48/yr)
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-[#2F6B4F]/20 bg-[#2F6B4F]/5 p-3.5 space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Link Slots</span>
                <strong className="text-[#2F6B4F] font-mono font-bold">50 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Monthly Scans</span>
                <strong className="text-[#2F6B4F] font-mono font-bold">25,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">AI Budget</span>
                <strong className="text-[#2F6B4F] font-mono font-bold">$5.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[13px] text-[#11140F]/85">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span><strong>AI Smart Routing</strong> (iOS & Geo)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span><strong>Physical Print Kits</strong> (Table tents & badges)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>Vector SVG export for printing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>Weekly email scan digests</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>5 Prompt-to-Page mobile sites</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('pro')}
              disabled={current === 'pro' || loadingPlan === 'pro'}
              className="w-full rounded-xl bg-[#11140F] py-3 text-[13.5px] font-semibold text-white hover:bg-[#2A2E25] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
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
                For growing brands & agencies wanting custom domains.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F]">
                  ${interval === 'year' ? '10' : '12'}
                </span>
                <span className="text-[13px] text-[#11140F]/50">/month</span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F]">
                  Billed annually ($120/yr)
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Link Slots</span>
                <strong className="text-blue-900 font-mono font-bold">500 Active</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Monthly Scans</span>
                <strong className="text-blue-900 font-mono font-bold">250,000 / mo</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">AI Budget</span>
                <strong className="text-blue-900 font-mono font-bold">$15.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[13px] text-[#11140F]/85">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span><strong>Custom Branded Domains</strong> (`qr.brand.com`)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span><strong>AI QR Art Studio</strong> (Stylized icons)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>25 Mobile Landing Pages</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>Bulk CSV link creator (up to 500)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>Priority email usage warnings</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('plus')}
              disabled={current === 'plus' || loadingPlan === 'plus'}
              className="w-full rounded-xl bg-[#2F6B4F] py-3 text-[13.5px] font-semibold text-white hover:bg-[#25553E] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
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
                For high-volume enterprises & multi-client agencies.
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold tracking-tight text-[#11140F]">
                  ${interval === 'year' ? '24' : '29'}
                </span>
                <span className="text-[13px] text-[#11140F]/50">/month</span>
              </div>
              {interval === 'year' && (
                <div className="mt-1 text-[11px] font-medium text-[#2F6B4F]">
                  Billed annually ($290/yr)
                </div>
              )}
            </div>

            {/* Core Quotas Box */}
            <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-3.5 space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Link Slots</span>
                <strong className="text-purple-900 font-mono font-bold">Unlimited</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">Monthly Scans</span>
                <strong className="text-purple-900 font-mono font-bold">Unlimited</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#11140F]/70 font-medium">AI Budget</span>
                <strong className="text-purple-900 font-mono font-bold">$50.00 / mo</strong>
              </div>
            </div>

            <ul className="space-y-3 text-[13px] text-[#11140F]/85">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span><strong>Unlimited</strong> Branded Custom Domains</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span><strong>Unlimited</strong> Mobile Landing Pages</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>Full AI automation orchestration</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>120 calls/min API burst throughput</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0" />
                <span>Dedicated priority SLA & support</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              onClick={() => handleCheckout('ultra')}
              disabled={current === 'ultra' || loadingPlan === 'ultra'}
              className="w-full rounded-xl border border-[#11140F]/20 bg-white py-3 text-[13.5px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
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
