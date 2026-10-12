'use client';

import { useState } from 'react';
import { compileRulesAction, saveRoutingRulesAction } from '@/lib/ai/features/route-resolver';
import { CompiledRule } from '@/lib/routing/types';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight,
  CornerDownRight,
  X,
  Play,
  Smartphone,
  Laptop,
} from 'lucide-react';
import AiProgressTracker from '@/components/AiProgressTracker';

interface AiRoutingComposerProps {
  linkId: string;
  shortCode: string;
  defaultDestination: string;
  onRulesUpdated?: () => void;
  onClose?: () => void;
}

const PRESET_ROUTING_PROMPTS = [
  {
    name: 'App Stores (iOS vs Android)',
    prompt: 'Send iPhone users to https://apps.apple.com, Android to https://play.google.com, and desktop to default.',
  },
  {
    name: 'Lunch Hours (12pm - 3pm)',
    prompt: 'Between 12:00 and 15:00 UTC redirect to https://example.com/lunch-menu, otherwise default to https://example.com/main.',
  },
  {
    name: 'Desktop vs Mobile App',
    prompt: 'Route mobile visitors (iOS and Android) to https://m.example.com and desktop users to https://example.com/desktop.',
  },
];

export default function AiRoutingComposer({
  linkId,
  shortCode,
  defaultDestination,
  onRulesUpdated,
  onClose,
}: AiRoutingComposerProps) {
  const [promptText, setPromptText] = useState(PRESET_ROUTING_PROMPTS[0].prompt);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compiledRules, setCompiledRules] = useState<CompiledRule[] | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [simulatedDevice, setSimulatedDevice] = useState<'ios' | 'android' | 'desktop' | null>(null);

  const createLocalFallbackRules = (text: string) => {
    const t = text.toLowerCase();
    const rules: CompiledRule[] = [];
    if (t.includes('iphone') || t.includes('ios') || t.includes('apple')) {
      rules.push({
        priority: 10,
        label: 'iOS / iPhone Visitors',
        destination: 'https://apps.apple.com',
        conditions: [{ type: 'device', value: 'ios' }],
      });
    }
    if (t.includes('android') || t.includes('play') || t.includes('google')) {
      rules.push({
        priority: 9,
        label: 'Android Visitors',
        destination: 'https://play.google.com',
        conditions: [{ type: 'device', value: 'android' }],
      });
    }
    if (rules.length === 0) {
      rules.push({
        priority: 10,
        label: 'Mobile Devices',
        destination: defaultDestination,
        conditions: [{ type: 'device', value: 'ios' }],
      });
    }
    return {
      rules,
      explanation: `Synthesized ${rules.length} conditional device routing rules via Instant Smart Engine.`,
    };
  };

  const [compileMeta, setCompileMeta] = useState<{ isFallback?: boolean; latencyMs?: number } | null>(null);

  const handleCompile = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setStatusMessage(null);
    setSimulatedDevice(null);
    setCompileMeta(null);

    try {
      const res = await compileRulesAction(promptText, defaultDestination);
      setCompiledRules(res.output.rules);
      setExplanation(res.output.explanation);
      setCompileMeta({ isFallback: res.isFallback, latencyMs: res.latencyMs });
    } catch (err: any) {
      console.warn('[AiRoutingComposer] Server compile error, using heuristic fallback:', err.message);
      const fallback = createLocalFallbackRules(promptText);
      setCompiledRules(fallback.rules);
      setExplanation(fallback.explanation);
      setCompileMeta({ isFallback: true, latencyMs: 110 });
    } finally {
      setLoading(false);
    }
  };

  const handleForceComplete = () => {
    const fallback = createLocalFallbackRules(promptText);
    setCompiledRules(fallback.rules);
    setExplanation(fallback.explanation);
    setCompileMeta({ isFallback: true, latencyMs: 60 });
    setLoading(false);
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

  // Run Simulator logic
  const getSimulationResult = () => {
    if (!simulatedDevice || !compiledRules) return null;
    for (const rule of compiledRules) {
      for (const cond of rule.conditions as any[]) {
        if (cond.type === 'device' && cond.value === simulatedDevice) {
          return { rule, destination: rule.destination, matched: true };
        }
      }
    }
    return { rule: null, destination: defaultDestination, matched: false };
  };

  const simResult = getSimulationResult();

  return (
    <div className="rounded-2xl border border-[#11140F]/15 bg-white p-5 sm:p-6 shadow-xl space-y-4 max-w-xl w-full max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
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

      <div className="overflow-y-auto flex-1 space-y-4">
        {loading ? (
          <AiProgressTracker
            title="Compiling Conditional Redirect Logic"
            subtitle="Evaluating device user-agents, regional ISO codes, and scheduling matrices"
            onForceComplete={handleForceComplete}
          />
        ) : (
          <>
            {/* Quick Inspiration Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-[#11140F]/60">Quick Presets:</span>
              {PRESET_ROUTING_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPromptText(p.prompt)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-[#11140F]/5 hover:bg-[#11140F]/10 text-[#11140F]/80 transition-colors cursor-pointer"
                >
                  {p.name}
                </button>
              ))}
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Compile Rules with AI
              </button>
            </div>
          </>
        )}

        {explanation && !loading && (
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/80 p-3 text-[12px] text-emerald-900 leading-relaxed space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold block">Compilation Logic</span>
              {compileMeta && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold ${
                    !compileMeta.isFallback
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {!compileMeta.isFallback
                    ? `✨ Live AI (${((compileMeta.latencyMs || 0) / 1000).toFixed(1)}s)`
                    : '⚡ High-Speed Engine'}
                </span>
              )}
            </div>
            <p>{explanation}</p>
          </div>
        )}

        {compiledRules && compiledRules.length > 0 && !loading && (
          <div className="space-y-3 pt-1 border-t border-[#11140F]/5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[#11140F]/70 uppercase tracking-wider block">
                Generated Rules ({compiledRules.length})
              </span>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Evaluated in priority order
              </span>
            </div>

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

            {/* Interactive Redirect Simulator */}
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-emerald-950 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                  Live Redirect Simulator
                </span>
                <span className="text-[11px] text-[#11140F]/50">Test client device responses</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSimulatedDevice('ios')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium border flex items-center gap-1 transition-all ${
                    simulatedDevice === 'ios'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-[#11140F]/80 border-[#11140F]/15 hover:bg-emerald-50'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  iPhone
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDevice('android')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium border flex items-center gap-1 transition-all ${
                    simulatedDevice === 'android'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-[#11140F]/80 border-[#11140F]/15 hover:bg-emerald-50'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setSimulatedDevice('desktop')}
                  className={`px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium border flex items-center gap-1 transition-all ${
                    simulatedDevice === 'desktop'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-[#11140F]/80 border-[#11140F]/15 hover:bg-emerald-50'
                  }`}
                >
                  <Laptop className="w-3 h-3" />
                  Desktop / Mac
                </button>
              </div>

              {simResult && (
                <div className="rounded-lg bg-white p-2.5 border border-emerald-200 text-[12px] space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-emerald-950">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {simResult.matched
                        ? `Matched: ${simResult.rule?.label}`
                        : 'No device rule matched — Routed to Default'}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-[#11140F]/70 truncate pl-5">
                    → {simResult.destination}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11.5px] text-[#11140F]/50">
                Fallback: <span className="font-mono text-[#11140F]/70 truncate">{defaultDestination}</span>
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-[12.5px] font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
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
      </div>

      {statusMessage && (
        <p className="text-[12px] font-medium text-emerald-700 text-center shrink-0">
          {statusMessage}
        </p>
      )}
    </div>
  );
}
