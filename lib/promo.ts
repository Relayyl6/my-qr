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
  };
}

export const DEFAULT_PROMO_CONFIG: AdminPromoConfig = {
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
};
