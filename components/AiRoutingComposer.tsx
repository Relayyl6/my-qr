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
  Calendar,
  Lock,
  Unlock,
  Zap,
  Check,
  ChevronDown,
  Layers,
} from 'lucide-react';
import AiProgressTracker from '@/components/AiProgressTracker';
import Link from 'next/link';

interface AiRoutingComposerProps {
  linkId: string;
  shortCode: string;
  defaultDestination: string;
  userTier?: string;
  initialTab?: 'schedule' | 'ai' | 'rules' | 'simulator';
  onRulesUpdated?: () => void;
  onClose?: () => void;
}

const DAYS_OF_WEEK = [
  { day: 0, short: 'Sun', name: 'Sunday' },
  { day: 1, short: 'Mon', name: 'Monday' },
  { day: 2, short: 'Tue', name: 'Tuesday' },
  { day: 3, short: 'Wed', name: 'Wednesday' },
  { day: 4, short: 'Thu', name: 'Thursday' },
  { day: 5, short: 'Fri', name: 'Friday' },
  { day: 6, short: 'Sat', name: 'Saturday' },
];

const PRESET_SCHEDULE_MATRICES = [
  {
    name: 'Restaurant / Hospitality Dayparting',
    description: 'Switch between Lunch Specials, Cocktail Hour, and Dinner Menu automatically.',
    slots: [
      {
        label: 'Lunch Specials',
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '11:00',
        endTime: '15:00',
        destination: 'https://example.com/lunch-menu',
      },
      {
        label: 'Cocktail Hour',
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        startTime: '15:00',
        endTime: '19:00',
        destination: 'https://example.com/cocktails-specials',
      },
      {
        label: 'Chef Tasting & Dinner',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: '19:00',
        endTime: '23:59',
        destination: 'https://example.com/dinner-tasting',
      },
    ],
  },
  {
    name: 'Retail / E-Commerce Operations',
    description: 'Daytime store catalog, evening flash discount, and weekend VIP drop.',
    slots: [
      {
        label: 'Business Hours Catalog',
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
        destination: 'https://example.com/store/catalog',
      },
      {
        label: 'Evening Flash Deal (15% Off)',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: '18:00',
        endTime: '23:59',
        destination: 'https://example.com/store/flash-deal',
      },
      {
        label: 'Weekend VIP Exclusives',
        daysOfWeek: [0, 6],
        startTime: '00:00',
        endTime: '23:59',
        destination: 'https://example.com/store/weekend-drop',
      },
    ],
  },
  {
    name: 'Nightlife & Live Events',
    description: 'Early bird access in the afternoon and live DJ stream / VIP table booking late night.',
    slots: [
      {
        label: 'Early Bird Guestlist & Tickets',
        daysOfWeek: [4, 5, 6],
        startTime: '16:00',
        endTime: '21:00',
        destination: 'https://example.com/events/guestlist',
      },
      {
        label: 'Live Stream & VIP Bottle Service',
        daysOfWeek: [4, 5, 6],
        startTime: '21:00',
        endTime: '04:00',
        destination: 'https://example.com/events/vip-table',
      },
    ],
  },
];

