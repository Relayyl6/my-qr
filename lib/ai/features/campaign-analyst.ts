"use server";

import { aggregateUserScans, AggregatedStatsBlob } from "@/lib/analytics/aggregate";
import { runAI } from "@/lib/ai/run";
import { CampaignAnalystOutput } from "@/lib/ai/prompts/campaign-analyst.v1";
import "@/lib/ai/prompts/campaign-analyst.v1"; // ensure registered
import { getCurrentUser } from "@/lib/auth";

export interface CampaignAnalysisResult {
  stats: AggregatedStatsBlob;
  analysis: CampaignAnalystOutput;
  cached: boolean;
  latencyMs: number;
}

export async function getCampaignAnalysisAction(
  forceRefresh = false
): Promise<CampaignAnalysisResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required to view AI marketing intelligence.");
  }

  // 1. Pre-aggregate user's scans
  const stats = await aggregateUserScans(user.id, 30);

  // 2. Cache key incorporates scan count to automatically invalidate on new scans unless forced
  const cacheKey = forceRefresh
    ? `force-${Date.now()}`
    : `user-${user.id}-scans-${stats.totalScans}`;

  // 3. Sacred wrapper invocation
  const aiResult = await runAI<CampaignAnalystOutput>({
    feature: "campaign-analyst",
    promptKey: "campaign-analyst.v1",
    input: stats,
    userId: user.id,
    cacheKey,
  });

  return {
    stats,
    analysis: aiResult.data,
    cached: aiResult.cached,
    latencyMs: aiResult.latencyMs,
  };
}
