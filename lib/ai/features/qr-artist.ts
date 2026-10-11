"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { QrStyleSpec } from "@/lib/ai/prompts/qr-artist.v1";
import "@/lib/ai/prompts/qr-artist.v1";
import { calculateScannability, ScannabilityResult } from "@/lib/qr/scannability";

export interface GenerateQrArtResult {
  styleSpec: QrStyleSpec;
  scannability: ScannabilityResult;
  cached: boolean;
  latencyMs: number;
}

export async function generateQrArtSpecAction(
  promptText: string
): Promise<GenerateQrArtResult> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required for AI Artistic QR generation.");
  }

  const aiResult = await runAI<QrStyleSpec>({
    feature: "qr-artist",
    promptKey: "qr-artist.v1",
    input: { prompt: promptText },
    userId: user.id,
    cacheKey: Buffer.from(promptText.trim().toLowerCase()).toString("base64"),
  });

  const scannability = calculateScannability(
    aiResult.data.fgColor,
    aiResult.data.bgColor
  );

  return {
    styleSpec: aiResult.data,
    scannability,
    cached: aiResult.cached,
    latencyMs: aiResult.latencyMs,
  };
}

export async function saveQrArtworkAction(
  linkId: string,
  promptText: string,
  styleSpec: QrStyleSpec,
  scannabilityScore: number
) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized.");
  }

  const artwork = await prisma.qrArtwork.create({
    data: {
      qrLinkId: linkId,
      prompt: promptText,
      styleSpec: styleSpec as any,
      imageUrl: "",
      compositeUrl: "",
      scannabilityScore,
    },
  });

  return { success: true, artworkId: artwork.id };
}