const PRESET_ROUTING_PROMPTS = [
  {
    name: 'App Stores (iOS vs Android)',
    prompt:
      'Send iPhone users to https://apps.apple.com, Android to https://play.google.com, and desktop to default.',
  },
  {
    name: 'Lunch Specials (11am - 3pm)',
    prompt:
      'Between 11:00 and 15:00 UTC redirect to https://example.com/lunch-menu, otherwise default to https://example.com/main.',
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
  userTier = 'free',
  initialTab = 'schedule',
  onRulesUpdated,
  onClose,
}: AiRoutingComposerProps) {
  const isFreeTier = userTier.toLowerCase() === 'free';
  const [activeTab, setActiveTab] = useState<'schedule' | 'ai' | 'rules' | 'simulator'>(initialTab);
  const [promptText, setPromptText] = useState(PRESET_ROUTING_PROMPTS[0].prompt);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compiledRules, setCompiledRules] = useState<CompiledRule[]>([]);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // New Schedule Slot Form State
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlotLabel, setNewSlotLabel] = useState('Lunch Specials');
  const [newSlotStartTime, setNewSlotStartTime] = useState('11:00');
  const [newSlotEndTime, setNewSlotEndTime] = useState('15:00');
  const [newSlotDays, setNewSlotDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newSlotDestination, setNewSlotDestination] = useState(defaultDestination);
  const [newSlotTimezone, setNewSlotTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  });

  // Simulator Test Vector State
  const [simTest, setSimTest] = useState<{
    device?: 'ios' | 'android' | 'desktop';
    country?: string;
    dayOfWeek?: number;
    timeStr?: string;
    referrer?: string;
  }>({
    device: 'ios',
    dayOfWeek: new Date().getDay(),
    timeStr: '13:00',
  });

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
        }
      } catch (err) {
        console.warn('Could not load existing rules:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadActiveRules();
  }, [linkId]);

  // Check if a schedule condition is currently active right now
  const isScheduleSlotActiveNow = (cond: any) => {
    try {
      const now = new Date();
      const timezone = cond.timezone || 'UTC';
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      }).formatToParts(now);

      const weekdayStr = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase() || '';
      const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
      const currentDay = weekdayStr ? dayMap[weekdayStr.slice(0, 3)] ?? now.getDay() : now.getDay();
      const hourVal = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      const minVal = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
      const currentHour = hourVal === 24 ? 0 : hourVal;
      const currentMins = currentHour * 60 + minVal;

      if (cond.daysOfWeek && cond.daysOfWeek.length > 0 && !cond.daysOfWeek.includes(currentDay)) {
        return false;
      }

      const parseMins = (t: string) => {
        const [h, m] = (t || '00:00').split(':').map(Number);
        return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
      };

      const startMins = parseMins(cond.startTime);
      const endMins = parseMins(cond.endTime);

      if (startMins <= endMins) {
        return currentMins >= startMins && currentMins < endMins;
      } else {
        return currentMins >= startMins || currentMins < endMins;
      }
    } catch {
      return false;
    }
  };

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
      if (text.includes('lunch') || text.includes('11:00') || (text.includes('11') && text.includes('15'))) {
        rules.push({
          priority: 15,
          label: 'Lunch Specials (11:00 – 15:00)',
          destination: 'https://example.com/lunch-menu',
          conditions: [
            {
              type: 'schedule',
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '11:00',
              endTime: '15:00',
              timezone: 'UTC',
            },
          ],
        });
      }
      if (text.includes('cocktail') || text.includes('15:00') || (text.includes('15') && text.includes('19'))) {
        rules.push({
          priority: 14,
          label: 'Cocktail Hour (15:00 – 19:00)',
          destination: 'https://example.com/cocktails-specials',
          conditions: [
            {
              type: 'schedule',
              daysOfWeek: [1, 2, 3, 4, 5, 6],
              startTime: '15:00',
              endTime: '19:00',
              timezone: 'UTC',
            },
          ],
        });
      }
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
    if (isFreeTier) {
      const hasSchedule = compiledRules.some((r) =>
        (r.conditions as any[]).some((c) => c.type === 'schedule')
      );
      if (hasSchedule) {
        setStatusMessage('Autonomous Ingress Scheduling is reserved for Pro, Plus, and Ultra subscribers.');
        return;
      }
    }

    setSaving(true);
    setStatusMessage(null);
    try {
      await saveRoutingRulesAction(linkId, compiledRules);
      setStatusMessage('Rules successfully deployed! Physical QR scans will now automatically route according to your ingress matrix.');
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

  const handleApplyPresetMatrix = (preset: typeof PRESET_SCHEDULE_MATRICES[0]) => {
    const newRules: CompiledRule[] = preset.slots.map((slot, idx) => ({
      priority: 20 - idx,
      label: slot.label,
      destination: slot.destination,
      conditions: [
        {
          type: 'schedule',
          daysOfWeek: slot.daysOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timezone: newSlotTimezone,
        },
      ],
    }));

    // Keep non-schedule rules and prepend schedule rules
    const nonSchedule = compiledRules.filter(
      (r) => !(r.conditions as any[]).some((c) => c.type === 'schedule')
    );
    setCompiledRules([...newRules, ...nonSchedule]);
    setStatusMessage(`Loaded "${preset.name}" into your matrix. Click 'Deploy Rules' to activate.`);
  };

  const handleAddNewScheduleSlot = () => {
    if (!newSlotDestination.trim()) return;
    const newRule: CompiledRule = {
      priority: compiledRules.length > 0 ? Math.max(...compiledRules.map((r) => r.priority)) + 1 : 10,
      label: newSlotLabel.trim() || 'Custom Schedule Slot',
      destination: newSlotDestination.trim(),
      conditions: [
        {
          type: 'schedule',
          daysOfWeek: newSlotDays.length > 0 ? newSlotDays : [0, 1, 2, 3, 4, 5, 6],
          startTime: newSlotStartTime,
          endTime: newSlotEndTime,
          timezone: newSlotTimezone,
        },
      ],
    };

    setCompiledRules([newRule, ...compiledRules]);
    setShowAddSlot(false);
    setStatusMessage(`Added schedule slot "${newRule.label}". Remember to click 'Deploy Rules'.`);
  };

  const handleDeleteRule = (index: number) => {
    setCompiledRules(compiledRules.filter((_, i) => i !== index));
  };

  const handleToggleDay = (day: number) => {
    if (newSlotDays.includes(day)) {
      if (newSlotDays.length > 1) {
        setNewSlotDays(newSlotDays.filter((d) => d !== day));
      }
    } else {
      setNewSlotDays([...newSlotDays, day].sort());
    }
  };

  // Live Simulator Evaluation Engine
  const evaluateSimulator = () => {
    const parseMins = (t: string) => {
      const [h, m] = (t || '00:00').split(':').map(Number);
      return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
    };

    for (const rule of compiledRules) {
      for (const cond of rule.conditions as any[]) {
        // Schedule condition check
        if (cond.type === 'schedule') {
          const testDay = simTest.dayOfWeek ?? new Date().getDay();
          const testTimeMins = parseMins(simTest.timeStr || '12:00');
          const slotStartMins = parseMins(cond.startTime);
          const slotEndMins = parseMins(cond.endTime);

          const dayMatches = !cond.daysOfWeek || cond.daysOfWeek.includes(testDay);
          const timeMatches =
            slotStartMins <= slotEndMins
              ? testTimeMins >= slotStartMins && testTimeMins < slotEndMins
              : testTimeMins >= slotStartMins || testTimeMins < slotEndMins;

          if (dayMatches && timeMatches) {
            const dayName = DAYS_OF_WEEK.find((d) => d.day === testDay)?.name || 'Today';
            return {
              matched: true,
              rule,
              destination: rule.destination,
              reason: `Matched Autonomous Ingress Matrix slot "${rule.label}" (${cond.startTime} – ${cond.endTime} on ${dayName})`,
            };
          }
        }

        // Device condition check
        if (cond.type === 'device' && simTest.device && cond.value === simTest.device) {
          return {
            matched: true,
            rule,
            destination: rule.destination,
            reason: `Matches device condition: ${cond.value.toUpperCase()}`,
          };
        }

        // Country condition check
        if (cond.type === 'country' && simTest.country && cond.value === simTest.country) {
          return {
            matched: true,
            rule,
            destination: rule.destination,
            reason: `Matches geographic country: ${cond.value.toUpperCase()}`,
          };
        }
      }
    }

    return {
      matched: false,
      rule: null,
      destination: defaultDestination,
      reason: 'No rule matched simulation conditions — falling back to primary destination URL',
    };
  };

  const simResult = evaluateSimulator();
  const scheduleRules = compiledRules.filter((r) =>
    (r.conditions as any[]).some((c) => c.type === 'schedule')
  );

  return (
    <div className="rounded-3xl border border-[#11140F]/15 bg-white p-5 sm:p-7 shadow-2xl space-y-5 max-w-2xl w-full max-h-[92vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-[#11140F] flex items-center gap-2">
              Autonomous Ingress & Router for <span className="font-mono text-emerald-700">/id/{shortCode}</span>
            </h3>
            <p className="text-[12px] text-[#11140F]/55">
              Switch destinations automatically by hour, day of week, device, and region without reprinting physical QR materials
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#11140F]/40 hover:text-[#11140F] p-1.5 rounded-xl hover:bg-[#11140F]/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-[#11140F]/10 pb-2.5 shrink-0 overflow-x-auto gap-2">
        <div className="flex gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'bg-[#11140F] text-white shadow-xs'
                : 'text-[#11140F]/65 hover:bg-[#11140F]/5'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Schedule Matrix</span>
            {scheduleRules.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                {scheduleRules.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-[#11140F] text-white shadow-xs'
                : 'text-[#11140F]/65 hover:bg-[#11140F]/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Composer</span>
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
            <span>All Rules</span>
            {compiledRules.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-800 font-mono">
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
            <span>Simulator</span>
          </button>
        </div>

        {compiledRules.length > 0 && (
          <button
            type="button"
            onClick={handleDeployRules}
            disabled={saving || (isFreeTier && scheduleRules.length > 0)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50 cursor-pointer shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deploying…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Deploy Matrix
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Body */}
      <div className="overflow-y-auto flex-1 space-y-4 pr-1">
        {/* TAB 1: AUTONOMOUS INGRESS MATRIX (Time & Day Scheduling) */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {/* Free Tier Lock Banner */}
            {isFreeTier && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="space-y-1 text-[12.5px] flex-1">
                  <h4 className="font-bold text-amber-950">Autonomous Ingress Scheduling is a Pro Feature</h4>
                  <p className="text-amber-800/80 leading-relaxed">
                    Auto-switching destination URLs by hour and day of week is available on Pro ($5/mo), Plus, and Ultra plans. Never touch your printed acrylic table tents or posters again when menus and promotions change.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/pricing"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-900 text-white font-semibold text-[11.5px] hover:bg-amber-950 transition-colors"
                    >
                      <span>Upgrade to Pro ($5/mo)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Apple / Titanium Matrix Showcase Card (matching user screenshot) */}
            <div className="rounded-2xl border border-[#11140F]/15 bg-[#0C0F0A] p-4 sm:p-5 text-white shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono tracking-wider font-bold text-emerald-400 uppercase">
                  AUTONOMOUS INGRESS MATRIX:
                </span>
                <span className="text-[11px] text-white/50 font-mono">
                  Timezone: {newSlotTimezone}
                </span>
              </div>

              {scheduleRules.length === 0 ? (
                <div className="py-6 text-center space-y-2 border border-dashed border-white/10 rounded-xl">
                  <Clock className="w-7 h-7 text-white/30 mx-auto" />
                  <p className="text-[12.5px] text-white/70 font-medium">No scheduled time slots configured</p>
                  <p className="text-[11px] text-white/40 max-w-sm mx-auto">
                    All scans currently route to default URL. Use the presets below or add a custom time & day window.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scheduleRules.map((rule, idx) => {
                    const cond = (rule.conditions as any[]).find((c) => c.type === 'schedule');
                    const isActive = cond ? isScheduleSlotActiveNow(cond) : false;
                    const daysLabel = cond?.daysOfWeek
                      ? cond.daysOfWeek.length === 7
                        ? 'Everyday'
                        : cond.daysOfWeek.map((d: number) => DAYS_OF_WEEK.find((w) => w.day === d)?.short).join(', ')
                      : 'Everyday';

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                            : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                              isActive
                                ? 'bg-emerald-500 text-black'
                                : 'bg-white/10 text-white/50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[13px] font-semibold text-emerald-300">
                                {cond?.startTime} – {cond?.endTime}
                              </span>
                              <span className="text-white/40 font-mono text-[12px]">&rarr;</span>
                              <span className="font-semibold text-[13px] text-white truncate">
                                {rule.label}
                              </span>
                              {isActive && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-emerald-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Active Now
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5 truncate">
                              <span>Days: {daysLabel}</span>
                              <span>&middot;</span>
                              <span className="font-mono truncate">{rule.destination}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const originalIdx = compiledRules.indexOf(rule);
                            if (originalIdx !== -1) handleDeleteRule(originalIdx);
                          }}
                          className="text-white/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
                          title="Remove time slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Default Fallback Display */}
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between text-[11.5px] text-white/60">
                <span className="font-mono">Outside Scheduled Windows &rarr; Default Destination:</span>
                <span className="font-mono text-emerald-400 truncate max-w-[240px] font-medium">{defaultDestination}</span>
              </div>
            </div>

            {/* Quick Action Buttons & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#11140F]/60">
                  One-Click Industry Templates:
                </span>
                {!showAddSlot && (
                  <button
                    type="button"
                    onClick={() => setShowAddSlot(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#11140F] text-white text-[11.5px] font-semibold hover:bg-[#2A2E25] transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span>Custom Slot</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_SCHEDULE_MATRICES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPresetMatrix(preset)}
                    className="p-3 rounded-xl text-left border border-[#11140F]/10 hover:border-emerald-600/40 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                  >
                    <div className="font-semibold text-[12px] text-[#11140F] group-hover:text-emerald-900 flex items-center justify-between">
                      <span>{preset.name}</span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                    </div>
                    <p className="text-[11px] text-[#11140F]/55 line-clamp-2 mt-1">
                      {preset.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Custom Slot Drawer */}
            {showAddSlot && (
              <div className="p-4 rounded-2xl border border-emerald-300 bg-emerald-50/40 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-emerald-950 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    Add Scheduled Ingress Time Slot
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddSlot(false)}
                    className="text-[#11140F]/40 hover:text-[#11140F] p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#11140F]/70 uppercase tracking-wider">
                      Slot Label (e.g. Lunch Specials)
                    </label>
                    <input
                      type="text"
                      value={newSlotLabel}
                      onChange={(e) => setNewSlotLabel(e.target.value)}
                      placeholder="e.g. Cocktail Hour"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#11140F]/70 uppercase tracking-wider">
                      Timezone
                    </label>
                    <select
                      value={newSlotTimezone}
                      onChange={(e) => setNewSlotTimezone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-900 outline-none focus:border-emerald-600"
                    >
                      <option value="UTC">UTC (Universal Time)</option>
                      <option value="America/New_York">Eastern Time (US / New York)</option>
                      <option value="America/Chicago">Central Time (US / Chicago)</option>
                      <option value="America/Los_Angeles">Pacific Time (US / Los Angeles)</option>
                      <option value="Europe/London">London (GMT / BST)</option>
                      <option value="Europe/Paris">Central Europe (Paris / Berlin)</option>
                      <option value="Africa/Lagos">West Africa (Lagos / UTC+1)</option>
                      <option value="Asia/Tokyo">Japan / Tokyo (JST)</option>
                    </select>
                  </div>
                </div>

                {/* Day Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#11140F]/70 uppercase tracking-wider">
                      Active Days of Week
                    </label>
                    <div className="flex items-center gap-2 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => setNewSlotDays([0, 1, 2, 3, 4, 5, 6])}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        All Days
                      </button>
                      <span>&middot;</span>
                      <button
                        type="button"
                        onClick={() => setNewSlotDays([1, 2, 3, 4, 5])}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        Weekdays
                      </button>
                      <span>&middot;</span>
                      <button
                        type="button"
                        onClick={() => setNewSlotDays([0, 6])}
                        className="text-emerald-700 hover:underline font-semibold"
                      >
                        Weekends
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {DAYS_OF_WEEK.map((d) => {
                      const selected = newSlotDays.includes(d.day);
                      return (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => handleToggleDay(d.day)}
                          className={`px-3 py-1 rounded-xl text-[11.5px] font-semibold border transition-all cursor-pointer ${
                            selected
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {d.short}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Start & End Times */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#11140F]/70 uppercase tracking-wider">
                      Start Time (24h)
                    </label>
                    <input
                      type="time"
                      value={newSlotStartTime}
                      onChange={(e) => setNewSlotStartTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-mono text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#11140F]/70 uppercase tracking-wider">
                      End Time (24h)
                    </label>
                    <input
                      type="time"
                      value={newSlotEndTime}
                      onChange={(e) => setNewSlotEndTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-mono text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Target URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#11140F]/70 uppercase tracking-wider">
                    Destination URL for this Window
                  </label>
                  <input
                    type="url"
                    value={newSlotDestination}
                    onChange={(e) => setNewSlotDestination(e.target.value)}
                    placeholder="https://example.com/specials"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-mono text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddSlot(false)}
                    className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 text-[#11140F] text-[12px] font-semibold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewScheduleSlot}
                    className="px-4 py-1.5 rounded-xl bg-emerald-700 text-white text-[12px] font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
                  >
                    Add Slot to Matrix
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI Routing Instructions */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
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
                placeholder="e.g. Route iOS visitors to App Store, Android to Google Play. Between 11:00 and 15:00 on weekdays send to https://example.com/lunch-menu."
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
                subtitle="Parsing device signatures, temporal schedules, and geographic bounds"
                onForceComplete={() => setLoading(false)}
              />
            )}
          </div>
        )}

        {/* TAB 3: All Active Rules */}
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
                  onClick={() => setActiveTab('schedule')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#11140F] text-white text-[12px] font-medium"
                >
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Configure Schedule Matrix
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
                          className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
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
                          {cond.type === 'schedule' && <Clock className="w-3 h-3 text-emerald-700" />}
                          {cond.type === 'device' && <Smartphone className="w-3 h-3" />}
                          {cond.type === 'country' && <Globe className="w-3 h-3" />}
                          {cond.type === 'referrer' && <ExternalLink className="w-3 h-3" />}
                          <span>
                            {cond.type === 'schedule' &&
                              `Schedule: ${cond.startTime} – ${cond.endTime} (${cond.daysOfWeek?.length === 7 ? 'Everyday' : `${cond.daysOfWeek?.length} days`})`}
                            {cond.type === 'device' && `Device: ${cond.value.toUpperCase()}`}
                            {cond.type === 'country' && `Country: ${cond.value.toUpperCase()}`}
                            {cond.type === 'referrer' && `Referrer: ${cond.contains}`}
                          </span>
                        </span>
                      ))}
                    </div>

                    {/* Target Destination */}
                    <div className="flex items-center gap-2">
                      <CornerDownRight className="w-4 h-4 text-emerald-600 shrink-0" />
                      <input
                        type="url"
                        value={rule.destination}
                        onChange={(e) => {
                          const updated = [...compiledRules];
                          updated[idx].destination = e.target.value;
                          setCompiledRules(updated);
                        }}
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-mono text-slate-900 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Interactive Simulator */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-[13px] font-bold text-[#11140F] uppercase tracking-wider flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                Live Traffic Sandbox Simulator
              </h4>
              <p className="text-[11.5px] text-[#11140F]/55">
                Test how incoming mobile scans resolve by simulating different hours, days, devices, and countries.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Simulate Client Environment:
              </span>

              {/* Day of Week */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600">Day of Week:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map((d) => (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => setSimTest({ ...simTest, dayOfWeek: d.day })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        simTest.dayOfWeek === d.day
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time of Day & Devices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Time of Day (24h):</span>
                  <div className="flex items-center gap-1.5">
                    {['12:00', '16:30', '20:30', '23:30'].map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSimTest({ ...simTest, timeStr: time })}
                        className={`px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                          simTest.timeStr === time
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600">Device Platform:</span>
                  <div className="flex items-center gap-1.5">
                    {(['ios', 'android', 'desktop'] as const).map((dev) => (
                      <button
                        key={dev}
                        type="button"
                        onClick={() => setSimTest({ ...simTest, device: dev })}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold uppercase transition-all cursor-pointer ${
                          simTest.device === dev
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {dev}
                      </button>
                    ))}
                  </div>
                </div>
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

      {/* Footer Status & Notification */}
      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[12px] font-medium text-emerald-900 text-center shrink-0">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
