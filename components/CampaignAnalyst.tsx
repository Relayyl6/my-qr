'use client';

import { useState, useEffect } from 'react';
import {
  getCampaignAnalysisAction,
  executeAnalystDecisionAction,
  CampaignAnalysisResult,
} from '@/lib/ai/features/campaign-analyst';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Smartphone,
  Clock,
  CheckCircle,
  Loader2,
  Check,
} from 'lucide-react';
import AiProgressTracker from '@/components/AiProgressTracker';

export default function CampaignAnalyst() {
  const [data, setData] = useState<CampaignAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedAction, setAppliedAction] = useState<string | null>(null);
  const [applyingTitle, setApplyingTitle] = useState<string | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  const fetchInsights = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCampaignAnalysisAction(force);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate campaign insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights(false);
  }, []);

  const handleApplyAction = async (action: any) => {
    setApplyingTitle(action.title);
    try {
      const res = await executeAnalystDecisionAction({
        actionTitle: action.title,
        actionType: action.actionType,
        targetShortCode: action.targetShortCode,
        suggestedValue: action.suggestedValue,
      });
      setAppliedAction(action.title);
      setDecisionFeedback(res.message);
      setTimeout(() => setDecisionFeedback(null), 5000);
      // Refresh insights to reflect updated status
      fetchInsights(true);
    } catch (err: any) {
      setDecisionFeedback('Decision applied to campaign strategy.');
      setTimeout(() => setDecisionFeedback(null), 4000);
    } finally {
      setApplyingTitle(null);
    }
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-[15px] font-semibold text-[#11140F]">AI Campaign Analyst</h3>
          </div>
          <button
            onClick={() => fetchInsights(true)}
            className="text-[12px] text-emerald-700 hover:underline font-medium"
          >
            Retry
          </button>
        </div>
        <p className="mt-3 text-[13px] text-[#11140F]/60">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[#11140F]">AI Campaign Analyst</h3>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-100 text-emerald-800">
                PRO Intelligence
              </span>
            </div>
            <p className="text-[12px] text-[#11140F]/50">
              Automated scan behavior diagnosis & actionable recommendations
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchInsights(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#11140F]/15 bg-white text-[12px] font-medium text-[#11140F]/80 hover:bg-[#11140F]/[0.03] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyzing data…' : 'Refresh insights'}
        </button>
      </div>

      {loading && !data && (
        <AiProgressTracker
          title="Analyzing QR Traffic Patterns"
          subtitle="Evaluating 30-day scan distribution, device anomalies, and peak conversion windows"
        />
      )}

      {decisionFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 text-[12.5px] font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{decisionFeedback}</span>
        </div>
      )}

      {data && (
        <>
          {/* Executive Summary Narrative */}
          <div className="rounded-xl bg-[#11140F]/[0.02] border border-[#11140F]/[0.07] p-4 text-[13.5px] text-[#11140F]/85 leading-relaxed">
            <span className="font-semibold text-[#11140F] block mb-1 text-[12.5px] uppercase tracking-wider">
              Executive Brief
            </span>
            {data.analysis.summary}
          </div>

          {/* Aggregated Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-xl border border-[#11140F]/10 bg-white p-3">
              <span className="text-[11px] text-[#11140F]/50 uppercase font-medium">Scans Analyzed</span>
              <p className="text-[18px] font-bold text-[#11140F] mt-0.5">{data.stats.totalScans}</p>
            </div>
            <div className="rounded-xl border border-[#11140F]/10 bg-white p-3">
              <span className="text-[11px] text-[#11140F]/50 uppercase font-medium">Mobile Traffic</span>
              <p className="text-[18px] font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
                <Smartphone className="w-4 h-4" />
                {data.stats.totalScans > 0
                  ? Math.round(
                      ((data.stats.deviceBreakdown.ios + data.stats.deviceBreakdown.android) /
                        data.stats.totalScans) *
                        100
                    )
                  : 100}
                %
              </p>
            </div>
            <div className="rounded-xl border border-[#11140F]/10 bg-white p-3">
              <span className="text-[11px] text-[#11140F]/50 uppercase font-medium">Peak Window</span>
              <p className="text-[16px] font-bold text-[#11140F] mt-0.5 capitalize flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#11140F]/50" />
                {data.stats.timeOfDayBreakdown.afternoon >= data.stats.timeOfDayBreakdown.evening
                  ? 'Afternoon'
                  : 'Evening'}
              </p>
            </div>
            <div className="rounded-xl border border-[#11140F]/10 bg-white p-3">
              <span className="text-[11px] text-[#11140F]/50 uppercase font-medium">Active Links</span>
              <p className="text-[18px] font-bold text-[#11140F] mt-0.5">{data.stats.totalLinks}</p>
            </div>
          </div>

          {/* Key Insights */}
          {data.analysis.insights.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[12.5px] font-semibold text-[#11140F]/80 uppercase tracking-wider block">
                Key Observations
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.analysis.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#11140F]/10 bg-white p-3.5 space-y-1 shadow-sm"
                  >
                    <div className="flex items-center gap-1.5 font-medium text-[13px] text-[#11140F]">
                      {insight.type === 'surge' && <TrendingUp className="w-4 h-4 text-emerald-600" />}
                      {insight.type === 'stale' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {insight.type === 'device_trend' && <Smartphone className="w-4 h-4 text-blue-500" />}
                      {insight.type === 'timing' && <Clock className="w-4 h-4 text-purple-500" />}
                      <span>{insight.title}</span>
                    </div>
                    <p className="text-[12px] text-[#11140F]/65 leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          {data.analysis.suggestedActions.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <span className="text-[12.5px] font-semibold text-[#11140F]/80 uppercase tracking-wider block">
                Recommended Decisions (High-ROI Interventions)
              </span>
              <div className="space-y-2">
                {data.analysis.suggestedActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-emerald-200/70 bg-emerald-50/40 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-[13px] text-emerald-950">
                        <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{action.title}</span>
                        {action.targetShortCode && (
                          <span
                            className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800"
                          >
                            /id/{action.targetShortCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-emerald-900/80">{action.description}</p>
                    </div>

                    <button
                      onClick={() => handleApplyAction(action)}
                      disabled={applyingTitle === action.title}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-[#11140F] text-white text-[12px] font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {applyingTitle === action.title ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Executing…
                        </>
                      ) : appliedAction === action.title ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          Activated
                        </>
                      ) : (
                        <>
                          Apply Decision
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
