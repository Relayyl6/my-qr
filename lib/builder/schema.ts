import { z } from 'zod';

export const BP = ['mobile', 'tablet', 'desktop'] as const;
export type Bp = (typeof BP)[number];

export const BREAKPOINTS = {
  mobile: { minWidth: 0, frameWidth: 390, frameHeight: 844 },
  tablet: { minWidth: 768, frameWidth: 820, frameHeight: 1180 },
  desktop: { minWidth: 1024, frameWidth: 1280, frameHeight: 800 },
} as const;

export const NODE_TYPES = [
  'section',
  'stack',
  'grid',
  'free',
  'heading',
  'text',
  'button',
  'linkRow',
  'image',
  'gallery',
  'card',
  'priceItem',
  'badge',
  'divider',
  'spacer',
  'icon',
  'social',
  'contact',
  'accordion',
  'testimonial',
  'video',
  'map',
  'qr',
  'footer',
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

// Allowlisted style vocabulary. Anything not listed here cannot be stored.
const Px = z.number().min(0).max(4000);
const Size = z.union([
  z.object({ u: z.literal('px'), v: Px }),
  z.object({ u: z.literal('%'), v: z.number().min(0).max(100) }),
  z.literal('fill'), // flex: 1 / 100%
  z.literal('hug'), // fit-content
  z.literal('auto'),
]);
const Space = z.number().min(0).max(400);
const ColorToken = z
  .string()
  .regex(/^(bg|fg|accent|muted|surface|border|onAccent|#[0-9a-fA-F]{6})$/);

export const StyleSchema = z
  .object({
    // layout
    display: z.enum(['flex', 'grid', 'block', 'none']),
    direction: z.enum(['row', 'column']),
    wrap: z.boolean(),
    align: z.enum(['start', 'center', 'end', 'stretch']),
    justify: z.enum(['start', 'center', 'end', 'between']),
    gap: Space,
    columns: z.number().int().min(1).max(6), // grid
    // box
    width: Size,
    height: Size,
    minWidth: Size,
    maxWidth: Size,
    minHeight: Size,
    padding: z.tuple([Space, Space, Space, Space]), // top right bottom left
    margin: z.tuple([Space, Space, Space, Space]),
    aspectRatio: z.enum(['auto', '1/1', '4/3', '3/2', '16/9', '3/4', '2/3']),
    overflow: z.enum(['visible', 'hidden']),
    // free-position children only
    position: z.enum(['static', 'absolute']),
    x: z.number().min(-2000).max(4000),
    y: z.number().min(-2000).max(4000),
    zIndex: z.number().int().min(0).max(100),
    rotate: z.number().min(-180).max(180),
    // look
    bg: ColorToken,
    bgImage: z.string().uuid(), // media id, never a raw URL
    bgOverlay: z.number().min(0).max(0.9),
    radius: z.number().min(0).max(999),
    border: z.object({ w: z.number().min(0).max(8), color: ColorToken }),
    shadow: z.enum(['none', 'sm', 'md', 'lg']),
    opacity: z.number().min(0).max(1),
    // type
    fontFamily: z.enum(['body', 'display', 'mono']),
    fontSize: z.number().min(10).max(120),
    fontWeight: z.union([
      z.literal(400),
      z.literal(500),
      z.literal(600),
      z.literal(700),
      z.literal(800),
    ]),
    lineHeight: z.number().min(0.9).max(2.2),
    letterSpacing: z.number().min(-0.02).max(0.2), // em. Negative floor is deliberately tiny
    textAlign: z.enum(['left', 'center', 'right']),
    color: ColorToken,
    textTransform: z.enum(['none', 'uppercase', 'capitalize', 'lowercase']),
    objectFit: z.enum(['cover', 'contain']),
  })
  .partial()
  .strict();
export type Style = z.infer<typeof StyleSchema>;

// Per-type prop schemas
export const PROP_SCHEMAS: Record<NodeType, z.ZodTypeAny> = {
  section: z.object({
    anchorId: z.string().max(40).optional(),
  }).strict(),
  stack: z.object({}).strict(),
  grid: z.object({}).strict(),
  free: z.object({}).strict(),
  heading: z.object({
    text: z.string().min(1).max(200),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(1),
  }).strict(),
  text: z.object({
    text: z.string().max(1000),
  }).strict(),
  button: z.object({
    label: z.string().min(1).max(80),
    variant: z.enum(['primary', 'secondary', 'ghost']).default('primary'),
    bind: z.union([z.literal('destination'), z.string().url()]).default('destination'),
    icon: z.string().optional(),
  }).strict(),
  linkRow: z.object({
    label: z.string().min(1).max(80),
    subtitle: z.string().max(140).optional(),
    href: z.string().url(),
    icon: z.string().optional(),
  }).strict(),
  image: z.object({
    mediaId: z.string().uuid().or(z.string().min(1)), // UUID or local asset ID
    alt: z.string().max(160),
    fit: z.enum(['cover', 'contain']).default('cover'),
    urlFallback: z.string().url().optional(),
  }).strict(),
  gallery: z.object({
    mediaIds: z.array(z.string().uuid().or(z.string().min(1))).max(12),
  }).strict(),
  card: z.object({}).strict(),
  priceItem: z.object({
    name: z.string().min(1).max(100),
    price: z.string().max(30).optional(),
    desc: z.string().max(200).optional(),
  }).strict(),
  badge: z.object({
    text: z.string().min(1).max(50),
  }).strict(),
  divider: z.object({}).strict(),
  spacer: z.object({
    height: z.number().min(4).max(200).default(24),
  }).strict(),
  icon: z.object({
    name: z.string().min(1).max(50),
  }).strict(),
  social: z.object({
    links: z.array(
      z.object({
        network: z.enum(['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok', 'github']),
        handle: z.string().min(1).max(60),
      })
    ).max(8),
  }).strict(),
  contact: z.object({
    phone: z.string().max(30).optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().max(200).optional(),
    whatsapp: z.string().max(30).optional(),
  }).strict(),
  accordion: z.object({
    items: z.array(
      z.object({
        question: z.string().min(1).max(140),
        answer: z.string().min(1).max(500),
      })
    ).max(10),
  }).strict(),
  testimonial: z.object({
    quote: z.string().min(1).max(300),
    name: z.string().min(1).max(80),
    role: z.string().max(80).optional(),
  }).strict(),
  video: z.object({
    provider: z.enum(['youtube', 'vimeo']),
    videoId: z.string().min(1).max(50),
  }).strict(),
  map: z.object({
    address: z.string().min(1).max(200),
  }).strict(),
  qr: z.object({}).strict(),
  footer: z.object({
    poweredBy: z.boolean().default(true),
  }).strict(),
};

// Node Schema
export const NodeSchema = z.object({
  id: z.string().regex(/^[a-z0-9_-]{4,24}$/),
  type: z.enum(NODE_TYPES),
  name: z.string().max(60).optional(), // layer name
  parent: z.string().nullable(),
  children: z.array(z.string()),
  locked: z.boolean().optional(), // cannot be moved or deleted by user or AI
  placeholder: z.boolean().optional(), // copy not yet written by a human or AI
  hidden: z
    .object({
      mobile: z.boolean(),
      tablet: z.boolean(),
      desktop: z.boolean(),
    })
    .partial()
    .optional(),
  style: z.object({
    mobile: StyleSchema, // base, always present
    tablet: StyleSchema.optional(), // overrides at >= 768px
    desktop: StyleSchema.optional(), // overrides at >= 1024px
  }),
  props: z.record(z.unknown()), // validated per type using PROP_SCHEMAS[node.type]
});
export type Node = z.infer<typeof NodeSchema>;

// Palette tokens
export const PALETTE_KEYS = ['ink', 'sand', 'forest', 'clay', 'sky', 'mono', 'custom'] as const;
export type PaletteTokenKey = (typeof PALETTE_KEYS)[number];

export const DocSchema = z.object({
  schemaVersion: z.literal(3),
  root: z.string(),
  nodes: z.record(NodeSchema),
  destination: z.object({
    url: z.string().url().startsWith('https://'),
  }), // THE locked destination URL
  tokens: z.object({
    palette: z.enum(PALETTE_KEYS),
    colors: z.object({
      bg: z.string(),
      fg: z.string(),
      accent: z.string(),
      muted: z.string(),
      surface: z.string(),
      border: z.string(),
      onAccent: z.string(),
    }),
    fonts: z.object({
      body: z.string(),
      display: z.string(),
      mono: z.string(),
    }),
    radius: z.number(),
    spacingUnit: z.number(),
  }),
  meta: z.object({
    title: z.string().max(70),
    description: z.string().max(160),
    ogMediaId: z.string().uuid().optional(),
  }),
});
export type Doc = z.infer<typeof DocSchema>;

// Containment Rules: CAN_CONTAIN[parentType] defines valid child types
export const CAN_CONTAIN: Record<string, readonly NodeType[]> = {
  root: ['section'],
  section: [
    'stack',
    'grid',
    'free',
    'card',
    'heading',
    'text',
    'button',
    'linkRow',
    'image',
    'gallery',
    'priceItem',
    'badge',
    'divider',
    'spacer',
    'icon',
    'social',
    'contact',
    'accordion',
    'testimonial',
    'video',
    'map',
    'qr',
    'footer',
  ],
  stack: [
    'stack',
    'grid',
    'free',
    'card',
    'heading',
    'text',
    'button',
    'linkRow',
    'image',
    'gallery',
    'priceItem',
    'badge',
    'divider',
    'spacer',
    'icon',
    'social',
    'contact',
    'accordion',
    'testimonial',
    'video',
    'map',
    'qr',
  ],
  grid: [
    'stack',
    'card',
    'heading',
    'text',
    'button',
    'linkRow',
    'image',
    'priceItem',
    'badge',
    'icon',
    'social',
    'testimonial',
  ],
  free: [
    'stack',
    'card',
    'heading',
    'text',
    'button',
    'image',
    'badge',
    'icon',
    'qr',
  ],
  card: [
    'stack',
    'heading',
    'text',
    'button',
    'linkRow',
    'image',
    'priceItem',
    'badge',
    'divider',
    'spacer',
    'icon',
    'social',
  ],
  // Leaf nodes cannot contain any children
  heading: [],
  text: [],
  button: [],
  linkRow: [],
  image: [],
  gallery: [],
  priceItem: [],
  badge: [],
  divider: [],
  spacer: [],
  icon: [],
  social: [],
  contact: [],
  accordion: [],
  testimonial: [],
  video: [],
  map: [],
  qr: [],
  footer: [],
};

export function canContain(parentType: string, childType: NodeType): boolean {
  const allowed = CAN_CONTAIN[parentType];
  return allowed ? allowed.includes(childType) : false;
}
