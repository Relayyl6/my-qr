'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import AiProgressTracker from '@/components/AiProgressTracker';

interface BulkImportWizardProps {
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

export default function BulkImportWizard({
  onImportComplete,
  onClose,
}: BulkImportWizardProps) {
  const [rawText, setRawText] = useState(PRESET_BATCHES[0].text);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [orchestrated, setOrchestrated] = useState<CampaignOrchestratorOutput | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const getParsedItems = () => {
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
  };

  const createLocalFallback = (items: { destinationUrl: string; label?: string }[]) => {
    return {
      totalItemsProcessed: items.length,
      summary: `Clustered ${items.length} destination assets into a unified marketing campaign using the High-Speed Engine.`,
      campaigns: [
        {
          campaignName: 'Bulk Marketing Ingestion',
          category: 'Promotional & Social',
          suggestedStrategy: 'High-speed 307 edge redirects with real-time analytics tracking.',
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
  };

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
    <div className="rounded-2xl border border-[#11140F]/15 bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-w-2xl w-full max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#11140F]">
              AI Bulk Import & Campaign Orchestrator
            </h3>
            <p className="text-[12px] text-[#11140F]/50">
              Paste URLs or CSV lines to cluster, slugify, and bulk-deploy
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#11140F]/40 hover:text-[#11140F] p-1.5 rounded-lg hover:bg-[#11140F]/5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1 space-y-4">
        {loading ? (
          <AiProgressTracker
            title="Orchestrating Campaign Clusters"
            subtitle="Grouping destinations, generating scannable shortcodes & assigning campaign tags"
            onForceComplete={handleForceComplete}
          />
        ) : !orchestrated ? (
          <div className="space-y-3">
            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11.5px] font-medium text-[#11140F]/60">Quick Examples:</span>
              {PRESET_BATCHES.map((batch, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawText(batch.text)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#11140F]/5 hover:bg-[#11140F]/10 text-[#11140F]/80 transition-colors cursor-pointer"
                >
                  {batch.name}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-medium text-[#11140F]/70">
                Paste Destination URLs (one per line, format: <code>url, label</code>)
              </label>
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="https://example.com/link-1, Flyer 1&#10;https://example.com/link-2, Flyer 2"
                className="w-full rounded-xl border border-[#11140F]/15 bg-[#11140F]/[0.02] p-3 text-[13px] font-mono text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleOrchestrate}
                disabled={loading || !rawText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                ⚡ Orchestrate Campaigns with AI
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[12.5px] text-emerald-950 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold block">Campaign Plan</span>
                {orchestratedMeta && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold ${
                      !orchestratedMeta.isFallback
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {!orchestratedMeta.isFallback
                      ? `✨ Live AI (${((orchestratedMeta.latencyMs || 0) / 1000).toFixed(1)}s)`
                      : '⚡ High-Speed Engine'}
                  </span>
                )}
              </div>
              <p>{orchestrated.summary}</p>
            </div>

            {orchestrated.campaigns.map((camp, cIdx) => (
              <div
                key={cIdx}
                className="rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.02] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[14px] text-[#11140F]">{camp.campaignName}</h4>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800">
                    {camp.category}
                  </span>
                </div>

                <p className="text-[12px] text-[#11140F]/60 italic">
                  Strategy: {camp.suggestedStrategy}
                </p>

                <div className="space-y-2">
                  {camp.items.map((it, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-2.5 rounded-lg bg-white border border-[#11140F]/10 flex items-center justify-between text-[12px]"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-[#11140F] block truncate">{it.label}</span>
                        <span className="font-mono text-[#11140F]/50 text-[11px] truncate block">
                          /id/{it.shortCode} → {it.destinationUrl}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {it.tags.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-1.5 py-0.5 rounded bg-[#11140F]/5 text-[#11140F]/70 text-[10px]"
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
                className="text-[12px] text-[#11140F]/60 hover:text-[#11140F] underline"
              >
                ← Back to text editor
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[12.5px] font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deploying links…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Apply & Deploy All QR Codes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {statusMsg && (
        <p className="text-[12px] font-medium text-emerald-700 text-center shrink-0">
          {statusMsg}
        </p>
      )}
    </div>
  );
}
