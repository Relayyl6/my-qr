"use server";

import { extractMetadata, PageMetadata } from "@/lib/scraper/extractMetadata";
import { healthCheck, HealthCheckResult } from "@/lib/scraper/healthCheck";
import { runAI } from "@/lib/ai/run";
import { UrlEnricherOutput } from "@/lib/ai/prompts/url-enricher.v1";
import "@/lib/ai/prompts/url-enricher.v1"; // ensure prompt registration

export interface EnrichedUrlResult {
  metadata: PageMetadata;
  health: HealthCheckResult;
  aiSuggestion: UrlEnricherOutput;
  cached: boolean;
  latencyMs: number;
}

export async function enrichUrlAction(
  url: string,
  userId?: string
): Promise<EnrichedUrlResult> {
  // 1. Scrape metadata & run health-check concurrently
  const [metadata, health] = await Promise.all([
    extractMetadata(url),
    healthCheck(url),
  ]);

  // 2. Run through sacred AI wrapper
  const aiResult = await runAI<UrlEnricherOutput>({
    feature: "url-enricher",
    promptKey: "url-enricher.v1",
    input: {
      url,
      title: metadata.title,
      description: metadata.description,
    },
    userId,
    cacheKey: Buffer.from(url).toString("base64"),
  });

  return {
    metadata,
    health,
    aiSuggestion: aiResult.data,
    cached: aiResult.cached,
    latencyMs: aiResult.latencyMs,
  };
}
