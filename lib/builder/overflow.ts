import { Doc, Bp, BREAKPOINTS } from './schema';
import { resolveStyle } from './resolve';

export interface OverflowFinding {
  nodeId: string;
  nodeName: string;
  bp: Bp;
  message: string;
  excessPx: number;
}

/**
 * Deterministic overflow detection at 390, 820, and 1280.
 * Checks for fixed-width elements that exceed the viewport width,
 * or images/containers with oversized min-widths.
 */
export function detectBreakpointOverflow(doc: Doc, bp: Bp): OverflowFinding[] {
  const findings: OverflowFinding[] = [];
  const maxViewportWidth = BREAKPOINTS[bp].frameWidth;

  for (const node of Object.values(doc.nodes)) {
    if (node.hidden?.[bp]) continue; // Hidden nodes do not cause overflow

    const resolved = resolveStyle(node, bp);

    // Check fixed width
    if (typeof resolved.width === 'object' && resolved.width.u === 'px') {
      const fixedPx = resolved.width.v;
      if (fixedPx > maxViewportWidth) {
        findings.push({
          nodeId: node.id,
          nodeName: node.name || node.type,
          bp,
          message: `Fixed width of ${fixedPx}px exceeds ${bp} frame (${maxViewportWidth}px).`,
          excessPx: fixedPx - maxViewportWidth,
        });
      }
    }

    // Check fixed minWidth
    if (typeof resolved.minWidth === 'object' && resolved.minWidth.u === 'px') {
      const minPx = resolved.minWidth.v;
      if (minPx > maxViewportWidth) {
        findings.push({
          nodeId: node.id,
          nodeName: node.name || node.type,
          bp,
          message: `Minimum width of ${minPx}px exceeds ${bp} frame (${maxViewportWidth}px).`,
          excessPx: minPx - maxViewportWidth,
        });
      }
    }
  }

  return findings;
}
