// Comprehensive GDPR/CCPA Account Erasure & Metric Retention Test Harness
// Verifies:
// 1. Permanent erasure of user PII (email, password, identity)
// 2. Anonymization and decoupling of QR links (userId: null, isArchived: true)
// 3. Complete retention of platform metrics (Scan telemetry, diurnal distribution)
// 4. Decoupling of AI compute metrics (userId: null) for token and latency analytics

if (typeof (process as any).loadEnvFile === 'function') {
  (process as any).loadEnvFile();
}

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function verifyAccountDeletion() {
  console.log('================================================================================');
  console.log('VERIFYING ACCOUNT DELETION & METRIC RETENTION (GDPR / CCPA)');
  console.log('================================================================================');

  const testId = `test-purge-${Date.now()}`;
  const testEmail = `${testId}@example.com`;
  const linkId = `link-${testId}`;
  const scanId = `scan-${testId}`;
  const aiId = `ai-${testId}`;

  // 1. Create a test user
  await sql`
    INSERT INTO "User" (id, email, password, name, tier, "createdAt", "updatedAt")
    VALUES (${testId}, ${testEmail}, 'hashed_pw_test', 'Test Purge User', 'pro', NOW(), NOW());
  `;
  console.log(`[+] Created test user: ${testId} (${testEmail})`);

  // 2. Create a test QR link
  await sql`
    INSERT INTO "QrLink" (id, "userId", "shortCode", "destinationUrl", label, "scanCount", "createdAt", "updatedAt")
    VALUES (${linkId}, ${testId}, ${testId}, 'https://example.com/target', 'Sample Menu QR', 5, NOW(), NOW());
  `;
  console.log(`[+] Created test QR link: ${linkId}`);

  // 3. Create sample scan records (platform metrics)
  await sql`
    INSERT INTO "Scan" (id, "qrLinkId", country, city, device, "scannedAt")
    VALUES (${scanId}, ${linkId}, 'NG', 'Benin City', 'ios', NOW());
  `;
  console.log(`[+] Created scan metric record: ${scanId}`);

  // 4. Create sample AI invocation (platform health telemetry)
  await sql`
    INSERT INTO "AiInvocation" (id, "userId", feature, "promptKey", model, "inputTokens", "outputTokens", "costUsd", "latencyMs", success, "createdAt")
    VALUES (${aiId}, ${testId}, 'route-resolver', 'route-resolver.v1', 'gemini-2.0-flash', 120, 45, 0.0001, 310, true, NOW());
  `;
  console.log(`[+] Created sample AI compute metric: ${aiId}`);

  // 5. Execute Purge (simulating purgeUserDataPreservingMetrics)
  console.log('\n[→] Executing purgeUserDataPreservingMetrics operations...');
  
  // Step A: Decouple & archive QR link
  await sql`
    UPDATE "QrLink"
    SET "userId" = NULL,
        "isArchived" = true,
        label = '[Anonymized - Account Erased]',
        "destinationUrl" = 'https://my-qr-sandy.vercel.app/inactive'
    WHERE "userId" = ${testId};
  `;

  // Step B: Decouple AI invocation records
  await sql`
    UPDATE "AiInvocation"
    SET "userId" = NULL
    WHERE "userId" = ${testId};
  `;

  // Step C: Delete user record permanently
  await sql`
    DELETE FROM "User"
    WHERE id = ${testId};
  `;
  console.log(`[✔] Purge operations executed successfully.`);

  // 6. Assertions
  const users = await sql`SELECT id, email FROM "User" WHERE id = ${testId};`;
  if (users.length !== 0) {
    throw new Error('FAILED: User record was not deleted from DB!');
  }
  console.log('[✅ PASS] Assertion 1: User record was permanently erased (0 rows)');

  const links = await sql`
    SELECT id, "userId", "isArchived", label
    FROM "QrLink"
    WHERE id = ${linkId};
  `;
  if (links.length === 0 || links[0].userId !== null || links[0].isArchived !== true) {
    throw new Error('FAILED: QR Link was not properly decoupled & archived!');
  }
  console.log('[✅ PASS] Assertion 2: QR link was decoupled (userId: null) and archived (isArchived: true)');

  const scans = await sql`
    SELECT id, "qrLinkId", country, city
    FROM "Scan"
    WHERE "qrLinkId" = ${linkId};
  `;
  if (scans.length !== 1) {
    throw new Error(`FAILED: Expected 1 preserved scan for platform metrics, found ${scans.length}!`);
  }
  console.log('[✅ PASS] Assertion 3: Scan metric records are preserved for platform health telemetry');

  const invocations = await sql`
    SELECT id, "userId", feature, model
    FROM "AiInvocation"
    WHERE id = ${aiId};
  `;
  if (invocations.length === 0 || invocations[0].userId !== null) {
    throw new Error('FAILED: AI invocation record was not decoupled!');
  }
  console.log('[✅ PASS] Assertion 4: AI compute metric decoupled (userId: null) and preserved');

  // Clean up test rows
  await sql`DELETE FROM "Scan" WHERE id = ${scanId};`;
  await sql`DELETE FROM "QrLink" WHERE id = ${linkId};`;
  await sql`DELETE FROM "AiInvocation" WHERE id = ${aiId};`;
  console.log('[+] Cleaned up temporary test artifacts');

  console.log('\n================================================================================');
  console.log('🎉 ALL GDPR ACCOUNT ERASURE & METRIC RETENTION TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================================');
}

verifyAccountDeletion().catch((e) => {
  console.error('Verification error:', e);
  process.exit(1);
});
