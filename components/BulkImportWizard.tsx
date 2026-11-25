'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  orchestrateBulkImportAction,
  applyOrchestratedCampaignAction,
} from '@/lib/ai/features/campaign-orchestrator';
import { CampaignOrchestratorOutput } from '@/lib/ai/prompts/campaign-orchestrator.v1';
import {
  Sparkles,
  Layers,
  Loader2,
  CheckCircle,
  FileSpreadsheet,
  X,
  ArrowRight,
  Zap,
  Lock,
} from 'lucide-react';
import AiProgressTracker from '@/components/AiProgressTracker';

interface BulkImportWizardProps {
  userTier?: string;
  isAdmin?: boolean;
  onImportComplete?: () => void;
  onClose?: () => void;
}

const PRESET_BATCHES = [
  {
    name: 'Omnichannel Socials',
    text: `https://instagram.com/mybusiness, Official Instagram\nhttps://tiktok.com/@mybrand, TikTok Showcase\nhttps://linkedin.com/company/mybrand, Corporate LinkedIn\nhttps://youtube.com/@mybrand, Video Channel`,
  },
  {
    name: 'Summer Sale & Promo',
    text: `https://example.com/summer-sale, Summer Collection 50% Off\nhttps://example.com/vip-tickets, VIP Early-Access Pass\nhttps://example.com/contact-us, Priority Helpdesk\nhttps://example.com/feedback, Customer Satisfaction Survey`,
  },
];

export function parseBulkImportLines(rawText: string): { destinationUrl: string; label?: string }[] {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const parts = line.split(',');
    const destinationUrl = parts[0].trim();
    const label = parts[1] ? parts[1].trim() : undefined;
    return { destinationUrl, label };
  });
}

export function createLocalFallback(items: { destinationUrl: string; label?: string }[]) {
  return {
    totalItemsProcessed: items.length,
    summary: `Clustered ${items.length} destination assets into a unified marketing campaign using the High-Speed Engine.`,
    campaigns: [
      {
        campaignName: 'Bulk Marketing Ingestion',
        category: 'Promotional & Social',
        suggestedStrategy: 'High-speed edge redirects with real-time analytics tracking.',
        items: items.map((it, idx) => {
          let slug = `asset-${idx + 1}`;
          try {
            const u = new URL(it.destinationUrl);
            slug = u.hostname.replace('www.', '').split('.')[0] || slug;
          } catch {}
          return {
            destinationUrl: it.destinationUrl,
            label: it.label || `Asset #${idx + 1}`,
            shortCode: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
            tags: ['bulk-import', 'auto-routed'],
          };
        }),
      },
    ],
  };
}

