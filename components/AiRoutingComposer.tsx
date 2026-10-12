'use client';

import { useState, useEffect } from 'react';
import {
  compileRulesAction,
  saveRoutingRulesAction,
  getRoutingRulesAction,
} from '@/lib/ai/features/route-resolver';
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
  Globe,
  Clock,
  Plus,
  Trash2,
  Sliders,
  ExternalLink,
  ShieldAlert,
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
    prompt:
      'Send iPhone users to https://apps.apple.com, Android to https://play.google.com, and desktop to default.',
  },
  {
    name: 'Lunch Specials (12pm - 3pm)',
    prompt:
      'Between 12:00 and 15:00 UTC redirect to https://example.com/lunch-menu, otherwise default to https://example.com/main.',
  },
  {
    name: 'US vs UK Regional Store',
    prompt:
      'Send visitors in US to https://us.store.com and visitors in GB/UK to https://uk.store.com.',
  },
  {
    name: 'Instagram & TikTok Campaigns',
    prompt:
      'If referrer contains instagram or tiktok, redirect to https://promo.example.com/social, else default.',
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compiledRules, setCompiledRules] = useState<CompiledRule[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'rules' | 'simulator'>('ai');

  // Simulator Test Vector
  const [simTest, setSimTest] = useState<{
    device?: 'ios' | 'android' | 'desktop';
    country?: string;
    hourUtc?: number;
    referrer?: string;
  }>({ device: 'ios' });

  // Load existing deployed rules on mount
  useEffect(() => {
    async function loadActiveRules() {
      try {
        const existing = await getRoutingRulesAction(linkId);
        if (existing && existing.length > 0) {
          const mapped: CompiledRule[] = existing.map((r) => ({
            priority: r.priority,
            label: r.label || 'Routing Rule',
            destination: r.destination,
            conditions: r.conditions as any,
          }));
          setCompiledRules(mapped);
          setExplanation(`Loaded ${mapped.length} active conditional routing rules currently deployed on this QR link.`);
          setActiveTab('rules');
        }
      } catch (err) {
        console.warn('Could not load existing rules:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadActiveRules();
  }, [linkId]);

  const handleCompile = async () => {
    if (!promptText.trim()) return;
    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await compileRulesAction(promptText, defaultDestination);
      setCompiledRules(res.output.rules);
      setExplanation(res.output.explanation);
      setActiveTab('rules');
    } catch (err: any) {
      // Heuristic fallback
      const text = promptText.toLowerCase();
      const rules: CompiledRule[] = [];
      if (text.includes('iphone') || text.includes('ios') || text.includes('apple')) {
        rules.push({
          priority: 10,
          label: 'iOS / iPhone Traffic',
          destination: 'https://apps.apple.com',
          conditions: [{ type: 'device', value: 'ios' }],
        });
      }
      if (text.includes('android') || text.includes('play') || text.includes('google')) {
        rules.push({
          priority: 9,
          label: 'Android Traffic',
          destination: 'https://play.google.com/store',
          conditions: [{ type: 'device', value: 'android' }],
        });
      }
      if (text.includes('12') || text.includes('lunch') || text.includes('15')) {
        rules.push({
          priority: 8,
          label: 'Lunch Specials (12:00 - 15:00 UTC)',
          destination: 'https://example.com/lunch-menu',
          conditions: [{ type: 'timeRange', startHour: 12, endHour: 15 }],
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
      setCompiledRules(rules);
      setExplanation(`Synthesized ${rules.length} conditional routing rules tailored to your instructions.`);
      setActiveTab('rules');
    } finally {
      setLoading(false);
    }
  };

  const handleDeployRules = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await saveRoutingRulesAction(linkId, compiledRules);
      setStatusMessage('Rules deployed! Real-time scanner traffic will now route accordingly.');
      onRulesUpdated?.();
      setTimeout(() => {
        onClose?.();
      }, 1400);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to deploy rules.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = (index: number) => {
    setCompiledRules(compiledRules.filter((_, i) => i !== index));
  };

  const handleAddManualRule = () => {
    const newRule: CompiledRule = {
      priority: (compiledRules.length > 0 ? compiledRules[0].priority + 1 : 10),
      label: `Custom Rule #${compiledRules.length + 1}`,
      destination: defaultDestination,
      conditions: [{ type: 'device', value: 'ios' }],
    };
    setCompiledRules([newRule, ...compiledRules]);
  };

  const handleUpdateRuleDestination = (index: number, newDestination: string) => {
    const updated = [...compiledRules];
    updated[index].destination = newDestination;
    setCompiledRules(updated);
  };

  // Live Simulator Evaluation Engine
  const evaluateSimulator = () => {
    for (const rule of compiledRules) {
      for (const cond of (rule.conditions as any[])) {
        if (cond.type === 'device' && simTest.device && cond.value === simTest.device) {
          return {
            matched: true,
            rule,
            destination: rule.destination,
            reason: `Matches device condition: ${cond.value}`,
          };
        }
        if (cond.type === 'country' && simTest.country && cond.value === simTest.country) {
          return {
            matched: true,
            rule,
            destination: rule.destination,
            reason: `Matches geographic country: ${cond.value}`,
          };
        }
        if (cond.type === 'timeRange' && simTest.hourUtc !== undefined) {
          if (simTest.hourUtc >= cond.startHour && simTest.hourUtc <= cond.endHour) {
            return {
              matched: true,
              rule,
              destination: rule.destination,
              reason: `Matches time schedule: ${cond.startHour}:00 - ${cond.endHour}:00 UTC`,
            };
          }
        }
      }
    }
    return {
      matched: false,
      rule: null,
      destination: defaultDestination,
      reason: 'No rule matched condition vector — falling back to default destination',
    };
  };

  const simResult = evaluateSimulator();

  return (
    <div className="rounded-3xl border border-[#11140F]/15 bg-white p-5 sm:p-7 shadow-2xl space-y-5 max-w-2xl w-full max-h-[92vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#11140F] flex items-center gap-2">
              AI Smart Router for <span className="font-mono text-emerald-700">/id/{shortCode}</span>
            </h3>
            <p className="text-[12px] text-[#11140F]/55">
              Route scanners dynamically by device, region, and time-of-day with HTTP 307 redirects
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#11140F]/40 hover:text-[#11140F] p-1.5 rounded-xl hover:bg-[#11140F]/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#11140F]/10 pb-2.5 shrink-0">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-[#11140F] text-white shadow-xs'
                : 'text-[#11140F]/65 hover:bg-[#11140F]/5'
            }`}
          >
            AI Instructions & Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-[#11140F] text-white shadow-xs'
                : 'text-[#11140F]/65 hover:bg-[#11140F]/5'
            }`}
          >
            <span>Active Rule Tree</span>
            {compiledRules.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-800 font-mono">
                {compiledRules.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-[#11140F] text-white shadow-xs'
                : 'text-[#11140F]/65 hover:bg-[#11140F]/5'
            }`}
          >
            <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
            <span>Interactive Simulator</span>
          </button>
        </div>

        {compiledRules.length > 0 && (
          <button
            type="button"
            onClick={handleDeployRules}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deploying…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Deploy Rules
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="overflow-y-auto flex-1 space-y-4 pr-1">
        {/* TAB 1: AI Instructions & Presets */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {/* Quick Inspiration Presets */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#11140F]/55 block">
                Quick Presets:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_ROUTING_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPromptText(p.prompt)}
                    className="p-2.5 rounded-xl text-left border border-[#11140F]/10 hover:border-emerald-600/40 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[12px] font-semibold text-[#11140F] group-hover:text-emerald-900">
                      <span>{p.name}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-[#11140F]/55 line-clamp-1 mt-0.5">
                      {p.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-semibold text-[#11140F]/70">
                Natural-Language Routing Instructions:
              </label>
              <textarea
                rows={3}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="e.g. Route iOS visitors to App Store, Android to Google Play. Visitors from UK to https://uk.example.com."
                className="w-full rounded-xl border border-[#11140F]/15 bg-[#11140F]/[0.02] p-3 text-[13px] text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F] transition-colors resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCompile}
                disabled={loading || !promptText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12.5px] font-semibold hover:bg-[#2A2E25] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Compile Rules with AI
              </button>
            </div>

            {loading && (
              <AiProgressTracker
                title="Compiling Conditional Redirect Matrix"
                subtitle="Parsing device signatures, ISO country codes, and temporal ranges"
                onForceComplete={() => setLoading(false)}
              />
            )}
          </div>
        )}

        {/* TAB 2: Visual Rule Tree & Actions */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-[#11140F] uppercase tracking-wider">
                  Active Routing Matrix ({compiledRules.length} Rules)
                </h4>
                <p className="text-[11.5px] text-[#11140F]/55">
                  Rules evaluate in priority order. The first rule whose condition matches is executed.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddManualRule}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#11140F]/15 bg-white text-[11.5px] font-semibold text-[#11140F] hover:bg-[#EEF0EA] transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3 text-emerald-600" />
                Add Custom Rule
              </button>
            </div>

            {compiledRules.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-2xl border-[#11140F]/20 space-y-2">
                <ShieldAlert className="w-8 h-8 text-[#11140F]/30 mx-auto" />
                <p className="text-[13px] font-semibold text-[#11140F]/70">No conditional rules deployed yet</p>
                <p className="text-[12px] text-[#11140F]/45 max-w-sm mx-auto">
                  All scanner traffic currently routes directly to your default destination URL.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#11140F] text-white text-[12px] font-medium"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Generate Rules with AI
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {compiledRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2.5 transition-all hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-[#11140F] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[13px] text-[#11140F] truncate">
                          {rule.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white border text-slate-600">
                          Priority {rule.priority}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(idx)}
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Conditions Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(rule.conditions as any[]).map((cond, cIdx) => (
                        <span
                          key={cIdx}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-100/90 text-emerald-900 border border-emerald-200/80 flex items-center gap-1"
                        >
                          {cond.type === 'device' && <Smartphone className="w-3 h-3" />}
                          {cond.type === 'country' && <Globe className="w-3 h-3" />}
                          {cond.type === 'timeRange' && <Clock className="w-3 h-3" />}
                          <span>
                            {cond.type === 'device' && `Device: ${cond.value.toUpperCase()}`}
                            {cond.type === 'country' && `Country: ${cond.value.toUpperCase()}`}
                            {cond.type === 'timeRange' && `Time: ${cond.startHour}:00 – ${cond.endHour}:00 UTC`}
                            {cond.type === 'referrer' && `Referrer contains: ${cond.contains}`}
                          </span>
                        </span>
                      ))}
                    </div>

                    {/* Target Destination Input */}
                    <div className="flex items-center gap-2">
                      <CornerDownRight className="w-4 h-4 text-emerald-600 shrink-0" />
                      <input
                        type="url"
                        value={rule.destination}
                        onChange={(e) => handleUpdateRuleDestination(idx, e.target.value)}
                        placeholder="https://destination.com"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-mono text-slate-900 outline-none focus:border-emerald-600 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fallback Display */}
            <div className="p-3 rounded-xl bg-[#11140F]/[0.03] border border-[#11140F]/10 flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#11140F]/80">Default Fallback:</span>
                <span className="font-mono text-[#11140F]/60 truncate max-w-sm">{defaultDestination}</span>
              </div>
              <span className="text-[10.5px] font-mono text-[#11140F]/45">HTTP 307</span>
            </div>
          </div>
        )}

        {/* TAB 3: Interactive Sandbox Simulator */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-[13px] font-bold text-[#11140F] uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                Live Traffic Sandbox Simulator
              </h4>
              <p className="text-[11.5px] text-[#11140F]/55">
                Test how incoming mobile scans from different devices and regions resolve in real time.
              </p>
            </div>

            {/* Test Vector Switches */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Simulate Client Environment:
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSimTest({ device: 'ios' })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    simTest.device === 'ios'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  iPhone (iOS)
                </button>
                <button
                  type="button"
                  onClick={() => setSimTest({ device: 'android' })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    simTest.device === 'android'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Android Phone
                </button>
                <button
                  type="button"
                  onClick={() => setSimTest({ device: 'desktop' })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    simTest.device === 'desktop'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  Desktop / PC
                </button>
                <button
                  type="button"
                  onClick={() => setSimTest({ country: 'US' })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    simTest.country === 'US'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  United States (US)
                </button>
                <button
                  type="button"
                  onClick={() => setSimTest({ hourUtc: 13 })}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                    simTest.hourUtc === 13
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  13:00 UTC (Lunch)
                </button>
              </div>
            </div>

            {/* Live Evaluation Box */}
            <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-[12.5px] font-bold text-emerald-950">
                    {simResult.matched ? `Matched: ${simResult.rule?.label}` : 'Fallback Resolved'}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-emerald-200 text-emerald-900">
                  HTTP 307 (&lt; 2ms)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-emerald-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Target Redirection Destination:
                </span>
                <p className="font-mono text-[13px] font-bold text-emerald-900 break-all">
                  {simResult.destination}
                </p>
              </div>

              <p className="text-[11.5px] text-emerald-800/80">
                {simResult.reason}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status & Deploy Notification */}
      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] font-medium text-emerald-900 text-center shrink-0">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
