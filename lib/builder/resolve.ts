import { Node, Style, Bp, BP } from './schema';

const ORDER: readonly Bp[] = ['mobile', 'tablet', 'desktop'] as const;

/**
 * Mobile styles are the base. Tablet overrides apply at 768px and up.
 * Desktop overrides apply at 1024px and up. A property set on mobile
 * is inherited by tablet and desktop unless explicitly overridden.
 */
export function resolveStyle(node: Node, bp: Bp): Style {
  const out: Style = {};
  for (const b of ORDER) {
    const layer = node.style[b];
    if (layer) {
      Object.assign(out, layer);
    }
    if (b === bp) break;
  }
  return out;
}

/**
 * Checks if a specific style key is explicitly overridden at the given breakpoint.
 * Returns false on mobile since mobile is the base style.
 */
export function isOverridden(node: Node, bp: Bp, key: keyof Style): boolean {
  if (bp === 'mobile') return false;
  return node.style[bp]?.[key] !== undefined;
}

/**
 * Deletes an override for a specific style key at tablet or desktop,
 * reverting that property to inherited behavior.
 */
export function resetOverride(node: Node, bp: Bp, key: keyof Style): void {
  if (bp === 'mobile') return;
  if (node.style[bp] && node.style[bp]![key] !== undefined) {
    delete node.style[bp]![key];
  }
}

/**
 * Copies resolved or raw styles from one breakpoint to another.
 */
export function copyStylesToBreakpoint(node: Node, fromBp: Bp, toBp: Bp): void {
  if (toBp === 'mobile') {
    // If copying to mobile, resolve and replace base
    node.style.mobile = resolveStyle(node, fromBp);
  } else {
    node.style[toBp] = {
      ...(node.style[toBp] || {}),
      ...resolveStyle(node, fromBp),
    };
  }
}

/**
 * Resets all overrides on a breakpoint, completely inheriting from the lower breakpoint.
 */
export function resetAllOverrides(node: Node, bp: Bp): void {
  if (bp === 'mobile') return;
  node.style[bp] = {};
}
