import Stripe from "stripe";

// Initialize Stripe client. Falls back cleanly if key is not yet set in .env
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key", {
  apiVersion: "2026-09-30.endive" as any,
  typescript: true,
});

export interface PlanDetails {
  id: "pro" | "plus" | "ultra";
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyAiBudget: number;
  maxLinks: number;
  priceIdMonthly?: string;
  priceIdYearly?: string;
}

export const PLANS: Record<string, PlanDetails> = {
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 6, // $5 + $1 markup
    yearlyPrice: 60, // $5/mo billed yearly ($60/yr, +$12/yr markup)
    monthlyAiBudget: 5.0,
    maxLinks: 50,
    priceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  plus: {
    id: "plus",
    name: "Plus",
    monthlyPrice: 13, // $12 + $1 markup
    yearlyPrice: 132, // $11/mo billed yearly ($132/yr, +$12/yr markup)
    monthlyAiBudget: 15.0,
    maxLinks: 500,
    priceIdMonthly: process.env.STRIPE_PRICE_PLUS_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_PLUS_YEARLY,
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    monthlyPrice: 21, // $20 + $1 markup
    yearlyPrice: 212, // ~$17.67/mo billed yearly ($212/yr, +$12/yr markup)
    monthlyAiBudget: 50.0,
    maxLinks: 999999,
    priceIdMonthly: process.env.STRIPE_PRICE_ULTRA_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_ULTRA_YEARLY,
  },
};

/**
 * Calculates Paystack Naira price using the active scaled FX engine rate
 */
export function calculatePlanNgnPrice(
  planId: string,
  interval: "month" | "year",
  effectiveFxRate: number = 1400
): { usdPrice: number; ngnPrice: number } {
  const plan = PLANS[planId] || PLANS.pro;
  const usdPrice = interval === "year" ? plan.yearlyPrice : plan.monthlyPrice;
  const ngnPrice = Math.ceil((usdPrice * effectiveFxRate) / 100) * 100;
  return { usdPrice, ngnPrice };
}
