'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Percent,
  Sliders,
  Shield,
  Layers,
  ArrowUpRight,
  Sparkles,
  Calculator,
  Tag,
} from 'lucide-react';
import { DomainPricingConfig, RoundingStep, applyRoundingStep } from '@/lib/domains/fxEngine';
import { adminSavePricingConfig, adminRefreshLiveFx } from '@/app/domains-actions';
import { WHOLESALE_USD_PRICING, SUPPORTED_TLDS, getTldTier, TldTier } from '@/lib/domains/constants';

export default function AdminDomainPricingManager({
  initialConfig,
}: {
  initialConfig: DomainPricingConfig;
}) {
  const [config, setConfig] = useState<DomainPricingConfig>(() => ({
    ...initialConfig,
    budgetMarkupNgn: initialConfig.budgetMarkupNgn ?? 2000,
    standardMarkupNgn: initialConfig.standardMarkupNgn ?? 5000,
    premiumMarkupNgn: initialConfig.premiumMarkupNgn ?? 8000,
    roundingStep: initialConfig.roundingStep ?? 500,
    tldMargins: initialConfig.tldMargins ?? {},
    tldOverrides: initialConfig.tldOverrides ?? {},
  }));

  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Per-TLD margin inputs state
  const [tldMargins, setTldMargins] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (initialConfig.tldMargins) {
      for (const [k, v] of Object.entries(initialConfig.tldMargins)) {
        map[k] = String(v);
      }
    }
    return map;
  });

  // Per-TLD fixed price overrides state
  const [tldOverrides, setTldOverrides] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (initialConfig.tldOverrides) {
      for (const [k, v] of Object.entries(initialConfig.tldOverrides)) {
        map[k] = String(v);
      }
    }
    return map;
  });

  const handleRefreshFx = async () => {
    setRefreshing(true);
    setAlert(null);
    try {
      const res = await adminRefreshLiveFx();
      if (res.success && res.config) {
        setConfig(res.config);
        setAlert({ type: 'success', text: res.message });
      } else {
        setAlert({ type: 'error', text: res.message || 'Failed to refresh FX rate.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: e.message || 'Error refreshing FX rate.' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setAlert(null);

    // Clean TLD overrides
    const cleanOverrides: Record<string, number> = {};
    for (const [k, v] of Object.entries(tldOverrides)) {
      const num = Number(v);
      if (num > 0) cleanOverrides[k] = num;
    }

    // Clean TLD margins
    const cleanMargins: Record<string, number> = {};
    for (const [k, v] of Object.entries(tldMargins)) {
      const num = Number(v);
      if (num > 0) cleanMargins[k] = num;
    }

    try {
      const res = await adminSavePricingConfig({
        mode: config.mode,
        bufferPercent: Number(config.bufferPercent),
        manualOverrideRate: Number(config.manualOverrideRate),
        platformMarkupNgn: Number(config.platformMarkupNgn),
        budgetMarkupNgn: Number(config.budgetMarkupNgn || 2000),
        standardMarkupNgn: Number(config.standardMarkupNgn || 5000),
        premiumMarkupNgn: Number(config.premiumMarkupNgn || 8000),
        roundingStep: config.roundingStep || 500,
        tldMargins: cleanMargins,
        tldOverrides: cleanOverrides,
      });

      if (res.success && res.config) {
        setConfig(res.config);
        setAlert({ type: 'success', text: 'Tiered margins, progressions, and pricing rules saved platform-wide!' });
      } else {
        setAlert({ type: 'error', text: res.message || 'Failed to save configuration.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: e.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const effectiveRate = config.mode === 'manual_override' ? config.manualOverrideRate : config.bufferedRate;

  return (
    <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0E1017] overflow-hidden shadow-xs space-y-0">
      {/* Header */}
      <div className="p-5 border-b border-[#11140F]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-[#34D399]" />
            <h3 className="font-semibold text-[16px] text-[#11140F] dark:text-white">
              FX Exchange Rate &amp; Scaled Profit Margin Sovereignty
            </h3>
          </div>
          <p className="text-[12.5px] text-[#11140F]/50 dark:text-white/50 mt-0.5">
            Configure tiered margins (₦5k–₦8k for premium tech domains), clean price progressions (₦500 / ₦1,000 steps), and per-TLD retail rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={refreshing}
            onClick={handleRefreshFx}
            className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white text-xs font-semibold hover:bg-[#F7F8F5] dark:hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Fetch Live FX</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving Rules...' : 'Save Pricing & Margins'}</span>
          </button>
        </div>
      </div>

      {alert && (
        <div
          className={`mx-5 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            alert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/30'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#34D399] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Row 1: Core FX & Converter Engine */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Live Market Rate vs Scaled Buffered Rate */}
        <div className="p-4 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5]/60 dark:bg-white/[0.02] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono font-bold text-[#11140F]/50 dark:text-white/50">
              Live API Rate (Source: {config.source})
            </span>
            <span className="text-[10px] text-[#11140F]/40 dark:text-white/40 font-mono">
              {new Date(config.lastFetchedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-[#11140F] dark:text-white tracking-tight">
              ₦{config.liveMarketRate?.toFixed(2)}
              <span className="text-xs font-normal text-[#11140F]/50 dark:text-white/50 ml-1">/ $1 USD</span>
            </div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-[#34D399] flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Scaled with +{config.bufferPercent}% Buffer:</span>
              <strong className="font-mono text-sm">₦{config.bufferedRate}</strong>
            </div>
          </div>

          <p className="text-[11px] text-[#11140F]/60 dark:text-white/60 leading-relaxed">
            Protects your profit margin against bank card conversion spreads and volatile settlement fluctuations.
          </p>
        </div>

        {/* Card 2: Mode & FX Buffer Percentage */}
        <div className="p-4 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-white/[0.02] space-y-3">
          <label className="text-[11.5px] font-bold text-[#11140F] dark:text-white block">
            Exchange Rate Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F7F8F5] dark:bg-white/[0.04] border border-[#11140F]/10 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setConfig({ ...config, mode: 'auto_buffered' })}
              className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                config.mode === 'auto_buffered'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              Auto Buffered API
            </button>
            <button
              type="button"
              onClick={() => setConfig({ ...config, mode: 'manual_override' })}
              className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                config.mode === 'manual_override'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              Manual Fixed Override
            </button>
          </div>

          {config.mode === 'auto_buffered' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#11140F]/70 dark:text-white/70">Safety Scaling Buffer:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-[#34D399]">{config.bufferPercent}%</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={config.bufferPercent}
                onChange={(e) => setConfig({ ...config, bufferPercent: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#11140F]/70 dark:text-white/70">Fixed Sovereign Rate (₦):</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-[#34D399]">₦{config.manualOverrideRate}</span>
              </div>
              <input
                type="number"
                step="10"
                value={config.manualOverrideRate}
                onChange={(e) => setConfig({ ...config, manualOverrideRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Card 3: Base Fallback & Conversion Summary */}
        <div className="p-4 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-white/[0.02] space-y-3">
          <label className="text-[11.5px] font-bold text-[#11140F] dark:text-white block">
            Baseline Fallback Markup
          </label>
          <div className="space-y-1">
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-[#11140F]/40 dark:text-white/40">₦</span>
              <input
                type="number"
                step="100"
                value={config.platformMarkupNgn}
                onChange={(e) => setConfig({ ...config, platformMarkupNgn: Number(e.target.value) })}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white font-mono text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-[#11140F]/50 dark:text-white/50 mt-1">
              Fallback markup for any unclassified domain extension.
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs border-t border-[#11140F]/10 dark:border-white/10 text-[#11140F]/70 dark:text-white/70">
            <span>Effective Billing FX:</span>
            <strong className="font-mono text-sm text-emerald-700 dark:text-[#34D399]">₦{effectiveRate} / $1</strong>
          </div>
        </div>
      </div>

      {/* Row 2: Tiered Margins & Price Progression Controls */}
      <div className="border-t border-[#11140F]/10 dark:border-white/10 p-5 bg-[#F7F8F5]/40 dark:bg-white/[0.01]">
        <div className="mb-4">
          <h4 className="font-semibold text-sm text-[#11140F] dark:text-white flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-600 dark:text-[#34D399]" />
            <span>Tiered Profit Margins &amp; Progression Engine</span>
          </h4>
          <p className="text-[12px] text-[#11140F]/50 dark:text-white/50">
            Set higher profit margins (e.g. ₦5,000–₦8,000) for premium tech extensions and select clean retail rounding steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tier 1: Budget Domains Margin */}
          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Budget TLDs Margin
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-mono">
                .site, .xyz, .store
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">₦</span>
              <input
                type="number"
                step="500"
                value={config.budgetMarkupNgn || 2000}
                onChange={(e) => setConfig({ ...config, budgetMarkupNgn: Number(e.target.value) })}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white font-mono text-xs font-bold outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[10.5px] text-emerald-900/60 dark:text-emerald-300/60 leading-tight">
              Lower markup keeps high student &amp; local creator conversion.
            </p>
          </div>

          {/* Tier 2: Standard Domains Margin */}
          <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400">
                Standard TLDs Margin
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-mono">
                .com, .net, .org
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-blue-700 dark:text-blue-400">₦</span>
              <input
                type="number"
                step="500"
                value={config.standardMarkupNgn || 5000}
                onChange={(e) => setConfig({ ...config, standardMarkupNgn: Number(e.target.value) })}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-500/30 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white font-mono text-xs font-bold outline-none focus:border-blue-500"
              />
            </div>
            <p className="text-[10.5px] text-blue-900/60 dark:text-blue-300/60 leading-tight">
              Standard commercial margin for established businesses.
            </p>
          </div>

          {/* Tier 3: Premium Tech Domains Margin */}
          <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-400">
                Premium Tech Margin
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-mono font-bold">
                .co, .io
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-purple-700 dark:text-purple-400">₦</span>
              <input
                type="number"
                step="500"
                value={config.premiumMarkupNgn || 8000}
                onChange={(e) => setConfig({ ...config, premiumMarkupNgn: Number(e.target.value) })}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-500/30 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white font-mono text-xs font-bold outline-none focus:border-purple-500"
              />
            </div>
            <p className="text-[10.5px] text-purple-900/60 dark:text-purple-300/60 leading-tight">
              High-value tech SaaS margin (₦5,000–₦8,000+ profit per order).
            </p>
          </div>

          {/* Tier 4: Progression / Rounding Step */}
          <div className="p-3.5 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-white/[0.02] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#11140F]/70 dark:text-white/70 block">
              Price Progression Step
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: '₦500 Step', val: 500 },
                { label: '₦1,000 Step', val: 1000 },
                { label: '.900 Charm', val: 900 },
                { label: '₦100 Fine', val: 100 },
              ].map((stepOption) => (
                <button
                  key={stepOption.val}
                  type="button"
                  onClick={() => setConfig({ ...config, roundingStep: stepOption.val as RoundingStep })}
                  className={`py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                    (config.roundingStep || 500) === stepOption.val
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'border border-[#11140F]/10 dark:border-white/10 text-[#11140F]/70 dark:text-white/70 hover:bg-[#F7F8F5] dark:hover:bg-white/5'
                  }`}
                >
                  {stepOption.label}
                </button>
              ))}
            </div>
            <p className="text-[10.5px] text-[#11140F]/50 dark:text-white/50 leading-tight">
              Rounds final price to clean numbers (e.g. ₦24,000 vs ₦23,200).
            </p>
          </div>
        </div>
      </div>

      {/* Live Storefront TLD Catalog & Override Engine */}
      <div className="border-t border-[#11140F]/10 dark:border-white/10 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-semibold text-sm text-[#11140F] dark:text-white">
              Live Storefront TLD Catalog &amp; Per-Domain Profit Controls ({SUPPORTED_TLDS.length} Extensions)
            </h4>
            <p className="text-[12px] text-[#11140F]/50 dark:text-white/50">
              Wholesale USD rates scale at live FX (₦{effectiveRate}). Enter a custom margin or a direct fixed retail override for any extension.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5]/80 dark:bg-white/[0.03] text-[11px] uppercase font-semibold text-[#11140F]/50 dark:text-white/50 tracking-wider">
                <th className="py-2.5 px-3">Extension &amp; Tier</th>
                <th className="py-2.5 px-3">Wholesale USD</th>
                <th className="py-2.5 px-3">Wholesale NGN</th>
                <th className="py-2.5 px-3">Tier Profit Margin</th>
                <th className="py-2.5 px-3">Custom Margin Override (₦)</th>
                <th className="py-2.5 px-3">Storefront Price (₦)</th>
                <th className="py-2.5 px-3">Fixed Price Override (₦)</th>
                <th className="py-2.5 px-3 text-right">Net Profit / Sale</th>
              </tr>
            </thead>
            <tbody>
              {SUPPORTED_TLDS.map((tld) => {
                const tier = getTldTier(tld);
                const wholesaleUsd = WHOLESALE_USD_PRICING[tld] || 10.0;
                const wholesaleNgn = Math.ceil(wholesaleUsd * effectiveRate);

                // Tier default margin
                const tierDefaultMargin =
                  tier === 'premium'
                    ? (config.premiumMarkupNgn || 8000)
                    : tier === 'standard'
                    ? (config.standardMarkupNgn || 5000)
                    : (config.budgetMarkupNgn || 2000);

                // Custom margin override
                const customMarginVal = tldMargins[tld] ? Number(tldMargins[tld]) : null;
                const activeMargin = customMarginVal && customMarginVal > 0 ? customMarginVal : tierDefaultMargin;

                // Calculated retail price with progression rounding
                const rawTotal = wholesaleNgn + activeMargin;
                const autoRetailNgn = applyRoundingStep(rawTotal, config.roundingStep || 500);

                // Fixed retail price override
                const overrideVal = tldOverrides[tld] ? Number(tldOverrides[tld]) : null;
                const finalRetailNgn = overrideVal && overrideVal > 0 ? overrideVal : autoRetailNgn;
                const profitNgn = finalRetailNgn - wholesaleNgn;
                const profitPercent = Math.round((profitNgn / finalRetailNgn) * 100);

                return (
                  <tr
                    key={tld}
                    className="border-b border-[#11140F]/5 dark:border-white/5 hover:bg-[#F7F8F5]/50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* TLD & Tier Badge */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#11140F] dark:text-white">
                          .{tld}
                        </span>
                        <span
                          className={`text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            tier === 'premium'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40'
                              : tier === 'standard'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                          }`}
                        >
                          {tier}
                        </span>
                      </div>
                    </td>

                    {/* Wholesale USD */}
                    <td className="py-2.5 px-3 text-xs font-mono text-[#11140F]/70 dark:text-white/70">
                      ${wholesaleUsd.toFixed(2)}
                    </td>

                    {/* Wholesale NGN */}
                    <td className="py-2.5 px-3 text-xs font-mono text-[#11140F]/70 dark:text-white/70">
                      ₦{wholesaleNgn.toLocaleString()}
                    </td>

                    {/* Tier Default Margin */}
                    <td className="py-2.5 px-3 text-xs font-mono text-[#11140F]/60 dark:text-white/60">
                      +₦{tierDefaultMargin.toLocaleString()}
                    </td>

                    {/* Custom Margin Override */}
                    <td className="py-2.5 px-3">
                      <div className="relative max-w-[120px]">
                        <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-[#11140F]/40 dark:text-white/40">₦</span>
                        <input
                          type="number"
                          step="500"
                          placeholder={String(tierDefaultMargin)}
                          value={tldMargins[tld] || ''}
                          onChange={(e) =>
                            setTldMargins({ ...tldMargins, [tld]: e.target.value })
                          }
                          className="w-full pl-6 pr-2 py-1 rounded border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white font-mono text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </td>

                    {/* Storefront Retail Price */}
                    <td className="py-2.5 px-3 text-xs font-mono font-bold text-[#11140F] dark:text-white">
                      ₦{autoRetailNgn.toLocaleString()}
                    </td>

                    {/* Fixed Retail Price Override */}
                    <td className="py-2.5 px-3">
                      <div className="relative max-w-[120px]">
                        <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-[#11140F]/40 dark:text-white/40">₦</span>
                        <input
                          type="number"
                          step="500"
                          placeholder={String(autoRetailNgn)}
                          value={tldOverrides[tld] || ''}
                          onChange={(e) =>
                            setTldOverrides({ ...tldOverrides, [tld]: e.target.value })
                          }
                          className="w-full pl-6 pr-2 py-1 rounded border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] text-[#11140F] dark:text-white font-mono text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </td>

                    {/* Platform Net Profit & Margin % */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-xs text-emerald-700 dark:text-[#34D399]">
                          +₦{profitNgn.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-mono">
                          {profitPercent}% margin
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
