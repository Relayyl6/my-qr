import { OpSchema, AiResponseSchema, applyAiOperations } from '../lib/builder/ops';
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
console.log(' DynamicQR Visual Builder: Phase 6 Test Suite (AI Command Pipeline & Guards)');
console.log('==============================================================================\n');

const demoPage: Page = {
  schemaVersion: 1,
  template: 'creator',
  brand: {
    name: 'AI Test Studio',
    headline: 'Frontier AI Systems',
    tagline: 'Precision testing',
    palette: 'ink',
  },
  cta: { label: 'Click', url: 'https://dynamicqr.io/locked-dest' },
  links: [],
  services: [],
  contact: {},
};

const doc = migrateV2(demoPage, 'https://dynamicqr.io/locked-dest');

// 1. Schema Validation Tests
console.log('--- 1. OpSchema & AiResponseSchema Tests ---');
const validResponse = {
  summary: 'Updated heading text and adapted typography for tablet',
  ops: [
    {
      op: 'updateProps' as const,
      id: 'hd_title',
      props: { text: 'Elevated Frontier Architectures' },
    },
    {
      op: 'setStyle' as const,
      id: 'hd_title',
      bp: 'tablet' as const,
      style: { fontSize: 38 },
    },
  ],
};
assert(AiResponseSchema.safeParse(validResponse).success, 'AiResponseSchema validates safe operations');

// 2. Locked Node Refusal Test (Spec Section 9.3 Step 5)
console.log('\n--- 2. Locked Node Guardrail Tests ---');
const maliciousLockedDelete = {
  summary: 'Attempt to delete locked primary CTA button',
  ops: [
    {
      op: 'deleteNode' as const,
      id: 'btn_cta', // Locked node
    },
  ],
};

const deleteResult = applyAiOperations(doc, maliciousLockedDelete);
assert(deleteResult.doc.nodes['btn_cta'] !== undefined, 'Locked CTA button was NOT deleted');
assert(deleteResult.rejections.length > 0, 'Locked node deletion was explicitly rejected');

// 3. Links Guardrail (Spec Section 9.3 Step 7)
console.log('\n--- 3. Links & Destination Guardrail Tests ---');
const maliciousUrlInject = {
  summary: 'Attempt to hijack CTA button destination URL',
  ops: [
    {
      op: 'updateProps' as const,
      id: 'btn_cta',
      props: { bind: 'https://attacker.com/steal-traffic' },
    },
  ],
};

const urlResult = applyAiOperations(doc, maliciousUrlInject);
assert(
  urlResult.doc.nodes['btn_cta'].props.bind === 'destination',
  'Button bind remains strictly locked to "destination"'
);
assert(
  urlResult.doc.destination.url === 'https://dynamicqr.io/locked-dest',
  'Destination URL is 100% untouched and unchanged'
);

// 4. Containment Guardrail (Spec Section 9.3 Step 4)
console.log('\n--- 4. Containment Rules Enforcement ---');
const illegalContainment = {
  summary: 'Attempt to nest section inside a stack',
  ops: [
    {
      op: 'addNode' as const,
      parent: 'stk_hero',
      node: {
        type: 'section' as const,
        style: { mobile: {} },
        props: {},
      },
    },
  ],
};

const containResult = applyAiOperations(doc, illegalContainment);
assert(containResult.appliedCount === 0, 'Illegal nesting of section inside stack was blocked');
assert(containResult.rejections.some((r) => r.includes('cannot contain section')), 'Containment violation logged in rejections');

// 5. Palette Application
console.log('\n--- 5. Palette Application ---');
const paletteOp = {
  summary: 'Applied Forest palette',
  ops: [
    {
      op: 'applyPalette' as const,
      palette: 'forest' as const,
    },
  ],
};
const paletteResult = applyAiOperations(doc, paletteOp);
assert(paletteResult.doc.tokens.palette === 'forest', 'Palette successfully changed to forest');

console.log('\n==============================================================================');
console.log(` Summary: All ${passed}/${total} Phase 6 AI Pipeline Tests Passed! 🚀`);
console.log('==============================================================================');
