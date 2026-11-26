import { Doc, Node, Style, Bp, BP, BREAKPOINTS } from './schema';
import { resolveStyle } from './resolve';

/**
 * Sanitizes any raw token or value to strictly prevent CSS injection.
 * Throws an error if forbidden characters or strings like semicolons,
 * braces, url(), expression(), or script tags are found.
 */
export function sanitizeCssString(val: string): string {
  if (/[;{}<>\\]|url\s*\(|expression\s*\(|@import|javascript:/i.test(val)) {
    throw new Error(`CSS Injection attempt rejected: forbidden token in "${val}"`);
  }
  return val.trim();
}

export function serializeColor(color?: string): string {
  if (!color) return 'inherit';
  const sanitized = sanitizeCssString(color);
  if (/^#[0-9a-fA-F]{6}$/.test(sanitized)) {
    return sanitized;
  }
  if (/^(bg|fg|accent|muted|surface|border|onAccent)$/.test(sanitized)) {
    return `var(--c-${sanitized})`;
  }
  throw new Error(`Invalid color token: "${color}"`);
}

export function serializeSize(size: any, prop: 'width' | 'height' | 'min-width' | 'max-width' | 'min-height'): string[] {
  if (!size) return [];
  if (size === 'fill') {
    if (prop === 'width') return ['width:100%', 'flex:1 1 0%'];
    if (prop === 'height') return ['height:100%', 'flex:1 1 0%'];
    return [`${prop}:100%`];
  }
  if (size === 'hug') {
    return [`${prop}:fit-content`];
  }
  if (size === 'auto') {
    return [`${prop}:auto`];
  }
  if (typeof size === 'object' && size.u && typeof size.v === 'number') {
    const v = Number(size.v);
    if (!Number.isFinite(v)) return [];
    if (size.u === 'px') return [`${prop}:${v}px`];
    if (size.u === '%') return [`${prop}:${v}%`];
  }
  return [];
}

/**
 * Serializes individual style declarations into a list of CSS rules "key:value".
 */
export function serializeStyleDeclarations(style: Style): Record<string, string> {
  const decls: Record<string, string> = {};

  if (style.display) {
    decls['display'] = sanitizeCssString(style.display);
  }
  if (style.direction) {
    decls['flex-direction'] = style.direction === 'column' ? 'column' : 'row';
  }
  if (style.wrap !== undefined) {
    decls['flex-wrap'] = style.wrap ? 'wrap' : 'nowrap';
  }
  if (style.align) {
    const map: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    decls['align-items'] = map[style.align] || style.align;
  }
  if (style.justify) {
    const map: Record<string, string> = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      between: 'space-between',
    };
    decls['justify-content'] = map[style.justify] || style.justify;
  }
  if (style.gap !== undefined) {
    decls['gap'] = `${Number(style.gap)}px`;
  }
  if (style.columns !== undefined) {
    const c = Math.max(1, Math.min(6, Math.floor(Number(style.columns))));
    decls['grid-template-columns'] = `repeat(${c},minmax(0,1fr))`;
  }

  // Box dimensions
  for (const item of serializeSize(style.width, 'width')) {
    const [k, v] = item.split(':');
    decls[k] = v;
  }
  for (const item of serializeSize(style.height, 'height')) {
    const [k, v] = item.split(':');
    decls[k] = v;
  }
  for (const item of serializeSize(style.minWidth, 'min-width')) {
    const [k, v] = item.split(':');
    decls[k] = v;
  }
  for (const item of serializeSize(style.maxWidth, 'max-width')) {
    const [k, v] = item.split(':');
    decls[k] = v;
  }
  for (const item of serializeSize(style.minHeight, 'min-height')) {
    const [k, v] = item.split(':');
    decls[k] = v;
  }

  if (style.padding) {
    decls['padding'] = `${style.padding[0]}px ${style.padding[1]}px ${style.padding[2]}px ${style.padding[3]}px`;
  }
  if (style.margin) {
    decls['margin'] = `${style.margin[0]}px ${style.margin[1]}px ${style.margin[2]}px ${style.margin[3]}px`;
  }
  if (style.aspectRatio && style.aspectRatio !== 'auto') {
    decls['aspect-ratio'] = sanitizeCssString(style.aspectRatio.replace('/', ' / '));
  }
  if (style.overflow) {
    decls['overflow'] = sanitizeCssString(style.overflow);
  }

  // Positioning
  if (style.position) {
    decls['position'] = style.position === 'absolute' ? 'absolute' : 'static';
  }
  if (style.x !== undefined) {
    decls['left'] = `${Number(style.x)}px`;
  }
  if (style.y !== undefined) {
    decls['top'] = `${Number(style.y)}px`;
  }
  if (style.zIndex !== undefined) {
    decls['z-index'] = `${Number(style.zIndex)}`;
  }
  if (style.rotate !== undefined && style.rotate !== 0) {
    decls['transform'] = `rotate(${Number(style.rotate)}deg)`;
  }

  // Look
  if (style.bg) {
    decls['background-color'] = serializeColor(style.bg);
  }
  if (style.radius !== undefined) {
    decls['border-radius'] = `${Number(style.radius)}px`;
  }
  if (style.border) {
    decls['border'] = `${Number(style.border.w)}px solid ${serializeColor(style.border.color)}`;
  }
  if (style.shadow && style.shadow !== 'none') {
    const shadows: Record<string, string> = {
      sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
      md: '0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -2px rgba(0,0,0,0.1)',
      lg: '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)',
    };
    decls['box-shadow'] = shadows[style.shadow] || 'none';
  }
  if (style.opacity !== undefined) {
    decls['opacity'] = `${Number(style.opacity)}`;
  }

  // Typography
  if (style.fontFamily) {
    const fontVars: Record<string, string> = {
      body: 'var(--f-body,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif)',
      display: 'var(--f-display,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif)',
      mono: 'var(--f-mono,ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace)',
    };
    decls['font-family'] = fontVars[style.fontFamily] || fontVars.body;
  }
  if (style.fontSize !== undefined) {
    decls['font-size'] = `${Number(style.fontSize)}px`;
  }
  if (style.fontWeight !== undefined) {
    decls['font-weight'] = `${Number(style.fontWeight)}`;
  }
  if (style.lineHeight !== undefined) {
    decls['line-height'] = `${Number(style.lineHeight)}`;
  }
  if (style.letterSpacing !== undefined) {
    decls['letter-spacing'] = `${Number(style.letterSpacing)}em`;
  }
  if (style.textAlign) {
    decls['text-align'] = sanitizeCssString(style.textAlign);
  }
  if (style.color) {
    decls['color'] = serializeColor(style.color);
  }
  if (style.textTransform && style.textTransform !== 'none') {
    decls['text-transform'] = sanitizeCssString(style.textTransform);
  }
  if (style.objectFit) {
    decls['object-fit'] = sanitizeCssString(style.objectFit);
  }

  return decls;
}

/**
 * Emits CSS variables block for document theme tokens.
 */
export function compileThemeVariables(doc: Doc): string {
  const { colors, fonts, radius, spacingUnit } = doc.tokens;
  return `:root {
  --c-bg: ${serializeColor(colors.bg)};
  --c-fg: ${serializeColor(colors.fg)};
  --c-accent: ${serializeColor(colors.accent)};
  --c-muted: ${serializeColor(colors.muted)};
  --c-surface: ${serializeColor(colors.surface)};
  --c-border: ${serializeColor(colors.border)};
  --c-onAccent: ${serializeColor(colors.onAccent)};
  --f-body: ${sanitizeCssString(fonts.body)};
  --f-display: ${sanitizeCssString(fonts.display)};
  --f-mono: ${sanitizeCssString(fonts.mono)};
  --r-unit: ${Number(radius)}px;
  --s-unit: ${Number(spacingUnit)}px;
}`;
}

/**
 * Compiles a Doc's nodes into minimal, deduplicated CSS with media queries.
 */
export function compileDocumentCss(doc: Doc): string {
  const rulesByBp: Record<Bp, string[]> = {
    mobile: [],
    tablet: [],
    desktop: [],
  };

  const themeVars = compileThemeVariables(doc);

  for (const node of Object.values(doc.nodes)) {
    const className = `.n_${node.id}`;

    // Compute resolved styles for each breakpoint
    const mobileStyle = resolveStyle(node, 'mobile');
    const tabletStyle = resolveStyle(node, 'tablet');
    const desktopStyle = resolveStyle(node, 'desktop');

    const mobileDecls = serializeStyleDeclarations(mobileStyle);
    const tabletDecls = serializeStyleDeclarations(tabletStyle);
    const desktopDecls = serializeStyleDeclarations(desktopStyle);

    // Visibility handling
    if (node.hidden?.mobile) {
      mobileDecls['display'] = 'none';
    }
    if (node.hidden?.tablet) {
      tabletDecls['display'] = 'none';
    } else if (node.hidden?.mobile && !node.hidden?.tablet) {
      // Restore visible display on tablet if hidden on mobile
      tabletDecls['display'] = mobileStyle.display || (node.type === 'section' || node.type === 'stack' ? 'flex' : 'block');
    }
    if (node.hidden?.desktop) {
      desktopDecls['display'] = 'none';
    } else if (node.hidden?.tablet && !node.hidden?.desktop) {
      desktopDecls['display'] = tabletStyle.display || mobileStyle.display || 'block';
    }

    // Auto-center sections when max-width applies
    if (node.type === 'section') {
      if (!mobileDecls['margin'] && !mobileDecls['margin-left']) {
        mobileDecls['margin-left'] = 'auto';
        mobileDecls['margin-right'] = 'auto';
      }
    }

    // 1. Mobile rules
    const mobileEntries = Object.entries(mobileDecls);
    if (mobileEntries.length > 0) {
      rulesByBp.mobile.push(
        `${className}{${mobileEntries.map(([k, v]) => `${k}:${v}`).join(';')}}`
      );
    }

    // 2. Tablet rules (Diff only against mobile)
    const tabletDiffEntries: [string, string][] = [];
    for (const [k, v] of Object.entries(tabletDecls)) {
      if (mobileDecls[k] !== v) {
        tabletDiffEntries.push([k, v]);
      }
    }
    if (tabletDiffEntries.length > 0) {
      rulesByBp.tablet.push(
        `${className}{${tabletDiffEntries.map(([k, v]) => `${k}:${v}`).join(';')}}`
      );
    }

    // 3. Desktop rules (Diff only against tablet)
    const desktopDiffEntries: [string, string][] = [];
    for (const [k, v] of Object.entries(desktopDecls)) {
      if (tabletDecls[k] !== v) {
        desktopDiffEntries.push([k, v]);
      }
    }
    if (desktopDiffEntries.length > 0) {
      rulesByBp.desktop.push(
        `${className}{${desktopDiffEntries.map(([k, v]) => `${k}:${v}`).join(';')}}`
      );
    }
  }

  const output: string[] = [themeVars];

  if (rulesByBp.mobile.length > 0) {
    output.push(rulesByBp.mobile.join('\n'));
  }
  if (rulesByBp.tablet.length > 0) {
    output.push(
      `@media (min-width: ${BREAKPOINTS.tablet.minWidth}px) {\n${rulesByBp.tablet.join('\n')}\n}`
    );
  }
  if (rulesByBp.desktop.length > 0) {
    output.push(
      `@media (min-width: ${BREAKPOINTS.desktop.minWidth}px) {\n${rulesByBp.desktop.join('\n')}\n}`
    );
  }

  return output.join('\n\n');
}
