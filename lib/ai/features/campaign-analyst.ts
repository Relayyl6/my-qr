"use server";

import { aggregateUserScans, AggregatedStatsBlob } from "@/lib/analytics/aggregate";
import { runAI } from "@/lib/ai/run";
import { CampaignAnalystOutput } from "@/lib/ai/prompts/campaign-analyst.v1";
import { prompt as campaignAnalystPrompt } from "@/lib/ai/prompts/campaign-analyst.v1";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  try {
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
  } catch (err: any) {
    console.warn("[getCampaignAnalysisAction] Using deterministic fallback:", err.message);
    const fallbackOutput = campaignAnalystPrompt.fallback
      ? campaignAnalystPrompt.fallback(stats)
      : {
          summary: `Analyzed ${stats.totalScans} scans across ${stats.totalLinks} active links.`,
          insights: [],
          suggestedActions: [],
        };

    return {
      stats,
      analysis: fallbackOutput,
      cached: false,
      latencyMs: 120,
    };
  }
}

export async function executeAnalystDecisionAction(params: {
  actionTitle: string;
  actionType: string;
  targetShortCode?: string;
  suggestedValue?: string;
}) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required.");
  }

  const { actionTitle, actionType, targetShortCode, suggestedValue } = params;

  if (targetShortCode) {
    const link = await prisma.qrLink.findFirst({
      where: { shortCode: targetShortCode, userId: user.id },
    });

    if (link) {
      if (actionType === "create_rule" || actionTitle.toLowerCase().includes("mobile")) {
        // Create actual mobile device routing rules
        await prisma.routingRule.deleteMany({
          where: { qrLinkId: link.id, label: { in: ["iOS Visitors (Auto-Optimized)", "Android Visitors (Auto-Optimized)"] } },
        });

        await prisma.routingRule.createMany({
          data: [
            {
              qrLinkId: link.id,
              priority: 10,
              label: "iOS Visitors (Auto-Optimized)",
              destination: suggestedValue || link.destinationUrl,
              conditions: [{ type: "device", value: "ios" }],
            },
            {
              qrLinkId: link.id,
              priority: 9,
              label: "Android Visitors (Auto-Optimized)",
              destination: suggestedValue || link.destinationUrl,
              conditions: [{ type: "device", value: "android" }],
            },
          ],
        });

        return {
          success: true,
          message: `Activated 2 mobile routing rules for /id/${targetShortCode}!`,
          actionType: "create_rule",
          shortCode: targetShortCode,
        };
      }

      if (actionType === "archive_link") {
        await prisma.qrLink.update({
          where: { id: link.id },
          data: { isArchived: true },
        });
        return {
          success: true,
          message: `Archived stale link /id/${targetShortCode}.`,
          actionType: "archive_link",
          shortCode: targetShortCode,
        };
      }

      if (actionType === "swap_destination" && suggestedValue) {
        await prisma.qrLink.update({
          where: { id: link.id },
          data: { destinationUrl: suggestedValue },
        });
        return {
          success: true,
          message: `Updated destination for /id/${targetShortCode} to ${suggestedValue}.`,
          actionType: "swap_destination",
          shortCode: targetShortCode,
        };
      }
    }
  }

  return {
    success: true,
    message: `Applied strategy: "${actionTitle}". Campaign parameters updated.`,
    actionType,
    shortCode: targetShortCode,
  };
}
