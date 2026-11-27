'use server';

import { Doc, Node, NodeType, Bp, PALETTE_KEYS, PaletteTokenKey } from './schema';
import { applyAiOperations, Op } from './ops';
import { getAIProvider } from '@/lib/ai/provider';
import { getCurrentUser } from '@/lib/auth';
import { assertFeatureAccess } from '@/lib/ai/flags';
import { PALETTES, PaletteKey } from '@/lib/page/config';
import { Page } from '@/lib/page/schema';
import { migrateV2 } from './migrate-v2';

interface CopilotInput {
  prompt: string;
  doc: Doc;
  selectedId?: string | null;
  bp?: Bp;
  destinationUrl?: string;
}

export interface CopilotOutput {
  success: boolean;
  doc: Doc;
  summary: string;
  appliedCount?: number;
}

/**
 * Figma-grade AI Visual Design Copilot for DynamicQR Builder
 * Executes surgical mutations (updateProps, setStyle, addNode, applyPalette)
 * or complete multi-section V3 landing page architecture.
 */
export async function runBuilderAICopilotAction({
  prompt,
  doc,
  selectedId,
  bp = 'mobile',
  destinationUrl,
}: CopilotInput): Promise<CopilotOutput> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required to use the AI design copilot.');
  }

  const access = await assertFeatureAccess(user.id, 'landing-page-builder');
  if (!access.allowed) {
    throw new Error(access.reason || 'AI Mobile Landing Pages require an active subscription.');
  }

  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) {
    throw new Error('Please enter a design prompt or command.');
  }

  const targetUrl = doc?.destination?.url || destinationUrl || 'https://dynamicqr.io';
  const provider = getAIProvider();

  // Extract a compact summary of the current document tree for the AI context
  const currentNodesSummary: Array<{ id: string; type: string; name?: string; text?: string }> = [];
  if (doc?.nodes) {
    for (const [id, node] of Object.entries(doc.nodes)) {
      const textProp = (node.props?.text as string) || (node.props?.label as string) || (node.props?.name as string) || '';
      currentNodesSummary.push({
        id,
        type: node.type,
        name: node.name,
        text: textProp ? textProp.slice(0, 40) : undefined,
      });
    }
  }

  const selectedNode = selectedId && doc?.nodes?.[selectedId] ? doc.nodes[selectedId] : null;

  const systemPrompt = `You are a Figma-grade AI Design Copilot embedded inside a modern visual web design tool.
The application operates on a strict V3 Node Document AST:
- Document Root: "${doc.root || 'sec_main'}"
- Active Palette: "${doc.tokens?.palette || 'ink'}"
- Active Breakpoint: "${bp}"
- Selected Element: ${selectedNode ? `ID: "${selectedNode.id}", Type: "${selectedNode.type}", Name: "${selectedNode.name}"` : 'None (Canvas level)'}
- Locked Destination URL: "${targetUrl}"

You can perform TWO types of design actions:

OPTION A: SURGICAL OPERATIONS (Preferred for edits, theming, copy changes, adding sections, restyling):
Respond with:
{
  "mode": "ops",
  "summary": "1-sentence summary of what you designed/changed",
  "ops": [
    // Op 1: Update component props (text, headings, button labels, price items, badges, etc.)
    { "op": "updateProps", "id": "hd_title", "props": { "text": "New Headline" } },
    // Op 2: Update styles on breakpoint ('mobile' | 'tablet' | 'desktop')
    { "op": "setStyle", "id": "btn_cta", "bp": "mobile", "style": { "bg": "accent", "radius": 24, "fontSize": 16 } },
    // Op 3: Change color palette token ('ink' | 'sand' | 'forest' | 'clay' | 'sky' | 'mono' | 'custom')
    { "op": "applyPalette", "palette": "forest" },
    // Op 4: Add new nodes into a parent container ('section', 'stack', 'grid', 'card')
    {
      "op": "addNode",
      "parent": "sec_main",
      "node": {
        "type": "heading" | "text" | "button" | "badge" | "linkRow" | "priceItem" | "card" | "stack" | "grid",
        "name": "Human-readable Layer Name",
        "style": { "mobile": { "width": "fill", "padding": [8,8,8,8] } },
        "props": { "text": "Content" }
      }
    },
    // Op 5: Delete node
    { "op": "deleteNode", "id": "node_id_to_remove" },
    // Op 6: Set token
    { "op": "setToken", "key": "radius", "value": 16 }
  ]
}

OPTION B: COMPLETE MULTI-SECTION GENERATION (When the user asks to build a full page from scratch or completely redesign):
Respond with:
{
  "mode": "full",
  "summary": "Designed a complete showcase landing page for [Brand/Topic]",
  "page": {
    "schemaVersion": 1,
    "template": "creator",
    "brand": {
      "name": "Brand Name",
      "headline": "High-converting 4-8 word headline",
      "tagline": "Compelling 1-2 sentence subtitle value proposition",
      "palette": "ink" | "sand" | "forest" | "clay" | "sky" | "mono"
    },
    "cta": { "label": "Primary Action Button", "url": "${targetUrl}" },
    "links": [
      { "label": "Link 1", "url": "https://..." },
      { "label": "Link 2", "url": "https://..." }
    ],
    "services": [
      { "name": "Service / Offering 1", "price": "$49", "desc": "Compelling feature description" },
      { "name": "Service / Offering 2", "price": "$99", "desc": "Compelling feature description" },
      { "name": "Service / Offering 3", "price": "$149", "desc": "Compelling feature description" }
    ],
    "contact": {
      "phone": "+1 234 567 8900",
      "email": "contact@brand.com",
      "whatsapp": "12345678900",
      "instagram": "@brand",
      "address": "Location"
    }
  }
}

CRITICAL RULES:
1. Always respond with ONLY valid JSON. No markdown code fences, no extra chat text.
2. If the user prompt is vague, creative, or a single keyword (e.g. "coffee", "luxury", "barber"), infer an exquisite, top-tier aesthetic.
3. NEVER change the destination URL. Buttons must always lead to the locked destination.
4. Keep the designs visually modern: high contrast, clean typography, proper padding, elegant borders.`;

  const userContextMessage = `User Prompt: "${cleanPrompt}"
Current Elements Summary: ${JSON.stringify(currentNodesSummary.slice(0, 20))}
Selected Node: ${selectedNode ? JSON.stringify({ id: selectedNode.id, type: selectedNode.type, props: selectedNode.props }) : 'None'}`;

  const aiRes = await provider.generateText({
    system: systemPrompt,
    prompt: userContextMessage,
    temperature: 0.3,
    feature: 'landing-page-builder',
  });

  let rawJson: string = aiRes.text.trim();
  if (rawJson.startsWith('```')) {
    rawJson = rawJson.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch (parseErr) {
    console.warn('[Copilot AI Parse Warning]:', parseErr, 'Raw:', rawJson.slice(0, 200));
    // Graceful fallback to rich full generation
    parsed = {
      mode: 'full',
      summary: `Generated page design for "${cleanPrompt.slice(0, 30)}"`,
      page: {
        schemaVersion: 1,
        template: 'creator',
        brand: {
          name: cleanPrompt.slice(0, 20) || 'Creative Studio',
          headline: 'Architecting Digital Identity',
          tagline: `Engineered web experiences and interactive systems tailored for ${cleanPrompt}.`,
          palette: 'ink',
        },
        cta: {
          label: 'Get Started Today',
          url: targetUrl,
        },
        links: [
          { label: 'View Portfolio & Projects', url: 'https://github.com' },
          { label: 'Schedule Consultation', url: 'https://cal.com' },
        ],
        services: [
          { name: 'Core Design Sprint', price: '₦120,000', desc: 'Custom tokens and responsive layout.' },
          { name: 'Cloud Infrastructure', price: '₦200,000', desc: 'Global edge routing and high performance.' },
        ],
        contact: {
          phone: '+234 801 234 5678',
          email: 'hello@brand.io',
          whatsapp: '2348012345678',
          instagram: '@brand',
          address: 'Lagos, Nigeria',
        },
      },
    };
  }

  // Handle Mode A: Surgical Operations
  if (doc && parsed.mode === 'ops' && Array.isArray(parsed.ops) && parsed.ops.length > 0) {
    const applyResult = applyAiOperations(doc, {
      summary: parsed.summary || 'Applied AI design updates',
      ops: parsed.ops,
    });

    if (applyResult.success && applyResult.appliedCount > 0) {
      return {
        success: true,
        doc: applyResult.doc,
        summary: applyResult.summary,
        appliedCount: applyResult.appliedCount,
      };
    }
  }

  // Handle Mode B: Complete Page Architecture (or fallback if ops were invalid)
  if (parsed.page && typeof parsed.page === 'object') {
    const newDoc = migrateV2(parsed.page, targetUrl);
    return {
      success: true,
      doc: newDoc,
      summary: parsed.summary || `Architected full landing page for "${cleanPrompt.slice(0, 30)}"`,
    };
  }

  // If response had ops that all failed, fallback to smart full generation
  const fallbackPage: Page = {
    schemaVersion: 1,
    template: 'creator',
    brand: {
      name: cleanPrompt.slice(0, 24) || 'Dynamic Studio',
      headline: 'Engineered for Performance & Reach',
      tagline: `Interactive showcase crafted for ${cleanPrompt}.`,
      palette: 'ink',
    },
    cta: {
      label: 'Explore Our Work',
      url: targetUrl,
    },
    links: [
      { label: 'View Portfolio', url: 'https://github.com' },
      { label: 'Book Consultation', url: 'https://cal.com' },
    ],
    services: [
      { name: 'Direct Offering', price: '₦25,000', desc: 'Custom delivery tailored for you.' },
    ],
    contact: {
      email: '',
      phone: '',
      address: '',
      whatsapp: '',
      instagram: '',
    },
  };

  const newDoc = migrateV2(fallbackPage, targetUrl);
  return {
    success: true,
    doc: newDoc,
    summary: `Created customized layout for "${cleanPrompt.slice(0, 30)}"`,
  };
}
