"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import {
  BulkImportRawItem,
  CampaignOrchestratorOutput,
} from "@/lib/ai/prompts/campaign-orchestrator.v1";
import "@/lib/ai/prompts/campaign-orchestrator.v1";

export async function orchestrateBulkImportAction(
  items: BulkImportRawItem[]
): Promise<{ output: CampaignOrchestratorOutput; cached: boolean; latencyMs: number }> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required for Bulk Campaign Orchestrator.");
  }

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
  };
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
