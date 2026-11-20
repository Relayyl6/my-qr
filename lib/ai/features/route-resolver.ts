"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { assertFeatureAccess } from "@/lib/ai/flags";
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

  const access = await assertFeatureAccess(user.id, "route-resolver");
  if (!access.allowed) {
    throw new Error(access.reason || "Smart Destination Router requires a Pro, Plus, or Ultra subscription.");
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
    if (err.message?.includes("requires a") || err.message?.includes("subscription") || err.message?.includes("Authentication")) {
      throw err;
    }
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

  // Tier Guard: Enforce strict plan limits per /pricing feature matrix
  const userTier = (user.tier || "free").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = user.email.toLowerCase() === adminEmail;

  if (!isAdmin) {
    if (userTier === "free" && rules.length > 0) {
      throw new Error(
        "Smart Conditional Routing (device splitting and schedule rules) is a Pro feature. Please upgrade your plan to deploy routing rules."
      );
    }

    if (userTier === "pro") {
      // 1. Max 3 waterfall rules (Matrix #11: Pro Up to 3 Rules)
      if (rules.length > 3) {
        throw new Error(
          "Pro plan allows up to 3 routing rules per QR link. Upgrade to Plus for up to 10 rules or Ultra for unlimited waterfall rules."
        );
      }

      // 2. Max 2 schedule time slots (Matrix #1: Pro 2 Time Slots)
      const scheduleCount = rules.filter((r) =>
        (r.conditions as any[]).some((c) => c.type === "schedule" || c.type === "timeRange")
      ).length;
      if (scheduleCount > 2) {
        throw new Error(
          "Pro plan allows up to 2 scheduled time slots in the Autonomous Ingress Matrix. Upgrade to Plus for 5 time slots or Ultra for unlimited."
        );
      }

      // 3. Country / Referrer / Language routing require Plus or Ultra (Matrix #7, #9, #10)
      const hasGeoOrReferrer = rules.some((r) =>
        (r.conditions as any[]).some(
          (c) => c.type === "country" || c.type === "referrer" || c.type === "language"
        )
      );
      if (hasGeoOrReferrer) {
        throw new Error(
          "Geographic Country Routing and Referrer Attribution Routing require a Plus or Ultra plan. Please upgrade to route by country or traffic source."
        );
      }
    }

    if (userTier === "plus") {
      // 1. Max 10 waterfall rules (Matrix #11: Plus Up to 10 Rules)
      if (rules.length > 10) {
        throw new Error(
          "Plus plan allows up to 10 routing rules per QR link. Upgrade to Ultra for unlimited waterfall rules."
        );
      }

      // 2. Max 5 schedule time slots (Matrix #1: Plus 5 Time Slots)
      const scheduleCount = rules.filter((r) =>
        (r.conditions as any[]).some((c) => c.type === "schedule" || c.type === "timeRange")
      ).length;
      if (scheduleCount > 5) {
        throw new Error(
          "Plus plan allows up to 5 scheduled time slots in the Autonomous Ingress Matrix. Upgrade to Ultra for unlimited."
        );
      }
    }
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
