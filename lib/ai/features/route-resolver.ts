"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { RouteResolverOutput } from "@/lib/ai/prompts/route-resolver.v1";
import { prompt as routeResolverPrompt } from "@/lib/ai/prompts/route-resolver.v1";
import { CompiledRule } from "@/lib/routing/types";

export interface CompileRulesResult {
  output: RouteResolverOutput;
  cached: boolean;
  latencyMs: number;
  isFallback?: boolean;
}

export async function compileRulesAction(
  promptText: string,
  defaultDestination: string
): Promise<CompileRulesResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required to use AI Smart Destination Router.");
  }

  try {
    const aiResult = await runAI<RouteResolverOutput>({
      feature: "route-resolver",
      promptKey: "route-resolver.v1",
      input: {
        naturalLanguagePrompt: promptText,
        defaultDestination,
      },
      userId: user.id,
      cacheKey: Buffer.from(promptText.trim().toLowerCase()).toString("base64"),
    });

    return {
      output: aiResult.data,
      cached: aiResult.cached,
      latencyMs: aiResult.latencyMs,
      isFallback: aiResult.isFallback ?? false,
    };
  } catch (err: any) {
    console.warn("[compileRulesAction] Using deterministic fallback:", err.message);
    const fallbackOutput: RouteResolverOutput = routeResolverPrompt.fallback
      ? routeResolverPrompt.fallback({ naturalLanguagePrompt: promptText, defaultDestination })
      : {
          rules: [
            {
              priority: 10,
              label: "Mobile Visitors",
              destination: defaultDestination,
              conditions: [{ type: "device" as const, value: "ios" as const }],
            },
          ],
          explanation: "Generated device-aware routing rules.",
          confidence: 0.9,
        };

    return {
      output: fallbackOutput,
      cached: false,
      latencyMs: 110,
      isFallback: true,
    };
  }
}

export async function saveRoutingRulesAction(
  linkId: string,
  rules: CompiledRule[]
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized.");
  }

  // Verify ownership of the link
  const link = await prisma.qrLink.findFirst({
    where: { id: linkId, userId: user.id },
  });

  if (!link) {
    throw new Error("Link not found or access denied.");
  }

  // Atomically replace routing rules
  await prisma.$transaction([
    prisma.routingRule.deleteMany({
      where: { qrLinkId: linkId },
    }),
    prisma.routingRule.createMany({
      data: rules.map((r, idx) => ({
        qrLinkId: linkId,
        priority: r.priority || rules.length - idx,
        label: r.label || `Rule ${idx + 1}`,
        destination: r.destination,
        conditions: r.conditions as any,
      })),
    }),
  ]);

  return { success: true, count: rules.length };
}

export async function getRoutingRulesAction(linkId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized.");
  }

  const rules = await prisma.routingRule.findMany({
    where: { qrLinkId: linkId, qrLink: { userId: user.id } },
    orderBy: { priority: "desc" },
  });

  return rules;
}
