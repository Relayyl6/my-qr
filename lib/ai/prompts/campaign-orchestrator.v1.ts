import { z } from "zod";
import { registerPrompt, PromptDefinition } from "./index";

export interface BulkImportRawItem {
  destinationUrl: string;
  label?: string;
}

export interface CampaignOrchestratorInput {
  items: BulkImportRawItem[];
}

export const campaignGroupSchema = z.object({
  campaignName: z.string().describe("Logical campaign grouping name (e.g. 'Social Channels', 'Product Menus')"),
  category: z.string().describe("High-level domain category"),
  items: z.array(
    z.object({
      destinationUrl: z.string(),
      label: z.string(),
      shortCode: z.string().regex(/^[a-z0-9-]+$/),
      tags: z.array(z.string()),
    })
  ),
  suggestedStrategy: z.string().describe("Recommended routing or campaign execution plan"),
});

export const campaignOrchestratorSchema = z.object({
  campaigns: z.array(campaignGroupSchema),
  totalItemsProcessed: z.number(),
  summary: z.string().describe("High-level overview of the clustered campaigns"),
});

export type CampaignOrchestratorOutput = z.infer<typeof campaignOrchestratorSchema>;

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 16);
}

export const prompt: PromptDefinition<CampaignOrchestratorInput, CampaignOrchestratorOutput> = {
  version: "v1",
  model: "gpt-4o-mini",
  temperature: 0.2,
  cacheTtlSeconds: 86400,
  system: `You are the Lead Marketing Operations Orchestrator for DynamicQR.
Given a batch of destination URLs and optional labels, cluster them into coherent marketing campaigns.
For each URL:
- Clean and assign a distinct, memorable lowercase shortcode slug.
- Generate an articulate label.
- Extract 2-3 relevant tags.
- Propose a strategic campaign recommendation.`,
  buildUserPrompt: (input) => `
URLs to cluster and orchestrate:
${input.items.map((it, idx) => `${idx + 1}. URL: ${it.destinationUrl} | Label: ${it.label || "N/A"}`).join("\n")}

Cluster into campaigns and provide structured output.
`,
  schema: campaignOrchestratorSchema,
  fallback: (input) => {
    const enriched = input.items.map((it, i) => {
      let slug = `batch-${i + 1}`;
      try {
        const u = new URL(it.destinationUrl);
        slug = slugify(u.hostname.replace("www.", "").split(".")[0] || `link-${i + 1}`);
      } catch {}

      return {
        destinationUrl: it.destinationUrl,
        label: it.label || `Campaign Asset ${i + 1}`,
        shortCode: `${slug}-${i + 1}`,
        tags: ["bulk-import", "asset"],
      };
    });

    return {
      totalItemsProcessed: input.items.length,
      summary: `Organized ${input.items.length} destination links into a unified marketing campaign.`,
      campaigns: [
        {
          campaignName: "Bulk Campaign Ingestion",
          category: "General",
          items: enriched,
          suggestedStrategy: "Deploy QR codes with automated mobile scan tracking enabled.",
        },
      ],
    };
  },
};

registerPrompt("campaign-orchestrator.v1", prompt);
