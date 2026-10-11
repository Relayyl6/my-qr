'use client';

import { useState } from 'react';
import { compileRulesAction, saveRoutingRulesAction } from '@/lib/ai/features/route-resolver';
import { CompiledRule } from '@/lib/routing/types';
import { Sparkles, Loader2, CheckCircle2, ArrowRight, CornerDownRight, X } from 'lucide-react';

interface AiRoutingComposerProps {
  linkId: string;
  shortCode: string;
  defaultDestination: string;
  onRulesUpdated?: () => void;
  onClose?: () => void;
}

export default function AiRoutingComposer({
  linkId,
  shortCode,
  defaultDestination,
  onRulesUpdated,
  onClose,
}: AiRoutingComposerProps) {
  const [promptText, setPromptText] = useState(
    'Send iPhone users to https://apps.apple.com, Android to https://play.google.com, and desktop to default.'
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compiledRules, setCompiledRules] = useState<CompiledRule[] | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCompile = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await compileRulesAction(promptText, defaultDestination);
      setCompiledRules(res.output.rules);
      setExplanation(res.output.explanation);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to compile rules.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!compiledRules) return;
    setSaving(true);
    try {
      await saveRoutingRulesAction(linkId, compiledRules);
      setStatusMessage('Routing rules deployed successfully!');
      onRulesUpdated?.();
      setTimeout(() => {
        onClose?.();
      }, 1200);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to deploy rules.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/15 bg-white p-5 sm:p-6 shadow-xl space-y-4 max-w-xl w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-[#11140F]">
              AI Smart Router for <span className="font-mono text-emerald-700">/id/{shortCode}</span>
            </h3>
            <p className="text-[12px] text-[#11140F]/50">Describe your routing conditions in plain English</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#11140F]/40 hover:text-[#11140F] p-1 rounded-lg hover:bg-[#11140F]/5"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-[12.5px] font-medium text-[#11140F]/70">
          Routing Instructions
        </label>
        <textarea
          rows={3}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="e.g. Route iOS visitors to App Store, Android to Google Play. Between 12pm and 3pm send to the lunch menu."
          className="w-full rounded-xl border border-[#11140F]/15 bg-[#11140F]/[0.02] p-3 text-[13px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors resize-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleCompile}
          disabled={loading || !promptText.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Compiling rules…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Compile Rules with AI
            </>
          )}
        </button>
      </div>

      {explanation && (
        <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-3 text-[12px] text-emerald-900 leading-relaxed">
          <span className="font-semibold block mb-0.5">Compilation Logic:</span>
          {explanation}
        </div>
      )}

      {compiledRules && compiledRules.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <span className="text-[12px] font-semibold text-[#11140F]/70 uppercase tracking-wider block">
            Generated Rules ({compiledRules.length})
          </span>
          <div className="space-y-2">
            {compiledRules.map((r, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.02] p-3 text-[12.5px] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#11140F]">{r.label}</span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#11140F]/5 text-[#11140F]/60">
                    Priority: {r.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {r.conditions.map((cond: any, cIdx: number) => (
                    <span
                      key={cIdx}
                      className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-medium"
                    >
                      {cond.type}: {cond.value || `${cond.startHour}:00 - ${cond.endHour}:00` || cond.contains}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 text-[11.5px] text-[#11140F]/60 truncate font-mono">
                  <CornerDownRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{r.destination}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11.5px] text-[#11140F]/50">
              Fallback: <span className="font-mono text-[#11140F]/70 truncate">{defaultDestination}</span>
            </span>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[12.5px] font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Deploying…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Deploy Rules to Link
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {statusMessage && (
        <p className="text-[12px] font-medium text-emerald-700 text-center">{statusMessage}</p>
      )}
    </div>
  );
}
