import { NextRequest } from 'next/server';
import { GET } from '../app/id/[shortCode]/route';
import { prisma } from '../lib/prisma';
import { hashIp } from '../lib/telemetry/trackVisit';
import {
  adminGetSystemConfig,
  adminSaveSystemConfig,
  adminUpdateUserTier,
  adminInspectUserLinks,
  adminForceVerifyDomain,
  adminResetAiCredit,
} from '../app/admin/actions';
import crypto from 'crypto';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  details: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(id: number, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ id, name, passed: true, details: 'OK', durationMs });
    console.log(`[PASS] Test ${id.toString().padStart(2, '0')}: ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ id, name, passed: false, details: err.message || String(err), durationMs });
    console.error(`[FAIL] Test ${id.toString().padStart(2, '0')}: ${name} (${durationMs}ms)`);
    console.error(`       Error:`, err.message || err);
  }
}

function assert(condition: any, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('SUBAGENT 2: SECURITY & LINK PROTECTION VERIFICATION SUITE');
  console.log('='.repeat(80));

  const runId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const createdLinkIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // Setup Shared Test Link
    // -------------------------------------------------------------------------
    const testShortCode1 = `${runId}-bot`;
    const destination1 = 'https://example.com/target-1';
    const link1 = await prisma.qrLink.create({
      data: {
        shortCode: testShortCode1,
        destinationUrl: destination1,
        label: 'Bot Filter & Scan Count Verification',
        scanCount: 0,
        isArchived: false,
      },
    });
    createdLinkIds.push(link1.id);

    // -------------------------------------------------------------------------
    // Test 1: Bot filtering: header `purpose: prefetch` is detected and scan counting is suppressed
    // -------------------------------------------------------------------------
    await runTest(1, 'Bot filtering: header `purpose: prefetch` suppressed', async () => {
      const req = new NextRequest(`http://localhost:3000/id/${testShortCode1}`, {
        headers: { purpose: 'prefetch' },
      });
      const res = await GET(req, { params: { shortCode: testShortCode1 } });

      assert(res.status === 307, `Expected status 307, got ${res.status}`);
      assert(res.headers.get('location') === destination1, `Expected redirect to destination1`);

      const updated = await prisma.qrLink.findUnique({ where: { id: link1.id } });
      const scansCount = await prisma.scan.count({ where: { qrLinkId: link1.id } });

      assert(updated?.scanCount === 0, `Expected scanCount 0, got ${updated?.scanCount}`);
      assert(scansCount === 0, `Expected 0 scan records, got ${scansCount}`);
    });

    // -------------------------------------------------------------------------
    // Test 2: Bot filtering: header `sec-purpose: prefetch` is suppressed
    // -------------------------------------------------------------------------
    await runTest(2, 'Bot filtering: header `sec-purpose: prefetch` suppressed', async () => {
      const req = new NextRequest(`http://localhost:3000/id/${testShortCode1}`, {
        headers: { 'sec-purpose': 'prefetch' },
      });
      const res = await GET(req, { params: { shortCode: testShortCode1 } });

      assert(res.status === 307, `Expected status 307, got ${res.status}`);
      const updated = await prisma.qrLink.findUnique({ where: { id: link1.id } });
      const scansCount = await prisma.scan.count({ where: { qrLinkId: link1.id } });

      assert(updated?.scanCount === 0, `Expected scanCount 0, got ${updated?.scanCount}`);
      assert(scansCount === 0, `Expected 0 scan records, got ${scansCount}`);
    });

    // -------------------------------------------------------------------------
    // Test 3: Bot filtering: header `x-purpose: preview` is suppressed
    // -------------------------------------------------------------------------
    await runTest(3, 'Bot filtering: header `x-purpose: preview` suppressed', async () => {
      const req = new NextRequest(`http://localhost:3000/id/${testShortCode1}`, {
        headers: { 'x-purpose': 'preview' },
      });
      const res = await GET(req, { params: { shortCode: testShortCode1 } });

      assert(res.status === 307, `Expected status 307, got ${res.status}`);
      const updated = await prisma.qrLink.findUnique({ where: { id: link1.id } });
      const scansCount = await prisma.scan.count({ where: { qrLinkId: link1.id } });

      assert(updated?.scanCount === 0, `Expected scanCount 0, got ${updated?.scanCount}`);
      assert(scansCount === 0, `Expected 0 scan records, got ${scansCount}`);
    });

    // -------------------------------------------------------------------------
    // Test 4: Bot filtering: header `x-moz: prefetch` is suppressed
    // -------------------------------------------------------------------------
    await runTest(4, 'Bot filtering: header `x-moz: prefetch` suppressed', async () => {
      const req = new NextRequest(`http://localhost:3000/id/${testShortCode1}`, {
        headers: { 'x-moz': 'prefetch' },
      });
      const res = await GET(req, { params: { shortCode: testShortCode1 } });

      assert(res.status === 307, `Expected status 307, got ${res.status}`);
      const updated = await prisma.qrLink.findUnique({ where: { id: link1.id } });
      const scansCount = await prisma.scan.count({ where: { qrLinkId: link1.id } });

      assert(updated?.scanCount === 0, `Expected scanCount 0, got ${updated?.scanCount}`);
      assert(scansCount === 0, `Expected 0 scan records, got ${scansCount}`);
    });

    // -------------------------------------------------------------------------
    // Test 5: Camera background prefetch suppression leaves scanCount untouched
    // -------------------------------------------------------------------------
    await runTest(5, 'Camera background prefetch suppression leaves scanCount untouched', async () => {
      // Simulate sequential camera app scanner background requests (e.g. iOS/Android camera preview)
      const headersList = [
        { purpose: 'prefetch' },
        { 'sec-purpose': 'prefetch' },
        { 'x-purpose': 'preview' },
        { 'x-moz': 'prefetch' },
        { purpose: 'Prefetch', 'x-purpose': 'preview' },
      ];

      for (const h of headersList) {
        const req = new NextRequest(`http://localhost:3000/id/${testShortCode1}`, { headers: h });
        await GET(req, { params: { shortCode: testShortCode1 } });
      }

      const check = await prisma.qrLink.findUnique({ where: { id: link1.id } });
      assert(check?.scanCount === 0, `Expected scanCount to remain 0 after 5 prefetch requests, got ${check?.scanCount}`);
      assert(check?.lastScannedAt === null, `Expected lastScannedAt to remain null`);
    });

    // -------------------------------------------------------------------------
    // Test 6: Valid scan increments `scanCount` by 1 and updates `lastScannedAt`
    // -------------------------------------------------------------------------
    await runTest(6, 'Valid scan increments `scanCount` by 1 and updates `lastScannedAt`', async () => {
      const beforeTime = new Date(Date.now() - 1000);
      const req = new NextRequest(`http://localhost:3000/id/${testShortCode1}`, {
        headers: {
          'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        },
      });

      const res = await GET(req, { params: { shortCode: testShortCode1 } });
      assert(res.status === 307, `Expected status 307`);

      const updated = await prisma.qrLink.findUnique({ where: { id: link1.id } });
      assert(updated?.scanCount === 1, `Expected scanCount 1, got ${updated?.scanCount}`);
      assert(updated?.lastScannedAt !== null, `Expected lastScannedAt to be set`);
      assert(
        updated!.lastScannedAt!.getTime() >= beforeTime.getTime(),
        `Expected lastScannedAt to be >= beforeTime`
      );
    });

    // -------------------------------------------------------------------------
    // Test 7: GDPR/CCPA 1-way IP hash: uses sha256 to hash IP with date salt, non-reversible
    // -------------------------------------------------------------------------
    await runTest(7, 'GDPR/CCPA 1-way IP hash: uses sha256 to hash IP with date salt, non-reversible', async () => {
      const ip = '198.51.100.42';
      const date = '2026-11-08';
      const hash = hashIp(ip, date);

      assert(typeof hash === 'string', 'Expected hash to be a string');
      assert(hash.length === 16, `Expected hash length 16, got ${hash.length}`);
      assert(/^[0-9a-f]{16}$/.test(hash), 'Expected hex string format');

      // Verify mathematical match with sha256
      const secret = process.env.AUTH_SECRET || 'qr-salt';
      const expected = crypto.createHash('sha256').update(`${ip}-${date}-${secret}`).digest('hex').slice(0, 16);
      assert(hash === expected, `Expected hash to match SHA-256 standard with date salt`);

      // Verify non-reversibility: hash cannot expose original IP
      assert(!hash.includes(ip), 'Hash must not contain plain IP');
    });

    // -------------------------------------------------------------------------
    // Test 8: GDPR/CCPA IP hash consistency: same IP on same day yields same hash
    // -------------------------------------------------------------------------
    await runTest(8, 'GDPR/CCPA IP hash consistency: same IP on same day yields same hash', async () => {
      const ip = '192.0.2.1';
      const date = '2026-11-08';

      const h1 = hashIp(ip, date);
      const h2 = hashIp(ip, date);
      const h3 = hashIp(ip, new Date('2026-11-08T14:30:00Z'));

      assert(h1 === h2, `Expected h1 === h2 (${h1} !== ${h2})`);
      assert(h1 === h3, `Expected h1 === h3 (${h1} !== ${h3})`);
    });

    // -------------------------------------------------------------------------
    // Test 9: GDPR/CCPA IP hash daily rotation: different date yields different hash
    // -------------------------------------------------------------------------
    await runTest(9, 'GDPR/CCPA IP hash daily rotation: different date yields different hash', async () => {
      const ip = '192.0.2.1';
      const day1 = '2026-11-08';
      const day2 = '2026-11-09';
      const day3 = '2026-11-10';

      const h1 = hashIp(ip, day1);
      const h2 = hashIp(ip, day2);
      const h3 = hashIp(ip, day3);

      assert(h1 !== h2, `Daily rotation failed: h1 (${h1}) === h2 (${h2})`);
      assert(h2 !== h3, `Daily rotation failed: h2 (${h2}) === h3 (${h3})`);
      assert(h1 !== h3, `Daily rotation failed: h1 (${h1}) === h3 (${h3})`);
    });

    // -------------------------------------------------------------------------
    // Test 10: Paused / Archived link check: `isArchived: true` redirects to `/inactive`
    // -------------------------------------------------------------------------
    const testShortCodeArchived = `${runId}-archived`;
    const linkArchived = await prisma.qrLink.create({
      data: {
        shortCode: testShortCodeArchived,
        destinationUrl: 'https://example.com/target-archived',
        isArchived: true,
      },
    });
    createdLinkIds.push(linkArchived.id);

    await runTest(10, 'Paused / Archived link check: `isArchived: true` redirects to `/inactive`', async () => {
      const req = new NextRequest(`http://localhost:3000/id/${testShortCodeArchived}`);
      const res = await GET(req, { params: { shortCode: testShortCodeArchived } });

      assert(res.status === 307, `Expected status 307, got ${res.status}`);
      const loc = res.headers.get('location') || '';
      assert(loc.endsWith('/inactive'), `Expected redirect to /inactive, got: ${loc}`);
    });

    // -------------------------------------------------------------------------
    // Test 11: Unarchived link: `isArchived: false` proceeds with routing
    // -------------------------------------------------------------------------
    await runTest(11, 'Unarchived link: `isArchived: false` proceeds with routing', async () => {
      await prisma.qrLink.update({
        where: { id: linkArchived.id },
        data: { isArchived: false },
      });

      const req = new NextRequest(`http://localhost:3000/id/${testShortCodeArchived}`);
      const res = await GET(req, { params: { shortCode: testShortCodeArchived } });

      assert(res.status === 307, `Expected status 307, got ${res.status}`);
      const loc = res.headers.get('location') || '';
      assert(loc === 'https://example.com/target-archived', `Expected redirect to destination, got: ${loc}`);
    });

    // -------------------------------------------------------------------------
    // Test 12: ShortCode sanitization: handles URL-encoded characters (%20, uppercase, trim)
    // -------------------------------------------------------------------------
    const cleanCode = `${runId}-clean`;
    const linkClean = await prisma.qrLink.create({
      data: {
        shortCode: cleanCode,
        destinationUrl: 'https://example.com/clean-target',
      },
    });
    createdLinkIds.push(linkClean.id);

    await runTest(12, 'ShortCode sanitization: handles URL-encoded characters, uppercase, trim', async () => {
      const rawWithSpacesAndCaps = `%20%20${cleanCode.toUpperCase()}%20%20`;
      const req = new NextRequest(`http://localhost:3000/id/${rawWithSpacesAndCaps}`);
      const res = await GET(req, { params: { shortCode: rawWithSpacesAndCaps } });

      assert(res.status === 307, `Expected status 307, got ${res.status}`);
      const loc = res.headers.get('location') || '';
      assert(loc === 'https://example.com/clean-target', `Expected clean-target redirect, got: ${loc}`);
    });

    // -------------------------------------------------------------------------
    // Test 13: ShortCode missing or not found redirects to `/not-found`
    // -------------------------------------------------------------------------
    await runTest(13, 'ShortCode missing or not found redirects to `/not-found`', async () => {
      const reqNotFound = new NextRequest(`http://localhost:3000/id/non-existent-code-${Date.now()}`);
      const resNotFound = await GET(reqNotFound, { params: { shortCode: `non-existent-code-${Date.now()}` } });

      assert(resNotFound.status === 307, `Expected status 307, got ${resNotFound.status}`);
      const loc = resNotFound.headers.get('location') || '';
      assert(loc.endsWith('/not-found'), `Expected redirect to /not-found, got: ${loc}`);

      // Also test missing param
      const reqEmpty = new NextRequest(`http://localhost:3000/id/`);
      const resEmpty = await GET(reqEmpty, { params: { shortCode: '' } });
      assert((resEmpty.headers.get('location') || '').endsWith('/not-found'), `Empty code must redirect to /not-found`);
    });

    // -------------------------------------------------------------------------
    // Test 14: Scan record creation: accurately logs device, country, city, userAgent (max 500), referrer (max 500)
    // -------------------------------------------------------------------------
    const testScanCode = `${runId}-scan-meta`;
    const linkScanMeta = await prisma.qrLink.create({
      data: {
        shortCode: testScanCode,
        destinationUrl: 'https://example.com/meta-destination',
      },
    });
    createdLinkIds.push(linkScanMeta.id);

    await runTest(14, 'Scan record creation: logs device, country, city, userAgent (<=500), referrer (<=500)', async () => {
      const longUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' + 'X'.repeat(800);
      const longRef = 'https://socialmedia.com/campaign/promo?' + 'param=value&'.repeat(80);

      const req = new NextRequest(`http://localhost:3000/id/${testScanCode}`, {
        headers: {
          'user-agent': longUA,
          referer: longRef,
          'x-vercel-ip-country': 'NG',
          'x-vercel-ip-city': 'Lagos',
        },
      });

      const res = await GET(req, { params: { shortCode: testScanCode } });
      assert(res.status === 307, `Expected status 307`);

      const scan = await prisma.scan.findFirst({
        where: { qrLinkId: linkScanMeta.id },
        orderBy: { scannedAt: 'desc' },
      });

      assert(scan !== null, 'Scan record should have been created');
      assert(scan?.device === 'ios', `Expected device 'ios', got '${scan?.device}'`);
      assert(scan?.country === 'NG', `Expected country 'NG', got '${scan?.country}'`);
      assert(scan?.city === 'Lagos', `Expected city 'Lagos', got '${scan?.city}'`);
      assert(scan?.userAgent?.length! <= 500, `UserAgent must be truncated to <= 500 chars (was ${scan?.userAgent?.length})`);
      assert(scan?.referrer?.length! <= 500, `Referrer must be truncated to <= 500 chars (was ${scan?.referrer?.length})`);
      assert(scan?.userAgent === longUA.slice(0, 500), 'UserAgent prefix should match slice(0, 500)');
      assert(scan?.referrer === longRef.slice(0, 500), 'Referrer prefix should match slice(0, 500)');
    });

    // -------------------------------------------------------------------------
    // Test 15: Rule attribution: `ruleFiredId` is logged in the `Scan` record when a rule matches
    // -------------------------------------------------------------------------
    const testRuleCode = `${runId}-rule-attr`;
    const linkWithRule = await prisma.qrLink.create({
      data: {
        shortCode: testRuleCode,
        destinationUrl: 'https://example.com/default-fallback',
        routingRules: {
          create: [
            {
              priority: 10,
              destination: 'https://android.example.com/play-store',
              conditions: [{ type: 'device', value: 'android' }],
              label: 'Android Target Rule',
            },
            {
              priority: 5,
              destination: 'https://ios.example.com/app-store',
              conditions: [{ type: 'device', value: 'ios' }],
              label: 'iOS Target Rule',
            },
          ],
        },
      },
      include: { routingRules: true },
    });
    createdLinkIds.push(linkWithRule.id);

    const androidRule = linkWithRule.routingRules.find((r) => r.destination.includes('android'))!;

    await runTest(15, 'Rule attribution: `ruleFiredId` is logged in Scan record when a rule matches', async () => {
      const androidUA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
      const req = new NextRequest(`http://localhost:3000/id/${testRuleCode}`, {
        headers: { 'user-agent': androidUA },
      });

      const res = await GET(req, { params: { shortCode: testRuleCode } });
      assert(res.status === 307, `Expected status 307`);
      assert(
        res.headers.get('location') === 'https://android.example.com/play-store',
        `Expected redirect to Android destination`
      );

      const scan = await prisma.scan.findFirst({
        where: { qrLinkId: linkWithRule.id, device: 'android' },
        orderBy: { scannedAt: 'desc' },
      });

      assert(scan !== null, 'Scan record must exist');
      assert(scan?.ruleFiredId === androidRule.id, `Expected ruleFiredId to match androidRule.id (${androidRule.id}), got: ${scan?.ruleFiredId}`);
    });

    // -------------------------------------------------------------------------
    // Test 16: Default redirect: `ruleFiredId` is null when fallback destination is taken
    // -------------------------------------------------------------------------
    await runTest(16, 'Default redirect: `ruleFiredId` is null when fallback destination is taken', async () => {
      const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';
      const req = new NextRequest(`http://localhost:3000/id/${testRuleCode}`, {
        headers: { 'user-agent': desktopUA },
      });

      const res = await GET(req, { params: { shortCode: testRuleCode } });
      assert(res.status === 307, `Expected status 307`);
      assert(
        res.headers.get('location') === 'https://example.com/default-fallback',
        `Expected redirect to fallback destination`
      );

      const scan = await prisma.scan.findFirst({
        where: { qrLinkId: linkWithRule.id, device: 'desktop' },
        orderBy: { scannedAt: 'desc' },
      });

      assert(scan !== null, 'Scan record must exist');
      assert(scan?.ruleFiredId === null, `Expected ruleFiredId to be null for fallback scan, got: ${scan?.ruleFiredId}`);
    });

    // -------------------------------------------------------------------------
    // Test 17: Landing page precedence: when `link.type === 'landing-page'` and published, routes to `/page/[shortCode]`
    // -------------------------------------------------------------------------
    const testLandingCode = `${runId}-landing`;
    const linkLanding = await prisma.qrLink.create({
      data: {
        shortCode: testLandingCode,
        destinationUrl: 'https://example.com/should-be-overridden',
        type: 'landing-page',
        landingPage: {
          create: {
            published: true,
            spec: { theme: 'dark', blocks: [] },
          },
        },
      },
    });
    createdLinkIds.push(linkLanding.id);

    await runTest(17, 'Landing page precedence: routes to `/page/[shortCode]` when published', async () => {
      const req = new NextRequest(`http://localhost:3000/id/${testLandingCode}`);
      const res = await GET(req, { params: { shortCode: testLandingCode } });

      assert(res.status === 307, `Expected status 307, got ${res.status}`);
      const loc = res.headers.get('location') || '';
      assert(
        loc.includes(`/page/${testLandingCode}`),
        `Expected redirect to /page/${testLandingCode}, got: ${loc}`
      );
    });

    // -------------------------------------------------------------------------
    // Test 18: HTTP 307 redirect status: ensures edge redirect does not cache permanently
    // -------------------------------------------------------------------------
    await runTest(18, 'HTTP 307 redirect status: strict no-cache headers allow dynamic target switching', async () => {
      const req = new NextRequest(`http://localhost:3000/id/${testShortCode1}`);
      const res = await GET(req, { params: { shortCode: testShortCode1 } });

      assert(res.status === 307, `Status must be 307 Temporary Redirect, got ${res.status}`);
      const cc = res.headers.get('cache-control');
      assert(cc !== null && cc.includes('no-store'), `Cache-Control must contain no-store, got: ${cc}`);
      assert(cc!.includes('no-cache'), `Cache-Control must contain no-cache, got: ${cc}`);
      assert(cc!.includes('max-age=0'), `Cache-Control must contain max-age=0, got: ${cc}`);
      assert(res.headers.get('pragma') === 'no-cache', `Pragma header must be no-cache`);
      assert(res.headers.get('expires') === '0', `Expires header must be 0`);
      assert(res.headers.get('surrogate-control') === 'no-store', `Surrogate-Control must be no-store`);
    });

    // -------------------------------------------------------------------------
    // Test 19: Admin security isolation: non-admin users cannot access super-admin endpoints
    // -------------------------------------------------------------------------
    await runTest(19, 'Admin security isolation: non-admin users cannot access super-admin endpoints', async () => {
      // In server environment without an active admin session, verify that calling admin server actions throws an error
      let caught1 = false;
      try {
        await adminGetSystemConfig();
      } catch (err: any) {
        caught1 = true;
        assert(
          err.message.includes('Unauthorized') || err.message.includes('Super-Admin'),
          `Expected unauthorized error message, got: ${err.message}`
        );
      }
      assert(caught1, 'adminGetSystemConfig should throw when unauthenticated');

      let caught2 = false;
      try {
        await adminSaveSystemConfig({ maintenanceMode: true });
      } catch (err: any) {
        caught2 = true;
        assert(
          err.message.includes('Unauthorized') || err.message.includes('Super-Admin'),
          `Expected unauthorized error, got: ${err.message}`
        );
      }
      assert(caught2, 'adminSaveSystemConfig should throw when unauthenticated');

      let caught3 = false;
      try {
        await adminUpdateUserTier('fake-user-id', 'ultra');
      } catch (err: any) {
        caught3 = true;
        assert(
          err.message.includes('Unauthorized') || err.message.includes('Super-Admin'),
          `Expected unauthorized error, got: ${err.message}`
        );
      }
      assert(caught3, 'adminUpdateUserTier should throw when unauthenticated');

      let caught4 = false;
      try {
        await adminInspectUserLinks('fake-user-id');
      } catch (err: any) {
        caught4 = true;
        assert(
          err.message.includes('Unauthorized') || err.message.includes('Super-Admin'),
          `Expected unauthorized error, got: ${err.message}`
        );
      }
      assert(caught4, 'adminInspectUserLinks should throw when unauthenticated');
    });

    // -------------------------------------------------------------------------
    // Test 20: Database cascade: deleting a QrLink cascades and deletes associated scans and routingRules cleanly
    // -------------------------------------------------------------------------
    await runTest(20, 'Database cascade: deleting a QrLink cascades and deletes scans and routingRules cleanly', async () => {
      const cascadeShortCode = `${runId}-cascade`;
      const linkToCascade = await prisma.qrLink.create({
        data: {
          shortCode: cascadeShortCode,
          destinationUrl: 'https://example.com/cascade-target',
          routingRules: {
            create: [
              { priority: 1, destination: 'https://sub1.example.com', conditions: [{ type: 'device', value: 'desktop' }] },
              { priority: 2, destination: 'https://sub2.example.com', conditions: [{ type: 'country', value: 'US' }] },
            ],
          },
          scans: {
            create: [
              { device: 'ios', country: 'US', city: 'New York' },
              { device: 'android', country: 'UK', city: 'London' },
              { device: 'desktop', country: 'CA', city: 'Toronto' },
            ],
          },
        },
      });

      const linkId = linkToCascade.id;

      // Assert children exist before delete
      const rulesBefore = await prisma.routingRule.count({ where: { qrLinkId: linkId } });
      const scansBefore = await prisma.scan.count({ where: { qrLinkId: linkId } });
      assert(rulesBefore === 2, `Expected 2 routingRules before delete, got ${rulesBefore}`);
      assert(scansBefore === 3, `Expected 3 scans before delete, got ${scansBefore}`);

      // Delete parent QrLink
      await prisma.qrLink.delete({ where: { id: linkId } });

      // Verify cascade deletion
      const rulesAfter = await prisma.routingRule.count({ where: { qrLinkId: linkId } });
      const scansAfter = await prisma.scan.count({ where: { qrLinkId: linkId } });

      assert(rulesAfter === 0, `Expected 0 routingRules after cascade delete, got ${rulesAfter}`);
      assert(scansAfter === 0, `Expected 0 scans after cascade delete, got ${scansAfter}`);
    });

  } finally {
    // -------------------------------------------------------------------------
    // Cleanup Created Test Records
    // -------------------------------------------------------------------------
    console.log('\nCleaning up created test records...');
    for (const id of createdLinkIds) {
      try {
        await prisma.qrLink.delete({ where: { id } }).catch(() => {});
      } catch (e) {}
    }
  }

  // ---------------------------------------------------------------------------
  // Summary Report
  // ---------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log('SECURITY & LINK PROTECTION VERIFICATION RESULTS');
  console.log('='.repeat(80));

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  for (const r of results) {
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`[${status}] #${r.id.toString().padStart(2, '0')}: ${r.name} (${r.durationMs}ms)`);
    if (!r.passed) {
      console.log(`       Reason: ${r.details}`);
    }
  }

  console.log('-'.repeat(80));
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`SUCCESS RATE: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
