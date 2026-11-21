'use client';

import Link from 'next/link';
import { Sparkles, AlertTriangle, ArrowRight, CheckCircle2, Zap, RefreshCw } from 'lucide-react';

interface Props {
  userTier: string;
  isAdmin: boolean;
  activeLinksCount: number;
  maxLinks: number;
  monthlyScansCount: number;
  maxScans: number;
  aiUsedUsd: number;
  aiLimitUsd: number;
  daysUntilReset: number;
}

export default function PlanUsageMeter({
  userTier,
  isAdmin,
  activeLinksCount,
  maxLinks,
  monthlyScansCount,
  maxScans,
  aiUsedUsd,
  aiLimitUsd,
  daysUntilReset,
}: Props) {
  const isUnlimitedLinks = isAdmin || maxLinks >= 999999;
  const isUnlimitedScans = isAdmin || maxScans >= 999999;

  const linksPercent = isUnlimitedLinks ? 0 : Math.min(100, Math.round((activeLinksCount / maxLinks) * 100));
  const scansPercent = isUnlimitedScans ? 0 : Math.min(100, Math.round((monthlyScansCount / maxScans) * 100));
  const aiPercent = Math.min(100, Math.round((aiUsedUsd / (aiLimitUsd || 0.5)) * 100));

  const isNearLinksLimit = !isUnlimitedLinks && linksPercent >= 80;
  const isLinksCapped = !isUnlimitedLinks && activeLinksCount >= maxLinks;

  const isNearAiLimit = aiPercent >= 80;
  const isAiCapped = aiUsedUsd >= aiLimitUsd;

  return (
    <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-5 sm:p-7 shadow-xs dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-6 text-[#11140F] dark:text-white transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[16px] text-[#11140F] dark:text-white">Plan Capacity & Monthly Usage</h3>
            <span className="rounded-full bg-[#2F6B4F]/10 dark:bg-[#2F6B4F]/30 text-[#2F6B4F] dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider font-mono">
              {userTier} Plan
            </span>
          </div>
          <p className="text-[13px] text-[#11140F]/60 dark:text-white/60 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-[#2F6B4F] dark:text-emerald-400" />
            Monthly scan limits & AI budgets reset in <strong className="text-[#11140F] dark:text-white">{daysUntilReset} days</strong> (1st of next month).
          </p>
        </div>

        {!isAdmin && userTier.toLowerCase() !== 'ultra' && (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-[12.5px] font-medium hover:bg-[#2A2E25] dark:hover:bg-white/90 transition-colors shrink-0 self-start sm:self-auto shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#96A689] dark:text-[#2F6B4F]" />
            Upgrade Plan
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Warning Alert if near or at limits */}
      {(isNearLinksLimit || isLinksCapped || isNearAiLimit || isAiCapped) && !isAdmin && (
        <div
          className={`rounded-xl p-4 flex items-start gap-3 border text-[13px] ${
            isLinksCapped || isAiCapped
              ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
              : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isLinksCapped || isAiCapped ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
          <div className="space-y-1">
            <p className="font-semibold">
              {isLinksCapped
                ? `You have reached your limit of ${maxLinks} active links.`
                : isNearLinksLimit
                ? `You have used ${linksPercent}% of your link slots (${activeLinksCount}/${maxLinks}).`
                : 'Your monthly AI computation budget is almost exhausted.'}
            </p>
            <p className="text-opacity-80">
              {isLinksCapped
                ? 'Archive or delete inactive links to free up slots immediately, or upgrade to Pro/Plus for higher limits.'
                : 'Upgrade before your limit is reached to ensure zero downtime on your printed materials.'}
            </p>
          </div>
        </div>
      )}

      {/* 3 Metric Increment Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Active QR Links */}
        <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#EEF0EA]/40 dark:bg-white/[0.04] p-4 space-y-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#11140F] dark:text-white">Active QR Links</span>
            <span className="font-mono text-[12px] font-bold text-[#11140F] dark:text-emerald-400">
              {isUnlimitedLinks ? `${activeLinksCount} (Unlimited)` : `${activeLinksCount} / ${maxLinks}`}
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#11140F]/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlimitedLinks
                  ? 'bg-[#2F6B4F] dark:bg-emerald-500'
                  : linksPercent >= 100
                  ? 'bg-red-600'
                  : linksPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-[#2F6B4F] dark:bg-emerald-500'
              }`}
              style={{ width: isUnlimitedLinks ? '100%' : `${linksPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#11140F]/55 dark:text-white/50">
            <span>{isUnlimitedLinks ? 'No cap' : `${maxLinks - activeLinksCount} slots remaining`}</span>
            <span>{isUnlimitedLinks ? '100% available' : `${linksPercent}% used`}</span>
          </div>
        </div>

        {/* Metric 2: Monthly Redirect Scans */}
        <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#EEF0EA]/40 dark:bg-white/[0.04] p-4 space-y-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#11140F] dark:text-white">Monthly Scans</span>
            <span className="font-mono text-[12px] font-bold text-[#11140F] dark:text-emerald-400">
              {isUnlimitedScans ? `${monthlyScansCount.toLocaleString()} (Unlimited)` : `${monthlyScansCount.toLocaleString()} / ${maxScans.toLocaleString()}`}
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#11140F]/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isUnlimitedScans
                  ? 'bg-[#2F6B4F] dark:bg-emerald-500'
                  : scansPercent >= 100
                  ? 'bg-red-600'
                  : scansPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-[#2F6B4F] dark:bg-emerald-500'
              }`}
              style={{ width: isUnlimitedScans ? '100%' : `${scansPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#11140F]/55 dark:text-white/50">
            <span>Resets on 1st</span>
            <span>{isUnlimitedScans ? 'Unlimited' : `${scansPercent}% used`}</span>
          </div>
        </div>

        {/* Metric 3: AI Compute Credit */}
        <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#EEF0EA]/40 dark:bg-white/[0.04] p-4 space-y-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="font-medium text-[#11140F] dark:text-white">Monthly AI Budget</span>
            <span className="font-mono text-[12px] font-bold text-[#11140F] dark:text-emerald-400">
              ${aiUsedUsd.toFixed(2)} / ${aiLimitUsd.toFixed(2)}
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-[#11140F]/10 dark:bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                aiPercent >= 100
                  ? 'bg-red-600'
                  : aiPercent >= 80
                  ? 'bg-amber-500'
                  : 'bg-[#2F6B4F] dark:bg-emerald-500'
              }`}
              style={{ width: `${aiPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#11140F]/55 dark:text-white/50">
            <span>AI routing & intelligence</span>
            <span>{aiPercent}% used</span>
          </div>
        </div>
      </div>
    </div>
  );
}
