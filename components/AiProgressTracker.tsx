'use client';

import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Loader2, Zap, ShieldCheck, Clock } from 'lucide-react';

interface Stage {
  label: string;
  detail: string;
}

interface AiProgressTrackerProps {
  title?: string;
  subtitle?: string;
  stages?: Stage[];
  onForceComplete?: () => void;
}

const DEFAULT_STAGES: Stage[] = [
  { label: 'Ingesting & Validating Payload', detail: 'Sanitizing syntax, endpoints & URL structures' },
  { label: 'Dispatching Neural Intent Processing', detail: 'Evaluating contextual semantics & device profiles' },
  { label: 'Synthesizing Structured Output', detail: 'Generating deterministic rules, slugs & assets' },
  { label: 'Calibrating Health & Scannability', detail: 'Verifying protocol security & ISO/IEC constraints' },
];

export default function AiProgressTracker({
  title = 'AI Processing in Progress',
  subtitle = 'Executing intelligent pipeline with neural acceleration',
  stages = DEFAULT_STAGES,
  onForceComplete,
}: AiProgressTrackerProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);
  const [elapsedSeconds, setElapsedSeconds] = useState(0.0);

  // Stopwatch timer
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Number(((Date.now() - start) / 1000).toFixed(1)));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Stage progression
  useEffect(() => {
    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1100);

    const progressInterval = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.floor(Math.random() * 12) + 5;
      });
    }, 300);

    return () => {
      clearInterval(stageInterval);
      clearInterval(progressInterval);
    };
  }, [stages.length]);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-50/40 via-white to-white p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div>
            <h4 className="text-[14px] font-semibold text-[#11140F] flex items-center gap-2">
              {title}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                ACTIVE
              </span>
            </h4>
            <p className="text-[12px] text-[#11140F]/60">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#11140F]/50 bg-[#11140F]/5 px-2.5 py-1 rounded-lg shrink-0">
          <Clock className="w-3 h-3 text-emerald-600" />
          <span>{elapsedSeconds.toFixed(1)}s elapsed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="font-medium text-emerald-950">
            {stages[currentStageIndex]?.label || 'Finalizing...'}
          </span>
          <span className="font-mono font-bold text-emerald-700">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#11140F]/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-[#2F6B4F] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stage Micro-Steps */}
      <div className="space-y-2 pt-1 border-t border-[#11140F]/5">
        {stages.map((stage, idx) => {
          const isDone = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 text-[12px] transition-opacity duration-300 ${
                isDone ? 'opacity-80' : isCurrent ? 'opacity-100 font-medium' : 'opacity-40'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-[#11140F]/30" />
                )}
              </div>
              <div className="min-w-0">
                <span className={isCurrent ? 'text-emerald-950' : 'text-[#11140F]'}>
                  {stage.label}
                </span>
                {isCurrent && (
                  <span className="block text-[11px] text-[#11140F]/50 truncate">
                    {stage.detail}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bypass Fallback Action */}
      {onForceComplete && elapsedSeconds > 4.0 && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onForceComplete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-emerald-800 text-[11.5px] font-medium hover:bg-emerald-50 transition-colors cursor-pointer shadow-xs"
          >
            <Zap className="w-3 h-3 text-emerald-600" />
            Fast-Track with Instant Engine
          </button>
        </div>
      )}
    </div>
  );
}
