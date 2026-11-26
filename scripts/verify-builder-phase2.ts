import { createBuilderStore } from '../lib/builder/store';
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
console.log(' DynamicQR Visual Builder: Phase 2 Test Suite (Store, Shell & Canvas)');
console.log('==============================================================================\n');

// 1. Initial Document & Store Setup
const demoPage: Page = {
  schemaVersion: 1,
  template: 'creator',
  brand: {
    name: 'Dev Studio',
    headline: 'Creative Architecture',
    tagline: 'Modern systems',
    palette: 'ink',
  },
  cta: {
    label: 'Visit Site',
    url: 'https://dynamicqr.io',
  },
  links: [{ label: 'GitHub', url: 'https://github.com' }],
  services: [{ name: 'System Design', price: '₦100,000' }],
  contact: { phone: '+2348000000000', email: 'test@dev.io' },
};

const initialDoc = migrateV2(demoPage, 'https://dynamicqr.io');
const store = createBuilderStore(initialDoc);

console.log('--- 1. Store Initialization & Initial State ---');
assert(store.getState().doc.root === 'sec_main', 'Store initializes with migrated root');
assert(store.getState().ui.bp === 'mobile', 'Default breakpoint is mobile');
assert(store.getState().ui.frameWidth === 390, 'Default frame width is 390px');
assert(!store.getState().canUndo(), 'Initially cannot undo');
assert(!store.getState().canRedo(), 'Initially cannot redo');

// 2. Breakpoint Switching & Tablet Rotation
console.log('\n--- 2. Breakpoint Switching & Frame Sizing ---');
store.getState().setBreakpoint('tablet');
assert(store.getState().ui.bp === 'tablet', 'Switching to tablet updates bp to tablet');
assert(store.getState().ui.frameWidth === 820, 'Tablet frame width is exactly 820px');

// Tablet rotation (1180px landscape mode)
store.getState().toggleRotateTablet();
assert(store.getState().ui.isRotated === true, 'Tablet rotation toggles isRotated to true');
assert(store.getState().ui.frameWidth === 1180, 'Rotated tablet frame width is 1180px');
assert(store.getState().ui.bp === 'desktop', '1180px triggers desktop breakpoint styles');

store.getState().toggleRotateTablet(); // Un-rotate
assert(store.getState().ui.frameWidth === 820, 'Un-rotating restores 820px');

store.getState().setBreakpoint('desktop');
assert(store.getState().ui.bp === 'desktop', 'Switching to desktop updates bp to desktop');
assert(store.getState().ui.frameWidth === 1280, 'Desktop frame width is exactly 1280px');

// 3. Command Execution & Patch Recording
console.log('\n--- 3. Command Execution & History Patches ---');
const btnId = 'btn_cta';
const originalLabel = store.getState().doc.nodes[btnId].props.label;

// Execute prop update command
store.getState().updateNodeProps(btnId, { label: 'Explore Our Work' });
assert(
  store.getState().doc.nodes[btnId].props.label === 'Explore Our Work',
  'Node prop updated to "Explore Our Work"'
);
assert(store.getState().canUndo(), 'canUndo returns true after command execution');
assert(!store.getState().canRedo(), 'canRedo is false after new command');

// 4. Undo and Redo
console.log('\n--- 4. Undo & Redo Precision ---');
store.getState().undo();
assert(
  store.getState().doc.nodes[btnId].props.label === originalLabel,
  'Undo rolls back button label to original'
);
assert(store.getState().canRedo(), 'canRedo returns true after undo');

store.getState().redo();
assert(
  store.getState().doc.nodes[btnId].props.label === 'Explore Our Work',
  'Redo re-applies button label to "Explore Our Work"'
);

// 5. Breakpoint-Specific Style Overrides
console.log('\n--- 5. Breakpoint Style Overrides ---');
const headingId = 'hd_title';
const initialMobileFontSize = store.getState().doc.nodes[headingId].style.mobile.fontSize;

// Override only tablet fontSize
store.getState().updateNodeStyle(headingId, 'tablet', { fontSize: 44 });
assert(
  store.getState().doc.nodes[headingId].style.tablet?.fontSize === 44,
  'Tablet fontSize overridden to 44'
);
assert(
  store.getState().doc.nodes[headingId].style.mobile.fontSize === initialMobileFontSize,
  'Mobile base fontSize is unchanged'
);

// Reset override
store.getState().resetNodeOverride(headingId, 'tablet', 'fontSize');
assert(
  store.getState().doc.nodes[headingId].style.tablet?.fontSize === undefined,
  'Resetting override removes property from tablet style'
);

// 6. Security Invariant Protection
console.log('\n--- 6. Security Invariant: Locked Destination URL ---');
const originalUrl = store.getState().doc.destination.url;
store.getState().exec({
  label: 'Malicious attempt to alter destination URL',
  run: (draft: any) => {
    draft.destination.url = 'https://malicious-site.com';
  },
});
assert(
  store.getState().doc.destination.url === originalUrl,
  'Destination URL mutation rejected by store invariant guard'
);

// 7. Layer Operations & Locked Nodes
console.log('\n--- 7. Layer Operations & Lock Guard ---');
const serviceCardId = 'crd_srv_1';
store.getState().renameNode(serviceCardId, 'Design System Card');
assert(
  store.getState().doc.nodes[serviceCardId].name === 'Design System Card',
  'Layer renamed successfully'
);

// Try deleting locked button
store.getState().deleteNode(btnId);
assert(
  store.getState().doc.nodes[btnId] !== undefined,
  'Locked button node cannot be deleted'
);

// Toggle hidden per breakpoint
store.getState().toggleHiddenNode(serviceCardId, 'tablet');
assert(
  store.getState().doc.nodes[serviceCardId].hidden?.tablet === true,
  'Layer hidden on tablet'
);

console.log('\n==============================================================================');
console.log(` Summary: All ${passed}/${total} Phase 2 Visual Builder Tests Passed! 🚀`);
console.log('==============================================================================');
