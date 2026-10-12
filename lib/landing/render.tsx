'use client';

import React, { useState, useEffect } from "react";
import { LandingPageSpec, LandingBlock } from "./types";
import {
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Twitter,
  ArrowUpRight,
  Smartphone,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  Globe,
  Sparkles,
  Share2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function normalizeLandingUrl(url?: string | null, fallbackUrl?: string | null): string {
  if (!url || url.trim() === "" || url.trim() === "#") {
    if (fallbackUrl && fallbackUrl.trim() !== "" && fallbackUrl.trim() !== "#") {
      return normalizeLandingUrl(fallbackUrl);
    }
    return "#";
  }
  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed}`;
}

export interface RenderLandingPageProps {
  spec: LandingPageSpec;
  destinationUrl?: string;
  forceViewMode?: 'mobile' | 'tablet' | 'desktop' | 'responsive';
  shortCode?: string;
}

export function RenderLandingPage({
  spec,
  destinationUrl,
  forceViewMode = 'responsive',
  shortCode,
}: RenderLandingPageProps) {
  const { theme, blocks } = spec;
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const pageUrl = currentUrl || (shortCode ? `https://dynamicqr.co/page/${shortCode}` : 'https://dynamicqr.co');

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Find hero and contact blocks for layout assignment
  const heroBlock = blocks.find((b) => b.type === 'hero') as Extract<LandingBlock, { type: 'hero' }> | undefined;
  const contactBlock = blocks.find((b) => b.type === 'contact') as Extract<LandingBlock, { type: 'contact' }> | undefined;
  const contentBlocks = blocks.filter((b) => b.type !== 'hero');

  // 1. MOBILE PHONE LAYOUT (< 640px)
  const renderMobileView = () => (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-8 selection:bg-emerald-200 transition-colors"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="w-full max-w-md space-y-4 transition-all">
        {destinationUrl && (
          <a
            href={normalizeLandingUrl(destinationUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between w-full p-2.5 rounded-xl border transition-all text-[12px] font-medium shadow-2xs"
            style={{
              backgroundColor: `${theme.primaryColor}0D`,
              borderColor: `${theme.primaryColor}26`,
              color: theme.textColor,
            }}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
              <span className="truncate">
                Primary Destination: <strong className="font-semibold underline">{destinationUrl.replace(/^https?:\/\//, '')}</strong>
              </span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        )}

        {blocks.map((block, idx) => (
          <div key={idx} className="w-full">
            {renderMobileBlock(block, theme, destinationUrl)}
          </div>
        ))}

        {/* Viral Growth Footer */}
        <div className="pt-8 pb-4 text-center">
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || "https://my-qr-sandy.vercel.app"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-[11px] opacity-75 hover:opacity-100 font-medium"
          >
            <span>⚡ Powered by <strong>DynamicQR</strong></span>
            <span>&middot;</span>
            <span className="underline">Create your code</span>
          </a>
        </div>
      </div>
    </div>
  );

  // 2. TABLET LAYOUT (640px – 900px)
  const renderTabletView = () => (
    <div
      className="min-h-screen w-full flex flex-col items-center px-6 py-8 selection:bg-emerald-200 transition-colors"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="w-full max-w-3xl space-y-6">
        {/* Tablet Top Header Card */}
        <div
          className="p-6 rounded-3xl border shadow-sm flex items-center justify-between gap-4"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `${theme.textColor}15`,
          }}
        >
          <div className="flex items-center gap-4 min-w-0">
            {heroBlock?.avatarUrl ? (
              <img
                src={heroBlock.avatarUrl}
                alt={spec.businessName}
                className="w-16 h-16 rounded-2xl object-cover border-2 shrink-0"
                style={{ borderColor: theme.primaryColor }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shrink-0"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {spec.businessName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight truncate">
                  {heroBlock?.title || spec.businessName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  Verified
                </span>
              </div>
              {(heroBlock?.subtitle || spec.bio) && (
                <p className="text-[13px] opacity-75 truncate mt-0.5">
                  {heroBlock?.subtitle || spec.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 rounded-xl border bg-white hover:bg-slate-50 transition-colors"
              style={{ borderColor: `${theme.textColor}15` }}
              title="Copy link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 opacity-70" />}
            </button>
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="p-2 rounded-xl border bg-white hover:bg-slate-50 transition-colors"
              style={{ borderColor: `${theme.textColor}15` }}
              title="Scan on mobile"
            >
              <Smartphone className="w-4 h-4 text-emerald-700" />
            </button>
          </div>
        </div>

        {/* Primary Destination CTA */}
        {destinationUrl && (
          <a
            href={normalizeLandingUrl(destinationUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between w-full p-3.5 rounded-2xl border transition-all text-[13px] font-semibold shadow-xs"
            style={{
              backgroundColor: `${theme.primaryColor}0D`,
              borderColor: `${theme.primaryColor}26`,
              color: theme.textColor,
            }}
          >
            <div className="flex items-center gap-2.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
              <span className="truncate">
                Primary Destination: <strong className="underline">{destinationUrl.replace(/^https?:\/\//, '')}</strong>
              </span>
            </div>
            <ArrowUpRight className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        )}

        {/* Content Blocks in Tablet 2-Column Grid */}
        <div className="space-y-6">
          {contentBlocks.map((block, idx) => (
            <div key={idx} className="w-full">
              {renderDesktopBlock(block, theme, destinationUrl)}
            </div>
          ))}
        </div>

        {/* Tablet Footer */}
        <div className="pt-6 pb-4 text-center">
          <a
            href={process.env.NEXT_PUBLIC_APP_URL || "https://my-qr-sandy.vercel.app"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-[11px] opacity-75 hover:opacity-100 font-medium"
          >
            <span>⚡ Powered by <strong>DynamicQR</strong></span>
            <span>&middot;</span>
            <span className="underline">Create your code</span>
          </a>
        </div>
      </div>
    </div>
  );

  // 3. WIDESCREEN DESKTOP BENTO LAYOUT (>= 900px)
  const renderDesktopView = () => (
    <div
      className="min-h-screen w-full flex flex-col selection:bg-emerald-200 transition-colors"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      {/* Top Floating Glassmorphism Bar */}
      <header
        className="sticky top-0 z-30 px-6 py-3.5 backdrop-blur-md border-b bg-white/75 transition-all"
        style={{ borderColor: `${theme.textColor}12` }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {heroBlock?.avatarUrl ? (
              <img
                src={heroBlock.avatarUrl}
                alt={spec.businessName}
                className="w-9 h-9 rounded-xl object-cover border"
                style={{ borderColor: `${theme.primaryColor}30` }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-[14px]"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {spec.businessName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] tracking-tight">{spec.businessName}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Showcase
                </span>
              </div>
              {spec.bio && (
                <p className="text-[12px] opacity-70 truncate max-w-md">{spec.bio}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-medium bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              style={{ borderColor: `${theme.textColor}20` }}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 opacity-60" />
                  <span>Copy Page Link</span>
                </>
              )}
            </button>

            {/* Scan on Mobile Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-medium bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              style={{ borderColor: `${theme.textColor}20` }}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#2F6B4F]" />
              <span>Scan on Mobile</span>
            </button>

            {/* Main Destination Button */}
            {destinationUrl && (
              <a
                href={normalizeLandingUrl(destinationUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[12.5px] font-semibold text-white shadow-sm hover:opacity-95 transition-all"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <span>Visit Main Site</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main 2-Column Desktop Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* Left Column: Sticky Brand Profile & Mobile Companion QR */}
          <div className="col-span-12 md:col-span-5 xl:col-span-4 space-y-6 md:sticky md:top-24">
            {/* Elevated Brand Profile Card */}
            <div
              className="rounded-3xl p-7 border shadow-xl backdrop-blur-xs space-y-5"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: `${theme.textColor}15`,
              }}
            >
              <div className="space-y-3.5">
                {heroBlock?.avatarUrl ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 shadow-sm" style={{ borderColor: theme.primaryColor }}>
                    <img src={heroBlock.avatarUrl} alt={spec.businessName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-md border-2 border-white/20 shrink-0"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {spec.businessName.charAt(0).toUpperCase()}
                  </div>
                )}

                {heroBlock?.badgeText && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-2xs"
                    style={{ backgroundColor: theme.primaryColor, color: "#FFFFFF" }}
                  >
                    {heroBlock.badgeText}
                  </span>
                )}

                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight">
                    {heroBlock?.title || spec.businessName}
                  </h1>
                  {(heroBlock?.subtitle || spec.bio) && (
                    <p className="text-[13.5px] opacity-75 mt-1.5 leading-relaxed">
                      {heroBlock?.subtitle || spec.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Primary Destination Link Card */}
              {destinationUrl && (
                <a
                  href={normalizeLandingUrl(destinationUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block p-3.5 rounded-2xl border transition-all text-[12.5px] font-medium shadow-2xs hover:shadow-sm"
                  style={{
                    backgroundColor: `${theme.primaryColor}08`,
                    borderColor: `${theme.primaryColor}20`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                        PRIMARY DESTINATION
                      </div>
                      <p className="truncate font-bold mt-0.5 text-[13px]">{destinationUrl.replace(/^https?:\/\//, '')}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </a>
              )}

              {/* Contact Details */}
              {contactBlock && (
                <div className="pt-3 border-t space-y-2.5 text-[12.5px]" style={{ borderColor: `${theme.textColor}12` }}>
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-60 block">
                    Direct Contact
                  </span>
                  {contactBlock.phone && (
                    <a href={`tel:${contactBlock.phone}`} className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{contactBlock.phone}</span>
                    </a>
                  )}
                  {contactBlock.email && (
                    <a href={`mailto:${contactBlock.email}`} className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span>{contactBlock.email}</span>
                    </a>
                  )}
                  {contactBlock.address && (
                    <div className="flex items-start gap-2 opacity-80">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{contactBlock.address}</span>
                    </div>
                  )}
                  {(contactBlock.instagram || contactBlock.twitter) && (
                    <div className="flex items-center gap-2 pt-1">
                      {contactBlock.instagram && (
                        <a
                          href={`https://instagram.com/${contactBlock.instagram.replace('@','')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] opacity-80 hover:opacity-100 transition-opacity"
                          style={{ borderColor: `${theme.textColor}15` }}
                        >
                          <Instagram className="w-3 h-3" />
                          <span>@{contactBlock.instagram.replace('@','')}</span>
                        </a>
                      )}
                      {contactBlock.twitter && (
                        <a
                          href={`https://twitter.com/${contactBlock.twitter.replace('@','')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] opacity-80 hover:opacity-100 transition-opacity"
                          style={{ borderColor: `${theme.textColor}15` }}
                        >
                          <Twitter className="w-3 h-3" />
                          <span>@{contactBlock.twitter.replace('@','')}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live QR Mobile Companion Card */}
            <div
              className="rounded-3xl p-6 border shadow-sm flex items-center gap-4"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: `${theme.textColor}15`,
              }}
            >
              <div className="p-2 rounded-2xl bg-white border border-slate-200 shrink-0 shadow-2xs">
                <QRCodeSVG
                  value={pageUrl}
                  size={96}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-800">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Open on Smartphone</span>
                </div>
                <p className="text-[12px] opacity-75 leading-relaxed">
                  Scan this live code with your phone camera to browse this page natively on mobile.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Expansive Content Canvas */}
          <div className="col-span-12 md:col-span-7 xl:col-span-8 space-y-6">
            {contentBlocks.map((block, idx) => (
              <div key={idx} className="w-full">
                {renderDesktopBlock(block, theme, destinationUrl)}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Desktop Footer */}
      <footer className="mt-auto py-8 text-center border-t" style={{ borderColor: `${theme.textColor}10` }}>
        <a
          href={process.env.NEXT_PUBLIC_APP_URL || "https://my-qr-sandy.vercel.app"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/5 hover:bg-black/10 transition-colors text-[12px] opacity-75 hover:opacity-100 font-medium"
        >
          <span>⚡ Powered by <strong>DynamicQR</strong></span>
          <span>&middot;</span>
          <span className="underline">Create your free code</span>
        </a>
      </footer>
    </div>
  );

  // Modal QR Code Dialog
  const renderQrModal = () => (
    showQrModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={() => setShowQrModal(false)}
      >
        <div
          className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl text-center space-y-4 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-900">Scan to View on Mobile</h3>
            <p className="text-[12.5px] text-slate-500 mt-1">
              Point your phone&apos;s camera at this code to open {spec.businessName}&apos;s mobile showcase.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 inline-block shadow-inner">
            <QRCodeSVG
              value={pageUrl}
              size={180}
              level="Q"
              includeMargin={false}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowQrModal(false)}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    )
  );

  // Forced View Modes (for Editor Live Previews)
  if (forceViewMode === 'mobile') {
    return (
      <>
        {renderMobileView()}
        {renderQrModal()}
      </>
    );
  }

  if (forceViewMode === 'tablet') {
    return (
      <>
        {renderTabletView()}
        {renderQrModal()}
      </>
    );
  }

  if (forceViewMode === 'desktop') {
    return (
      <>
        {renderDesktopView()}
        {renderQrModal()}
      </>
    );
  }

  // Fluid Responsive Mode: Mobile (< 640px), Tablet (640px-768px), Desktop (>= 768px)
  return (
    <>
      <div className="block sm:hidden">
        {renderMobileView()}
      </div>
      <div className="hidden sm:block md:hidden">
        {renderTabletView()}
      </div>
      <div className="hidden md:block">
        {renderDesktopView()}
      </div>
      {renderQrModal()}
    </>
  );
}

// Mobile Blocks Renderer
function renderMobileBlock(
  block: LandingBlock,
  theme: LandingPageSpec["theme"],
  destinationUrl?: string
) {
  switch (block.type) {
    case "hero":
      return (
        <div className="text-center space-y-3 py-2">
          {block.avatarUrl && (
            <div className="mx-auto w-24 h-24 rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: theme.primaryColor }}>
              <img src={block.avatarUrl} alt={block.title} className="w-full h-full object-cover" />
            </div>
          )}
          {block.badgeText && (
            <span
              className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase shadow-sm"
              style={{ backgroundColor: theme.primaryColor, color: "#FFFFFF" }}
            >
              {block.badgeText}
            </span>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{block.title}</h1>
          {block.subtitle && (
            <p className="text-[14px] opacity-75 max-w-sm mx-auto leading-relaxed">
              {block.subtitle}
            </p>
          )}
        </div>
      );

    case "linkList":
      return (
        <div className="space-y-2.5">
          {block.title && (
            <h2 className="text-[12px] font-semibold uppercase tracking-wider opacity-60 px-1">
              {block.title}
            </h2>
          )}
          <div className="space-y-2">
            {block.items.map((item, i) => {
              const targetUrl = normalizeLandingUrl(item.url, destinationUrl);
              return (
                <a
                  key={i}
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full p-3.5 rounded-2xl border transition-all duration-150 transform active:scale-[0.98] ${
                    item.highlight
                      ? "shadow-md ring-2 ring-emerald-500/20"
                      : "shadow-2xs"
                  }`}
                  style={{
                    backgroundColor: item.highlight ? theme.primaryColor : theme.cardBg,
                    color: item.highlight ? "#FFFFFF" : theme.textColor,
                    borderColor: `${theme.textColor}15`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-[14px] truncate">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[12px] opacity-80 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-4 h-4 shrink-0 opacity-60" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      );

    case "menu":
      return (
        <div
          className="p-5 rounded-2xl border shadow-sm space-y-3"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `${theme.textColor}15`,
          }}
        >
          <h2 className="text-[13px] font-bold uppercase tracking-wider opacity-90 border-b pb-2" style={{ borderColor: `${theme.textColor}10` }}>
            {block.title}
          </h2>
          <div className="space-y-2.5">
            {block.items.map((m, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2 border-b border-dashed pb-2 last:border-0" style={{ borderColor: `${theme.textColor}15` }}>
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-[13.5px]">{m.name}</span>
                  {m.description && (
                    <p className="text-[11.5px] opacity-70 mt-0.5">{m.description}</p>
                  )}
                </div>
                <span className="font-mono font-bold text-[13px] shrink-0" style={{ color: theme.accentColor }}>
                  {m.price}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case "contact":
      return (
        <div
          className="p-5 rounded-2xl border shadow-sm space-y-3"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `${theme.textColor}15`,
          }}
        >
          <h2 className="text-[12.5px] font-bold uppercase tracking-wider opacity-80">
            {block.title}
          </h2>
          <div className="space-y-2 text-[12.5px]">
            {block.phone && (
              <a href={`tel:${block.phone}`} className="flex items-center gap-2 opacity-80 hover:opacity-100">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{block.phone}</span>
              </a>
            )}
            {block.email && (
              <a href={`mailto:${block.email}`} className="flex items-center gap-2 opacity-80 hover:opacity-100">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>{block.email}</span>
              </a>
            )}
            {block.address && (
              <div className="flex items-start gap-2 opacity-80">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{block.address}</span>
              </div>
            )}
          </div>
          {(block.instagram || block.twitter) && (
            <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: `${theme.textColor}10` }}>
              {block.instagram && (
                <a href={`https://instagram.com/${block.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] opacity-75 hover:opacity-100">
                  <Instagram className="w-3.5 h-3.5" />
                  <span>@{block.instagram.replace('@','')}</span>
                </a>
              )}
              {block.twitter && (
                <a href={`https://twitter.com/${block.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[11px] opacity-75 hover:opacity-100">
                  <Twitter className="w-3.5 h-3.5" />
                  <span>@{block.twitter.replace('@','')}</span>
                </a>
              )}
            </div>
          )}
        </div>
      );
  }
}

// Desktop & Tablet Expansive Block Renderer
function renderDesktopBlock(
  block: LandingBlock,
  theme: LandingPageSpec["theme"],
  destinationUrl?: string
) {
  switch (block.type) {
    case "hero":
      return null;

    case "linkList":
      return (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-bold uppercase tracking-wider opacity-70">
              {block.title || "Featured Actions & Links"}
            </h2>
            <span className="text-[11.5px] font-mono opacity-50">{block.items.length} items</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {block.items.map((item, i) => {
              const targetUrl = normalizeLandingUrl(item.url, destinationUrl);
              const isHighlight = item.highlight;
              return (
                <a
                  key={i}
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group block p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    isHighlight
                      ? "sm:col-span-2 shadow-md ring-2 ring-emerald-500/20"
                      : "shadow-2xs hover:shadow"
                  }`}
                  style={{
                    backgroundColor: isHighlight ? theme.primaryColor : theme.cardBg,
                    color: isHighlight ? "#FFFFFF" : theme.textColor,
                    borderColor: `${theme.textColor}15`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[14.5px] truncate">{item.title}</p>
                        {isHighlight && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/20 text-white shrink-0">
                            Featured
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className={`text-[12px] truncate mt-0.5 ${isHighlight ? 'text-white/80' : 'opacity-70'}`}>
                          {item.subtitle}
                        </p>
                      )}
                      <span className={`text-[11px] font-mono block mt-1 truncate ${isHighlight ? 'text-white/60' : 'opacity-40'}`}>
                        {targetUrl.replace(/^https?:\/\//, '')}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isHighlight ? 'bg-white/10' : 'bg-[#11140F]/5'}`}>
                      <ExternalLink className="w-4 h-4 opacity-80" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      );

    case "menu":
      return (
        <div
          className="p-6 rounded-3xl border shadow-sm space-y-4"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `${theme.textColor}15`,
          }}
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: `${theme.textColor}10` }}>
            <h2 className="text-[14px] font-bold uppercase tracking-wider opacity-90">
              {block.title}
            </h2>
            <span className="text-[11.5px] font-mono opacity-50">{block.items.length} items</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {block.items.map((m, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl border border-dashed flex flex-col justify-between gap-2"
                style={{ borderColor: `${theme.textColor}15` }}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-bold text-[14px]">{m.name}</span>
                    <span className="font-mono font-bold text-[13px] shrink-0" style={{ color: theme.accentColor }}>
                      {m.price}
                    </span>
                  </div>
                  {m.description && (
                    <p className="text-[12px] opacity-70 mt-1 leading-relaxed">{m.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "contact":
      return (
        <div
          className="p-6 rounded-3xl border shadow-sm space-y-4"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `${theme.textColor}15`,
          }}
        >
          <h2 className="text-[13px] font-bold uppercase tracking-wider opacity-80">
            {block.title}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
            {block.phone && (
              <a
                href={`tel:${block.phone}`}
                className="p-3 rounded-2xl border flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-all shadow-2xs"
                style={{ borderColor: `${theme.textColor}12` }}
              >
                <Phone className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="truncate">{block.phone}</span>
              </a>
            )}
            {block.email && (
              <a
                href={`mailto:${block.email}`}
                className="p-3 rounded-2xl border flex items-center gap-2.5 opacity-80 hover:opacity-100 transition-all shadow-2xs"
                style={{ borderColor: `${theme.textColor}12` }}
              >
                <Mail className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="truncate">{block.email}</span>
              </a>
            )}
            {block.address && (
              <div
                className="p-3 rounded-2xl border flex items-start gap-2.5 opacity-80 shadow-2xs"
                style={{ borderColor: `${theme.textColor}12` }}
              >
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span className="truncate">{block.address}</span>
              </div>
            )}
          </div>
        </div>
      );
  }
}
