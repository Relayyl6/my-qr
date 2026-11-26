// lib/page/render.tsx
import React from "react";
import { Page } from "./schema";
import { PALETTES, PaletteKey } from "./config";
import {
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Instagram,
  MessageCircle,
  ArrowRight,
  Share2,
} from "lucide-react";

export interface RenderPageProps {
  page: Page;
  pageId?: string; // If provided, links route via /r/{pageId}/{linkIndex}
  isLivePreview?: boolean;
}

export function RenderPage({ page, pageId, isLivePreview = false }: RenderPageProps) {
  const { brand, cta, links, services, contact } = page;
  const palette = PALETTES[brand.palette as PaletteKey] || PALETTES.ink;

  // Trackable redirect URLs or direct fallback
  const ctaUrl = pageId && !isLivePreview ? `/r/${pageId}/cta` : cta.url;
  const getLinkUrl = (index: number, directUrl: string) =>
    pageId && !isLivePreview ? `/r/${pageId}/${index}` : directUrl;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start px-4 py-8 sm:py-12 selection:bg-black/10 transition-colors"
      style={{
        backgroundColor: palette.bg,
        color: palette.fg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {/* Centered Single-Column Container (Max 480px across Mobile, Tablet, Desktop) */}
      <main className="w-full max-w-[480px] space-y-6 animate-in fade-in duration-300">
        {/* 1. Brand Header */}
        <header className="text-center space-y-2 pt-2 pb-1">
          {brand.logoUrl && (
            <div className="flex justify-center mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm border border-black/10 dark:border-white/10"
              />
            </div>
          )}
          <p
            className="text-[12px] font-semibold tracking-wider uppercase opacity-75"
            style={{ color: palette.accent }}
          >
            {brand.name}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {brand.headline}
          </h1>
          {brand.tagline && (
            <p className="text-[14.5px] opacity-80 leading-relaxed max-w-[400px] mx-auto">
              {brand.tagline}
            </p>
          )}
        </header>

        {/* 2. Primary CTA Button */}
        {cta.label && cta.url && (
          <section className="pt-1">
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl font-bold text-[15px] sm:text-[16px] shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] text-center"
              style={{
                backgroundColor: palette.accent,
                color: palette.bg === "#0F172A" || palette.accent === "#111111" ? "#FFFFFF" : "#FFFFFF",
              }}
            >
              <span>{cta.label}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </section>
        )}

        {/* 3. Secondary Links (max 4) */}
        {links && links.length > 0 && (
          <nav aria-label="Secondary links" className="space-y-2.5">
            {links.map((link, idx) => (
              <a
                key={idx}
                href={getLinkUrl(idx, link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between w-full p-3.5 px-4 rounded-xl border transition-all duration-150 text-[14px] font-medium shadow-2xs hover:shadow-sm"
                style={{
                  backgroundColor: palette.cardBg,
                  borderColor: palette.border,
                  color: palette.fg,
                }}
              >
                <span className="truncate pr-3">{link.label}</span>
                <ExternalLink className="w-4 h-4 opacity-50 flex-shrink-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </nav>
        )}

        {/* 4. Services or Menu Items (max 6) */}
        {services && services.length > 0 && (
          <section className="pt-2 space-y-2.5">
            <div className="flex items-center gap-2 pb-1">
              <span className="text-[12px] font-bold uppercase tracking-wider opacity-60">
                {page.template === "restaurant" ? "Featured Menu" : "Services & Offerings"}
              </span>
              <div
                className="h-[1px] flex-1 opacity-20"
                style={{ backgroundColor: palette.fg }}
              />
            </div>
            <div className="space-y-2">
              {services.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border transition-all"
                  style={{
                    backgroundColor: palette.cardBg,
                    borderColor: palette.border,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-[14px] leading-snug">{item.name}</span>
                    {item.price && (
                      <span
                        className="text-[12.5px] font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                        style={{
                          backgroundColor: `${palette.accent}1A`,
                          color: palette.accent,
                        }}
                      >
                        {item.price}
                      </span>
                    )}
                  </div>
                  {item.desc && (
                    <p className="text-[12.5px] opacity-75 mt-1 leading-normal">{item.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Contact & Socials Footer */}
        {contact && (contact.phone || contact.email || contact.address || contact.instagram || contact.whatsapp) && (
          <footer
            className="pt-4 pb-2 border-t mt-8 space-y-3 text-[13px] opacity-85"
            style={{ borderColor: palette.border }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity truncate"
                >
                  <Phone className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  <span className="truncate">{contact.phone}</span>
                </a>
              )}
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity truncate"
                >
                  <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  <span className="truncate">{contact.whatsapp}</span>
                </a>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity truncate"
                >
                  <Mail className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  <span className="truncate">{contact.email}</span>
                </a>
              )}
              {contact.instagram && (
                <a
                  href={`https://instagram.com/${contact.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-100 transition-opacity truncate"
                >
                  <Instagram className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  <span className="truncate">@{contact.instagram.replace(/^@/, "")}</span>
                </a>
              )}
            </div>
            {contact.address && (
              <div className="flex items-start gap-2 pt-1 text-[12px] opacity-75 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 opacity-70 mt-0.5" />
                <span>{contact.address}</span>
              </div>
            )}
          </footer>
        )}

        {/* Minimal branding & share badge */}
        <div className="pt-4 text-center opacity-40 text-[11px] flex items-center justify-center gap-1.5">
          <span>Powered by DynamicQR</span>
        </div>
      </main>
    </div>
  );
}
