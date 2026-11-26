'use client';

import React from 'react';
import Link from 'next/link';
import PageEditor from './PageEditor';
import { migrateLegacySpec } from '@/lib/page/migrate';
import { LandingPageSpec } from '@/lib/landing/types';
import { Page } from '@/lib/page/schema';
import { Smartphone, Lock, ArrowRight, X } from 'lucide-react';

interface LandingPageEditorProps {
  linkId: string;
  shortCode: string;
  destinationUrl: string;
  initialSpec?: LandingPageSpec | Page | any | null;
  isCurrentlyActive?: boolean;
  userTier?: string;
  isAdmin?: boolean;
  onSaved?: () => void;
  onReverted?: () => void;
  onClose?: () => void;
}

export default function LandingPageEditor({
  linkId,
  shortCode,
  destinationUrl,
  initialSpec,
  isCurrentlyActive = false,
  userTier = 'free',
  isAdmin = false,
  onSaved,
  onReverted,
  onClose,
}: LandingPageEditorProps) {
  const isEligible = isAdmin || ['plus', 'ultra'].includes(userTier.toLowerCase());

  if (!isEligible) {
    return (
      <div className="bg-white dark:bg-[#101211] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#11140F]/10 dark:border-white/12 space-y-6 animate-in fade-in zoom-in-95 duration-150 text-[#11140F] dark:text-white">
        <div className="flex items-center justify-between pb-4 border-b border-[#11140F]/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[16px] text-[#11140F] dark:text-white">Prompt-to-Page (AI)</h3>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                Plus & Ultra
              </span>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#11140F]/50 dark:text-white/50 hover:bg-[#11140F]/5 dark:hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-[14px] text-[#11140F]/70 dark:text-white/70 leading-relaxed">
            Prompt-to-Page generates high-converting, mobile-optimized micro landing pages from a simple text description.
          </p>
          <div className="rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/10 p-4 space-y-2 text-[12.5px] text-blue-900 dark:text-blue-200">
            <p className="font-semibold">Included on Plus & Ultra Plans:</p>
            <ul className="space-y-1 list-disc pl-4 text-blue-800/80 dark:text-blue-200/80">
              <li>Up to 3 Mobile Showcases (Plus) or Unlimited (Ultra)</li>
              <li>Responsive single-column live simulator (480px WCAG AA)</li>
              <li>Zero-reprint activation: instantly point physical codes to the page</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#11140F]/15 dark:border-white/12 text-[#11140F] dark:text-white/80 text-[13px] font-medium hover:bg-[#EEF0EA] dark:hover:bg-white/10 cursor-pointer"
            >
              Close
            </button>
          )}
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#11140F] dark:bg-[#34D399] text-white dark:text-[#09110D] text-[13px] font-semibold hover:bg-[#2A2E25] dark:hover:bg-[#2EC28A] transition-colors shadow-xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-blue-400 dark:text-[#09110D]" />
            <span>Upgrade to Plus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const initialPage = initialSpec ? migrateLegacySpec(initialSpec, destinationUrl) : null;

  return (
    <PageEditor
      linkId={linkId}
      shortCode={shortCode}
      destinationUrl={destinationUrl}
      initialPage={initialPage}
      isCurrentlyActive={isCurrentlyActive}
      userTier={userTier}
      isAdmin={isAdmin}
      onSaved={onSaved}
      onReverted={onReverted}
      onClose={onClose}
    />
  );
}
