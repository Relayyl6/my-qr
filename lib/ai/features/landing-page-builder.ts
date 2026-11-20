"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { assertFeatureAccess } from "@/lib/ai/flags";
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
  spec: LandingPageSpec,
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

  // Tier limit: Plus plan includes up to 3 published showcase pages (Matrix #81)
  const userTier = (user.tier || "free").toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = user.email.toLowerCase() === adminEmail;
  if (!isAdmin && userTier === "plus") {
    const existingCount = await prisma.landingPage.count({
      where: {
        qrLink: { userId: user.id },
        published: true,
        qrLinkId: { not: linkId },
      },
    });
    if (existingCount >= 3) {
      throw new Error(
        "Your Plus plan includes up to 3 published Mobile Landing Pages. Please upgrade to Ultra for unlimited mobile landing page showcases."
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