export default function BulkImportWizard({
  userTier = 'free',
  isAdmin = false,
  onImportComplete,
  onClose,
}: BulkImportWizardProps) {
  const isEligible = isAdmin || ['pro', 'plus', 'ultra'].includes(userTier.toLowerCase());

  if (!isEligible) {
    return (
      <div className="bg-white dark:bg-[#101211] text-[#11140F] dark:text-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#11140F]/10 dark:border-white/12 space-y-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-[#11140F]/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-[#2F6B4F] dark:text-[#34D399] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[16px] text-[#11140F] dark:text-white">Bulk Link Ingestion</h3>
              <span className="text-[10.5px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#11140F]/5 dark:bg-white/10 text-[#11140F]/70 dark:text-[#34D399] uppercase tracking-wider">
                Pro &amp; Higher
              </span>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-[#11140F]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-4">
          <p className="text-[13.5px] text-[#11140F]/70 dark:text-white/65 leading-relaxed">
            Automatically cluster CSV or text link batches into organized campaigns with semantic shortcodes and instant deployment.
          </p>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 space-y-2 text-[12.5px]">
            <p className="font-semibold text-[#11140F] dark:text-white">Included on Pro, Plus &amp; Ultra Plans:</p>
            <ul className="space-y-1 list-disc pl-4 text-[#11140F]/75 dark:text-white/75">
              <li>Up to 50 active links on Pro, 500 on Plus, unlimited on Ultra</li>
              <li>Batch CSV and plain text paste ingestion</li>
              <li>Automated campaign naming &amp; tag classification</li>
              <li>Instant 1-click batch generation</li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-[#11140F] dark:text-white text-[13px] font-medium hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            >
              Close
            </button>
          )}
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#34D399] text-[#09110D] text-[13px] font-bold hover:opacity-90 transition-opacity shadow-xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const [rawText, setRawText] = useState(PRESET_BATCHES[0].text);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [orchestrated, setOrchestrated] = useState<CampaignOrchestratorOutput | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const getParsedItems = () => parseBulkImportLines(rawText);

  const [orchestratedMeta, setOrchestratedMeta] = useState<{ isFallback?: boolean; latencyMs?: number } | null>(null);

  const handleOrchestrate = async () => {
    const items = getParsedItems();
    if (items.length === 0) return;

    setLoading(true);
    setStatusMsg(null);
    setOrchestratedMeta(null);

    try {
      const res = await orchestrateBulkImportAction(items);
      setOrchestrated(res.output);
      setOrchestratedMeta({ isFallback: res.isFallback, latencyMs: res.latencyMs });
    } catch (err: any) {
      console.warn('[BulkImportWizard] Server action failed, engaging smart heuristic engine:', err.message);
      setOrchestrated(createLocalFallback(items));
      setOrchestratedMeta({ isFallback: true, latencyMs: 120 });
    } finally {
      setLoading(false);
    }
  };

  const handleForceComplete = () => {
    const items = getParsedItems();
    setOrchestrated(createLocalFallback(items));
    setOrchestratedMeta({ isFallback: true, latencyMs: 50 });
    setLoading(false);
  };

  const handleApply = async () => {
    if (!orchestrated) return;
    setApplying(true);
    try {
      const res = await applyOrchestratedCampaignAction(orchestrated.campaigns);
      setStatusMsg(`Successfully created ${res.createdCount} QR links!`);
      onImportComplete?.();
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (err: any) {
      setStatusMsg(err.message || 'Failed to deploy campaigns.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-[#101211] text-[#11140F] dark:text-white p-5 sm:p-6 shadow-2xl space-y-4 max-w-2xl w-full max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between shrink-0 pb-3 border-b border-[#11140F]/10 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Layers className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399]" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[#11140F] dark:text-white">
              Bulk Import &amp; Campaign Builder
            </h3>
            <p className="text-[12px] text-[#11140F]/55 dark:text-white/55">
              Paste URLs or CSV lines to organize, slugify, and bulk-deploy
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#11140F]/45 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 space-y-4">
        {loading ? (
          <AiProgressTracker
            title="Organizing Campaign Clusters"
            subtitle="Grouping destinations, generating shortcodes & assigning campaign tags"
            onForceComplete={handleForceComplete}
          />
        ) : !orchestrated ? (
          <div className="space-y-3">
            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11.5px] font-medium text-[#11140F]/60 dark:text-white/55">Quick Examples:</span>
              {PRESET_BATCHES.map((batch, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawText(batch.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-black/5 dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/10 text-[#11140F]/80 dark:text-white/80 transition-colors cursor-pointer"
                >
                  {batch.name}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-medium text-[#11140F]/75 dark:text-white/80">
                Paste Destination URLs (one per line, format: <code className="font-mono text-[#34D399]">url, label</code>)
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="https://example.com/link-1, Flyer 1&#10;https://example.com/link-2, Flyer 2"
                className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-black/40 p-3 text-[13px] font-mono text-[#11140F] dark:text-white placeholder:text-[#11140F]/35 dark:placeholder:text-white/35 outline-none focus:border-[#34D399] transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleOrchestrate}
                disabled={loading || !rawText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#34D399] hover:bg-[#34D399]/90 text-[#09110D] text-[12.5px] font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Organize Campaigns</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[12.5px] text-[#11140F] dark:text-white space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold block">Campaign Plan</span>
                {orchestratedMeta && (
                  <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-emerald-500/20 text-[#2F6B4F] dark:text-[#34D399]">
                    Ready to Deploy
                  </span>
                )}
              </div>
              <p className="text-[#11140F]/75 dark:text-white/75">{orchestrated.summary}</p>
            </div>

            {orchestrated.campaigns.map((camp, cIdx) => (
              <div
                key={cIdx}
                className="rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-white/[0.03] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[14px] text-[#11140F] dark:text-white">{camp.campaignName}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-[#2F6B4F] dark:text-[#34D399]">
                    {camp.category}
                  </span>
                </div>

                <p className="text-[12px] text-[#11140F]/60 dark:text-white/55 italic">
                  Strategy: {camp.suggestedStrategy}
                </p>

                <div className="space-y-2">
                  {camp.items.map((it, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between text-[12px]"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-[#11140F] dark:text-white block truncate">{it.label}</span>
                        <span className="font-mono text-[#11140F]/55 dark:text-white/50 text-[11px] truncate block">
                          /id/{it.shortCode} → {it.destinationUrl}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {it.tags.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[#11140F]/70 dark:text-white/75 text-[10px]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setOrchestrated(null)}
                className="text-[12px] text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white underline cursor-pointer"
              >
                ← Back to editor
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#34D399] hover:bg-[#34D399]/90 text-[#09110D] text-[12.5px] font-bold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deploying links…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Apply &amp; Deploy All QR Codes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {statusMsg && (
        <p className="text-[12px] font-medium text-[#2F6B4F] dark:text-[#34D399] text-center shrink-0">
          {statusMsg}
        </p>
      )}
    </div>
  );
}
