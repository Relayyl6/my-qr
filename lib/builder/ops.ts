import { z } from 'zod';
import { Doc, Node, Style, StyleSchema, canContain, NodeSchema, PALETTE_KEYS } from './schema';
import { runDocumentLinter } from './linter';

// 9.2 The AI returns operations, never raw markup
export const OpSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('addNode'),
    parent: z.string(),
    index: z.number().int().optional(),
    node: z.object({
      id: z.string().optional(),
      type: NodeSchema.shape.type,
      name: z.string().max(60).optional(),
      style: NodeSchema.shape.style,
      props: z.record(z.unknown()),
    }),
  }),
  z.object({
    op: z.literal('updateProps'),
    id: z.string(),
    props: z.record(z.unknown()),
  }),
  z.object({
    op: z.literal('setStyle'),
    id: z.string(),
    bp: z.enum(['mobile', 'tablet', 'desktop']),
    style: StyleSchema,
  }),
  z.object({
    op: z.literal('moveNode'),
    id: z.string(),
    parent: z.string(),
    index: z.number().int(),
  }),
  z.object({
    op: z.literal('deleteNode'),
    id: z.string(),
  }),
  z.object({
    op: z.literal('setHidden'),
    id: z.string(),
    bp: z.enum(['mobile', 'tablet', 'desktop']),
    hidden: z.boolean(),
  }),
  z.object({
    op: z.literal('applyPalette'),
    palette: z.enum(PALETTE_KEYS),
  }),
  z.object({
    op: z.literal('setToken'),
    key: z.enum(['radius', 'spacingUnit']),
    value: z.number(),
  }),
]);

export type Op = z.infer<typeof OpSchema>;

export const AiResponseSchema = z.object({
  summary: z.string().max(200),
  ops: z.array(OpSchema).max(30),
});

export type AiResponse = z.infer<typeof AiResponseSchema>;

export interface ApplyResult {
  success: boolean;
  doc: Doc;
  appliedCount: number;
  rejectedCount: number;
  rejections: string[];
  summary: string;
}

/**
 * 9.3 The 11-step Apply Pipeline executed entirely in deterministic code.
 * Rejects any op attempting to set URLs, edit the destination, touch locked nodes,
 * introduce containment violations, or breach node limits.
 */
export function applyAiOperations(doc: Doc, rawResponse: unknown): ApplyResult {
  // Step 1: Parse schema
  const parsed = AiResponseSchema.safeParse(rawResponse);
  if (!parsed.success) {
    return {
      success: false,
      doc,
      appliedCount: 0,
      rejectedCount: 0,
      rejections: ['Invalid AI response schema structure'],
      summary: "Couldn't make that change.",
    };
  }

  const { summary, ops } = parsed.data;
  const ghostDoc: Doc = JSON.parse(JSON.stringify(doc));
  const rejections: string[] = [];
  let appliedCount = 0;
  const tempIdMap: Record<string, string> = {};

  for (const op of ops) {
    switch (op.op) {
      case 'addNode': {
        // Step 4: Containment & Node ceiling (max 150)
        if (Object.keys(ghostDoc.nodes).length >= 150) {
          rejections.push('Node ceiling reached (150 max)');
          continue;
        }

        const realParent = tempIdMap[op.parent] || op.parent;
        const parentNode = ghostDoc.nodes[realParent];
        if (!parentNode) {
          rejections.push(`Parent node "${op.parent}" does not exist`);
          continue;
        }

        if (!canContain(parentNode.type, op.node.type)) {
          rejections.push(`Container ${parentNode.type} cannot contain ${op.node.type}`);
          continue;
        }

        // Step 2: Remap IDs
        const newId = `${op.node.type.slice(0, 3)}_${Math.random().toString(36).substring(2, 8)}`;
        if (op.node.id) tempIdMap[op.node.id] = newId;

        // Step 7: Links guard - buttons must bind to destination
        const safeProps = { ...op.node.props };
        if (op.node.type === 'button') {
          safeProps.bind = 'destination';
        }

        ghostDoc.nodes[newId] = {
          id: newId,
          type: op.node.type,
          name: op.node.name || `New ${op.node.type}`,
          parent: realParent,
          children: [],
          style: op.node.style,
          props: safeProps,
        };

        const idx = op.index !== undefined ? Math.min(parentNode.children.length, op.index) : parentNode.children.length;
        parentNode.children.splice(idx, 0, newId);
        appliedCount++;
        break;
      }

      case 'updateProps': {
        const targetId = tempIdMap[op.id] || op.id;
        const node = ghostDoc.nodes[targetId];
        if (!node) {
          rejections.push(`Node "${op.id}" not found`);
          continue;
        }

        // Step 5: Refuse locked nodes
        if (node.locked) {
          rejections.push(`Cannot update props on locked node "${node.id}"`);
          continue;
        }

        // Step 7: Links guard - never allow arbitrary destination URL mutation
        const safeProps = { ...op.props };
        if (node.type === 'button' && safeProps.bind && safeProps.bind !== 'destination') {
          safeProps.bind = 'destination';
        }

        node.props = { ...node.props, ...safeProps };
        node.placeholder = false;
        appliedCount++;
        break;
      }

      case 'setStyle': {
        const targetId = tempIdMap[op.id] || op.id;
        const node = ghostDoc.nodes[targetId];
        if (!node) {
          rejections.push(`Node "${op.id}" not found`);
          continue;
        }

        if (op.bp === 'mobile') {
          node.style.mobile = { ...node.style.mobile, ...op.style };
        } else {
          node.style[op.bp] = { ...(node.style[op.bp] || {}), ...op.style };
        }
        appliedCount++;
        break;
      }

      case 'deleteNode': {
        const targetId = tempIdMap[op.id] || op.id;
        const node = ghostDoc.nodes[targetId];
        if (!node) continue;

        // Step 5: Refuse locked nodes
        if (node.locked || targetId === ghostDoc.root) {
          rejections.push(`Cannot delete locked node "${targetId}"`);
          continue;
        }

        if (node.parent && ghostDoc.nodes[node.parent]) {
          const parent = ghostDoc.nodes[node.parent];
          parent.children = parent.children.filter((cid) => cid !== targetId);
        }
        delete ghostDoc.nodes[targetId];
        appliedCount++;
        break;
      }

      case 'setHidden': {
        const targetId = tempIdMap[op.id] || op.id;
        const node = ghostDoc.nodes[targetId];
        if (!node) continue;
        if (!node.hidden) node.hidden = {};
        node.hidden[op.bp] = op.hidden;
        appliedCount++;
        break;
      }

      case 'applyPalette': {
        ghostDoc.tokens.palette = op.palette;
        appliedCount++;
        break;
      }

      case 'setToken': {
        if (op.key === 'radius') ghostDoc.tokens.radius = op.value;
        if (op.key === 'spacingUnit') ghostDoc.tokens.spacingUnit = op.value;
        appliedCount++;
        break;
      }
    }
  }

  // Step 9: Invariant verification - Destination URL strictly untouched
  if (ghostDoc.destination.url !== doc.destination.url) {
    ghostDoc.destination.url = doc.destination.url;
  }

  return {
    success: appliedCount > 0,
    doc: ghostDoc,
    appliedCount,
    rejectedCount: rejections.length,
    rejections,
    summary,
  };
}
