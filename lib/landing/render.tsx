import React from "react";
import { LandingPageSpec, LandingBlock } from "./types";
import { ExternalLink, Mail, Phone, MapPin, Instagram, Twitter, ArrowUpRight } from "lucide-react";

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

export function RenderLandingPage({
  spec,
  destinationUrl,
}: {
  spec: LandingPageSpec;
  destinationUrl?: string;
}) {
  const { theme, blocks } = spec;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-8 sm:py-12 selection:bg-emerald-200"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="w-full max-w-md space-y-5">
        {destinationUrl && (
          <a
            href={normalizeLandingUrl(destinationUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between w-full p-2.5 rounded-xl border transition-all text-[12px] font-medium shadow-xs"
            style={{
              backgroundColor: `${theme.primaryColor}0D`,
              borderColor: `${theme.primaryColor}26`,
              color: theme.textColor,
            }}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
              <span className="truncate">
                Primary Website: <strong className="font-semibold underline">{destinationUrl.replace(/^https?:\/\//, '')}</strong>
              </span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        )}

        {blocks.map((block, idx) => (
          <div key={idx} className="w-full">
            {renderBlock(block, theme, destinationUrl)}
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
            <span className="underline">Create your free code</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function renderBlock(
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
            <p className="text-[14px] opacity-75 max-w-xs mx-auto leading-relaxed">
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
                  className={`block w-full p-4 rounded-2xl border transition-all duration-150 transform active:scale-[0.98] ${
                    item.highlight
                      ? "shadow-md hover:shadow-lg"
                      : "shadow-sm hover:shadow"
                  }`}
                  style={{
                    backgroundColor: item.highlight ? theme.primaryColor : theme.cardBg,
                    color: item.highlight ? "#FFFFFF" : theme.textColor,
                    borderColor: `${theme.textColor}15`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="font-semibold text-[15px] truncate">{item.title}</p>
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
          className="p-5 rounded-2xl border shadow-sm space-y-3.5"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: `${theme.textColor}15`,
          }}
        >
          <h2 className="text-[14px] font-bold uppercase tracking-wider opacity-90 border-b pb-2" style={{ borderColor: `${theme.textColor}10` }}>
            {block.title}
          </h2>
          <div className="space-y-3">
            {block.items.map((m, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2 border-b border-dashed pb-2 last:border-0" style={{ borderColor: `${theme.textColor}15` }}>
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-[14px]">{m.name}</span>
                  {m.description && (
                    <p className="text-[12px] opacity-70 mt-0.5">{m.description}</p>
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
          <h2 className="text-[13px] font-bold uppercase tracking-wider opacity-80">
            {block.title}
          </h2>
          <div className="space-y-2 text-[13px]">
            {block.phone && (
              <a href={`tel:${block.phone}`} className="flex items-center gap-2.5 opacity-80 hover:opacity-100">
                <Phone className="w-4 h-4 shrink-0" />
                <span>{block.phone}</span>
              </a>
            )}
            {block.email && (
              <a href={`mailto:${block.email}`} className="flex items-center gap-2.5 opacity-80 hover:opacity-100">
                <Mail className="w-4 h-4 shrink-0" />
                <span>{block.email}</span>
              </a>
            )}
            {block.address && (
              <div className="flex items-start gap-2.5 opacity-80">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{block.address}</span>
              </div>
            )}
          </div>
          {(block.instagram || block.twitter) && (
            <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: `${theme.textColor}10` }}>
              {block.instagram && (
                <a href={`https://instagram.com/${block.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] opacity-75 hover:opacity-100">
                  <Instagram className="w-4 h-4" />
                  <span>@{block.instagram.replace('@','')}</span>
                </a>
              )}
              {block.twitter && (
                <a href={`https://twitter.com/${block.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] opacity-75 hover:opacity-100">
                  <Twitter className="w-4 h-4" />
                  <span>@{block.twitter.replace('@','')}</span>
                </a>
              )}
            </div>
          )}
        </div>
      );
  }
}
