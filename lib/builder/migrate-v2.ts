import { Page } from '@/lib/page/schema';
import { PALETTES, PaletteKey } from '@/lib/page/config';
import { Doc, Node, PaletteTokenKey } from './schema';

export const KNOWN_V2_PLACEHOLDERS = {
  brandName: 'My Business',
  headline: 'Welcome to our space',
  tagline: 'Simple, direct, and made for our community.',
  serviceName: 'Core Offering',
  serviceDesc: 'Direct service tailored for you.',
};

/**
 * Pure function migrating a V2 flat Page document into a V3 Doc.
 * Preserves mobile layout 1:1, while providing responsive overrides
 * for tablet (820px) and desktop (1280px).
 */
export function migrateV2(page: Page, fallbackDestinationUrl?: string): Doc {
  const destinationUrl = (page.cta?.url || fallbackDestinationUrl || 'https://dynamicqr.io').trim();
  const rawPaletteKey = (page.brand?.palette || 'ink') as PaletteKey;
  const palette = PALETTES[rawPaletteKey] || PALETTES.ink;

  const validPaletteKey: PaletteTokenKey = (['ink', 'sand', 'forest', 'clay', 'sky', 'mono'].includes(rawPaletteKey)
    ? rawPaletteKey
    : 'custom') as PaletteTokenKey;

  const nodes: Record<string, Node> = {};

  // 1. Root Section
  const rootSectionId = 'sec_main';
  const heroStackId = 'stk_hero';
  const badgeId = 'bdg_brand';
  const headingId = 'hd_title';
  const taglineId = 'txt_tagline';
  const ctaBtnId = 'btn_cta';
  const linksStackId = 'stk_links';
  const servicesGridId = 'grd_services';
  const contactId = 'cnt_main';
  const footerId = 'ftr_main';

  const rootChildren: string[] = [heroStackId, ctaBtnId];

  // Hero Stack
  const heroChildren: string[] = [badgeId, headingId];
  if (page.brand?.tagline) {
    heroChildren.push(taglineId);
  }

  // Brand Name Badge
  const isBrandPlaceholder = page.brand?.name?.trim() === KNOWN_V2_PLACEHOLDERS.brandName;
  nodes[badgeId] = {
    id: badgeId,
    type: 'badge',
    name: 'Brand Name Eyebrow',
    parent: heroStackId,
    children: [],
    placeholder: isBrandPlaceholder,
    style: {
      mobile: {
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.08,
        color: palette.bg === '#0F172A' ? '#38BDF8' : 'accent',
        textAlign: 'center',
        margin: [0, 0, 8, 0],
      },
    },
    props: {
      text: page.brand?.name || 'My Business',
    },
  };

  // Headline
  const isHeadlinePlaceholder = page.brand?.headline?.trim() === KNOWN_V2_PLACEHOLDERS.headline;
  nodes[headingId] = {
    id: headingId,
    type: 'heading',
    name: 'Hero Title',
    parent: heroStackId,
    children: [],
    placeholder: isHeadlinePlaceholder,
    style: {
      mobile: {
        fontSize: 28,
        fontWeight: 800,
        lineHeight: 1.15,
        letterSpacing: 0,
        textAlign: 'center',
        color: 'fg',
      },
      tablet: {
        fontSize: 34,
      },
      desktop: {
        fontSize: 38,
      },
    },
    props: {
      text: page.brand?.headline || 'Welcome to our space',
      level: 1,
    },
  };

  // Tagline
  if (page.brand?.tagline) {
    const isTaglinePlaceholder = page.brand?.tagline?.trim() === KNOWN_V2_PLACEHOLDERS.tagline;
    nodes[taglineId] = {
      id: taglineId,
      type: 'text',
      name: 'Hero Tagline',
      parent: heroStackId,
      children: [],
      placeholder: isTaglinePlaceholder,
      style: {
        mobile: {
          fontSize: 15,
          lineHeight: 1.5,
          textAlign: 'center',
          color: 'muted',
          maxWidth: { u: 'px', v: 420 },
          margin: [8, 0, 0, 0],
        },
      },
      props: {
        text: page.brand.tagline,
      },
    };
  }

  // Hero Stack Container
  nodes[heroStackId] = {
    id: heroStackId,
    type: 'stack',
    name: 'Hero Stack',
    parent: rootSectionId,
    children: heroChildren,
    style: {
      mobile: {
        display: 'flex',
        direction: 'column',
        align: 'center',
        justify: 'center',
        width: 'fill',
        padding: [16, 0, 12, 0],
      },
    },
    props: {},
  };

  // CTA Button (Bound to destination URL, locked)
  nodes[ctaBtnId] = {
    id: ctaBtnId,
    type: 'button',
    name: 'Primary CTA Button',
    parent: rootSectionId,
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
        radius: 16,
        fontSize: 16,
        fontWeight: 700,
        shadow: 'md',
        padding: [14, 24, 14, 24],
      },
      tablet: {
        width: { u: 'px', v: 340 },
      },
      desktop: {
        width: { u: 'px', v: 360 },
      },
    },
    props: {
      label: page.cta?.label || 'Visit Website',
      variant: 'primary',
      bind: 'destination',
    },
  };

  // Secondary Links
  if (page.links && page.links.length > 0) {
    rootChildren.push(linksStackId);
    const linkChildIds: string[] = [];

    page.links.forEach((link, idx) => {
      const linkId = `lnk_${idx + 1}`;
      linkChildIds.push(linkId);
      nodes[linkId] = {
        id: linkId,
        type: 'linkRow',
        name: `Link: ${link.label}`,
        parent: linksStackId,
        children: [],
        style: {
          mobile: {
            display: 'flex',
            align: 'center',
            justify: 'between',
            width: 'fill',
            bg: 'surface',
            color: 'fg',
            border: { w: 1, color: 'border' },
            radius: 12,
            padding: [14, 16, 14, 16],
            fontSize: 14,
            fontWeight: 500,
          },
        },
        props: {
          label: link.label,
          href: link.url,
        },
      };
    });

    nodes[linksStackId] = {
      id: linksStackId,
      type: 'stack',
      name: 'Links Stack',
      parent: rootSectionId,
      children: linkChildIds,
      style: {
        mobile: {
          display: 'flex',
          direction: 'column',
          gap: 10,
          width: 'fill',
          margin: [16, 0, 0, 0],
        },
      },
      props: {},
    };
  }

  // Services or Offerings
  if (page.services && page.services.length > 0) {
    rootChildren.push(servicesGridId);
    const serviceChildIds: string[] = [];

    page.services.forEach((s, idx) => {
      const cardId = `crd_srv_${idx + 1}`;
      const itemId = `itm_srv_${idx + 1}`;
      serviceChildIds.push(cardId);

      const isServicePlaceholder = s.name.trim() === KNOWN_V2_PLACEHOLDERS.serviceName;

      nodes[itemId] = {
        id: itemId,
        type: 'priceItem',
        name: `Service: ${s.name}`,
        parent: cardId,
        children: [],
        placeholder: isServicePlaceholder,
        style: {
          mobile: {
            width: 'fill',
          },
        },
        props: {
          name: s.name,
          price: s.price || undefined,
          desc: s.desc || undefined,
        },
      };

      nodes[cardId] = {
        id: cardId,
        type: 'card',
        name: `Card: ${s.name}`,
        parent: servicesGridId,
        children: [itemId],
        style: {
          mobile: {
            display: 'flex',
            direction: 'column',
            bg: 'surface',
            color: 'fg',
            border: { w: 1, color: 'border' },
            radius: 14,
            padding: [16, 16, 16, 16],
            width: 'fill',
          },
        },
        props: {},
      };
    });

    nodes[servicesGridId] = {
      id: servicesGridId,
      type: 'grid',
      name: 'Services Grid',
      parent: rootSectionId,
      children: serviceChildIds,
      style: {
        mobile: {
          display: 'grid',
          columns: 1,
          gap: 12,
          width: 'fill',
          margin: [18, 0, 0, 0],
        },
        tablet: {
          columns: 2,
          gap: 16,
        },
        desktop: {
          columns: 3,
          gap: 20,
        },
      },
      props: {},
    };
  }

  // Contact & Socials
  if (
    page.contact &&
    (page.contact.phone ||
      page.contact.email ||
      page.contact.whatsapp ||
      page.contact.address ||
      page.contact.instagram)
  ) {
    rootChildren.push(contactId);
    nodes[contactId] = {
      id: contactId,
      type: 'contact',
      name: 'Contact Info',
      parent: rootSectionId,
      children: [],
      style: {
        mobile: {
          display: 'flex',
          direction: 'column',
          width: 'fill',
          gap: 8,
          margin: [20, 0, 0, 0],
        },
      },
      props: {
        phone: page.contact.phone || undefined,
        email: page.contact.email || undefined,
        whatsapp: page.contact.whatsapp || undefined,
        address: page.contact.address || undefined,
      },
    };
  }

  // Footer
  rootChildren.push(footerId);
  nodes[footerId] = {
    id: footerId,
    type: 'footer',
    name: 'Footer',
    parent: rootSectionId,
    children: [],
    style: {
      mobile: {
        fontSize: 12,
        color: 'muted',
        textAlign: 'center',
        padding: [24, 0, 16, 0],
      },
    },
    props: {
      poweredBy: true,
    },
  };

  // Root Section
  nodes[rootSectionId] = {
    id: rootSectionId,
    type: 'section',
    name: 'Main Page Section',
    parent: null,
    children: rootChildren,
    style: {
      mobile: {
        display: 'flex',
        direction: 'column',
        align: 'center',
        width: 'fill',
        maxWidth: { u: 'px', v: 480 },
        padding: [24, 16, 32, 16],
        gap: 16,
      },
      tablet: {
        maxWidth: { u: 'px', v: 720 },
        padding: [40, 24, 48, 24],
      },
      desktop: {
        maxWidth: { u: 'px', v: 1120 },
        padding: [56, 32, 64, 32],
      },
    },
    props: {},
  };

  return {
    schemaVersion: 3,
    root: rootSectionId,
    nodes,
    destination: {
      url: destinationUrl.startsWith('https://') ? destinationUrl : `https://${destinationUrl}`,
    },
    tokens: {
      palette: validPaletteKey,
      colors: {
        bg: palette.bg,
        fg: palette.fg,
        accent: palette.accent,
        muted: palette.bg === '#0F172A' ? '#94A3B8' : '#71717A',
        surface: palette.cardBg,
        border: palette.border,
        onAccent: '#FFFFFF',
      },
      fonts: {
        body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      },
      radius: 16,
      spacingUnit: 8,
    },
    meta: {
      title: `${page.brand?.name || 'My Business'} | DynamicQR`,
      description: page.brand?.tagline || page.brand?.headline || 'Mobile showcase powered by DynamicQR',
    },
  };
}
