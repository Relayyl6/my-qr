'use client';

import { useState, useEffect } from 'react';
import { CompiledRule, RuleCondition } from '@/lib/routing/types';
import { getRoutingRulesAction, saveRoutingRulesAction } from '@/lib/ai/features/route-resolver';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';

interface RoutingRuleBuilderProps {
  linkId: string;
  defaultDestination: string;
  onSaved?: () => void;
}

export default function RoutingRuleBuilder({
  linkId,
  defaultDestination,
  onSaved,
}: RoutingRuleBuilderProps) {
  const [rules, setRules] = useState<CompiledRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stored = await getRoutingRulesAction(linkId);
        if (stored && stored.length > 0) {
          setRules(
            stored.map((s) => ({
              priority: s.priority,
              label: s.label || 'Routing Rule',
              destination: s.destination,
              conditions: Array.isArray(s.conditions) ? (s.conditions as RuleCondition[]) : [],
            }))
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [linkId]);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        priority: 10,
        label: `Custom Rule ${prev.length + 1}`,
        destination: 'https://',
        conditions: [{ type: 'device', value: 'ios' }],
      },
    ]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConditionTypeChange = (idx: number, newType: string) => {
    let newCondition: RuleCondition;
    if (newType === 'device') {
      newCondition = { type: 'device', value: 'ios' };
    } else if (newType === 'country') {
      newCondition = { type: 'country', value: 'US' };
    } else if (newType === 'timeRange') {
      newCondition = { type: 'timeRange', startHour: 11, endHour: 15 };
    } else if (newType === 'referrer') {
      newCondition = { type: 'referrer', contains: 'instagram' };
    } else {
      newCondition = { type: 'device', value: 'ios' };
    }

    setRules((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, conditions: [newCondition] } : r
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await saveRoutingRulesAction(linkId, rules);
      setSavedSuccess(true);
      onSaved?.();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 flex justify-center text-[#11140F]/40 text-[12px]">
        Loading routing rules…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-[#11140F]">Active Routing Rules</h4>
        <button
          type="button"
          onClick={addRule}
          className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 hover:text-emerald-800 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Condition Row
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#11140F]/15 p-4 text-center text-[12px] text-[#11140F]/50">
          No custom rules configured yet. All scans currently redirect to default destination:
          <span className="font-mono text-[#11140F]/70 block mt-1">{defaultDestination}</span>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, idx) => {
            const firstCond = rule.conditions[0] || { type: 'device', value: 'ios' };

            return (
              <div
                key={idx}
                className="rounded-xl border border-[#11140F]/10 bg-white p-3 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={rule.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRules((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, label: val } : r))
                      );
                    }}
                    className="text-[13px] font-semibold text-[#11140F] bg-transparent outline-none border-b border-transparent focus:border-[#11140F]/30"
                    placeholder="Rule Name"
                  />
                  <button
                    type="button"
                    onClick={() => removeRule(idx)}
                    className="text-red-500 hover:text-red-700 p-1 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Conditions Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11.5px] text-[#11140F]/50 font-medium">IF</span>
                  <select
                    value={firstCond.type}
                    onChange={(e) => handleConditionTypeChange(idx, e.target.value)}
                    className="rounded-lg border border-[#11140F]/15 bg-white px-2 py-1 text-[12px] text-[#11140F]"
                  >
                    <option value="device">Device</option>
                    <option value="country">Country</option>
                    <option value="timeRange">Time Window</option>
                    <option value="referrer">Referrer</option>
                  </select>

                  <span className="text-[11.5px] text-[#11140F]/50 font-medium">IS</span>

                  {firstCond.type === 'device' && (
                    <select
                      value={firstCond.value}
                      onChange={(e) => {
                        const v = e.target.value as 'ios' | 'android' | 'desktop';
                        setRules((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, conditions: [{ type: 'device', value: v }] } : r
                          )
                        );
                      }}
                      className="rounded-lg border border-[#11140F]/15 bg-white px-2 py-1 text-[12px] text-[#11140F]"
                    >
                      <option value="ios">iOS (iPhone/iPad)</option>
                      <option value="android">Android</option>
                      <option value="desktop">Desktop</option>
                    </select>
                  )}

                  {firstCond.type === 'country' && (
                    <input
                      type="text"
                      maxLength={2}
                      value={firstCond.value}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        setRules((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, conditions: [{ type: 'country', value: v }] } : r
                          )
                        );
                      }}
                      placeholder="US"
                      className="w-16 rounded-lg border border-[#11140F]/15 bg-white px-2 py-1 text-[12px] text-[#11140F] font-mono uppercase"
                    />
                  )}

                  {firstCond.type === 'referrer' && (
                    <input
                      type="text"
                      value={firstCond.contains}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRules((prev) =>
                          prev.map((r, i) =>
                            i === idx ? { ...r, conditions: [{ type: 'referrer', contains: v }] } : r
                          )
                        );
                      }}
                      placeholder="instagram"
                      className="w-32 rounded-lg border border-[#11140F]/15 bg-white px-2 py-1 text-[12px] text-[#11140F]"
                    />
                  )}
                </div>

                {/* Destination row */}
                <div className="flex items-center gap-2">
                  <span className="text-[11.5px] text-[#11140F]/50 font-medium">THEN REDIRECT TO</span>
                  <input
                    type="url"
                    value={rule.destination}
                    onChange={(e) => {
                      const dest = e.target.value;
                      setRules((prev) =>
                        prev.map((r, i) => (i === idx ? { ...r, destination: dest } : r))
                      );
                    }}
                    className="flex-1 rounded-lg border border-[#11140F]/15 bg-[#11140F]/[0.02] px-2.5 py-1 text-[12px] text-[#11140F] font-mono outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#11140F] text-white text-[12px] font-medium hover:bg-[#2A2E25] transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Saved
                </>
              ) : (
                'Save Manual Rules'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
