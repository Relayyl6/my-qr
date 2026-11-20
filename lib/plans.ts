export type PlanTier = 'free' | 'pro' | 'plus' | 'ultra';

export interface PlanEntitlements {
  name: string;
  level: number;
  link_slots: number;
  scans_monthly: number;
  ai_budget_usd: number;
  mailing_lists: number;
  subscribers_max: number;
  campaigns_per_month: number;
  custom_domains: number;
  branded_footer: boolean;
  microsaas: {
    shortener: number;
    vcard: number;
    wifi: number;
    menu: number;
    form: number;
    review: number;
    ticket: number;
    coupon: number;
    signup_widget: number;
    landing_page: number;
  };
  routing: {
    time_scheduled: boolean;
    device_os: boolean;
    geo_country: boolean;
  };
  export: {
    png_300dpi: boolean;
    svg: boolean;
  };
}

/**
 * Entitlements calibrated strictly to personal Gmail & Nodemailer capacity (max 500 emails/day):
 * - Free: 1 list, up to 10 contacts, 2 campaigns/mo
 * - Pro: 2 lists, up to 50 contacts, 5 campaigns/mo
 * - Plus: 5 lists, up to 100 contacts, 15 campaigns/mo
 * - Ultra: 10 lists, up to 500 contacts, 30 campaigns/mo (Gmail daily ceiling)
 */
export const PLANS: Record<PlanTier, PlanEntitlements> = {
  free: {
    name: 'Free',
    level: 0,
    link_slots: 5,
    scans_monthly: 1000,
    ai_budget_usd: 0.50,
    mailing_lists: 1,
    subscribers_max: 10,
    campaigns_per_month: 2,
    custom_domains: 0,
    branded_footer: true,
    microsaas: {
      shortener: 1,
      vcard: 1,
      wifi: 1,
      menu: 0,
      form: 0,
      review: 0,
      ticket: 0,
      coupon: 0,
      signup_widget: 0,
      landing_page: 0,
    },
    routing: {
      time_scheduled: false,
      device_os: false,
      geo_country: false,
    },
    export: {
      png_300dpi: true,
      svg: false,
    },
  },
  pro: {
    name: 'Pro',
    level: 1,
    link_slots: 50,
    scans_monthly: 25000,
    ai_budget_usd: 5.00,
    mailing_lists: 2,
    subscribers_max: 50,
    campaigns_per_month: 5,
    custom_domains: 0,
    branded_footer: false,
    microsaas: {
      shortener: 10,
      vcard: 5,
      wifi: 5,
      menu: 2,
      form: 1,
      review: 1,
      ticket: 0,
      coupon: 3,
      signup_widget: 0,
      landing_page: 1,
    },
    routing: {
      time_scheduled: true,
      device_os: true,
      geo_country: false,
    },
    export: {
      png_300dpi: true,
      svg: false,
    },
  },
  plus: {
    name: 'Plus',
    level: 2,
    link_slots: 500,
    scans_monthly: 250000,
    ai_budget_usd: 15.00,
    mailing_lists: 5,
    subscribers_max: 100,
    campaigns_per_month: 15,
    custom_domains: 1,
    branded_footer: false,
    microsaas: {
      shortener: 100,
      vcard: 25,
      wifi: 25,
      menu: 10,
      form: 10,
      review: 5,
      ticket: 10,
      coupon: 15,
      signup_widget: 5,
      landing_page: 3,
    },
    routing: {
      time_scheduled: true,
      device_os: true,
      geo_country: true,
    },
    export: {
      png_300dpi: true,
      svg: true,
    },
  },
  ultra: {
    name: 'Ultra',
    level: 3,
    link_slots: 999999,
    scans_monthly: 999999,
    ai_budget_usd: 50.00,
    mailing_lists: 10,
    subscribers_max: 500,
    campaigns_per_month: 30,
    custom_domains: 999999,
    branded_footer: false,
    microsaas: {
      shortener: 999999,
      vcard: 999999,
      wifi: 999999,
      menu: 999999,
      form: 999999,
      review: 999999,
      ticket: 999999,
      coupon: 999999,
      signup_widget: 999999,
      landing_page: 999999,
    },
    routing: {
      time_scheduled: true,
      device_os: true,
      geo_country: true,
    },
    export: {
      png_300dpi: true,
      svg: true,
    },
  },
};

export function getPlanEntitlements(tierString?: string | null): PlanEntitlements {
  const normalized = (tierString || 'free').toLowerCase() as PlanTier;
  return PLANS[normalized] || PLANS.free;
}

export function canAccessFeature(
  userTier: string | null | undefined,
  requiredTier: PlanTier,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) return true;
  const current = getPlanEntitlements(userTier);
  const required = PLANS[requiredTier];
  return current.level >= required.level;
}
