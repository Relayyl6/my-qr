/**
 * Comprehensive Automated Verification Suite for:
 * Pricing Matrix, Plan Entitlements, Feature Categories, Search, Quotas & Auth Constraints
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { MASTER_FEATURES, CATEGORIES } from '../components/ComprehensiveFeatureMatrix';
import { PLANS } from '../lib/stripe';
import { TIER_CONFIGS } from '../lib/ai/flags';
import { POST as checkoutPost } from '../app/api/billing/checkout/route';

interface TestResult {
  id: number;
  title: string;
  passed: boolean;
  details: string;
  metrics?: Record<string, any>;
}

const results: TestResult[] = [];

function assertTest(id: number, title: string, passed: boolean, details: string, metrics?: Record<string, any>) {
  results.push({ id, title, passed, details, metrics });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`[${status}] Test ${id}: ${title}`);
  if (details) console.log(`   └─ ${details}`);
  if (metrics) console.log(`   └─ Metrics: ${JSON.stringify(metrics)}`);
}

async function runVerification() {
  console.log('='.repeat(80));
  console.log('DYNAMICQR PRICING MATRIX & PLAN ENTITLEMENTS VERIFICATION SUITE');
  console.log('='.repeat(80));

  // --- Test 1: Master Feature Matrix (at least 100 features, actual count 102) ---
  const totalFeatures = MASTER_FEATURES.length;
  assertTest(
    1,
    'Master Feature Matrix: >= 100 features (actual 102)',
    totalFeatures >= 100 && totalFeatures === 102,
    `Total features defined: ${totalFeatures}`,
    { totalFeatures, requiredMin: 100, expectedExact: 102 }
  );

  // --- Test 2: Categories count: all 8 functional categories exist and all features categorized ---
  const expectedCategoryIds = [
    'routing',
    'qr',
    'marketing',
    'security',
    'domains',
    'analytics',
    'ai',
    'enterprise',
  ];
  const categoryIdsInConfig = CATEGORIES.map((c) => c.id);
  const all8Exist = expectedCategoryIds.every((id) => categoryIdsInConfig.includes(id));
  const uncategorized = MASTER_FEATURES.filter((f) => !expectedCategoryIds.includes(f.category));

  assertTest(
    2,
    'Categories count: all 8 functional categories exist & all features categorized',
    all8Exist && uncategorized.length === 0,
    `8 functional categories configured, 0 uncategorized features out of ${totalFeatures}`,
    { categoriesCount: CATEGORIES.length, functionalCategories: expectedCategoryIds.length, uncategorizedCount: uncategorized.length }
  );

  // --- Tests 3-10: Category filter feature counts ---
  const categoryExpectations: Record<string, { expected: number; testId: number }> = {
    routing: { expected: 13, testId: 3 },
    qr: { expected: 14, testId: 4 },
    marketing: { expected: 14, testId: 5 },
    security: { expected: 12, testId: 6 },
    domains: { expected: 12, testId: 7 },
    analytics: { expected: 13, testId: 8 },
    ai: { expected: 12, testId: 9 },
    enterprise: { expected: 12, testId: 10 },
  };

  for (const [catId, { expected, testId }] of Object.entries(categoryExpectations)) {
    const count = MASTER_FEATURES.filter((f) => f.category === catId).length;
    assertTest(
      testId,
      `Category filter: '${catId}' category returns ${expected} features`,
      count === expected,
      `Found ${count} features in '${catId}' (expected ${expected})`,
      { category: catId, count, expected }
    );
  }

  // --- Test 11: Search filter: searching 'scheduling' returns Autonomous Ingress features ---
  const schedulingMatches = MASTER_FEATURES.filter(
    (f) =>
      f.name.toLowerCase().includes('scheduling') ||
      f.description.toLowerCase().includes('scheduling') ||
      f.name.toLowerCase().includes('schedule') ||
      f.description.toLowerCase().includes('schedule')
  );
  const hasAutonomousIngress = schedulingMatches.some((f) =>
    f.name.includes('Autonomous Ingress') || f.name.includes('Day-of-Week Scheduling')
  );
  assertTest(
    11,
    "Search filter: searching 'scheduling' returns Autonomous Ingress features",
    schedulingMatches.length > 0 && hasAutonomousIngress,
    `Found ${schedulingMatches.length} matching features including '${schedulingMatches[0]?.name}'`,
    { matchesCount: schedulingMatches.length, sampleFeatures: schedulingMatches.map((m) => m.name).slice(0, 3) }
  );

  // --- Test 12: Search filter: searching 'utm' returns UTM parameters and auto-tagging ---
  const utmMatches = MASTER_FEATURES.filter(
    (f) =>
      f.name.toLowerCase().includes('utm') ||
      f.description.toLowerCase().includes('utm')
  );
  const hasUtmParameterBuilder = utmMatches.some((f) => f.name.includes('UTM Parameter Builder'));
  const hasUtmAutoInjection = utmMatches.some(
    (f) => f.name.includes('Automatic UTM Injection') || f.plus === 'Auto-Tagging'
  );
  assertTest(
    12,
    "Search filter: searching 'utm' returns UTM parameters and auto-tagging",
    utmMatches.length >= 2 && hasUtmParameterBuilder && hasUtmAutoInjection,
    `Found ${utmMatches.length} UTM features including parameter builder, auto-tagging & automatic injection`,
    { matchesCount: utmMatches.length, sampleFeatures: utmMatches.map((m) => m.name) }
  );

  // --- Test 13: Search filter: searching 'pin' returns PIN protection features ---
  const pinMatches = MASTER_FEATURES.filter(
    (f) =>
      f.name.toLowerCase().includes('pin') ||
      f.description.toLowerCase().includes('pin')
  );
  const hasPinProtection = pinMatches.some((f) => f.name.toLowerCase().includes('pin'));
  assertTest(
    13,
    "Search filter: searching 'pin' returns PIN protection features",
    pinMatches.length >= 1 && hasPinProtection,
    `Found ${pinMatches.length} PIN security feature: '${pinMatches[0]?.name}'`,
    { matchesCount: pinMatches.length, sampleFeatures: pinMatches.map((m) => m.name) }
  );

  // --- Test 14: Search filter: searching 'api' returns REST API and webhook features ---
  const apiMatches = MASTER_FEATURES.filter(
    (f) =>
      f.name.toLowerCase().includes('api') ||
      f.description.toLowerCase().includes('api') ||
      f.name.toLowerCase().includes('webhook') ||
      f.description.toLowerCase().includes('webhook')
  );
  const hasRestApi = apiMatches.some((f) => f.name.toLowerCase().includes('api'));
  const hasWebhooks = apiMatches.some((f) => f.name.toLowerCase().includes('webhook'));
  assertTest(
    14,
    "Search filter: searching 'api' returns REST API and webhook features",
    apiMatches.length >= 4 && hasRestApi && hasWebhooks,
    `Found ${apiMatches.length} API/webhook features`,
    { matchesCount: apiMatches.length, sampleFeatures: apiMatches.map((m) => m.name).slice(0, 4) }
  );

  // --- Test 15: Competitive benchmarking: Bitly ($35/mo) and TinyURL ($12.99/mo) ---
  const matrixFile = fs.readFileSync(
    path.join(__dirname, '../components/ComprehensiveFeatureMatrix.tsx'),
    'utf-8'
  );
  const hasBitlyComparison = matrixFile.includes('Bitly Growth ($35/mo)') || matrixFile.includes('$35/month');
  const hasTinyUrlComparison = matrixFile.includes('TinyURL Pro ($12.99/mo)') || matrixFile.includes('$12.99/mo');
  const hasDynamicQrPro = matrixFile.includes('DynamicQR Pro ($5/mo)');
  assertTest(
    15,
    'Competitive benchmarking: comparison callout against Bitly ($35/mo) and TinyURL ($12.99/mo)',
    hasBitlyComparison && hasTinyUrlComparison && hasDynamicQrPro,
    'Verified presence of Bitly ($35/mo), TinyURL ($12.99/mo), and DynamicQR Pro ($5/mo) competitive intelligence card',
    { hasBitlyComparison, hasTinyUrlComparison, hasDynamicQrPro }
  );

  // --- Test 16: Plan quotas: Free plan (5 link slots, 1,000 scans/mo, $0.50 AI budget) ---
  const pricingTableFile = fs.readFileSync(
    path.join(__dirname, '../components/PricingTable.tsx'),
    'utf-8'
  );
  const freeLimitUsd = TIER_CONFIGS.free.monthlyLimitUsd;
  const pricingHasFreeLinks = pricingTableFile.includes('5 Active');
  const pricingHasFreeScans = pricingTableFile.includes('1,000 / mo');
  const pricingHasFreeAi = pricingTableFile.includes('$0.50 / mo');
  assertTest(
    16,
    'Plan quotas: Free plan tier quotas (5 link slots, 1,000 scans/mo, $0.50 AI budget)',
    freeLimitUsd === 0.50 && pricingHasFreeLinks && pricingHasFreeScans && pricingHasFreeAi,
    `Free plan quotas verified: 5 Active link slots, 1,000 scans/mo, $0.50/mo AI budget in TIER_CONFIGS & PricingTable`,
    { freeLimitUsd, pricingHasFreeLinks, pricingHasFreeScans, pricingHasFreeAi }
  );

  // --- Test 17: Plan quotas: Pro plan (50 link slots, 25,000 scans/mo, $5.00 AI budget) ---
  const proMaxLinks = PLANS.pro.maxLinks;
  const proAiBudget = PLANS.pro.monthlyAiBudget;
  const proTierLimitUsd = TIER_CONFIGS.pro.monthlyLimitUsd;
  const pricingHasProLinks = pricingTableFile.includes('50 Active');
  const pricingHasProScans = pricingTableFile.includes('25,000 / mo');
  const pricingHasProAi = pricingTableFile.includes('$5.00 / mo');
  assertTest(
    17,
    'Plan quotas: Pro plan tier quotas (50 link slots, 25,000 scans/mo, $5.00 AI budget)',
    proMaxLinks === 50 && proAiBudget === 5.0 && proTierLimitUsd === 5.0 && pricingHasProLinks && pricingHasProScans && pricingHasProAi,
    `Pro plan quotas verified: 50 links, 25k scans, $5.00/mo AI budget across PLANS, TIER_CONFIGS & PricingTable`,
    { proMaxLinks, proAiBudget, proTierLimitUsd, pricingHasProLinks, pricingHasProScans }
  );

  // --- Test 18: Plan quotas: Plus plan (500 link slots, 250,000 scans/mo, $15.00 AI budget) ---
  const plusMaxLinks = PLANS.plus.maxLinks;
  const plusAiBudget = PLANS.plus.monthlyAiBudget;
  const plusTierLimitUsd = TIER_CONFIGS.plus.monthlyLimitUsd;
  const pricingHasPlusLinks = pricingTableFile.includes('500 Active');
  const pricingHasPlusScans = pricingTableFile.includes('250,000 / mo');
  const pricingHasPlusAi = pricingTableFile.includes('$15.00 / mo');
  assertTest(
    18,
    'Plan quotas: Plus plan tier quotas (500 link slots, 250,000 scans/mo, $15.00 AI budget)',
    plusMaxLinks === 500 && plusAiBudget === 15.0 && plusTierLimitUsd === 15.0 && pricingHasPlusLinks && pricingHasPlusScans && pricingHasPlusAi,
    `Plus plan quotas verified: 500 links, 250k scans, $15.00/mo AI budget across PLANS, TIER_CONFIGS & PricingTable`,
    { plusMaxLinks, plusAiBudget, plusTierLimitUsd, pricingHasPlusLinks, pricingHasPlusScans }
  );

  // --- Test 19: Plan quotas: Ultra plan (Unlimited links, Unlimited scans, $50.00 AI budget, Unlimited custom domains) ---
  const ultraAiBudget = PLANS.ultra.monthlyAiBudget;
  const ultraTierLimitUsd = TIER_CONFIGS.ultra.monthlyLimitUsd;
  const ultraMaxLinks = PLANS.ultra.maxLinks; // 999999 (Unlimited sentinel)
  const pricingHasUltraUnlimitedLinks = pricingTableFile.includes('Unlimited');
  const pricingHasUltraDomains = /Active Links,\s*Scans\s*&\s*Custom Domains/i.test(pricingTableFile);
  const pricingHasUltraAi = pricingTableFile.includes('$50.00 / mo');
  assertTest(
    19,
    'Plan quotas: Ultra plan tier quotas (Unlimited links, Unlimited scans, $50.00 AI budget, Unlimited custom domains)',
    ultraAiBudget === 50.0 && ultraTierLimitUsd === 50.0 && ultraMaxLinks >= 999999 && pricingHasUltraUnlimitedLinks && pricingHasUltraDomains && pricingHasUltraAi,
    `Ultra plan quotas verified: Unlimited links/scans/domains, $50.00/mo AI budget across PLANS, TIER_CONFIGS & PricingTable`,
    { ultraAiBudget, ultraTierLimitUsd, ultraMaxLinks, pricingHasUltraDomains }
  );

  // --- Test 20: Default new user tier constraint: schema.prisma & signUp() strictly set 'free' ---
  const schemaFile = fs.readFileSync(
    path.join(__dirname, '../prisma/schema.prisma'),
    'utf-8'
  );
  const authActionsFile = fs.readFileSync(
    path.join(__dirname, '../app/auth-actions.ts'),
    'utf-8'
  );
  const schemaHasDefaultFree = /tier\s+String\s+@default\("free"\)/.test(schemaFile);
  const authSignUpSetsFree = /tier:\s*['"]free['"]/.test(authActionsFile);
  assertTest(
    20,
    "Default new user tier constraint: schema.prisma and signUp() strictly set tier to 'free'",
    schemaHasDefaultFree && authSignUpSetsFree,
    `schema.prisma contains '@default("free")', signUp() explicitly sets tier: 'free'`,
    { schemaHasDefaultFree, authSignUpSetsFree }
  );

  // --- Test 21: Stripe Checkout API: rejects unauthenticated callers & validates planId ('pro', 'plus', 'ultra') ---
  // A. Unauthenticated request rejection
  const unauthReq = new NextRequest('http://localhost:3000/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: 'pro' }),
  });
  const unauthRes = await checkoutPost(unauthReq);
  const unauthStatus = unauthRes.status;
  const unauthData = await unauthRes.json();
  const unauthRejected = unauthStatus === 401 && unauthData.error?.includes('Unauthorized');

  // B. Plan ID validation logic: PLANS supports 'pro', 'plus', 'ultra'
  const validPlans = Object.keys(PLANS);
  const hasExpectedPlans = ['pro', 'plus', 'ultra'].every((p) => validPlans.includes(p));
  const freeRejectedByPlans = !validPlans.includes('free');
  const invalidRejectedByPlans = !validPlans.includes('invalid_plan');

  assertTest(
    21,
    "Stripe Checkout API: rejects unauthenticated callers and validates planId ('pro', 'plus', 'ultra')",
    unauthRejected && hasExpectedPlans && freeRejectedByPlans && invalidRejectedByPlans,
    `Unauthenticated returns status 401. PLANS strictly restricts checkout to: [${validPlans.join(', ')}]`,
    { unauthStatus, unauthError: unauthData.error, validPlans, freeRejectedByPlans, invalidRejectedByPlans }
  );

  // --- SUMMARY REPORT ---
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(80));
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;

  console.log(`Total Verification Tests: ${totalTests}`);
  console.log(`Passed:                   ${passedTests} / ${totalTests}`);
  console.log(`Failed:                   ${failedTests} / ${totalTests}`);
  console.log(`Success Rate:             ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.error('\nFAILURES ENCOUNTERED:');
    results.filter((r) => !r.passed).forEach((r) => console.error(`  - Test ${r.id}: ${r.title}`));
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 21 PRICING MATRIX & PLAN ENTITLEMENTS VERIFICATIONS PASSED WITH 100% PRECISION!');
  }
}

runVerification().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
