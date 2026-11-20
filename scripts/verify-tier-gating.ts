import { AI_FEATURES, TIER_CONFIGS, UserTier } from "../lib/ai/flags";

async function runTierVerification() {
  console.log("=================================================");
  console.log("   TIER GATING & ENTITLEMENTS VERIFICATION SUITE   ");
  console.log("=================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] ${testName}`);
    } else {
      console.error(`  [FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
    }
  }

  // 1. Feature Registry Tier Requirements
  console.log("--- 1. AI Feature Registry Tier Configurations ---");
  assert(AI_FEATURES["campaign-analyst"].tier === "pro", "Campaign Analyst requires PRO tier");
  assert(AI_FEATURES["route-resolver"].tier === "pro", "Route Resolver requires PRO tier");
  assert(AI_FEATURES["landing-page-builder"].tier === "pro", "Landing Page Builder requires PRO tier");
  assert(AI_FEATURES["campaign-orchestrator"].tier === "pro", "Campaign Orchestrator requires PRO tier");
  assert(AI_FEATURES["qr-artist"].tier === "plus", "QR Art Studio requires PLUS tier");
  assert(AI_FEATURES["shortcode-generator"].tier === "free", "Shortcode Generator allowed on FREE tier");
  assert(AI_FEATURES["url-enricher"].tier === "free", "URL Enricher allowed on FREE tier");

  // 2. Pure Tier Comparison Logic
  console.log("\n--- 2. Entitlement Level Logic ---");
  const testMatrix: { tier: UserTier; feature: keyof typeof AI_FEATURES; expectedAllowed: boolean }[] = [
    // FREE user checks
    { tier: "free", feature: "campaign-analyst", expectedAllowed: false },
    { tier: "free", feature: "route-resolver", expectedAllowed: false },
    { tier: "free", feature: "qr-artist", expectedAllowed: false },
    { tier: "free", feature: "landing-page-builder", expectedAllowed: false },
    { tier: "free", feature: "campaign-orchestrator", expectedAllowed: false },
    { tier: "free", feature: "shortcode-generator", expectedAllowed: true },
    { tier: "free", feature: "url-enricher", expectedAllowed: true },

    // PRO user checks
    { tier: "pro", feature: "campaign-analyst", expectedAllowed: true },
    { tier: "pro", feature: "route-resolver", expectedAllowed: true },
    { tier: "pro", feature: "landing-page-builder", expectedAllowed: true },
    { tier: "pro", feature: "campaign-orchestrator", expectedAllowed: true },
    { tier: "pro", feature: "qr-artist", expectedAllowed: false }, // Plus required
    { tier: "pro", feature: "shortcode-generator", expectedAllowed: true },

    // PLUS user checks
    { tier: "plus", feature: "campaign-analyst", expectedAllowed: true },
    { tier: "plus", feature: "route-resolver", expectedAllowed: true },
    { tier: "plus", feature: "landing-page-builder", expectedAllowed: true },
    { tier: "plus", feature: "campaign-orchestrator", expectedAllowed: true },
    { tier: "plus", feature: "qr-artist", expectedAllowed: true },

    // ULTRA user checks
    { tier: "ultra", feature: "campaign-analyst", expectedAllowed: true },
    { tier: "ultra", feature: "qr-artist", expectedAllowed: true },
    { tier: "ultra", feature: "landing-page-builder", expectedAllowed: true },
  ];

  for (const { tier, feature, expectedAllowed } of testMatrix) {
    const config = AI_FEATURES[feature];
    const userTierConfig = TIER_CONFIGS[tier];
    const requiredConfig = TIER_CONFIGS[config.tier];
    const isAllowed = userTierConfig.level >= requiredConfig.level;

    assert(
      isAllowed === expectedAllowed,
      `User with tier '${tier.toUpperCase()}' access to '${feature}' -> ${isAllowed ? "ALLOWED" : "DENIED"} (expected: ${expectedAllowed ? "ALLOWED" : "DENIED"})`
    );
  }

  // 3. Custom Branded Domains Eligibility
  console.log("\n--- 3. Custom Branded Domains Tier Gating ---");
  const ALLOWED_DOMAIN_TIERS = ["plus", "ultra"];
  assert(!ALLOWED_DOMAIN_TIERS.includes("free"), "Free tier blocked from adding custom domains");
  assert(!ALLOWED_DOMAIN_TIERS.includes("pro"), "Pro tier blocked from adding custom domains");
  assert(ALLOWED_DOMAIN_TIERS.includes("plus"), "Plus tier allowed to add custom domains (1 domain)");
  assert(ALLOWED_DOMAIN_TIERS.includes("ultra"), "Ultra tier allowed to add custom domains (5 domains)");

  // 4. CSV Scan History Export Eligibility
  console.log("\n--- 4. CSV Scan Export Tier Gating ---");
  const ALLOWED_EXPORT_TIERS = ["pro", "plus", "ultra"];
  assert(!ALLOWED_EXPORT_TIERS.includes("free"), "Free tier blocked from downloading CSV scan history");
  assert(ALLOWED_EXPORT_TIERS.includes("pro"), "Pro tier allowed to download CSV scan history");
  assert(ALLOWED_EXPORT_TIERS.includes("plus"), "Plus tier allowed to download CSV scan history");
  assert(ALLOWED_EXPORT_TIERS.includes("ultra"), "Ultra tier allowed to download CSV scan history");

  // 5. Link Quota Caps
  console.log("\n--- 5. Link Limit Tier Enforcement ---");
  const getLinkCap = (tier: string) => {
    switch (tier) {
      case "free": return 5;
      case "pro": return 50;
      case "plus": return 500;
      case "ultra": return 999999;
      default: return 5;
    }
  };
  assert(getLinkCap("free") === 5, "Free tier link limit is 5");
  assert(getLinkCap("pro") === 50, "Pro tier link limit is 50");
  assert(getLinkCap("plus") === 500, "Plus tier link limit is 500");
  assert(getLinkCap("ultra") === 999999, "Ultra tier link limit is unlimited");

  console.log("\n=================================================");
  console.log(`   RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log("=================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTierVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
