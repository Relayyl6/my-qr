import { z } from "zod";
import { registerPrompt, PromptDefinition } from "./index";
import { AggregatedStatsBlob } from "@/lib/analytics/aggregate";

export const insightSchema = z.object({
  title: z.string().describe("Punchy headline of the insight"),
  description: z.string().describe("Specific finding backed by data"),
  type: z.enum(["surge", "stale", "device_trend", "timing"]).describe("Category of insight"),
  severity: z.enum(["info", "warning", "opportunity"]).describe("Importance level"),
});

export const actionSchema = z.object({
  title: z.string().describe("Call to action button label"),
  description: z.string().describe("Why taking this action improves ROI"),
  actionType: z.enum(["swap_destination", "create_rule", "archive_link", "share_qr"]),
  targetShortCode: z.string().optional().describe("Shortcode of link to apply to"),
  suggestedValue: z.string().optional().describe("Suggested URL or setting value"),
});

export const campaignAnalystSchema = z.object({
  summary: z.string().describe("2-3 sentence executive summary of scan performance"),
  insights: z.array(insightSchema).describe("Key data-backed observations"),
  suggestedActions: z.array(actionSchema).describe("Concrete, actionable steps for the business owner"),
});

export type CampaignAnalystOutput = z.infer<typeof campaignAnalystSchema>;

export const prompt: PromptDefinition<AggregatedStatsBlob, CampaignAnalystOutput> = {
  version: "v1",
  model: "gpt-4o-mini",
  temperature: 0.3,
  cacheTtlSeconds: 1800, // 30 minutes cache per user stats blob
  system: `You are the Principal Growth & Marketing Analyst for DynamicQR.
Business owners look to you for DECISIONS, not just charts.
Analyze their aggregated QR scan data and produce:
1. A punchy executive summary.
2. 2 to 4 high-value insights (highlighting traffic surges, dead links, device biases).
3. 2 to 3 concrete suggested actions that the business owner can execute right now.`,
  buildUserPrompt: (stats) => `
Aggregated QR Performance Data (Past ${stats.periodDays} days):
- Total Active Links: ${stats.totalLinks}
- Total Scans Logged: ${stats.totalScans}
- Inactive/Stale Links (>7 days without scan): ${stats.staleLinksCount}
- Device Distribution: iOS: ${stats.deviceBreakdown.ios}, Android: ${stats.deviceBreakdown.android}, Desktop: ${stats.deviceBreakdown.desktop}
- Time-of-Day Distribution: Morning: ${stats.timeOfDayBreakdown.morning}, Afternoon: ${stats.timeOfDayBreakdown.afternoon}, Evening: ${stats.timeOfDayBreakdown.evening}, Night: ${stats.timeOfDayBreakdown.night}

Individual Link Performance:
${stats.links
  .slice(0, 10)
  .map(
    (l) =>
      `• /id/${l.shortCode} ("${l.label || "Untitled"}"): ${l.totalScans} all-time scans, top device: ${l.topDevice}, last scanned: ${
        l.lastScannedDaysAgo === null ? "Never" : `${l.lastScannedDaysAgo}d ago`
      }`
  )
  .join("\n")}

Provide the executive brief and suggested actions.
`,
  schema: campaignAnalystSchema,
  fallback: (stats) => {
    const topLink = stats.links[0];
    const hasScans = stats.totalScans > 0;

    return {
      summary: hasScans
        ? `Your campaigns generated ${stats.totalScans} scans recently. Top performer is '/id/${topLink?.shortCode || "link"}' with ${topLink?.totalScans || 0} scans.`
        : "Your QR codes are created and ready for distribution. Once scans arrive, AI intelligence will automatically diagnose traffic patterns.",
      insights: [
        {
          title: hasScans ? "Mobile-First Audience" : "Awaiting First Scans",
          description: hasScans
            ? `Mobile devices represent ${stats.deviceBreakdown.ios + stats.deviceBreakdown.android} scans. Ensure landing pages load under 2 seconds.`
            : "Print your QR code on physical promotional materials or test-scan it with your phone.",
          type: "device_trend",
          severity: "info",
        },
        ...(stats.staleLinksCount > 0
          ? [
              {
                title: `${stats.staleLinksCount} Inactive Links Detected`,
                description: "Several links haven't registered scans recently. Consider testing new placement or updating destinations.",
                type: "stale" as const,
                severity: "warning" as const,
              },
            ]
          : []),
      ],
      suggestedActions: [
        {
          title: "Optimize for Mobile",
          description: "Configure conditional device routing for iOS vs Android.",
          actionType: "create_rule",
          targetShortCode: topLink?.shortCode,
        },
        {
          title: "Share Top Flyer",
          description: "Distribute your top QR code on active communication channels.",
          actionType: "share_qr",
          targetShortCode: topLink?.shortCode,
        },
      ],
    };
  },
};

registerPrompt("campaign-analyst.v1", prompt);
