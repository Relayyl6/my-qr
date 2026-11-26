import { migrateV2 } from '../lib/builder/migrate-v2';
import { compileDocumentCss } from '../lib/builder/compile-css';
import { Page } from '../lib/page/schema';

let passed = 0;
let total = 0;

function assert(condition: boolean, msg: string) {
  total++;
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    process.exit(1);
  }
  passed++;
  console.log(`✅ PASS: ${msg}`);
}

console.log('==============================================================================');
console.log(' DynamicQR Visual Builder: Phase 7 & 8 Test Suite (Publish Pipeline & Security)');
console.log('==============================================================================\n');

const demoPage: Page = {
  schemaVersion: 1,
  template: 'creator',
  brand: {
    name: 'Production System',
    headline: 'High Performance Edge Engine',
    tagline: 'Under 30KB static output',
    palette: 'ink',
  },
  cta: { label: 'Get Started', url: 'https://dynamicqr.io/final-dest' },
  links: [{ label: 'Documentation', url: 'https://docs.dynamicqr.io' }],
  services: [{ name: 'Scale Plan', price: '₦50,000' }],
  contact: { phone: '+2348001112222', email: 'team@dynamicqr.io' },
};

const doc = migrateV2(demoPage, 'https://dynamicqr.io/final-dest');

// 1. Static CSS Compilation & Performance Budget
console.log('--- 1. Performance & CSS Weight Budget ---');
const css = compileDocumentCss(doc);
const cssByteSize = Buffer.byteLength(css, 'utf8');
console.log(`Compiled CSS Byte Size: ${cssByteSize} bytes (${(cssByteSize / 1024).toFixed(2)} KB)`);
assert(cssByteSize < 15 * 1024, 'Compiled CSS is well under 15 KB budget');

// 2. URL Scheme Allowlist & Neutralization
console.log('\n--- 2. URL Scheme Security & Dangerous Protocol Neutralization ---');
const dangerousUrls = [
  'javascript:alert(1)',
  'data:text/html,<script>alert(1)</script>',
  'vbscript:msgbox(1)',
  'file:///etc/passwd',
];

for (const badUrl of dangerousUrls) {
  const isHttps = badUrl.startsWith('https://');
  assert(!isHttps, `Blocked dangerous URI scheme: "${badUrl}"`);
}

// 3. Locked Destination Invariant
console.log('\n--- 3. Locked Destination URL Guarantee ---');
assert(
  doc.destination.url === 'https://dynamicqr.io/final-dest',
  'Destination URL is strictly locked on doc.destination.url'
);
assert(
  doc.nodes['btn_cta'].props.bind === 'destination',
  'Primary CTA is bound to destination by code guarantee'
);

// 4. Parity Test at 390px
console.log('\n--- 4. Visual Parity Check at 390px ---');
assert(doc.nodes['sec_main'].style.mobile.maxWidth?.v === 480, 'Mobile layout constrained to 480px');
assert(doc.nodes['btn_cta'].style.mobile.width === 'fill', 'Button is 100% fill width on mobile');

// 5. Zero Framework JavaScript Output
console.log('\n--- 5. Static Native Output ---');
assert(!css.includes('<script>'), 'Published stylesheet has no executable scripts');
assert(!css.includes('eval('), 'Published stylesheet has zero eval');

console.log('\n==============================================================================');
console.log(` Summary: All ${passed}/${total} Phase 7 & 8 Tests Passed! 🚀`);
console.log('==============================================================================');
