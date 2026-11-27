"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { assertFeatureAccess } from "@/lib/ai/flags";
import { LandingPageSpec } from "@/lib/landing/types";
import { generateCopy, GenerateInput } from "@/lib/page/generate-copy";
import { assemble } from "@/lib/page/assemble";
import { Page, PageSchema } from "@/lib/page/schema";
import { migrateLegacySpec, isPageSchema } from "@/lib/page/migrate";
import { migrateV2 } from "@/lib/builder/migrate-v2";
import { getAIProvider } from "@/lib/ai/provider";
import { PLANS, PlanTier } from "@/lib/plans";
import { runBuilderAICopilotAction } from "@/lib/builder/ai-actions";
import "@/lib/ai/prompts/landing-page-builder.v1";

/**
 * AI Command Bar & Prompt Assistant for Visual Builder
 */
export async function aiPromptBuilderAction(
  promptText: string,
  destinationUrl?: string
) {
  const result = await runBuilderAICopilotAction({
    prompt: promptText,
    doc: null as any,
    destinationUrl,
  });

  return {
    success: result.success,
    doc: result.doc,
    headline: result.summary,
  };
}

/**
 * Modern AI Copy Generator for the flat Page architecture
 */
export async function generatePageCopyAction(input: GenerateInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required to generate page copy.");
  }

  const access = await assertFeatureAccess(user.id, "landing-page-builder");
  if (!access.allowed) {
    throw new Error(access.reason || "Mobile Landing Pages require a Plus or Ultra subscription.");
  }

  const provider = getAIProvider();
  const callModel = async (system: string, userPrompt: string) => {
    const res = await provider.generateText({
      system,
      prompt: userPrompt,
      temperature: 0.2,
      feature: "landing-page-builder",
    });
    return res.text;
  };

  const result = await generateCopy(input, callModel);
  if (!result.ok) {
    throw new Error(result.errors?.join(", ") || "Failed to generate copy. Please try again or fill in the form directly.");
  }

  return {
    copy: result.copy,
    source: result.source,
  };
}

export async function buildLandingPageSpecAction(
  promptText: string,
  businessName?: string,
  destinationUrl?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required to build AI landing pages.");
  }

  const access = await assertFeatureAccess(user.id, "landing-page-builder");
  if (!access.allowed) {
    throw new Error(access.reason || "Prompt-to-Page AI Mobile Landing Pages require a Plus or Ultra subscription.");
  }

  const cacheSeed = `${promptText.trim().toLowerCase()}_${destinationUrl || ''}`;
  const aiResult = await runAI<LandingPageSpec>({
    feature: "landing-page-builder",
    promptKey: "landing-page-builder.v1",
    input: {
      prompt: promptText,
      businessName,
      destinationUrl,
    },
    userId: user.id,
    cacheKey: Buffer.from(cacheSeed).toString("base64"),
  });

  return {
    spec: aiResult.data,
    cached: aiResult.cached,
    latencyMs: aiResult.latencyMs,
  };
}

export async function saveLandingPageAction(
  linkId: string,
  spec: Page | LandingPageSpec | any,
  published = true
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized.");
  }

  const access = await assertFeatureAccess(user.id, "landing-page-builder");
  if (!access.allowed) {
    throw new Error(access.reason || "Saving AI Mobile Landing Pages requires a Plus or Ultra subscription.");
  }

  // Tier limits matching Pricing Table & PLANS matrix
  const userTier = (user.tier || "free").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = user.email.toLowerCase() === adminEmail;
  const allowedPages = PLANS[userTier as PlanTier]?.microsaas.landing_page ?? 1;

  if (!isAdmin && userTier !== "ultra") {
    const existingCount = await prisma.landingPage.count({
      where: {
        qrLink: { userId: user.id },
        published: true,
        qrLinkId: { not: linkId },
      },
    });
    if (existingCount >= allowedPages) {
      throw new Error(
        `Your ${userTier.toUpperCase()} plan includes up to ${allowedPages} published Mobile Landing Page${allowedPages > 1 ? 's' : ''}. Please upgrade your plan for more.`
      );
    }
  }

  // Ensure link exists and belongs to user
  const link = await prisma.qrLink.findFirst({
    where: { id: linkId, userId: user.id },
  });

  if (!link) {
    throw new Error("Link not found or access denied.");
  }

  // Update link type to landing-page and upsert landing page record
  const [updatedLink, page] = await prisma.$transaction([
    prisma.qrLink.update({
      where: { id: linkId },
      data: { type: "landing-page" },
    }),
    prisma.landingPage.upsert({
      where: { qrLinkId: linkId },
      create: {
        qrLinkId: linkId,
        spec: spec as any,
        published,
      },
      update: {
        spec: spec as any,
        published,
      },
    }),
  ]);

  revalidatePath('/');
  revalidatePath(`/page/${link.shortCode}`);
  revalidatePath(`/id/${link.shortCode}`);

  return { success: true, pageId: page.id };
}

export async function revertLandingPageAction(linkId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized.");
  }

  // Ensure link belongs to user
  const link = await prisma.qrLink.findFirst({
    where: { id: linkId, userId: user.id },
  });

  if (!link) {
    throw new Error("Link not found or access denied.");
  }

  // Switch type back to standard redirect and mark landing page as unpublished
  await prisma.$transaction([
    prisma.qrLink.update({
      where: { id: linkId },
      data: { type: "redirect" },
    }),
    prisma.landingPage.updateMany({
      where: { qrLinkId: linkId },
      data: { published: false },
    }),
  ]);

  revalidatePath('/');
  revalidatePath(`/page/${link.shortCode}`);
  revalidatePath(`/id/${link.shortCode}`);

  return { success: true };
}

export async function getLandingPageByShortCode(shortCode: string) {
  const link = await prisma.qrLink.findUnique({
    where: { shortCode },
    include: { landingPage: true },
  });

  if (!link || !link.landingPage) return null;
  return {
    link,
    landingPage: link.landingPage,
    spec: link.landingPage.spec as unknown as LandingPageSpec,
  };
}
