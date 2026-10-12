"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { LandingPageSpec } from "@/lib/landing/types";
import "@/lib/ai/prompts/landing-page-builder.v1";

export async function buildLandingPageSpecAction(
  promptText: string,
  businessName?: string,
  destinationUrl?: string
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required to build AI landing pages.");
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
  spec: LandingPageSpec,
  published = true
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized.");
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
