import { prisma } from "@/lib/prisma";

export type AIFeatureName =
  | "route-resolver"
  | "campaign-analyst"
  | "shortcode-generator"
  | "url-enricher"
  | "qr-artist"
  | "landing-page-builder"
  | "campaign-orchestrator";

export type UserTier = "free" | "pro" | "plus" | "ultra" | "premium";

export interface TierConfig {
  name: string;
  monthlyLimitUsd: number;
  rateLimitPerMinute: number;
  level: number;
  description: string;
}

export const TIER_CONFIGS: Record<string, TierConfig> = {
  free: {
    name: "Free",
    monthlyLimitUsd: 0.50, // ~1,500 operations on Gemini Flash
    rateLimitPerMinute: 10,
    level: 1,
    description: "Personal starter with essential AI shortcodes & enrichment",
  },
  pro: {
    name: "Pro",
    monthlyLimitUsd: 5.00, // ~15,000 operations
    rateLimitPerMinute: 30,
    level: 2,
    description: "Power users with conditional routing, campaign analytics & landing pages",
  },
  plus: {
    name: "Plus",
    monthlyLimitUsd: 15.00, // ~45,000 operations
    rateLimitPerMinute: 60,
    level: 3,
    description: "Growing brands & marketing teams with AI QR Art Studio & higher limits",
  },
  premium: {
    name: "Plus",
    monthlyLimitUsd: 15.00,
    rateLimitPerMinute: 60,
    level: 3,
    description: "Legacy alias for Plus",
  },
  ultra: {
    name: "Ultra",
    monthlyLimitUsd: 50.00, // ~150,000+ operations
    rateLimitPerMinute: 120,
    level: 4,
    description: "Agencies & enterprise workloads with maximum throughput & limits",
  },
};

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
    tier: "plus",
    enabled: true,
    description: "Artistic, branded, high-contrast QR generation",
  },
};

/**
 * Gate every feature call through assertFeatureAccess(userId, feature)
 */
export async function assertFeatureAccess(
  userId: string | undefined | null,
  feature: AIFeatureName
): Promise<{ allowed: boolean; reason?: string; userTier: UserTier; tierConfig: TierConfig }> {
  const config = AI_FEATURES[feature];
  if (!config || !config.enabled) {
    return {
      allowed: false,
      reason: `Feature '${feature}' is currently disabled.`,
      userTier: "free",
      tierConfig: TIER_CONFIGS.free,
    };
  }

  // Free tier features are accessible to everyone
  if (config.tier === "free") {
    return { allowed: true, userTier: "free", tierConfig: TIER_CONFIGS.free };
  }

  // For paid tiers (pro, plus, ultra), user must be authenticated
  if (!userId) {
    return {
      allowed: false,
      userTier: "free",
      tierConfig: TIER_CONFIGS.free,
      reason: `Please sign in or create an account to use ${feature} (${config.tier.toUpperCase()} feature).`,
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, tier: true },
    });

    const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
    if (user && user.email.toLowerCase() === adminEmail) {
      return { allowed: true, userTier: "ultra", tierConfig: TIER_CONFIGS.ultra };
    }

    const userTierKey = (user?.tier as string)?.toLowerCase() || "pro";
    const tierConfig = TIER_CONFIGS[userTierKey] || TIER_CONFIGS.pro;
    const requiredConfig = TIER_CONFIGS[config.tier] || TIER_CONFIGS.pro;

    if (tierConfig.level < requiredConfig.level) {
      return {
        allowed: false,
        userTier: userTierKey as UserTier,
        tierConfig,
        reason: `Feature '${feature}' requires a ${requiredConfig.name.toUpperCase()} tier subscription. Your current tier is ${tierConfig.name.toUpperCase()}.`,
      };
    }

    return { allowed: true, userTier: userTierKey as UserTier, tierConfig };
  } catch (error) {
    console.error("Error checking feature access:", error);
    // Allow in dev / fallback to pro
    return { allowed: true, userTier: "pro", tierConfig: TIER_CONFIGS.pro };
  }
}
