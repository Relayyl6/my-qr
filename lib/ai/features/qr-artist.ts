"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { QrStyleSpec } from "@/lib/ai/prompts/qr-artist.v1";
import { prompt as qrArtistPrompt } from "@/lib/ai/prompts/qr-artist.v1";
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

  try {
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
  } catch (err: any) {
    console.warn("[generateQrArtSpecAction] Using deterministic fallback:", err.message);
    const fallbackSpec = qrArtistPrompt.fallback
      ? qrArtistPrompt.fallback({ prompt: promptText })
      : {
          fgColor: "#064E3B",
          bgColor: "#FFFFFF",
          accentColor: "#059669",
          cornerDotColor: "#047857",
          gradientType: "linear" as const,
          gradientColors: ["#ECFDF5", "#D1FAE5"],
          artisticStyle: "Emerald Botanical",
          errorCorrectionLevel: "H" as const,
        };

    const scannability = calculateScannability(fallbackSpec.fgColor, fallbackSpec.bgColor);
    return {
      styleSpec: fallbackSpec,
      scannability,
      cached: false,
      latencyMs: 90,
    };
  }
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
