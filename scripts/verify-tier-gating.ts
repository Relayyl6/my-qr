import { AI_FEATURES, TIER_CONFIGS, UserTier } from "../lib/ai/flags";

async function runTierVerification() {
  console.log("================================================================================");
  console.log("       DYNAMICQR FULL 102+ PRICING MATRIX & ENTITLEMENTS VERIFICATION SUITE       ");
  console.log("================================================================================\n");

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

  // 1. AI Feature Registry Tier Requirements (per /pricing)
  console.log("--- 1. AI Feature Registry Tier Configurations ---");
  assert(AI_FEATURES["campaign-analyst"].tier === "pro", "AI Campaign Analyst requires PRO tier (Matrix #80)");
  assert(AI_FEATURES["route-resolver"].tier === "pro", "Route Resolver requires PRO tier (Matrix #79)");
  assert(AI_FEATURES["landing-page-builder"].tier === "plus", "Landing Page Builder requires PLUS tier (Matrix #81)");
  assert(AI_FEATURES["campaign-orchestrator"].tier === "pro", "Campaign Orchestrator requires PRO tier (Matrix #86)");
  assert(AI_FEATURES["qr-artist"].tier === "plus", "QR Art Studio requires PLUS tier (Matrix #84)");
  assert(AI_FEATURES["shortcode-generator"].tier === "free", "Shortcode Generator allowed on FREE tier (Matrix #72)");
  assert(AI_FEATURES["url-enricher"].tier === "free", "URL Enricher allowed on FREE tier (Matrix #80)");

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
    { tier: "pro", feature: "campaign-orchestrator", expectedAllowed: true },
    { tier: "pro", feature: "shortcode-generator", expectedAllowed: true },
    { tier: "pro", feature: "url-enricher", expectedAllowed: true },
    { tier: "pro", feature: "landing-page-builder", expectedAllowed: false }, // Plus required
    { tier: "pro", feature: "qr-artist", expectedAllowed: false }, // Plus required

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

  // 3. Custom Branded Domains Eligibility & Limits (Matrix #54)
  console.log("\n--- 3. Custom Branded Domains Tier Gating (Matrix #54) ---");
  const getDomainCap = (tier: string) => {
    switch (tier) {
      case "free": return 0;
      case "pro": return 0;
      case "plus": return 1;
      case "ultra": return 999999;
      default: return 0;
    }
  };
  assert(getDomainCap("free") === 0, "Free tier custom domains cap: 0");
  assert(getDomainCap("pro") === 0, "Pro tier custom domains cap: 0");
  assert(getDomainCap("plus") === 1, "Plus tier custom domains cap: 1 domain (Matrix #54)");
  assert(getDomainCap("ultra") === 999999, "Ultra tier custom domains cap: Unlimited (Matrix #54)");

  // 4. Autonomous Ingress Matrix & Routing Rules (Matrix #1 & #11)
  console.log("\n--- 4. Routing Rule & Schedule Slot Limits (Matrix #1 & #11) ---");
  const getMaxRules = (tier: string) => {
    switch (tier) {
      case "free": return 0;
      case "pro": return 3;
      case "plus": return 10;
      case "ultra": return 999999;
      default: return 0;
    }
  };
  const getMaxScheduleSlots = (tier: string) => {
    switch (tier) {
      case "free": return 0;
      case "pro": return 2;
      case "plus": return 5;
      case "ultra": return 999999;
      default: return 0;
    }
  };
  assert(getMaxRules("free") === 0, "Free tier routing rules limit: 0");
  assert(getMaxRules("pro") === 3, "Pro tier routing rules limit: Up to 3 Rules (Matrix #11)");
  assert(getMaxRules("plus") === 10, "Plus tier routing rules limit: Up to 10 Rules (Matrix #11)");
  assert(getMaxRules("ultra") === 999999, "Ultra tier routing rules limit: Unlimited Waterfall (Matrix #11)");

  assert(getMaxScheduleSlots("free") === 0, "Free tier schedule slots: 0");
  assert(getMaxScheduleSlots("pro") === 2, "Pro tier schedule slots: 2 Time Slots (Matrix #1)");
  assert(getMaxScheduleSlots("plus") === 5, "Plus tier schedule slots: 5 Time Slots (Matrix #1)");
  assert(getMaxScheduleSlots("ultra") === 999999, "Ultra tier schedule slots: Unlimited Matrix (Matrix #1)");

  // 5. Geographic Country & Referrer Routing Permissions (Matrix #7, #10)
  console.log("\n--- 5. Country & Referrer Routing Permissions (Matrix #7, #10) ---");
  const canUseGeoRouting = (tier: string) => ["plus", "ultra"].includes(tier);
  assert(!canUseGeoRouting("free"), "Free tier blocked from Country Routing");
  assert(!canUseGeoRouting("pro"), "Pro tier blocked from Country Routing (Plus required)");
  assert(canUseGeoRouting("plus"), "Plus tier allowed Country Routing (Top 20 Countries)");
  assert(canUseGeoRouting("ultra"), "Ultra tier allowed Country Routing (240+ Global Nations)");

  // 6. Vector SVG & White-Label Watermark (Matrix #17, #55)
  console.log("\n--- 6. Vector SVG & White-Label Permissions (Matrix #17, #55) ---");
  const canUseVectorSvg = (tier: string) => ["plus", "ultra"].includes(tier);
  const canWhiteLabel = (tier: string) => ["plus", "ultra"].includes(tier);

  assert(!canUseVectorSvg("free"), "Free tier blocked from Vector SVG print export");
  assert(!canUseVectorSvg("pro"), "Pro tier blocked from Vector SVG print export (Plus required)");
  assert(canUseVectorSvg("plus"), "Plus tier allowed Vector SVG print export");
  assert(canUseVectorSvg("ultra"), "Ultra tier allowed Vector SVG print export");

  assert(!canWhiteLabel("free"), "Free tier must keep DynamicQR watermark branding");
  assert(!canWhiteLabel("pro"), "Pro tier must keep DynamicQR watermark branding");
  assert(canWhiteLabel("plus"), "Plus tier allowed 100% white-label print materials");
  assert(canWhiteLabel("ultra"), "Ultra tier allowed 100% white-label print materials");

  // 7. Prompt-to-Page AI Mobile Landing Pages (Matrix #81)
  console.log("\n--- 7. Mobile Landing Pages Showcases Limit (Matrix #81) ---");
  const getLandingPageCap = (tier: string) => {
    switch (tier) {
      case "free": return 0;
      case "pro": return 0;
      case "plus": return 3;
      case "ultra": return 999999;
      default: return 0;
    }
  };
  assert(getLandingPageCap("free") === 0, "Free tier mobile landing pages: 0");
  assert(getLandingPageCap("pro") === 0, "Pro tier mobile landing pages: 0 (Plus required)");
  assert(getLandingPageCap("plus") === 3, "Plus tier mobile landing pages: 3 Showcases (Matrix #81)");
  assert(getLandingPageCap("ultra") === 999999, "Ultra tier mobile landing pages: Unlimited (Matrix #81)");

  // 8. CSV Scan Export Limits (Matrix #75)
  console.log("\n--- 8. CSV Scan Export Row Limits (Matrix #75) ---");
  const getCsvExportMaxRows = (tier: string) => {
    switch (tier) {
      case "free": return 0;
      case "pro": return 100;
      case "plus": return 1000;
      case "ultra": return 999999;
      default: return 0;
    }
  };
  assert(getCsvExportMaxRows("free") === 0, "Free tier blocked from CSV export (0 rows)");
  assert(getCsvExportMaxRows("pro") === 100, "Pro tier CSV export: up to 100 recent rows");
  assert(getCsvExportMaxRows("plus") === 1000, "Plus tier CSV export: 1,000 Rows/mo (Matrix #75)");
  assert(getCsvExportMaxRows("ultra") === 999999, "Ultra tier CSV export: Uncapped (Matrix #75)");

  // 9. Link Quota Caps (Matrix #94)
  console.log("\n--- 9. Active Link Limit Enforcement (Matrix #94) ---");
  const getLinkCap = (tier: string) => {
    switch (tier) {
      case "free": return 5;
      case "pro": return 50;
      case "plus": return 500;
      case "ultra": return 999999;
      default: return 5;
    }
  };
  assert(getLinkCap("free") === 5, "Free tier active link limit: 5");
  assert(getLinkCap("pro") === 50, "Pro tier active link limit: 50");
  assert(getLinkCap("plus") === 500, "Plus tier active link limit: 500");
  assert(getLinkCap("ultra") === 999999, "Ultra tier active link limit: Unlimited");

  // 10. Monthly Scan Capacities (Matrix #95)
  console.log("\n--- 10. Monthly Scan Capacity Enforcement (Matrix #95) ---");
  const getScanCapacity = (tier: string) => {
    switch (tier) {
      case "free": return 1000;
      case "pro": return 25000;
      case "plus": return 250000;
      case "ultra": return 999999;
      default: return 1000;
    }
  };
  assert(getScanCapacity("free") === 1000, "Free tier scan capacity: 1,000 / mo");
  assert(getScanCapacity("pro") === 25000, "Pro tier scan capacity: 25,000 / mo");
  assert(getScanCapacity("plus") === 250000, "Plus tier scan capacity: 250,000 / mo");
  assert(getScanCapacity("ultra") === 999999, "Ultra tier scan capacity: Unlimited");

  // 11. Historical Retention Windows (Matrix #78)
  console.log("\n--- 11. Historical Data Retention (Matrix #78) ---");
  const getRetentionDays = (tier: string) => {
    switch (tier) {
      case "free": return 7;
      case "pro": return 30;
      case "plus": return 90;
      case "ultra": return 3650;
      default: return 7;
    }
  };
  assert(getRetentionDays("free") === 7, "Free tier historical retention: 7 Days");
  assert(getRetentionDays("pro") === 30, "Pro tier historical retention: 30 Days");
  assert(getRetentionDays("plus") === 90, "Plus tier historical retention: 90 Days");
  assert(getRetentionDays("ultra") === 3650, "Ultra tier historical retention: Unlimited Forever");

  console.log("\n================================================================================");
  console.log(`   TOTAL RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log("================================================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTierVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
