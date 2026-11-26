import { createBuilderStore } from '../lib/builder/store';
import { migrateV2 } from '../lib/builder/migrate-v2';
import { compileDocumentCss } from '../lib/builder/compile-css';
import { detectBreakpointOverflow } from '../lib/builder/overflow';
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
console.log(' DynamicQR Visual Builder: Phase 4 Test Suite (Responsive Tools)');
console.log('==============================================================================\n');

const demoPage: Page = {
  schemaVersion: 1,
  template: 'creator',
  brand: {
    name: 'Responsive Studio',
    headline: 'Multi-screen Architecture',
    tagline: 'Precision layouts across 390, 820, and 1280px',
    palette: 'ink',
  },
  cta: { label: 'Click', url: 'https://dynamicqr.io' },
  links: [],
  services: [{ name: 'Service 1' }],
  contact: {},
};

const doc = migrateV2(demoPage, 'https://dynamicqr.io');
const store = createBuilderStore(doc);

// 1. Per-Breakpoint Visibility & CSS Display Restore Test
console.log('--- 1. Per-Breakpoint Visibility & Display Restore ---');
const btnId = 'btn_cta';

// Hide button ONLY on tablet
store.getState().toggleHiddenNode(btnId, 'tablet');
assert(store.getState().doc.nodes[btnId].hidden?.tablet === true, 'Button hidden flag set for tablet');
assert(!store.getState().doc.nodes[btnId].hidden?.mobile, 'Button remains visible on mobile');
assert(!store.getState().doc.nodes[btnId].hidden?.desktop, 'Button remains visible on desktop');

const css = compileDocumentCss(store.getState().doc);
assert(css.includes(`.n_${btnId}{display:flex`), 'Mobile CSS maintains display:flex for button');
assert(css.includes(`@media (min-width: 768px)`), 'Tablet media query generated');
assert(css.includes(`.n_${btnId}{display:none`), 'Tablet media query explicitly hides button');
assert(css.includes(`@media (min-width: 1024px)`), 'Desktop media query generated');
assert(css.includes(`.n_${btnId}{display:flex`), 'Desktop media query restores display:flex');

// 2. Overflow Detection at 390, 820, and 1280
console.log('\n--- 2. Overflow Detection Across Breakpoints ---');
// Set fixed width 500px on button for mobile
store.getState().setNodeDimension(btnId, 'mobile', 'width', 'fixed', 500);

const mobileOverflow = detectBreakpointOverflow(store.getState().doc, 'mobile');
assert(mobileOverflow.length > 0, 'Overflow detected on 390px mobile when width is 500px');
assert(mobileOverflow[0].excessPx === 110, 'Excess px is exactly 110px (500 - 390)');

// Tablet (820px) should have 0 overflow for 500px element
const tabletOverflow = detectBreakpointOverflow(store.getState().doc, 'tablet');
assert(tabletOverflow.length === 0, 'Zero overflow on 820px tablet for 500px element');

// Desktop (1280px) should have 0 overflow
const desktopOverflow = detectBreakpointOverflow(store.getState().doc, 'desktop');
assert(desktopOverflow.length === 0, 'Zero overflow on 1280px desktop for 500px element');

// Change back to 'fill' on mobile
store.getState().setNodeDimension(btnId, 'mobile', 'width', 'fill');
const clearedOverflow = detectBreakpointOverflow(store.getState().doc, 'mobile');
assert(clearedOverflow.length === 0, 'Overflow clears to 0 when element width is changed to "fill"');

// 3. Resetting Overrides
console.log('\n--- 3. Overrides Management ---');
const hdId = 'hd_title';
store.getState().updateNodeStyle(hdId, 'tablet', { fontSize: 38, textAlign: 'left' });
assert(store.getState().doc.nodes[hdId].style.tablet?.fontSize === 38, 'Tablet override set');

store.getState().resetNodeOverride(hdId, 'tablet', 'textAlign');
assert(store.getState().doc.nodes[hdId].style.tablet?.textAlign === undefined, 'textAlign override reset');
assert(store.getState().doc.nodes[hdId].style.tablet?.fontSize === 38, 'fontSize override preserved');

console.log('\n==============================================================================');
console.log(` Summary: All ${passed}/${total} Phase 4 Responsive Tools Tests Passed! 🚀`);
console.log('==============================================================================');
