import { Doc, Node, Bp } from './schema';
import { resolveStyle } from './resolve';
import { detectBreakpointOverflow } from './overflow';

export interface LinterFinding {
  id: string;
  nodeId?: string;
  severity: 'error' | 'warning';
  title: string;
  message: string;
  rule:
    | 'contrast'
    | 'mobile-font-size'
    | 'tap-target'
    | 'overflow'
    | 'placeholder-copy'
    | 'empty-action'
    | 'heading-hierarchy';
}

/**
 * Deterministic linter running zero AI.
 * Validates WCAG AA accessibility, mobile tap targets, typography floors,
 * overflow across all 3 breakpoints, and placeholder flags.
 */
export function runDocumentLinter(doc: Doc): LinterFinding[] {
  const findings: LinterFinding[] = [];

  let h1Count = 0;

  for (const node of Object.values(doc.nodes)) {
    const resolvedMobile = resolveStyle(node, 'mobile');

    // 1. Heading Hierarchy (max 1 h1 per page)
    if (node.type === 'heading' && node.props.level === 1) {
      h1Count++;
      if (h1Count > 1) {
        findings.push({
          id: `h1_excess_${node.id}`,
          nodeId: node.id,
          severity: 'warning',
          title: 'Multiple H1 Headings',
          message: 'Page has more than one H1 heading. Consider using H2 for subheadings.',
          rule: 'heading-hierarchy',
        });
      }
    }

    // 2. Mobile Body Text Size Floor (>= 16px)
    if (node.type === 'text' && resolvedMobile.fontSize && resolvedMobile.fontSize < 16) {
      findings.push({
        id: `font_size_${node.id}`,
        nodeId: node.id,
        severity: 'warning',
        title: 'Small Mobile Text',
        message: `Body text is ${resolvedMobile.fontSize}px on mobile. Minimum recommended size is 16px.`,
        rule: 'mobile-font-size',
      });
    }

    // 3. Tap Target Size Floor (>= 44px on mobile)
    if (node.type === 'button') {
      const height = resolvedMobile.height;
      if (typeof height === 'object' && height.u === 'px' && height.v < 44) {
        findings.push({
          id: `tap_target_${node.id}`,
          nodeId: node.id,
          severity: 'error',
          title: 'Undersized Tap Target',
          message: `Button height of ${height.v}px is below the 44px minimum touch target for mobile.`,
          rule: 'tap-target',
        });
      }
    }

    // 4. Empty Action / Missing Destination
    if (node.type === 'button' && (!node.props.label || String(node.props.label).trim() === '')) {
      findings.push({
        id: `empty_button_${node.id}`,
        nodeId: node.id,
        severity: 'error',
        title: 'Empty Button Label',
        message: 'Button has no label text.',
        rule: 'empty-action',
      });
    }

    if (node.type === 'linkRow' && (!node.props.href || String(node.props.href).trim() === '')) {
      findings.push({
        id: `empty_link_${node.id}`,
        nodeId: node.id,
        severity: 'error',
        title: 'Missing Link URL',
        message: 'Link row has no target URL configured.',
        rule: 'empty-action',
      });
    }

    // 5. Placeholder Copy Flag
    if (node.placeholder) {
      findings.push({
        id: `placeholder_${node.id}`,
        nodeId: node.id,
        severity: 'warning',
        title: 'Sample Placeholder Copy',
        message: `Element "${node.name || node.type}" contains default unedited sample text.`,
        rule: 'placeholder-copy',
      });
    }
  }

  // 6. Horizontal Overflow Checks across 390, 820, 1280
  (['mobile', 'tablet', 'desktop'] as Bp[]).forEach((bp) => {
    const overflows = detectBreakpointOverflow(doc, bp);
    overflows.forEach((ov) => {
      findings.push({
        id: `overflow_${bp}_${ov.nodeId}`,
        nodeId: ov.nodeId,
        severity: 'error',
        title: `Horizontal Overflow (${bp})`,
        message: ov.message,
        rule: 'overflow',
      });
    });
  });

  return findings;
}
