import { Doc, Node, NodeType, canContain } from './schema';

export interface DragSource {
  type: 'palette' | 'canvas';
  nodeType: NodeType;
  nodeId?: string; // Present when dragging from canvas
}

export interface DropTarget {
  containerId: string;
  index: number;
  isValid: boolean;
  lineRect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  highlightRect?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * Calculates drop target container and insertion index based on pointer position.
 * Respects CAN_CONTAIN table: sections can only go in root, cards/stacks accept children.
 */
export function calculateDropTarget({
  doc,
  source,
  relX,
  relY,
  zoom,
  elementsAtPoint,
  nodeRects,
}: {
  doc: Doc;
  source: DragSource;
  relX: number;
  relY: number;
  zoom: number;
  elementsAtPoint: Element[];
  nodeRects: Record<string, { top: number; left: number; width: number; height: number }>;
}): DropTarget | null {
  // 1. If dragging a section, it can ONLY go in root
  if (source.nodeType === 'section') {
    const rootNode = doc.nodes[doc.root];
    if (!rootNode) return null;
    const r = nodeRects[doc.root];
    return {
      containerId: doc.root,
      index: rootNode.children.length,
      isValid: true,
      highlightRect: r,
    };
  }

  // 2. Find nearest valid container in DOM tree under pointer
  let targetContainerId: string | null = null;

  for (const el of elementsAtPoint) {
    const match = el.className?.match?.(/\bn_([a-z0-9_-]+)\b/);
    if (!match) continue;
    const candidateId = match[1];
    const candidate = doc.nodes[candidateId];
    if (!candidate) continue;

    // Do not allow dropping inside self or self's descendants
    if (source.nodeId && (candidateId === source.nodeId || isDescendant(doc, candidateId, source.nodeId))) {
      continue;
    }

    if (canContain(candidate.type, source.nodeType)) {
      targetContainerId = candidateId;
      break;
    }
  }

  // Fallback to root or default section if valid
  if (!targetContainerId) {
    const rootNode = doc.nodes[doc.root];
    if (rootNode && canContain(rootNode.type, source.nodeType)) {
      targetContainerId = doc.root;
    } else {
      // Find first section in root
      const firstSection = rootNode?.children.find((cid) => doc.nodes[cid]?.type === 'section');
      if (firstSection && canContain('section', source.nodeType)) {
        targetContainerId = firstSection;
      }
    }
  }

  if (!targetContainerId || !doc.nodes[targetContainerId]) {
    return null;
  }

  const container = doc.nodes[targetContainerId];
  const containerRect = nodeRects[targetContainerId];
  const children = container.children;

  // Calculate insertion index along main axis (default column: Y axis, row: X axis)
  let insertIndex = children.length;
  const isRow = container.style.mobile?.direction === 'row';

  for (let i = 0; i < children.length; i++) {
    const childId = children[i];
    if (childId === source.nodeId) continue;
    const childRect = nodeRects[childId];
    if (!childRect) continue;

    if (isRow) {
      const midX = childRect.left + childRect.width / 2;
      if (relX * zoom < midX) {
        insertIndex = i;
        break;
      }
    } else {
      const midY = childRect.top + childRect.height / 2;
      if (relY * zoom < midY) {
        insertIndex = i;
        break;
      }
    }
  }

  // Compute blue insertion line coordinates
  let lineRect: DropTarget['lineRect'] = undefined;
  if (containerRect) {
    if (isRow) {
      const x = insertIndex < children.length && nodeRects[children[insertIndex]]
        ? nodeRects[children[insertIndex]].left - 2
        : containerRect.left + containerRect.width - 2;
      lineRect = {
        top: containerRect.top,
        left: x,
        width: 3,
        height: containerRect.height,
      };
    } else {
      const y = insertIndex < children.length && nodeRects[children[insertIndex]]
        ? nodeRects[children[insertIndex]].top - 2
        : containerRect.top + containerRect.height - 2;
      lineRect = {
        top: y,
        left: containerRect.left + 4,
        width: containerRect.width - 8,
        height: 3,
      };
    }
  }

  return {
    containerId: targetContainerId,
    index: insertIndex,
    isValid: true,
    lineRect,
    highlightRect: containerRect,
  };
}

function isDescendant(doc: Doc, nodeToCheck: string, ancestorId: string): boolean {
  let curr = doc.nodes[nodeToCheck];
  while (curr && curr.parent) {
    if (curr.parent === ancestorId) return true;
    curr = doc.nodes[curr.parent];
  }
  return false;
}
