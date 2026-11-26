'use client';

import React, { useState } from 'react';
import { Download, Copy, Check, Share2, Sparkles, QrCode } from 'lucide-react';

interface BioQuickActionsProps {
  domain: string;
  businessTitle: string;
  primaryEmail: string;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  vcardDownloadUrl: string;
}

export default function BioQuickActions({
  domain,
  businessTitle,
  primaryEmail,
  phoneNumber,
  whatsappNumber,
  vcardDownloadUrl,
}: BioQuickActionsProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopyDetails = () => {
    const lines = [
      businessTitle,
      `Domain: https://${domain}`,
      `Email: ${primaryEmail}`,
      phoneNumber ? `Phone: ${phoneNumber}` : '',
      whatsappNumber ? `WhatsApp: ${whatsappNumber}` : '',
    ].filter(Boolean);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: businessTitle,
          text: `Official Contact Portal & Brand Hub for ${businessTitle}`,
          url: `https://${domain}`,
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(`https://${domain}`);
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  return (
    <div className="space-y-2.5">
      {/* Primary vCard Download Button */}
      <a
        href={vcardDownloadUrl}
        className="group flex items-center justify-center gap-2.5 w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-[#09110D] font-bold text-[14px] shadow-lg shadow-emerald-500/15 transition-all text-center cursor-pointer"
      >
        <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
        <span>Save Contact Card (.vcf)</span>
      </a>

      {/* Secondary Desktop & Mobile Operability Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleCopyDetails}
          className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/10 text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-white/70" />
              <span>Copy Contact</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/10 text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          {shared ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-white/70" />
              <span>Share Portal</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
