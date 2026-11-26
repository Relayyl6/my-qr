import { DocSchema, StyleSchema, canContain, NodeSchema } from '../lib/builder/schema';
import { resolveStyle, isOverridden, resetOverride } from '../lib/builder/resolve';
import { compileDocumentCss, sanitizeCssString } from '../lib/builder/compile-css';
import { migrateV2 } from '../lib/builder/migrate-v2';
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
console.log(' DynamicQR Visual Builder: Phase 1 Test Suite');
console.log('==============================================================================\n');

// 1. DocSchema & StyleSchema validation
console.log('--- 1. Schema & Allowlist Tests ---');
const validStyle = {
  display: 'flex' as const,
  direction: 'column' as const,
  gap: 16,
  padding: [10, 10, 10, 10] as [number, number, number, number],
  margin: [0, 0, 0, 0] as [number, number, number, number],
  width: 'fill' as const,
  color: 'accent',
};
const parsedStyle = StyleSchema.safeParse(validStyle);
assert(parsedStyle.success, 'StyleSchema parses valid style object');

// Strict reject unallowlisted style keys
const invalidStyle = {
  ...validStyle,
  boxSizing: 'border-box', // Not in allowlist
};
const parsedInvalid = StyleSchema.safeParse(invalidStyle);
assert(!parsedInvalid.success, 'StyleSchema rejects unallowlisted CSS property (boxSizing)');

// Negative letter-spacing floor
const badLetterSpacing = { letterSpacing: -0.05 };
assert(!StyleSchema.safeParse(badLetterSpacing).success, 'StyleSchema rejects negative letter-spacing below -0.02em');

// 2. CSS Injection Protection
console.log('\n--- 2. CSS Injection Protection Tests ---');
const injectionVectors = [
  'red; background: blue',
  'black} body { display:none }',
  'url("https://malicious.com/steal")',
  'url (javascript:alert(1))',
  'expression(alert(1))',
  '@import "evil.css"',
  '<script>alert(1)</script>',
  '\\002a',
];

for (const vector of injectionVectors) {
  let caught = false;
  try {
    sanitizeCssString(vector);
  } catch (err) {
    caught = true;
  }
  assert(caught, `sanitizeCssString blocks injection vector: "${vector}"`);
}

// 3. Containment Rules
console.log('\n--- 3. CAN_CONTAIN Table Tests ---');
assert(canContain('root', 'section'), 'Root can contain section');
assert(!canContain('root', 'button'), 'Root cannot contain button directly');
assert(canContain('section', 'stack'), 'Section can contain stack');
assert(canContain('stack', 'button'), 'Stack can contain button');
assert(canContain('grid', 'card'), 'Grid can contain card');
assert(!canContain('stack', 'section'), 'Stack cannot contain section');
assert(!canContain('button', 'text'), 'Leaf node button cannot contain children');

// 4. Style Resolution & Overrides
console.log('\n--- 4. Style Resolution & Overrides Tests ---');
const sampleNode: any = {
  id: 'test_node',
  type: 'button',
  children: [],
  parent: 'root',
  props: { label: 'Click', variant: 'primary', bind: 'destination' },
  style: {
    mobile: {
      fontSize: 16,
      width: 'fill',
      gap: 12,
    },
    tablet: {
      fontSize: 20, // override
    },
    desktop: {
      gap: 24, // override
    },
  },
};

const mobileResolved = resolveStyle(sampleNode, 'mobile');
assert(mobileResolved.fontSize === 16, 'Mobile resolved fontSize is 16');
assert(mobileResolved.gap === 12, 'Mobile resolved gap is 12');

const tabletResolved = resolveStyle(sampleNode, 'tablet');
assert(tabletResolved.fontSize === 20, 'Tablet resolved fontSize overrides mobile to 20');
assert(tabletResolved.gap === 12, 'Tablet inherits mobile gap 12');
assert(isOverridden(sampleNode, 'tablet', 'fontSize'), 'isOverridden returns true for tablet fontSize');
assert(!isOverridden(sampleNode, 'tablet', 'gap'), 'isOverridden returns false for inherited gap');

const desktopResolved = resolveStyle(sampleNode, 'desktop');
assert(desktopResolved.fontSize === 20, 'Desktop inherits tablet overridden fontSize 20');
assert(desktopResolved.gap === 24, 'Desktop resolved gap overrides to 24');

// Reset override test
resetOverride(sampleNode, 'tablet', 'fontSize');
const tabletAfterReset = resolveStyle(sampleNode, 'tablet');
assert(tabletAfterReset.fontSize === 16, 'Resetting tablet override reverts fontSize to inherited mobile 16');

// 5. Migration from V2 to V3 Doc
console.log('\n--- 5. V2 to V3 Migration Tests ---');
const v2Demo: Page = {
  schemaVersion: 1,
  template: 'creator',
  brand: {
    name: 'My Business', // Placeholder
    headline: 'Welcome to our space', // Placeholder
    tagline: 'Custom artisan crafted coffee in Lagos.',
    palette: 'ocean' as any,
  },
  cta: {
    label: 'Order on WhatsApp',
    url: 'https://whatsapp.com/sample',
  },
  links: [
    { label: 'Instagram Feed', url: 'https://instagram.com/coffee' },
  ],
  services: [
    { name: 'Core Offering', price: '₦3,000', desc: 'Direct service tailored for you.' }, // Placeholder
  ],
  contact: {
    phone: '+234 800 000 0000',
    whatsapp: '2348000000000',
  },
};

const migratedDoc = migrateV2(v2Demo, 'https://destination.com');
const docValidation = DocSchema.safeParse(migratedDoc);
assert(docValidation.success, 'migratedDoc satisfies DocSchema');

// Destination URL locked check
assert(
  migratedDoc.destination.url === 'https://whatsapp.com/sample',
  'Destination URL is strictly locked on doc.destination.url'
);

// Placeholder detection
const badgeNode = migratedDoc.nodes['bdg_brand'];
assert(badgeNode.placeholder === true, 'Placeholder detected for default brand name');

const headingNode = migratedDoc.nodes['hd_title'];
assert(headingNode.placeholder === true, 'Placeholder detected for default headline');

const ctaNode = migratedDoc.nodes['btn_cta'];
assert(ctaNode.locked === true, 'CTA Button node is marked locked: true');
assert(ctaNode.props.bind === 'destination', 'CTA Button is bound to destination');

// 6. CSS Compiler Tests
console.log('\n--- 6. CSS Compiler Tests ---');
const compiledCss = compileDocumentCss(migratedDoc);
assert(compiledCss.includes(':root'), 'CSS includes :root theme variables block');
assert(compiledCss.includes('--c-accent:'), 'CSS includes --c-accent variable');
assert(compiledCss.includes('.n_sec_main'), 'CSS includes root section selector');
assert(compiledCss.includes('@media (min-width: 768px)'), 'CSS includes 768px tablet media query');
assert(compiledCss.includes('@media (min-width: 1024px)'), 'CSS includes 1024px desktop media query');
assert(!compiledCss.includes('<script>'), 'CSS is free of HTML script tags');
assert(!compiledCss.includes('undefined'), 'CSS contains no undefined values');

console.log('==============================================================================');
console.log(` Summary: All ${passed}/${total} Phase 1 Builder Tests Passed! 🚀`);
console.log('==============================================================================');
