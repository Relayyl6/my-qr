'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Tag,
  Megaphone,
  Sparkles,
  CheckCircle,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  Eye,
  Calendar,
  Layers,
  Percent,
} from 'lucide-react';
import { AdminPromoConfig, SAMPLE_PROMO_TEMPLATES, PROMO_DEFAULTS } from '@/lib/promo';
import {
  adminSavePromoConfig,
  adminCreatePromoCode,
  adminTogglePromoCode,
  adminDeletePromoCode,
} from '@/app/admin/actions';

interface PromoCodeItem {
  id: string;
  code: string;
  type: string;
  value: number;
  appliesTo: string;
  billingPeriod: string;
  maxRedemptions: number | null;
  redemptionsCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

interface AdminPromoManagerProps {
  initialConfig: AdminPromoConfig;
  initialPromoCodes: PromoCodeItem[];
}

export default function AdminPromoManager({
  initialConfig,
  initialPromoCodes,
}: AdminPromoManagerProps) {
  const [activeTab, setActiveTab] = useState<'banner' | 'modal' | 'codes'>('banner');
  const [config, setConfig] = useState<AdminPromoConfig>(initialConfig);
  const [promoCodes, setPromoCodes] = useState<PromoCodeItem[]>(initialPromoCodes);

  // Status & loading
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New promo code form modal
  const [showCreateCodeModal, setShowCreateCodeModal] = useState(false);
  const [newCodeForm, setNewCodeForm] = useState({
    code: '',
    type: 'percent',
    value: 40,
    appliesTo: 'all',
    billingPeriod: 'both',
    maxRedemptions: '',
    expiresAt: '',
  });

  const handleToggleBannerSwitch = async (checked: boolean) => {
    const effectiveMessage = config.banner.messageText?.trim() || PROMO_DEFAULTS.banner.messageText;
    const effectiveBadge = config.banner.badgeText?.trim() || PROMO_DEFAULTS.banner.badgeText;
    const effectivePromoCode = config.banner.promoCode?.trim() || PROMO_DEFAULTS.banner.promoCode;
    const effectiveCtaText = config.banner.ctaText?.trim() || PROMO_DEFAULTS.banner.ctaText;
    const effectiveCtaUrl =
      config.banner.ctaUrl?.trim() ||
      (effectivePromoCode ? `/pricing?promo=${effectivePromoCode}` : PROMO_DEFAULTS.banner.ctaUrl);

    const updatedBanner = {
      ...config.banner,
      enabled: checked,
      messageText: checked ? effectiveMessage : config.banner.messageText,
      badgeText: checked ? effectiveBadge : config.banner.badgeText,
      promoCode: checked ? effectivePromoCode : config.banner.promoCode,
      ctaText: checked ? effectiveCtaText : config.banner.ctaText,
      ctaUrl: checked ? effectiveCtaUrl : config.banner.ctaUrl,
    };

    const updated = {
      ...config,
      banner: updatedBanner,
    };
    setConfig(updated);
    try {
      await adminSavePromoConfig({ banner: updatedBanner });
      setStatusMsg(
        checked
          ? 'Announcement bar activated platform-wide!'
          : 'Announcement bar disabled platform-wide!'
      );
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update announcement bar state.');
    }
  };

  const handleToggleModalSwitch = async (checked: boolean) => {
    const effectiveHeadline = config.modal.headline?.trim() || PROMO_DEFAULTS.modal.headline;
    const effectiveBody = config.modal.bodyText?.trim() || PROMO_DEFAULTS.modal.bodyText;
    const effectiveBadge = config.modal.badgeText?.trim() || PROMO_DEFAULTS.modal.badgeText;
    const effectiveDiscount = config.modal.discountPercent || PROMO_DEFAULTS.modal.discountPercent;
    const effectivePromoCode = config.modal.promoCode?.trim() || PROMO_DEFAULTS.modal.promoCode;
    const effectiveCtaText = config.modal.ctaText?.trim() || PROMO_DEFAULTS.modal.ctaText;
    const effectiveFrequency = config.modal.frequencyDays || PROMO_DEFAULTS.modal.frequencyDays;

    const updatedModal = {
      ...config.modal,
      enabled: checked,
      headline: checked ? effectiveHeadline : config.modal.headline,
      bodyText: checked ? effectiveBody : config.modal.bodyText,
      badgeText: checked ? effectiveBadge : config.modal.badgeText,
      discountPercent: checked ? effectiveDiscount : config.modal.discountPercent,
      promoCode: checked ? effectivePromoCode : config.modal.promoCode,
      ctaText: checked ? effectiveCtaText : config.modal.ctaText,
      frequencyDays: checked ? effectiveFrequency : config.modal.frequencyDays,
    };

    const updated = {
      ...config,
      modal: updatedModal,
    };
    setConfig(updated);
    try {
      await adminSavePromoConfig({ modal: updatedModal });
      setStatusMsg(
        checked
          ? 'Entry popup modal activated platform-wide!'
          : 'Entry popup modal disabled platform-wide!'
      );
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update modal state.');
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const bannerToSave = {
      ...config.banner,
      messageText: config.banner.messageText?.trim() || PROMO_DEFAULTS.banner.messageText,
      badgeText: config.banner.badgeText?.trim() || PROMO_DEFAULTS.banner.badgeText,
      promoCode: config.banner.promoCode?.trim() || PROMO_DEFAULTS.banner.promoCode,
      ctaText: config.banner.ctaText?.trim() || PROMO_DEFAULTS.banner.ctaText,
      ctaUrl:
        config.banner.ctaUrl?.trim() ||
        (config.banner.promoCode?.trim()
          ? `/pricing?promo=${config.banner.promoCode.trim()}`
          : PROMO_DEFAULTS.banner.ctaUrl),
    };

    setConfig((prev) => ({ ...prev, banner: bannerToSave }));

    try {
      await adminSavePromoConfig({ banner: bannerToSave });
      setStatusMsg('Announcement bar settings published platform-wide!');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save announcement bar.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    setErrorMsg(null);

    const modalToSave = {
      ...config.modal,
      headline: config.modal.headline?.trim() || PROMO_DEFAULTS.modal.headline,
      bodyText: config.modal.bodyText?.trim() || PROMO_DEFAULTS.modal.bodyText,
      badgeText: config.modal.badgeText?.trim() || PROMO_DEFAULTS.modal.badgeText,
      discountPercent: config.modal.discountPercent || PROMO_DEFAULTS.modal.discountPercent,
      promoCode: config.modal.promoCode?.trim() || PROMO_DEFAULTS.modal.promoCode,
      ctaText: config.modal.ctaText?.trim() || PROMO_DEFAULTS.modal.ctaText,
      frequencyDays: config.modal.frequencyDays || PROMO_DEFAULTS.modal.frequencyDays,
    };

    setConfig((prev) => ({ ...prev, modal: modalToSave }));

    try {
      await adminSavePromoConfig({ modal: modalToSave });
      setStatusMsg('Entry promotional popup settings published platform-wide!');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save promo popup.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCode = async (id: string, currentActive: boolean) => {
    try {
      await adminTogglePromoCode(id, !currentActive);
      setPromoCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, active: !currentActive } : c))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle promo code');
    }
  };

  const handleDeleteCode = async (id: string, codeStr: string) => {
    if (!confirm(`Are you sure you want to delete promo code "${codeStr}"?`)) return;
    try {
      await adminDeletePromoCode(id);
      setPromoCodes((prev) => prev.filter((c) => c.id !== id));
      setStatusMsg(`Promo code "${codeStr}" deleted.`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete promo code');
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await adminCreatePromoCode({
        code: newCodeForm.code,
        type: newCodeForm.type,
        value: Number(newCodeForm.value),
        appliesTo: newCodeForm.appliesTo,
        billingPeriod: newCodeForm.billingPeriod,
        maxRedemptions: newCodeForm.maxRedemptions ? Number(newCodeForm.maxRedemptions) : null,
        expiresAt: newCodeForm.expiresAt || null,
      });

      if (res.promoCode) {
        setPromoCodes((prev) => [
          {
            id: res.promoCode.id,
            code: res.promoCode.code,
            type: res.promoCode.type,
            value: Number(res.promoCode.value),
            appliesTo: res.promoCode.appliesTo,
            billingPeriod: res.promoCode.billingPeriod,
            maxRedemptions: res.promoCode.maxRedemptions,
            redemptionsCount: res.promoCode.redemptionsCount,
            expiresAt: res.promoCode.expiresAt ? new Date(res.promoCode.expiresAt).toISOString() : null,
            active: res.promoCode.active,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      setShowCreateCodeModal(false);
      setNewCodeForm({
        code: '',
        type: 'percent',
        value: 40,
        appliesTo: 'all',
        billingPeriod: 'both',
        maxRedemptions: '',
        expiresAt: '',
      });
      setStatusMsg('New promo code created and activated!');
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create promo code.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#11140F]/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
            <h2 className="text-lg sm:text-xl font-bold text-[#11140F] tracking-tight">
              Promotional System & Banner Console
            </h2>
            <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Admin Sovereignty
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#11140F]/60 mt-1">
            Authoritative platform-wide management for the top announcement bar, entry promo popup, and checkout discount codes.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('banner')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'banner'
                ? 'bg-[#11140F] text-white shadow-sm'
                : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#EEF0EA]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Top Announcement Bar</span>
            <span
              className={`w-2 h-2 rounded-full ${
                config.banner.enabled ? 'bg-emerald-400' : 'bg-gray-400'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('modal')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'modal'
                ? 'bg-[#11140F] text-white shadow-sm'
                : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#EEF0EA]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Entry Promo Modal</span>
            <span
              className={`w-2 h-2 rounded-full ${
                config.modal.enabled ? 'bg-emerald-400' : 'bg-gray-400'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('codes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'codes'
                ? 'bg-[#11140F] text-white shadow-sm'
                : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#EEF0EA]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promo Codes Engine</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#11140F]/10">
              {promoCodes.length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Status & Feedback */}
      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{statusMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: TOP ANNOUNCEMENT BAR */}
      {activeTab === 'banner' && (
        <div className="space-y-6">
          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#11140F]/70">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Live Storefront Banner Simulation:
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  config.banner.enabled
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {config.banner.enabled ? 'ACTIVE & VISIBLE' : 'DISABLED (HIDDEN)'}
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#11140F]/15 shadow-sm">
              <div className="bg-gradient-to-r from-[#11140F] via-[#1a2218] to-[#11140F] text-white px-4 py-3 text-xs sm:text-[13px] flex items-center justify-center gap-3 text-center">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2F6B4F]/40 border border-[#34D399]/30 text-[#34D399] font-mono text-[11px] font-bold uppercase tracking-wider">
                  <Tag className="w-3 h-3" />
                  {config.banner.badgeText || 'PROMOTION'}
                </span>
                <span className="text-white/90">
                  {config.banner.messageText || 'Special Offer:'}{' '}
                  <code className="font-mono bg-white/15 px-1.5 py-0.5 rounded text-white font-bold">
                    {config.banner.promoCode || 'PROMO'}
                  </code>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#34D399] ml-1 underline underline-offset-4">
                  {config.banner.ctaText || 'Claim Offer'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Sample Template Loaders */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F7F8F5] rounded-xl border border-[#11140F]/8">
            <div className="flex items-center gap-1.5 text-xs text-[#11140F]/70">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-[#11140F]">Load Sample Template:</span>
              <span className="text-[#11140F]/50 hidden sm:inline">(Populates form fields as sample placeholder)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    banner: { ...SAMPLE_PROMO_TEMPLATES.black_friday.banner },
                  })
                }
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white border border-[#11140F]/15 hover:bg-[#EEF0EA] text-[#11140F] transition-all cursor-pointer"
              >
                Black Friday 40%
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    banner: { ...SAMPLE_PROMO_TEMPLATES.flash_sale.banner },
                  })
                }
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white border border-[#11140F]/15 hover:bg-[#EEF0EA] text-[#11140F] transition-all cursor-pointer"
              >
                Flash Sale 25%
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    banner: {
                      enabled: false,
                      badgeText: '',
                      messageText: '',
                      promoCode: '',
                      ctaText: 'Claim Offer',
                      ctaUrl: '/pricing',
                    },
                  })
                }
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 transition-all cursor-pointer"
              >
                Clear Form
              </button>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveBanner} className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 bg-[#F7F8F5] rounded-xl border border-[#11140F]/5">
              <div>
                <h4 className="text-xs font-bold text-[#11140F]">Display Announcement Bar</h4>
                <p className="text-[11.5px] text-[#11140F]/60">
                  When enabled, this bar renders across all public storefront pages and landing routes.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.banner.enabled}
                  onChange={(e) => handleToggleBannerSwitch(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11140F]" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Badge Pill Text</label>
                <input
                  type="text"
                  value={config.banner.badgeText}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      banner: { ...config.banner, badgeText: e.target.value },
                    })
                  }
                  placeholder="e.g. BLACK FRIDAY"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Promo Code to Feature</label>
                <input
                  type="text"
                  value={config.banner.promoCode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      banner: {
                        ...config.banner,
                        promoCode: e.target.value.toUpperCase(),
                        ctaUrl: `/pricing?promo=${e.target.value.toUpperCase()}`,
                      },
                    })
                  }
                  placeholder="e.g. BLACKFRIDAY40"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white font-mono font-bold focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#11140F]">Announcement Message</label>
              <input
                type="text"
                value={config.banner.messageText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    banner: { ...config.banner, messageText: e.target.value },
                  })
                }
                placeholder="e.g. Save 40% OFF all annual plans with code"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white focus:outline-hidden focus:border-[#2F6B4F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">CTA Button Label</label>
                <input
                  type="text"
                  value={config.banner.ctaText}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      banner: { ...config.banner, ctaText: e.target.value },
                    })
                  }
                  placeholder="e.g. Claim Offer"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">CTA Target URL</label>
                <input
                  type="text"
                  value={config.banner.ctaUrl}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      banner: { ...config.banner, ctaUrl: e.target.value },
                    })
                  }
                  placeholder="/pricing?promo=BLACKFRIDAY40"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white font-mono focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#11140F] text-white text-xs font-bold hover:bg-[#2A2E25] transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Publish Announcement Bar Updates</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ENTRY PROMO MODAL */}
      {activeTab === 'modal' && (
        <div className="space-y-6">
          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#11140F]/70">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                Live Storefront Modal Preview:
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                  config.modal.enabled
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {config.modal.enabled ? 'ACTIVE & TRIGGERING' : 'DISABLED (INACTIVE)'}
              </span>
            </div>

            <div className="rounded-2xl p-6 bg-[#0F120E] text-white border border-white/15 max-w-lg mx-auto shadow-xl space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2F6B4F]/30 border border-[#34D399]/30 text-[#34D399] font-mono text-[10.5px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  {config.modal.badgeText || 'SPECIAL OFFER'}
                </span>
                <span className="text-[11px] font-mono text-white/50">
                  {config.modal.frequencyDays}d cap
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {config.modal.headline}
                </h3>
                <p className="text-xs text-white/70 mt-1 leading-relaxed">
                  {config.modal.bodyText}
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-white/50 uppercase font-mono block">
                    Promo Code
                  </span>
                  <strong className="text-sm font-mono text-[#34D399] tracking-wider">
                    {config.modal.promoCode}
                  </strong>
                </div>
                <span className="text-xs font-bold bg-[#34D399] text-[#0F120E] px-2.5 py-1 rounded-lg">
                  {config.modal.discountPercent}% OFF
                </span>
              </div>

              <div className="pt-1">
                <div className="w-full py-2.5 rounded-xl bg-white text-[#11140F] text-xs font-bold text-center">
                  {config.modal.ctaText} &rarr;
                </div>
              </div>
            </div>
          </div>

          {/* Sample Template Loaders */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F7F8F5] rounded-xl border border-[#11140F]/8">
            <div className="flex items-center gap-1.5 text-xs text-[#11140F]/70">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold text-[#11140F]">Load Sample Template:</span>
              <span className="text-[#11140F]/50 hidden sm:inline">(Populates modal preview & fields)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    modal: { ...SAMPLE_PROMO_TEMPLATES.black_friday.modal },
                  })
                }
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white border border-[#11140F]/15 hover:bg-[#EEF0EA] text-[#11140F] transition-all cursor-pointer"
              >
                Black Friday 40%
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    modal: { ...SAMPLE_PROMO_TEMPLATES.flash_sale.modal },
                  })
                }
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white border border-[#11140F]/15 hover:bg-[#EEF0EA] text-[#11140F] transition-all cursor-pointer"
              >
                Flash Sale 25%
              </button>
              <button
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    modal: {
                      enabled: false,
                      badgeText: '',
                      headline: '',
                      bodyText: '',
                      discountPercent: 0,
                      promoCode: '',
                      ctaText: 'Claim Discount',
                      frequencyDays: 7,
                    },
                  })
                }
                className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-red-50 border border-red-200 hover:bg-red-100 text-red-700 transition-all cursor-pointer"
              >
                Clear Form
              </button>
            </div>
          </div>

          {/* Modal Settings Form */}
          <form onSubmit={handleSaveModal} className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 bg-[#F7F8F5] rounded-xl border border-[#11140F]/5">
              <div>
                <h4 className="text-xs font-bold text-[#11140F]">Enable Entry Promo Modal</h4>
                <p className="text-[11.5px] text-[#11140F]/60">
                  Triggers for visitors after 2.5 seconds with frequency cooldown.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.modal.enabled}
                  onChange={(e) => handleToggleModalSwitch(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#11140F]" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Badge Header</label>
                <input
                  type="text"
                  value={config.modal.badgeText}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      modal: { ...config.modal, badgeText: e.target.value },
                    })
                  }
                  placeholder="e.g. BLACK FRIDAY SPECIAL"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Discount Percent (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={config.modal.discountPercent}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      modal: { ...config.modal, discountPercent: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white font-mono focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#11140F]">Headline</label>
              <input
                type="text"
                value={config.modal.headline}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    modal: { ...config.modal, headline: e.target.value },
                  })
                }
                placeholder="e.g. Unlock 40% Off DynamicQR Pro & Plus"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white focus:outline-hidden focus:border-[#2F6B4F]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#11140F]">Body Copy</label>
              <textarea
                rows={2}
                value={config.modal.bodyText}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    modal: { ...config.modal, bodyText: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white focus:outline-hidden focus:border-[#2F6B4F] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Promo Code</label>
                <input
                  type="text"
                  value={config.modal.promoCode}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      modal: { ...config.modal, promoCode: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white font-mono font-bold focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Frequency Cooldown (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={config.modal.frequencyDays}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      modal: { ...config.modal, frequencyDays: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white font-mono focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#11140F] text-white text-xs font-bold hover:bg-[#2A2E25] transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Publish Entry Modal Updates</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PROMO CODES ENGINE */}
      {activeTab === 'codes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-[#11140F]/5">
            <div>
              <h3 className="text-sm font-bold text-[#11140F]">Active Coupon & Promo Codes</h3>
              <p className="text-xs text-[#11140F]/60 mt-0.5">
                Redeemable at Stripe checkout & developer tier upgrades. Configured codes instantly validate on `/pricing`.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateCodeModal(true)}
              className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Promo Code</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#11140F]/10 text-[#11140F]/50 uppercase tracking-wider font-mono">
                  <th className="pb-3 font-semibold">Promo Code</th>
                  <th className="pb-3 font-semibold">Discount</th>
                  <th className="pb-3 font-semibold">Applies To</th>
                  <th className="pb-3 font-semibold">Billing</th>
                  <th className="pb-3 font-semibold">Redemptions</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#11140F]/5">
                {promoCodes.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F7F8F5]/60 transition-colors">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#11140F]">
                          {item.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.code)}
                          className="p-1 text-[#11140F]/40 hover:text-[#11140F] cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedCode === item.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 font-bold text-emerald-700 font-mono">
                      {item.type === 'percent' ? `${item.value}% OFF` : `$${item.value} OFF`}
                    </td>
                    <td className="py-3.5 uppercase font-mono text-[11px] text-[#11140F]/70">
                      {item.appliesTo}
                    </td>
                    <td className="py-3.5 capitalize text-[#11140F]/70">
                      {item.billingPeriod}
                    </td>
                    <td className="py-3.5 font-mono">
                      <span className="font-bold text-[#11140F]">{item.redemptionsCount}</span>
                      {item.maxRedemptions && (
                        <span className="text-[#11140F]/50"> / {item.maxRedemptions} max</span>
                      )}
                    </td>
                    <td className="py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleCode(item.id, item.active)}
                        className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold uppercase cursor-pointer transition-colors ${
                          item.active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {item.active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteCode(item.id, item.code)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE PROMO CODE MODAL */}
      {showCreateCodeModal && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#11140F]/10 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#11140F]/10 pb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#11140F]">Create Sovereign Promo Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateCodeModal(false)}
                className="text-[#11140F]/50 hover:text-[#11140F] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCode} className="space-y-4">
              {/* Quick Preset Fillers */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F8F5] border border-[#11140F]/8">
                <span className="text-[11px] font-medium text-[#11140F]/60">Quick Presets:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setNewCodeForm({
                        code: 'BLACKFRIDAY40',
                        type: 'percent',
                        value: 40,
                        appliesTo: 'all',
                        billingPeriod: 'both',
                        maxRedemptions: '',
                        expiresAt: '',
                      })
                    }
                    className="px-2 py-0.5 text-[10.5px] font-mono font-bold rounded-md bg-white border border-[#11140F]/15 hover:bg-[#EEF0EA] text-[#11140F] transition-all cursor-pointer"
                  >
                    BLACKFRIDAY40
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewCodeForm({
                        code: 'FLASH25',
                        type: 'percent',
                        value: 25,
                        appliesTo: 'all',
                        billingPeriod: 'both',
                        maxRedemptions: '',
                        expiresAt: '',
                      })
                    }
                    className="px-2 py-0.5 text-[10.5px] font-mono font-bold rounded-md bg-white border border-[#11140F]/15 hover:bg-[#EEF0EA] text-[#11140F] transition-all cursor-pointer"
                  >
                    FLASH25
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Promo Code *</label>
                <input
                  type="text"
                  required
                  value={newCodeForm.code}
                  onChange={(e) =>
                    setNewCodeForm({ ...newCodeForm, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g. CYBERMONDAY50"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 font-mono font-bold focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Discount Type</label>
                  <select
                    value={newCodeForm.type}
                    onChange={(e) => setNewCodeForm({ ...newCodeForm, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Dollar ($)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Discount Value *</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={newCodeForm.value}
                    onChange={(e) =>
                      setNewCodeForm({ ...newCodeForm, value: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Applies To Plan</label>
                  <select
                    value={newCodeForm.appliesTo}
                    onChange={(e) => setNewCodeForm({ ...newCodeForm, appliesTo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white"
                  >
                    <option value="all">All Plans</option>
                    <option value="pro">Pro Only</option>
                    <option value="plus">Plus Only</option>
                    <option value="ultra">Ultra Only</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Billing Frequency</label>
                  <select
                    value={newCodeForm.billingPeriod}
                    onChange={(e) =>
                      setNewCodeForm({ ...newCodeForm, billingPeriod: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 bg-white"
                  >
                    <option value="both">Monthly & Annual</option>
                    <option value="annual">Annual Only</option>
                    <option value="monthly">Monthly Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Max Uses (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={newCodeForm.maxRedemptions}
                    onChange={(e) =>
                      setNewCodeForm({ ...newCodeForm, maxRedemptions: e.target.value })
                    }
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Expires On (Optional)</label>
                  <input
                    type="date"
                    value={newCodeForm.expiresAt}
                    onChange={(e) =>
                      setNewCodeForm({ ...newCodeForm, expiresAt: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowCreateCodeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#11140F]/70 hover:text-[#11140F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#11140F] text-white text-xs font-bold hover:bg-[#2A2E25] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
