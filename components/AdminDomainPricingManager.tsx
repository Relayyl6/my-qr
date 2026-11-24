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
} from 'lucide-react';
import { DomainPricingConfig } from '@/lib/domains/fxEngine';
import { adminSavePricingConfig, adminRefreshLiveFx } from '@/app/domains-actions';
import { WHOLESALE_USD_PRICING, SUPPORTED_TLDS } from '@/lib/domains/constants';

export default function AdminDomainPricingManager({
  initialConfig,
}: {
  initialConfig: DomainPricingConfig;
}) {
  const [config, setConfig] = useState<DomainPricingConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Per-TLD price overrides state
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

    try {
      const res = await adminSavePricingConfig({
        mode: config.mode,
        bufferPercent: Number(config.bufferPercent),
        manualOverrideRate: Number(config.manualOverrideRate),
        platformMarkupNgn: Number(config.platformMarkupNgn),
        tldOverrides: cleanOverrides,
      });

      if (res.success && res.config) {
        setConfig(res.config);
        setAlert({ type: 'success', text: 'Pricing engine configuration saved and active platform-wide!' });
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
    <div className="rounded-2xl border border-[#11140F]/10 bg-white overflow-hidden shadow-xs space-y-0">
      {/* Header */}
      <div className="p-5 border-b border-[#11140F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-[16px] text-[#11140F]">
              FX Exchange Rate & Scaled Markup Sovereignty
            </h3>
          </div>
          <p className="text-[12.5px] text-[#11140F]/50 mt-0.5">
            Real-time APILayer exchange rates, safety buffers, platform markups, and per-TLD retail pricing overrides.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            disabled={refreshing}
            onClick={handleRefreshFx}
            className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 text-xs font-semibold hover:bg-[#F7F8F5] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
            <span>{saving ? 'Saving Rules...' : 'Save Pricing Rules'}</span>
          </button>
        </div>
      </div>

      {alert && (
        <div
          className={`mx-5 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Main FX Control Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Live Market Rate vs Scaled Buffered Rate */}
        <div className="p-4 rounded-xl border border-[#11140F]/10 bg-[#F7F8F5]/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono font-bold text-[#11140F]/50">
              Live API Rate (Source: {config.source})
            </span>
            <span className="text-[10px] text-[#11140F]/40 font-mono">
              {new Date(config.lastFetchedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-2xl font-black text-[#11140F] tracking-tight">
              ₦{config.liveMarketRate?.toFixed(2)}
              <span className="text-xs font-normal text-[#11140F]/50 ml-1">/ $1 USD</span>
            </div>
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Scaled with +{config.bufferPercent}% Buffer:</span>
              <strong className="font-mono text-sm">₦{config.bufferedRate}</strong>
            </div>
          </div>

          <p className="text-[11px] text-[#11140F]/60 leading-relaxed">
            Protects your margin against bank card conversion spreads and volatile settlement fluctuations.
          </p>
        </div>

        {/* Card 2: Mode & FX Buffer Percentage */}
        <div className="p-4 rounded-xl border border-[#11140F]/10 bg-white space-y-3">
          <label className="text-[11.5px] font-bold text-[#11140F] block">
            Exchange Rate Mode
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F7F8F5] border border-[#11140F]/10 text-xs">
            <button
              type="button"
              onClick={() => setConfig({ ...config, mode: 'auto_buffered' })}
              className={`py-1.5 px-2 rounded-lg font-bold text-center transition-all cursor-pointer ${
                config.mode === 'auto_buffered'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#11140F]/60 hover:text-[#11140F]'
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
                  : 'text-[#11140F]/60 hover:text-[#11140F]'
              }`}
            >
              Manual Fixed Override
            </button>
          </div>

          {config.mode === 'auto_buffered' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#11140F]/70">Safety Scaling Buffer:</span>
                <span className="font-mono font-bold text-emerald-700">{config.bufferPercent}%</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0"
                max="25"
                value={config.bufferPercent}
                onChange={(e) => setConfig({ ...config, bufferPercent: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#11140F]/70">Fixed Sovereign Rate (₦):</span>
                <span className="font-mono font-bold text-emerald-700">₦{config.manualOverrideRate}</span>
              </div>
              <input
                type="number"
                step="10"
                value={config.manualOverrideRate}
                onChange={(e) => setConfig({ ...config, manualOverrideRate: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Card 3: Platform Markup (Profit) */}
        <div className="p-4 rounded-xl border border-[#11140F]/10 bg-white space-y-3">
          <label className="text-[11.5px] font-bold text-[#11140F] block">
            Platform Markup (Domain + DNS + Email)
          </label>
          <div className="space-y-1">
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-[#11140F]/40">₦</span>
              <input
                type="number"
                step="100"
                value={config.platformMarkupNgn}
                onChange={(e) => setConfig({ ...config, platformMarkupNgn: Number(e.target.value) })}
                className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-[#11140F]/15 font-mono text-xs font-bold text-[#11140F] outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-[#11140F]/50 mt-1">
              Flat platform fee added on top of wholesale registrar cost for every domain sold.
            </p>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs border-t border-[#11140F]/10 text-[#11140F]/70">
            <span>Effective Billing FX:</span>
            <strong className="font-mono text-sm text-emerald-700">₦{effectiveRate} / $1</strong>
          </div>
        </div>
      </div>

      {/* Live Storefront TLD Catalog & Override Engine */}
      <div className="border-t border-[#11140F]/10 p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-semibold text-sm text-[#11140F]">
              Live Storefront Pricing & TLD Overrides ({SUPPORTED_TLDS.length} Extensions)
            </h4>
            <p className="text-[12px] text-[#11140F]/50">
              Wholesale USD rates automatically scale with the effective FX rate. Enter a custom price in the override column to set a fixed retail price.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#11140F]/10 bg-[#F7F8F5]/80 text-[11px] uppercase font-semibold text-[#11140F]/50 tracking-wider">
                <th className="py-2.5 px-3">TLD</th>
                <th className="py-2.5 px-3">Wholesale USD</th>
                <th className="py-2.5 px-3">Wholesale NGN (at ₦{effectiveRate})</th>
                <th className="py-2.5 px-3">Platform Fee</th>
                <th className="py-2.5 px-3">Auto Retail Price (₦)</th>
                <th className="py-2.5 px-3">Custom Override Price (₦)</th>
                <th className="py-2.5 px-3 text-right">Platform Profit Margin</th>
              </tr>
            </thead>
            <tbody>
              {SUPPORTED_TLDS.map((tld) => {
                const wholesaleUsd = WHOLESALE_USD_PRICING[tld] || 10.0;
                const wholesaleNgn = Math.ceil(wholesaleUsd * effectiveRate);
                const autoRetailNgn = Math.ceil((wholesaleNgn + config.platformMarkupNgn) / 100) * 100;
                const overrideVal = tldOverrides[tld] ? Number(tldOverrides[tld]) : null;
                const activeRetail = overrideVal && overrideVal > 0 ? overrideVal : autoRetailNgn;
                const profitNgn = activeRetail - wholesaleNgn;

                return (
                  <tr key={tld} className="border-b border-[#11140F]/5 hover:bg-[#F7F8F5]/50 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/5 text-[#11140F]">
                        .{tld}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono text-[#11140F]/70">
                      ${wholesaleUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono text-[#11140F]/70">
                      ₦{wholesaleNgn.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono text-[#11140F]/70">
                      +₦{config.platformMarkupNgn.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono font-semibold text-[#11140F]">
                      ₦{autoRetailNgn.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="relative max-w-[130px]">
                        <span className="absolute left-2.5 top-1.5 text-[11px] font-bold text-[#11140F]/40">₦</span>
                        <input
                          type="number"
                          step="100"
                          placeholder={String(autoRetailNgn)}
                          value={tldOverrides[tld] || ''}
                          onChange={(e) =>
                            setTldOverrides({ ...tldOverrides, [tld]: e.target.value })
                          }
                          className="w-full pl-6 pr-2 py-1 rounded border border-[#11140F]/15 font-mono text-xs outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-xs text-emerald-700">
                      +₦{profitNgn.toLocaleString()}
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
