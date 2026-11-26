import { createBuilderStore } from '../lib/builder/store';
import { migrateV2 } from '../lib/builder/migrate-v2';
import { SECTION_LIBRARY } from '../lib/builder/sections';
import { runDocumentLinter } from '../lib/builder/linter';
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
console.log(' DynamicQR Visual Builder: Phase 5 Test Suite (Library, Themes & Linter)');
console.log('==============================================================================\n');

// 1. Section Library Validation
console.log('--- 1. Section Library Integrity Tests ---');
assert(SECTION_LIBRARY.length >= 2, 'Section library contains prebuilt templates');

SECTION_LIBRARY.forEach((section) => {
  assert(section.rootNodeId in section.nodes, `Section "${section.name}" has valid rootNodeId`);
  assert(section.nodes[section.rootNodeId].type === 'section', `Section "${section.name}" root is a section node`);
});

// 2. Deterministic Linter Rules
console.log('\n--- 2. Deterministic Linter Rule Checks ---');

const demoPage: Page = {
  schemaVersion: 1,
  template: 'creator',
  brand: {
    name: 'My Business', // Default placeholder
    headline: 'Welcome to our space', // Default placeholder
    tagline: 'Crafted for our community',
    palette: 'ink',
  },
  cta: { label: 'Click', url: 'https://dynamicqr.io' },
  links: [],
  services: [{ name: 'Service 1' }],
  contact: {},
};

const doc = migrateV2(demoPage, 'https://dynamicqr.io');
const store = createBuilderStore(doc);

// Initially has placeholder findings
let findings = runDocumentLinter(store.getState().doc);
const placeholderFindings = findings.filter((f) => f.rule === 'placeholder-copy');
assert(placeholderFindings.length > 0, 'Linter detects default placeholder copy');

// Introduce tap target violation (<44px)
const btnId = 'btn_cta';
store.getState().setNodeDimension(btnId, 'mobile', 'height', 'fixed', 32);
findings = runDocumentLinter(store.getState().doc);
const tapTargetViolation = findings.find((f) => f.rule === 'tap-target');
assert(tapTargetViolation !== undefined, 'Linter catches tap target below 44px');

// Restore button height
store.getState().setNodeDimension(btnId, 'mobile', 'height', 'fixed', 52);
findings = runDocumentLinter(store.getState().doc);
assert(findings.find((f) => f.rule === 'tap-target') === undefined, 'Linter clears tap target warning when fixed');

// Multiple H1 violation
store.getState().exec({
  label: 'Add extra H1',
  run: (draft) => {
    draft.nodes['extra_h1'] = {
      id: 'extra_h1',
      type: 'heading',
      parent: 'sec_main',
      children: [],
      style: { mobile: {} },
      props: { text: 'Second H1', level: 1 },
    };
    draft.nodes['sec_main'].children.push('extra_h1');
  },
});
findings = runDocumentLinter(store.getState().doc);
const h1Violation = findings.find((f) => f.rule === 'heading-hierarchy');
assert(h1Violation !== undefined, 'Linter warns about multiple H1 headings');

// Empty action violation
store.getState().updateNodeProps(btnId, { label: '' });
findings = runDocumentLinter(store.getState().doc);
assert(findings.some((f) => f.rule === 'empty-action'), 'Linter flags empty button label');

console.log('\n==============================================================================');
console.log(` Summary: All ${passed}/${total} Phase 5 Library & Linter Tests Passed! 🚀`);
console.log('==============================================================================');
