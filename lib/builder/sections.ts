import { Doc, Node, NodeType, Style } from './schema';

export interface PrebuiltSection {
  id: string;
  name: string;
  category: 'hero' | 'features' | 'pricing' | 'faq' | 'contact' | 'testimonials';
  description: string;
  nodes: Record<string, Node>;
  rootNodeId: string;
}

/**
 * Hand-authored section library, responsive and verified across 390, 820, and 1280px.
 */
export const SECTION_LIBRARY: PrebuiltSection[] = [
  // 1. Hero Centered
  {
    id: 'sec_hero_centered',
    name: 'Hero Centered',
    category: 'hero',
    description: 'Impactful centered brand title, eyebrow badge, tagline, and locked CTA button.',
    rootNodeId: 'sec_hero_1',
    nodes: {
      sec_hero_1: {
        id: 'sec_hero_1',
        type: 'section',
        name: 'Hero Centered Section',
        parent: null,
        children: ['stk_hero_1', 'btn_hero_1'],
        style: {
          mobile: {
            display: 'flex',
            direction: 'column',
            align: 'center',
            width: 'fill',
            padding: [32, 16, 32, 16],
            gap: 16,
          },
          tablet: { padding: [48, 24, 48, 24] },
          desktop: { padding: [64, 32, 64, 32] },
        },
        props: {},
      },
      stk_hero_1: {
        id: 'stk_hero_1',
        type: 'stack',
        name: 'Hero Text Stack',
        parent: 'sec_hero_1',
        children: ['bdg_hero_1', 'hd_hero_1', 'txt_hero_1'],
        style: {
          mobile: {
            display: 'flex',
            direction: 'column',
            align: 'center',
            width: 'fill',
            gap: 8,
          },
        },
        props: {},
      },
      bdg_hero_1: {
        id: 'bdg_hero_1',
        type: 'badge',
        name: 'Eyebrow Badge',
        parent: 'stk_hero_1',
        children: [],
        style: {
          mobile: {
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'accent',
            textAlign: 'center',
          },
        },
        props: { text: 'Premium Experience' },
      },
      hd_hero_1: {
        id: 'hd_hero_1',
        type: 'heading',
        name: 'Main Title',
        parent: 'stk_hero_1',
        children: [],
        style: {
          mobile: { fontSize: 32, fontWeight: 800, textAlign: 'center', color: 'fg' },
          tablet: { fontSize: 40 },
          desktop: { fontSize: 48 },
        },
        props: { text: 'Elevate Your Digital Presence', level: 1 },
      },
      txt_hero_1: {
        id: 'txt_hero_1',
        type: 'text',
        name: 'Tagline Description',
        parent: 'stk_hero_1',
        children: [],
        style: {
          mobile: { fontSize: 16, textAlign: 'center', color: 'muted', maxWidth: { u: 'px', v: 460 } },
        },
        props: { text: 'Crafted with precision engineering for modern entrepreneurs.' },
      },
      btn_hero_1: {
        id: 'btn_hero_1',
        type: 'button',
        name: 'CTA Button',
        parent: 'sec_hero_1',
        children: [],
        locked: true,
        style: {
          mobile: {
            display: 'flex',
            align: 'center',
            justify: 'center',
            width: 'fill',
            height: { u: 'px', v: 52 },
            bg: 'accent',
            color: 'onAccent',
            radius: 14,
            fontSize: 16,
            fontWeight: 700,
          },
          tablet: { width: { u: 'px', v: 320 } },
        },
        props: { label: 'Get Started Today', variant: 'primary', bind: 'destination' },
      },
    },
  },

  // 2. Features Grid (3-Up on desktop)
  {
    id: 'sec_features_grid',
    name: 'Features 3-Up Grid',
    category: 'features',
    description: 'Showcase 3 core offerings or values with responsive 1/2/3 columns.',
    rootNodeId: 'sec_feat_1',
    nodes: {
      sec_feat_1: {
        id: 'sec_feat_1',
        type: 'section',
        name: 'Features Section',
        parent: null,
        children: ['hd_feat_1', 'grd_feat_1'],
        style: {
          mobile: {
            display: 'flex',
            direction: 'column',
            width: 'fill',
            padding: [24, 16, 24, 16],
            gap: 16,
          },
        },
        props: {},
      },
      hd_feat_1: {
        id: 'hd_feat_1',
        type: 'heading',
        name: 'Section Heading',
        parent: 'sec_feat_1',
        children: [],
        style: {
          mobile: { fontSize: 24, fontWeight: 700, textAlign: 'center', color: 'fg' },
        },
        props: { text: 'Why Choose Our Space', level: 2 },
      },
      grd_feat_1: {
        id: 'grd_feat_1',
        type: 'grid',
        name: '3-Up Grid Container',
        parent: 'sec_feat_1',
        children: ['crd_feat_a', 'crd_feat_b', 'crd_feat_c'],
        style: {
          mobile: { display: 'grid', columns: 1, gap: 12, width: 'fill' },
          tablet: { columns: 2, gap: 16 },
          desktop: { columns: 3, gap: 20 },
        },
        props: {},
      },
      crd_feat_a: {
        id: 'crd_feat_a',
        type: 'card',
        name: 'Feature Card 1',
        parent: 'grd_feat_1',
        children: ['itm_feat_a'],
        style: {
          mobile: {
            display: 'flex',
            direction: 'column',
            bg: 'surface',
            border: { w: 1, color: 'border' },
            radius: 12,
            padding: [16, 16, 16, 16],
            width: 'fill',
          },
        },
        props: {},
      },
      itm_feat_a: {
        id: 'itm_feat_a',
        type: 'priceItem',
        name: 'Feature 1 Item',
        parent: 'crd_feat_a',
        children: [],
        style: { mobile: { width: 'fill' } },
        props: { name: 'Direct Sourcing', desc: 'Sourced ethically from regional partners.' },
      },
      crd_feat_b: {
        id: 'crd_feat_b',
        type: 'card',
        name: 'Feature Card 2',
        parent: 'grd_feat_1',
        children: ['itm_feat_b'],
        style: {
          mobile: {
            display: 'flex',
            direction: 'column',
            bg: 'surface',
            border: { w: 1, color: 'border' },
            radius: 12,
            padding: [16, 16, 16, 16],
            width: 'fill',
          },
        },
        props: {},
      },
      itm_feat_b: {
        id: 'itm_feat_b',
        type: 'priceItem',
        name: 'Feature 2 Item',
        parent: 'crd_feat_b',
        children: [],
        style: { mobile: { width: 'fill' } },
        props: { name: 'Edge Performance', desc: 'Zero latency infrastructure worldwide.' },
      },
      crd_feat_c: {
        id: 'crd_feat_c',
        type: 'card',
        name: 'Feature Card 3',
        parent: 'grd_feat_1',
        children: ['itm_feat_c'],
        style: {
          mobile: {
            display: 'flex',
            direction: 'column',
            bg: 'surface',
            border: { w: 1, color: 'border' },
            radius: 12,
            padding: [16, 16, 16, 16],
            width: 'fill',
          },
        },
        props: {},
      },
      itm_feat_c: {
        id: 'itm_feat_c',
        type: 'priceItem',
        name: 'Feature 3 Item',
        parent: 'crd_feat_c',
        children: [],
        style: { mobile: { width: 'fill' } },
        props: { name: 'Instant Delivery', desc: 'Realtime order tracking via WhatsApp.' },
      },
    },
  },
];
