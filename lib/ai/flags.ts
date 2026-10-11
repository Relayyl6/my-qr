import { prisma } from "@/lib/prisma";

export type AIFeatureName =
  | "route-resolver"
  | "campaign-analyst"
  | "shortcode-generator"
  | "url-enricher"
  | "qr-artist"
  | "landing-page-builder"
  | "campaign-orchestrator";

export type UserTier = "free" | "pro" | "premium";

export const AI_FEATURES: Record<
  AIFeatureName,
  { tier: UserTier; enabled: boolean; description: string }
> = {
  "url-enricher": {
    tier: "free",
    enabled: true,
    description: "One-click page metadata extraction and health check",
  },
  "shortcode-generator": {
    tier: "free",
    enabled: true,
    description: "Smart semantic shortcode and category generation",
  },
  "route-resolver": {
    tier: "pro",
    enabled: true,
    description: "Plain-English conditional redirect rules compilation",
  },
  "campaign-analyst": {
    tier: "pro",
    enabled: true,
    description: "Scan intelligence, trend detection, and marketing actions",
  },
  "landing-page-builder": {
    tier: "pro",
    enabled: true,
    description: "Instant mobile landing page generation (Prompt-to-Page)",
  },
  "campaign-orchestrator": {
    tier: "pro",
    enabled: true,
    description: "Bulk link ingestion and campaign grouping",
  },
  "qr-artist": {
    tier: "premium",
    enabled: true,
    description: "Artistic, branded, high-contrast QR generation",
  },
};

const TIER_LEVELS: Record<UserTier, number> = {
  free: 1,
  pro: 2,
  premium: 3,
};

/**
 * Gate every feature call through assertFeatureAccess(userId, feature)
 */
export async function assertFeatureAccess(
  userId: string | undefined | null,
  feature: AIFeatureName
): Promise<{ allowed: boolean; reason?: string; userTier?: UserTier }> {
  const config = AI_FEATURES[feature];
  if (!config || !config.enabled) {
    return { allowed: false, reason: `Feature '${feature}' is currently disabled.` };
  }

  // Free tier features are always allowed
  if (config.tier === "free") {
    return { allowed: true, userTier: "free" };
  }

  // For paid tiers (pro, premium), user must be authenticated
  if (!userId) {
    return {
      allowed: false,
      reason: `Please sign in or create an account to use ${feature} (${config.tier.toUpperCase()} feature).`,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true },
    });

    const userTier = (user?.tier as UserTier) || "pro";
    const requiredLevel = TIER_LEVELS[config.tier];
    const userLevel = TIER_LEVELS[userTier] || 1;

    if (userLevel < requiredLevel) {
      return {
        allowed: false,
        userTier,
        reason: `Feature '${feature}' requires a ${config.tier.toUpperCase()} tier subscription. Your current tier is ${userTier.toUpperCase()}.`,
      };
    }

    return { allowed: true, userTier };
  } catch (error) {
    console.error("Error checking feature access:", error);
    // Allow in dev / fallback to pro
    return { allowed: true, userTier: "pro" };
  }
}
