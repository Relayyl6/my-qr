'use client';

import { useState } from 'react';
import { Check, Sparkles, Zap, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { UserTier } from '@/lib/ai/flags';

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
    <div className="space-y-12">
      {/* Interval Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-[14px] font-medium ${interval === 'month' ? 'text-[#11140F]' : 'text-[#11140F]/50'}`}>
          Monthly Billing
        </span>
        <button
          onClick={() => setInterval(interval === 'month' ? 'year' : 'month')}
          className="relative inline-flex h-7 w-12 items-center rounded-full bg-[#11140F] transition-colors p-1"
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
              interval === 'year' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-[14px] font-medium flex items-center gap-1.5 ${interval === 'year' ? 'text-[#11140F]' : 'text-[#11140F]/50'}`}>
          Yearly Billing
          <span className="rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F] text-[11px] font-semibold px-2 py-0.5">
            Save 20%
          </span>
        </span>
      </div>

      {/* Grid of 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {/* FREE PLAN */}
        <div className="rounded-3xl border border-[#11140F]/10 bg-white p-7 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#11140F]">Free</h3>
              {current === 'free' && (
                <span className="text-[11px] font-semibold bg-[#11140F]/5 text-[#11140F]/70 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Current
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] text-[#11140F]/60">Personal starter for permanent links & basic AI</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-[#11140F]">$0</span>
              <span className="text-[13px] text-[#11140F]/50">/month</span>
            </div>

            <ul className="mt-8 space-y-3.5 text-[13px] text-[#11140F]/75">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>5</strong> Active Dynamic QR Codes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>1,000</strong> Scans / month</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>$0.50/mo</strong> AI credit (~1,500 operations)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>Instant HTTP 307 redirects</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>One-click AI URL enricher</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>1024px PNG downloads</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('free')}
            disabled={current === 'free'}
            className="mt-8 w-full rounded-xl border border-[#11140F]/15 py-3 text-[14px] font-medium text-[#11140F] hover:bg-[#EEF0EA] transition-colors disabled:opacity-50"
          >
            {current === 'free' ? 'Current Plan' : 'Select Free'}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className="rounded-3xl border-2 border-[#11140F] bg-white p-7 sm:p-8 flex flex-col justify-between shadow-lg relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#11140F] text-white text-[11px] font-semibold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#96A689]" />
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#11140F]">Pro</h3>
              {current === 'pro' && (
                <span className="text-[11px] font-semibold bg-[#2F6B4F]/10 text-[#2F6B4F] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] text-[#11140F]/60">For marketers & businesses needing conditional routing</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-[#11140F]">
                ${interval === 'year' ? '10' : '12'}
              </span>
              <span className="text-[13px] text-[#11140F]/50">/month</span>
              {interval === 'year' && (
                <span className="text-[11px] text-[#2F6B4F] ml-1">billed yearly ($120)</span>
              )}
            </div>

            <ul className="mt-8 space-y-3.5 text-[13px] text-[#11140F]/75">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>50</strong> Active Dynamic QR Codes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>25,000</strong> Scans / month</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>$5.00/mo</strong> AI credit (~15,000 operations)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>AI Smart Routing</strong> (iOS vs Android & Geo)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>AI Campaign Analyst</strong> & scan trend diagnostics</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>5</strong> Prompt-to-Page Mobile Landing Pages</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>Bulk CSV link orchestrator (up to 50)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>300 DPI high-res labeled poster export</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('pro')}
            disabled={current === 'pro' || loadingPlan === 'pro'}
            className="mt-8 w-full rounded-xl bg-[#11140F] py-3 text-[14px] font-medium text-white hover:bg-[#2A2E25] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

        {/* PLUS PLAN */}
        <div className="rounded-3xl border border-[#11140F]/10 bg-white p-7 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#11140F]">Plus</h3>
              {current === 'plus' && (
                <span className="text-[11px] font-semibold bg-[#2F6B4F]/10 text-[#2F6B4F] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] text-[#11140F]/60">For brands & agencies scaling campaigns & custom artwork</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-[#11140F]">
                ${interval === 'year' ? '24' : '29'}
              </span>
              <span className="text-[13px] text-[#11140F]/50">/month</span>
              {interval === 'year' && (
                <span className="text-[11px] text-[#2F6B4F] ml-1">billed yearly ($290)</span>
              )}
            </div>

            <ul className="mt-8 space-y-3.5 text-[13px] text-[#11140F]/75">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>500</strong> Active Dynamic QR Codes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>250,000</strong> Scans / month</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>$15.00/mo</strong> AI credit (~45,000 operations)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>AI QR Artistic Studio</strong> (Themed branding)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>25</strong> Mobile Landing Pages</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>Bulk CSV link orchestrator (up to 500)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>Weekly automated email performance digests</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>Priority 60 calls/min AI burst limits</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('plus')}
            disabled={current === 'plus' || loadingPlan === 'plus'}
            className="mt-8 w-full rounded-xl bg-[#2F6B4F] py-3 text-[14px] font-medium text-white hover:bg-[#25553E] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

        {/* ULTRA PLAN */}
        <div className="rounded-3xl border border-[#11140F]/10 bg-white p-7 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#11140F]">Ultra</h3>
              {current === 'ultra' && (
                <span className="text-[11px] font-semibold bg-[#2F6B4F]/10 text-[#2F6B4F] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] text-[#11140F]/60">For high-volume enterprises & multi-client agencies</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight text-[#11140F]">
                ${interval === 'year' ? '65' : '79'}
              </span>
              <span className="text-[13px] text-[#11140F]/50">/month</span>
              {interval === 'year' && (
                <span className="text-[11px] text-[#2F6B4F] ml-1">billed yearly ($790)</span>
              )}
            </div>

            <ul className="mt-8 space-y-3.5 text-[13px] text-[#11140F]/75">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Unlimited</strong> Dynamic QR Codes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Unlimited</strong> Scans & bandwidth</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>$50.00/mo</strong> AI credit (~150,000+ operations)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span><strong>Unlimited</strong> Mobile Landing Pages</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>Unlimited Bulk Batch Ingestion</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>120 calls/min AI throughput limit</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2F6B4F] shrink-0 mt-0.5" />
                <span>Dedicated priority SLA & support</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => handleCheckout('ultra')}
            disabled={current === 'ultra' || loadingPlan === 'ultra'}
            className="mt-8 w-full rounded-xl border border-[#11140F]/15 py-3 text-[14px] font-medium text-[#11140F] hover:bg-[#EEF0EA] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
  );
}
