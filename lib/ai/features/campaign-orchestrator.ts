"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import {
  BulkImportRawItem,
  CampaignOrchestratorOutput,
} from "@/lib/ai/prompts/campaign-orchestrator.v1";
import { prompt as orchestratorPrompt } from "@/lib/ai/prompts/campaign-orchestrator.v1";

export async function orchestrateBulkImportAction(
  items: BulkImportRawItem[]
): Promise<{ output: CampaignOrchestratorOutput; cached: boolean; latencyMs: number; isFallback?: boolean }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required for Bulk Campaign Orchestrator.");
  }

  try {
    const aiResult = await runAI<CampaignOrchestratorOutput>({
      feature: "campaign-orchestrator",
      promptKey: "campaign-orchestrator.v1",
      input: { items },
      userId: user.id,
    });

    return {
      output: aiResult.data,
      cached: aiResult.cached,
      latencyMs: aiResult.latencyMs,
      isFallback: aiResult.isFallback ?? false,
    };
  } catch (err: any) {
    console.warn("[orchestrateBulkImportAction] Using deterministic fallback:", err.message);
    const fallbackOutput = orchestratorPrompt.fallback
      ? orchestratorPrompt.fallback({ items })
      : {
          totalItemsProcessed: items.length,
          summary: `Organized ${items.length} destination links into campaigns.`,
          campaigns: [
            {
              campaignName: "Bulk Campaign Ingestion",
              category: "General",
              items: items.map((it, idx) => ({
                destinationUrl: it.destinationUrl,
                label: it.label || `Link ${idx + 1}`,
                shortCode: `bulk-${idx + 1}-${Math.floor(100 + Math.random() * 900)}`,
                tags: ["bulk", "campaign"],
              })),
              suggestedStrategy: "Deploy with standard scan tracking.",
            },
          ],
        };

    return {
      output: fallbackOutput,
      cached: false,
      latencyMs: 150,
      isFallback: true,
    };
  }
}

export async function applyOrchestratedCampaignAction(
  campaigns: CampaignOrchestratorOutput["campaigns"]
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized.");
  }

  let createdCount = 0;
  const createdIds: string[] = [];

  for (const campaign of campaigns) {
    for (const item of campaign.items) {
      // Ensure unique shortcode
      let targetCode = item.shortCode.toLowerCase().trim();
      const existing = await prisma.qrLink.findUnique({
        where: { shortCode: targetCode },
      });

      if (existing) {
        targetCode = `${targetCode}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const link = await prisma.qrLink.create({
        data: {
          shortCode: targetCode,
          destinationUrl: item.destinationUrl,
          label: item.label,
          userId: user.id,
        },
      });

      createdCount++;
      createdIds.push(link.id);
    }
  }

  return { success: true, createdCount, createdIds };
}
