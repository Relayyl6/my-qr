'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Page, PageSchema } from '@/lib/page/schema';
import { PALETTES, PaletteKey, PageTemplate, LIMITS } from '@/lib/page/config';
import { RenderPage } from '@/lib/page/render';
import {
  generatePageCopyAction,
  saveLandingPageAction,
  revertLandingPageAction,
} from '@/lib/ai/features/landing-page-builder';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Lock,
  ExternalLink,
  Smartphone,
  Undo2,
  Palette as PaletteIcon,
  HelpCircle,
} from 'lucide-react';

interface PageEditorProps {
  linkId: string;
  shortCode: string;
  destinationUrl: string;
  initialPage?: Page | null;
  isCurrentlyActive?: boolean;
  userTier?: string;
  isAdmin?: boolean;
  onSaved?: () => void;
  onReverted?: () => void;
  onClose?: () => void;
}

const defaultPage = (destinationUrl: string): Page => ({
  schemaVersion: 1,
  template: 'creator',
  brand: {
    name: 'My Business',
    headline: 'Welcome to our space',
    tagline: 'Simple, direct, and made for our community.',
    palette: 'ink',
  },
  cta: {
    label: 'Visit Website',
    url: destinationUrl,
  },
  links: [
    { label: 'Follow our updates', url: 'https://instagram.com' },
  ],
  services: [
    { name: 'Core Offering', price: '', desc: 'Direct service tailored for you.' },
  ],
  contact: {
    email: '',
    phone: '',
    address: '',
    whatsapp: '',
    instagram: '',
  },
});

