import { createBuilderStore } from '../lib/builder/store';
import { migrateV2 } from '../lib/builder/migrate-v2';
import { calculateDropTarget } from '../lib/builder/drag-drop';
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
console.log(' DynamicQR Visual Builder: Phase 3 Test Suite (Drag, Drop & Resize)');
console.log('==============================================================================\n');

const demoPage: Page = {
  schemaVersion: 1,
  template: 'creator',
  brand: {
    name: 'Brand Studio',
    headline: 'Creative Systems',
    tagline: 'Precision digital design',
    palette: 'ink',
  },
  cta: {
    label: 'Explore',
    url: 'https://dynamicqr.io',
  },
  links: [{ label: 'Links 1', url: 'https://github.com' }],
  services: [
    { name: 'Service 1', price: '₦10,000' },
    { name: 'Service 2', price: '₦20,000' },
  ],
  contact: { phone: '+2348000000000' },
};

const initialDoc = migrateV2(demoPage, 'https://dynamicqr.io');
const store = createBuilderStore(initialDoc);

// 1. Drop Target Calculation Tests
console.log('--- 1. Drop Target Calculation Tests ---');
const dummyRects = {
  sec_main: { top: 0, left: 0, width: 390, height: 800 },
  stk_hero: { top: 20, left: 16, width: 358, height: 200 },
  hd_title: { top: 60, left: 16, width: 358, height: 40 },
  btn_cta: { top: 230, left: 16, width: 358, height: 50 },
};

// Dragging a section targets root
const sectionDrop = calculateDropTarget({
  doc: store.getState().doc,
  source: { type: 'palette', nodeType: 'section' },
  relX: 200,
  relY: 400,
  zoom: 1,
  elementsAtPoint: [],
  nodeRects: dummyRects,
});
assert(sectionDrop !== null, 'calculateDropTarget calculates target for section');
assert(sectionDrop?.containerId === 'sec_main', 'Section drop targets root section');

// 2. Node Duplication Tests
console.log('\n--- 2. Node Duplication & Subtree Cloning ---');
const service1Id = 'crd_srv_1';
const initialChildCount = store.getState().doc.nodes['grd_services'].children.length;

store.getState().duplicateNode(service1Id);
const updatedChildCount = store.getState().doc.nodes['grd_services'].children.length;
assert(updatedChildCount === initialChildCount + 1, 'Duplicate adds 1 child to parent container');

// Check that duplicated node has a new ID and is not locked
const duplicatedId = store.getState().doc.nodes['grd_services'].children[1];
const duplicatedNode = store.getState().doc.nodes[duplicatedId];
assert(duplicatedNode !== undefined, 'Duplicated node exists in doc.nodes');
assert(duplicatedNode.id !== service1Id, 'Duplicated node has a unique ID');
assert(duplicatedNode.name?.includes('(Copy)'), 'Duplicated node name includes "(Copy)"');

// Undo duplication
store.getState().undo();
assert(
  store.getState().doc.nodes['grd_services'].children.length === initialChildCount,
  'Undo cleanly removes duplicated node in one step'
);

// 3. Grouping & Ungrouping Nodes
console.log('\n--- 3. Grouping & Ungrouping Nodes ---');
const heroHeadingId = 'hd_title';
const heroBadgeId = 'bdg_brand';

store.getState().groupNodes([heroBadgeId, heroHeadingId]);
const heroChildren = store.getState().doc.nodes['stk_hero'].children;
const groupStackId = heroChildren[0];
const groupStack = store.getState().doc.nodes[groupStackId];

assert(groupStack !== undefined, 'Group stack created');
assert(groupStack.type === 'stack', 'Group node has type "stack"');
assert(groupStack.children.includes(heroBadgeId), 'Group contains first node');
assert(groupStack.children.includes(heroHeadingId), 'Group contains second node');

// Ungroup stack
store.getState().ungroupNode(groupStackId);
assert(store.getState().doc.nodes[groupStackId] === undefined, 'Ungroup deletes group stack container');
assert(
  store.getState().doc.nodes['stk_hero'].children.includes(heroHeadingId),
  'Ungroup moves children back to original parent'
);

// 4. Sizing Semantics (Fill, Hug, Fixed px)
console.log('\n--- 4. Resize Sizing Semantics ---');
const btnId = 'btn_cta';

// Set button width to fixed 280px on tablet
store.getState().setNodeDimension(btnId, 'tablet', 'width', 'fixed', 280);
const tabletWidth: any = store.getState().doc.nodes[btnId].style.tablet?.width;
assert(
  typeof tabletWidth === 'object' && tabletWidth.u === 'px' && tabletWidth.v === 280,
  'Fixed width 280px set on tablet override'
);

// Mobile width remains fill
const mobileWidth = store.getState().doc.nodes[btnId].style.mobile.width;
assert(mobileWidth === 'fill', 'Mobile width remains "fill"');

// Double click to hug
store.getState().setNodeDimension(btnId, 'tablet', 'width', 'hug');
assert(store.getState().doc.nodes[btnId].style.tablet?.width === 'hug', 'Width set to "hug"');

// Undo sets back to fixed
store.getState().undo();
const revertedWidth: any = store.getState().doc.nodes[btnId].style.tablet?.width;
assert(
  typeof revertedWidth === 'object' && revertedWidth.v === 280,
  'Undo restores fixed 280px width'
);

console.log('\n==============================================================================');
console.log(` Summary: All ${passed}/${total} Phase 3 Visual Builder Tests Passed! 🚀`);
console.log('==============================================================================');
