'use client';

import { useState } from 'react';
import {
  buildLandingPageSpecAction,
  saveLandingPageAction,
} from '@/lib/ai/features/landing-page-builder';
import { LandingPageSpec } from '@/lib/landing/types';
import { RenderLandingPage } from '@/lib/landing/render';
import { Sparkles, Loader2, CheckCircle2, Globe, Eye, Edit3, X } from 'lucide-react';

interface LandingPageEditorProps {
  linkId: string;
  shortCode: string;
  initialSpec?: LandingPageSpec | null;
  onSaved?: () => void;
  onClose?: () => void;
}

export default function LandingPageEditor({
  linkId,
  shortCode,
  initialSpec,
  onSaved,
  onClose,
}: LandingPageEditorProps) {
  const [promptText, setPromptText] = useState(
    'Create an artisanal coffee shop menu & links page with our flat white, croissant, cold brew specials, opening hours, and Instagram link.'
  );
  const [spec, setSpec] = useState<LandingPageSpec | null>(initialSpec || null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await buildLandingPageSpecAction(promptText);
      setSpec(res.spec);
      setActiveTab('preview');
    } catch (err: any) {
      setMessage(err.message || 'Generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndPublish = async () => {
    if (!spec) return;
    setSaving(true);
    try {
      await saveLandingPageAction(linkId, spec, true);
      setMessage('Landing page published live!');
      onSaved?.();
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (err: any) {
      setMessage(err.message || 'Failed to save page.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/15 bg-white p-5 sm:p-6 shadow-2xl space-y-4 max-w-2xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#11140F]">
              Prompt-to-Page for <span className="font-mono text-emerald-700">/id/{shortCode}</span>
            </h3>
            <p className="text-[12px] text-[#11140F]/50">
              Generate an instant, mobile link-in-bio page powered by AI
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

      {/* Mode Switcher */}
      <div className="flex items-center justify-between border-b pb-2 shrink-0">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors ${
              activeTab === 'editor'
                ? 'bg-[#11140F] text-white'
                : 'text-[#11140F]/60 hover:bg-[#11140F]/5'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Prompt & Setup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            disabled={!spec}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
              activeTab === 'preview'
                ? 'bg-[#11140F] text-white'
                : 'text-[#11140F]/60 hover:bg-[#11140F]/5'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Live Mobile Preview
          </button>
        </div>

        {spec && (
          <button
            type="button"
            onClick={handleSaveAndPublish}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[12px] font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" />
                Publish & Link QR
              </>
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1 min-h-[320px] max-h-[500px]">
        {activeTab === 'editor' ? (
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-[12.5px] font-medium text-[#11140F]/70">
                What kind of page would you like AI to build?
              </label>
              <textarea
                rows={4}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Describe your business, special menu items, links, social accounts, and aesthetic..."
                className="w-full rounded-xl border border-[#11140F]/15 bg-[#11140F]/[0.02] p-3 text-[13px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading || !promptText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating Mobile Page…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Generate Mobile Page with AI
                  </>
                )}
              </button>
            </div>

            {spec && (
              <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-[12px] text-emerald-900 flex items-center justify-between">
                <span>
                  Page ready: <strong>{spec.businessName}</strong> ({spec.blocks.length} sections)
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="font-medium text-emerald-700 underline"
                >
                  View Preview →
                </button>
              </div>
            )}
          </div>
        ) : spec ? (
          <div className="flex justify-center p-2 bg-[#11140F]/[0.03] rounded-2xl">
            <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
              <RenderLandingPage spec={spec} />
            </div>
          </div>
        ) : null}
      </div>

      {message && (
        <p className="text-[12px] font-medium text-emerald-700 text-center shrink-0">
          {message}
        </p>
      )}
    </div>
  );
}