export const DEFAULT_PLACEHOLDERS = {
  brandName: 'My Business',
  headline: 'Welcome to our space',
  tagline: 'Simple, direct, and made for our community.',
  serviceName: 'Core Offering',
  serviceDesc: 'Direct service tailored for you.',
};

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export default function PageEditor({
  linkId,
  shortCode,
  destinationUrl,
  initialPage,
  isCurrentlyActive = false,
  userTier = 'free',
  isAdmin = false,
  onSaved,
  onReverted,
  onClose,
}: PageEditorProps) {
  const isEligible = isAdmin || ['plus', 'ultra'].includes(userTier.toLowerCase());

  // Form State
  const [page, setPage] = useState<Page>(() => initialPage || defaultPage(destinationUrl));
  const [isActive, setIsActive] = useState(isCurrentlyActive);
  const [showPlaceholderWarning, setShowPlaceholderWarning] = useState(false);

  const palette = PALETTES[page.brand.palette as PaletteKey] || PALETTES.ink;

  // Detect remaining fallback copy
  const isBrandNamePlaceholder = page.brand.name.trim() === DEFAULT_PLACEHOLDERS.brandName;
  const isHeadlinePlaceholder = page.brand.headline.trim() === DEFAULT_PLACEHOLDERS.headline;
  const isTaglinePlaceholder = page.brand.tagline.trim() === DEFAULT_PLACEHOLDERS.tagline;
  const hasServicePlaceholder = page.services.some(
    (s) => s.name.trim() === DEFAULT_PLACEHOLDERS.serviceName
  );

  const remainingPlaceholders: string[] = [];
  if (isBrandNamePlaceholder) remainingPlaceholders.push(`Brand Name ("${DEFAULT_PLACEHOLDERS.brandName}")`);
  if (isHeadlinePlaceholder) remainingPlaceholders.push(`Headline ("${DEFAULT_PLACEHOLDERS.headline}")`);
  if (isTaglinePlaceholder) remainingPlaceholders.push(`Tagline ("${DEFAULT_PLACEHOLDERS.tagline}")`);
  if (hasServicePlaceholder) remainingPlaceholders.push(`Service ("${DEFAULT_PLACEHOLDERS.serviceName}")`);

  // Accordion Sections State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    ai: true,
    brand: true,
    cta: true,
    links: false,
    services: false,
    contact: false,
  });

  // AI Generator state
  const [promptText, setPromptText] = useState('');
  const [servicesInput, setServicesInput] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAiGenerate = async () => {
    if (!promptText.trim()) {
      setStatusMessage({ text: 'Please describe what your business does.', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const res = await generatePageCopyAction({
        name: page.brand.name,
        description: promptText.trim(),
        items: servicesInput.trim() || undefined,
        contact: contactInput.trim() || undefined,
        destinationUrl,
      });

      const copy = res.copy;
      setPage((prev) => ({
        ...prev,
        template: copy.template,
        brand: {
          ...prev.brand,
          headline: copy.headline,
          tagline: copy.tagline,
        },
        cta: {
          ...prev.cta,
          label: copy.ctaLabel,
          url: destinationUrl, // Enforce in code
        },
        services: copy.services.length > 0 ? copy.services : prev.services,
      }));

      setStatusMessage({
        text: `Copy generated with AI (${res.source === 'cache' ? 'instant cache' : 'fresh model run'})! Review and edit anytime.`,
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'AI generation failed.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (forcePublish = false) => {
    if (!forcePublish && remainingPlaceholders.length > 0) {
      setShowPlaceholderWarning(true);
      return;
    }

    setShowPlaceholderWarning(false);
    setIsSaving(true);
    setStatusMessage(null);

    try {
      // Validate with Zod before saving
      const validated = PageSchema.parse({
        ...page,
        cta: {
          ...page.cta,
          url: destinationUrl, // Absolute code guarantee
        },
      });

      await saveLandingPageAction(linkId, validated, true);
      setIsActive(true);
      setStatusMessage({ text: 'Page published live! Visitors to this QR code will now see this micro-page.', type: 'success' });
      onSaved?.();
    } catch (err: any) {
      setStatusMessage({
        text: err.errors ? err.errors.map((e: any) => e.message).join(', ') : err.message || 'Failed to save page.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevert = async () => {
    if (!confirm('Revert this QR code to standard URL redirect? Visitors will directly open the destination link.')) return;
    setIsReverting(true);
    setStatusMessage(null);

    try {
      await revertLandingPageAction(linkId);
      setIsActive(false);
      setStatusMessage({ text: 'Reverted to direct URL redirect.', type: 'success' });
      onReverted?.();
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Revert failed.', type: 'error' });
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F1210] rounded-2xl p-4 sm:p-6 shadow-2xl border border-[#11140F]/10 dark:border-white/12 max-w-6xl w-full mx-auto space-y-6 text-[#11140F] dark:text-white">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#11140F]/10 dark:border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[17px]">Micro-Landing Page Engine</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold uppercase">
                v2 Single-Column
              </span>
            </div>
            <p className="text-[12px] opacity-60">
              Templates first • AI copy assist • 480px WCAG AA responsive layout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <button
              onClick={handleRevert}
              disabled={isReverting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-[12.5px] font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{isReverting ? 'Reverting...' : 'Revert to Redirect'}</span>
            </button>
          )}

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-[#11140F]/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-[13px] flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40'
              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800/40'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Two-Column Editor Layout: Form on Left (60%), Live Preview on Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Groups */}
        <div className="lg:col-span-7 space-y-4 max-h-[750px] overflow-y-auto pr-1">
          {/* Section 0: AI Copy Generator (Optional Shortcut) */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('ai')}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-[13.5px] font-bold text-emerald-900 dark:text-emerald-300">
                  AI Copywriter (Fills Headline, Tagline & Offerings)
                </h3>
              </div>
              {openSections.ai ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {openSections.ai && (
              <div className="space-y-3 pt-1 text-[13px]">
                <p className="opacity-75 text-[12px] leading-relaxed">
                  Enter brief notes about your business. The AI writes concise, fact-checked copy without altering your destination URL or palette.
                </p>
                <div>
                  <label className="block text-[11.5px] font-semibold uppercase opacity-60 mb-1">
                    What does your business do?
                  </label>
                  <textarea
                    rows={2}
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="e.g. Mama Tee's Kitchen, Lagos. Jollof rice, suya, and small chops for parties. Order on WhatsApp."
                    className="w-full px-3 py-2 text-[13px] rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-[#151916] focus:outline-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase opacity-60 mb-1">
                      Menu or items (optional)
                    </label>
                    <input
                      type="text"
                      value={servicesInput}
                      onChange={(e) => setServicesInput(e.target.value)}
                      placeholder="e.g. Jollof rice, Suya platter"
                      className="w-full px-3 py-1.5 text-[12.5px] rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-[#151916]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase opacity-60 mb-1">
                      Contact info (optional)
                    </label>
                    <input
                      type="text"
                      value={contactInput}
                      onChange={(e) => setContactInput(e.target.value)}
                      placeholder="e.g. 08012345678, Lekki Phase 1"
                      className="w-full px-3 py-1.5 text-[12.5px] rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-[#151916]"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[12.5px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isGenerating ? 'Writing Copy...' : 'Write Copy with AI'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 1: Brand & Palette */}
          <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 p-4 space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('brand')}
            >
              <h3 className="text-[14px] font-bold">1. Brand & Palette</h3>
              {openSections.brand ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {openSections.brand && (
              <div className="space-y-3 pt-1 text-[13px]">
                {/* Template picker */}
                <div>
                  <label className="block text-[11.5px] font-semibold uppercase opacity-60 mb-1.5">
                    Template Archetype
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['creator', 'restaurant'] as PageTemplate[]).map((tmpl) => (
                      <button
                        key={tmpl}
                        type="button"
                        onClick={() => setPage((p) => ({ ...p, template: tmpl }))}
                        className={`py-2 px-3 rounded-lg border text-center font-medium capitalize text-[13px] transition-all cursor-pointer ${
                          page.template === tmpl
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold'
                            : 'border-[#11140F]/10 dark:border-white/10 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {tmpl === 'creator' ? '👤 Creator / Bio Links' : '🍽️ Restaurant / Shop'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11.5px] font-semibold uppercase opacity-60">
                        Business / Brand Name
                      </label>
                      {isBrandNamePlaceholder && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          Sample text
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={page.brand.name}
                      onChange={(e) =>
                        setPage((p) => ({ ...p, brand: { ...p.brand, name: e.target.value } }))
                      }
                      className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-semibold uppercase opacity-60 mb-1">
                      Logo Image URL (optional)
                    </label>
                    <input
                      type="text"
                      value={page.brand.logoUrl || ''}
                      onChange={(e) =>
                        setPage((p) => ({
                          ...p,
                          brand: { ...p.brand, logoUrl: e.target.value.trim() || undefined },
                        }))
                      }
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11.5px] font-semibold uppercase opacity-60">Headline</label>
                      {isHeadlinePlaceholder && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          Sample text
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono opacity-50">
                      {countWords(page.brand.headline)}/{LIMITS.headlineWords} words
                    </span>
                  </div>
                  <input
                    type="text"
                    value={page.brand.headline}
                    onChange={(e) =>
                      setPage((p) => ({ ...p, brand: { ...p.brand, headline: e.target.value } }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent font-semibold"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11.5px] font-semibold uppercase opacity-60">Tagline / Bio</label>
                      {isTaglinePlaceholder && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          Sample text
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono opacity-50">
                      {countWords(page.brand.tagline)}/{LIMITS.taglineWords} words
                    </span>
                  </div>
                  <input
                    type="text"
                    value={page.brand.tagline}
                    onChange={(e) =>
                      setPage((p) => ({ ...p, brand: { ...p.brand, tagline: e.target.value } }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent"
                  />
                </div>

                {/* 6 Curated WCAG AA Palettes */}
                <div>
                  <label className="block text-[11.5px] font-semibold uppercase opacity-60 mb-1.5">
                    Curated Color Palette (WCAG AA Certified)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(Object.keys(PALETTES) as PaletteKey[]).map((pKey) => {
                      const pal = PALETTES[pKey];
                      const isSelected = page.brand.palette === pKey;
                      return (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() =>
                            setPage((p) => ({ ...p, brand: { ...p.brand, palette: pKey } }))
                          }
                          className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                              : 'border-[#11140F]/10 dark:border-white/10 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-full border border-black/15 shadow-inner flex items-center justify-center"
                            style={{ backgroundColor: pal.bg }}
                          >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: pal.accent }} />
                          </div>
                          <span className="text-[11px] font-medium">{pal.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Call to Action (CTA) */}
          <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 p-4 space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('cta')}
            >
              <h3 className="text-[14px] font-bold">2. Primary Call to Action</h3>
              {openSections.cta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {openSections.cta && (
              <div className="space-y-3 pt-1 text-[13px]">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11.5px] font-semibold uppercase opacity-60">Button Label</label>
                    <span className="text-[11px] font-mono opacity-50">
                      {countWords(page.cta.label)}/{LIMITS.ctaWords} words
                    </span>
                  </div>
                  <input
                    type="text"
                    value={page.cta.label}
                    onChange={(e) =>
                      setPage((p) => ({ ...p, cta: { ...p.cta, label: e.target.value } }))
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent font-bold"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#11140F]/5 dark:bg-white/5 border border-[#11140F]/10 dark:border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Locked Destination URL (Guaranteed by Code):</span>
                  </div>
                  <p className="text-[12px] font-mono opacity-70 truncate">{destinationUrl}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Secondary Links (Max 4) */}
          <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 p-4 space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('links')}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold">3. Secondary Links</h3>
                <span className="text-[11px] opacity-60 font-mono">({page.links.length}/{LIMITS.links})</span>
              </div>
              {openSections.links ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {openSections.links && (
              <div className="space-y-3 pt-1 text-[13px]">
                {page.links.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[#11140F]/10 dark:border-white/10 flex items-center gap-2"
                  >
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => {
                          const updated = [...page.links];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setPage((p) => ({ ...p, links: updated }));
                        }}
                        placeholder="Link Label"
                        className="w-full px-2.5 py-1 text-[12.5px] rounded border border-[#11140F]/10 dark:border-white/10 bg-transparent font-medium"
                      />
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => {
                          const updated = [...page.links];
                          updated[idx] = { ...updated[idx], url: e.target.value };
                          setPage((p) => ({ ...p, links: updated }));
                        }}
                        placeholder="https://..."
                        className="w-full px-2.5 py-1 text-[12px] font-mono rounded border border-[#11140F]/10 dark:border-white/10 bg-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setPage((p) => ({ ...p, links: p.links.filter((_, i) => i !== idx) }))
                      }
                      className="p-2 text-red-500 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {page.links.length < LIMITS.links && (
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => ({
                        ...p,
                        links: [...p.links, { label: 'New Link', url: 'https://' }],
                      }))
                    }
                    className="w-full py-1.5 border border-dashed border-[#11140F]/20 dark:border-white/20 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Link</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Services / Offerings (Max 6) */}
          <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 p-4 space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('services')}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold">4. Services or Menu Items</h3>
                <span className="text-[11px] opacity-60 font-mono">({page.services.length}/{LIMITS.services})</span>
              </div>
              {openSections.services ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {openSections.services && (
              <div className="space-y-3 pt-1 text-[13px]">
                {page.services.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-[#11140F]/10 dark:border-white/10 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...page.services];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setPage((p) => ({ ...p, services: updated }));
                          }}
                          placeholder="Item / Service Name"
                          className="w-full px-2.5 py-1 text-[12.5px] rounded border border-[#11140F]/10 dark:border-white/10 bg-transparent font-medium"
                        />
                        {item.name.trim() === DEFAULT_PLACEHOLDERS.serviceName && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold whitespace-nowrap">
                            Sample
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={item.price || ''}
                        onChange={(e) => {
                          const updated = [...page.services];
                          updated[idx] = { ...updated[idx], price: e.target.value };
                          setPage((p) => ({ ...p, services: updated }));
                        }}
                        placeholder="Price (optional)"
                        className="w-28 px-2.5 py-1 text-[12.5px] rounded border border-[#11140F]/10 dark:border-white/10 bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPage((p) => ({
                            ...p,
                            services: p.services.filter((_, i) => i !== idx),
                          }))
                        }
                        className="p-1 text-red-500 opacity-60 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.desc || ''}
                      onChange={(e) => {
                        const updated = [...page.services];
                        updated[idx] = { ...updated[idx], desc: e.target.value };
                        setPage((p) => ({ ...p, services: updated }));
                      }}
                      placeholder="Short description (max 12 words)"
                      className="w-full px-2.5 py-1 text-[12px] rounded border border-[#11140F]/10 dark:border-white/10 bg-transparent opacity-85"
                    />
                  </div>
                ))}

                {page.services.length < LIMITS.services && (
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => ({
                        ...p,
                        services: [...p.services, { name: 'New Item', price: '', desc: '' }],
                      }))
                    }
                    className="w-full py-1.5 border border-dashed border-[#11140F]/20 dark:border-white/20 rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Contact & Socials */}
          <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 p-4 space-y-3">
            <div
              className="flex items-center justify-between cursor-pointer select-none"
              onClick={() => toggleSection('contact')}
            >
              <h3 className="text-[14px] font-bold">5. Contact & Socials</h3>
              {openSections.contact ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>

            {openSections.contact && (
              <div className="space-y-3 pt-1 text-[13px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase opacity-60 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={page.contact.phone || ''}
                      onChange={(e) =>
                        setPage((p) => ({
                          ...p,
                          contact: { ...p.contact, phone: e.target.value },
                        }))
                      }
                      placeholder="+234..."
                      className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase opacity-60 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={page.contact.whatsapp || ''}
                      onChange={(e) =>
                        setPage((p) => ({
                          ...p,
                          contact: { ...p.contact, whatsapp: e.target.value },
                        }))
                      }
                      placeholder="080..."
                      className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase opacity-60 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={page.contact.email || ''}
                      onChange={(e) =>
                        setPage((p) => ({
                          ...p,
                          contact: { ...p.contact, email: e.target.value },
                        }))
                      }
                      placeholder="hello@..."
                      className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase opacity-60 mb-1">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      value={page.contact.instagram || ''}
                      onChange={(e) =>
                        setPage((p) => ({
                          ...p,
                          contact: { ...p.contact, instagram: e.target.value },
                        }))
                      }
                      placeholder="@yourhandle"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase opacity-60 mb-1">
                    Physical Address (optional)
                  </label>
                  <input
                    type="text"
                    value={page.contact.address || ''}
                    onChange={(e) =>
                      setPage((p) => ({
                        ...p,
                        contact: { ...p.contact, address: e.target.value },
                      }))
                    }
                    placeholder="e.g. 14 Victoria Island, Lagos"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Phone Mock Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-2 text-[12px] opacity-60 font-medium">
            <span className="truncate pr-2">Live Interactive Preview</span>
            <span className="font-mono text-[11px] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-md whitespace-nowrap">
              390px Mobile View
            </span>
          </div>

          {/* Smartphone Frame Wrapper */}
          <div className="w-[330px] sm:w-[350px] h-[680px] rounded-[44px] bg-[#11140F] p-3 shadow-2xl ring-1 ring-white/10 flex flex-col relative overflow-hidden">
            {/* Phone Speaker Pill Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-end px-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-900/40" />
            </div>

            {/* Screen Inner Viewport (Seamless palette background filling safe-area notch) */}
            <div
              className="w-full h-full rounded-[34px] overflow-y-auto overflow-x-hidden scrollbar-none relative"
              style={{ backgroundColor: palette.bg }}
            >
              <RenderPage page={page} isLivePreview={true} />
            </div>

            {/* Home indicator bar */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>

      {/* Placeholder Copy Warning Dialog */}
      {showPlaceholderWarning && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPlaceholderWarning(false);
          }}
        >
          <div className="bg-white dark:bg-[#161A17] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-amber-500/30 space-y-4 text-[#11140F] dark:text-white">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-bold text-[16px]">Sample Placeholder Copy Detected</h3>
            </div>
            <p className="text-[13px] opacity-80 leading-relaxed">
              Your page still contains default sample text that your visitors will see upon scanning:
            </p>
            <ul className="text-[12.5px] space-y-1.5 bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
              {remainingPlaceholders.map((item, i) => (
                <li key={i} className="flex items-center gap-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="truncate">{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-[12px] opacity-65">
              You can review and edit these fields, or publish now and customize them later anytime.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPlaceholderWarning(false)}
                className="px-4 py-2 rounded-xl border border-[#11140F]/15 dark:border-white/12 text-[12.5px] font-semibold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                Review & Edit
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[12.5px] font-semibold cursor-pointer"
              >
                Publish Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
