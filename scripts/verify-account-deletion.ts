import { prisma } from '../lib/prisma';
import { purgeUserDataPreservingMetrics } from '../lib/user/deleteAccount';

async function verifyAccountDeletion() {
  console.log('================================================================================');
  console.log('VERIFYING ACCOUNT DELETION & METRIC RETENTION (GDPR / CCPA)');
  console.log('================================================================================');

  const testEmail = `test-purge-${Date.now()}@example.com`;

  // 1. Create a test user
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      password: 'hashed-password-sample',
      name: 'Test Deletion User',
      tier: 'pro',
    },
  });
  console.log(`[+] Created test user: ${user.id} (${user.email})`);

  // 2. Create a test QR link
  const link = await prisma.qrLink.create({
    data: {
      userId: user.id,
      shortCode: `purge-${Date.now()}`,
      destinationUrl: 'https://example.com/target',
      label: 'Sample Menu QR',
      scanCount: 5,
    },
  });
  console.log(`[+] Created test QR link: ${link.id} (/id/${link.shortCode})`);

  // 3. Create sample scan records
  await prisma.scan.createMany({
    data: [
      { qrLinkId: link.id, country: 'NG', city: 'Benin City', device: 'ios' },
      { qrLinkId: link.id, country: 'NG', city: 'Abuja', device: 'android' },
      { qrLinkId: link.id, country: 'US', city: 'New York', device: 'desktop' },
    ],
  });
  console.log('[+] Created 3 scan events for test link');

  // 4. Create sample AI invocation
  const invocation = await prisma.aiInvocation.create({
    data: {
      userId: user.id,
      feature: 'route-resolver',
      promptKey: 'route-resolver.v1',
      model: 'gemini-2.0-flash',
      inputTokens: 120,
      outputTokens: 45,
      costUsd: 0.0001,
      latencyMs: 310,
      success: true,
    },
  });
  console.log(`[+] Created sample AI invocation: ${invocation.id}`);

  // 5. Execute Purge
  console.log('\n[→] Executing purgeUserDataPreservingMetrics...');
  const result = await purgeUserDataPreservingMetrics(user.id);
  console.log(`[✔] Purge executed: deleted ${result.deletedEmail}, anonymized ${result.linksAnonymized} links`);

  // 6. Assertions
  const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (deletedUser !== null) {
    throw new Error('FAILED: User record was not deleted from DB!');
  }
  console.log('[✅ PASS] Assertion 1: User record was permanently erased');

  const decoupledLink = await prisma.qrLink.findUnique({ where: { id: link.id } });
  if (!decoupledLink || decoupledLink.userId !== null || !decoupledLink.isArchived) {
    throw new Error('FAILED: QR Link was not properly decoupled & archived!');
  }
  console.log('[✅ PASS] Assertion 2: QR link was decoupled (userId: null) and archived');

  const scansRemaining = await prisma.scan.count({ where: { qrLinkId: link.id } });
  if (scansRemaining !== 3) {
    throw new Error(`FAILED: Expected 3 preserved scans for platform metrics, found ${scansRemaining}!`);
  }
  console.log('[✅ PASS] Assertion 3: All 3 scan metric records are preserved for platform health telemetry');

  const decoupledInvocation = await prisma.aiInvocation.findUnique({ where: { id: invocation.id } });
  if (!decoupledInvocation || decoupledInvocation.userId !== null) {
    throw new Error('FAILED: AI invocation record was not decoupled!');
  }
  console.log('[✅ PASS] Assertion 4: AI compute metric decoupled (userId: null) and preserved');

  // Clean up test data
  await prisma.scan.deleteMany({ where: { qrLinkId: link.id } });
  await prisma.qrLink.delete({ where: { id: link.id } });
  await prisma.aiInvocation.delete({ where: { id: invocation.id } });
  console.log('[+] Cleaned up temporary test artifacts');

  console.log('\n🎉 ALL GDPR ACCOUNT ERASURE & METRIC RETENTION TESTS PASSED WITH 100% SUCCESS!');
}

verifyAccountDeletion().catch((e) => {
  console.error('Verification error:', e);
  process.exit(1);
});
