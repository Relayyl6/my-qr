export interface AdminPromoConfig {
  banner: {
    enabled: boolean;
    badgeText: string;
    messageText: string;
    promoCode: string;
    ctaText: string;
    ctaUrl: string;
  };
  modal: {
    enabled: boolean;
    badgeText: string;
    headline: string;
    bodyText: string;
    discountPercent: number;
    promoCode: string;
    ctaText: string;
    frequencyDays: number;
    requireEmail?: boolean;
    emailPlaceholder?: string;
    emailButtonText?: string;
  };
}

/**
 * Default clean state: Completely disabled and empty until admin explicitly configures it.
 * No hardcoded marketing copy or fallbacks.
 */
export const DEFAULT_PROMO_CONFIG: AdminPromoConfig = {
  banner: {
    enabled: false,
    badgeText: '',
    messageText: '',
    promoCode: '',
    ctaText: 'Claim Offer',
    ctaUrl: '/pricing',
  },
  modal: {
    enabled: false,
    badgeText: '',
    headline: '',
    bodyText: '',
    discountPercent: 0,
    promoCode: '',
    ctaText: 'Claim Discount',
    frequencyDays: 7,
    requireEmail: false,
    emailPlaceholder: '',
    emailButtonText: 'Get Code',
  },
};

/**
 * Sample campaign templates optionally loadable on-demand in the Admin Console
 * via click to populate form fields. Never active or shown by default.
 */
export const SAMPLE_PROMO_TEMPLATES = {
  black_friday: {
    name: 'Black Friday 40% Off',
    banner: {
      enabled: true,
      badgeText: 'BLACK FRIDAY',
      messageText: 'Save 40% OFF all annual plans with code',
      promoCode: 'BLACKFRIDAY40',
      ctaText: 'Claim Offer',
      ctaUrl: '/pricing?promo=BLACKFRIDAY40',
    },
    modal: {
      enabled: true,
      badgeText: 'BLACK FRIDAY SPECIAL',
      headline: 'Unlock 40% Off DynamicQR Pro & Plus',
      bodyText: 'Get high-converting QR codes, 307 speed redirects, branded domains, and AI routing.',
      discountPercent: 40,
      promoCode: 'BLACKFRIDAY40',
      ctaText: 'Claim 40% Discount',
      frequencyDays: 7,
    },
  },
  flash_sale: {
    name: 'Flash Sale 25% Off',
    banner: {
      enabled: true,
      badgeText: 'FLASH SALE',
      messageText: 'Limited time: 25% OFF all upgrades with code',
      promoCode: 'FLASH25',
      ctaText: 'Upgrade Now',
      ctaUrl: '/pricing?promo=FLASH25',
    },
    modal: {
      enabled: true,
      badgeText: 'LIMITED FLASH SALE',
      headline: 'Save 25% on Any Paid Plan',
      bodyText: 'Upgrade your dynamic routing links, unbranded micro-apps, and custom domains.',
      discountPercent: 25,
      promoCode: 'FLASH25',
      ctaText: 'Claim 25% Off',
      frequencyDays: 3,
    },
  },
};
