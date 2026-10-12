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
    monthlyPrice: 5,
    yearlyPrice: 48, // $4/mo billed yearly ($48/yr)
    monthlyAiBudget: 5.0,
    maxLinks: 50,
    priceIdMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
  plus: {
    id: "plus",
    name: "Plus",
    monthlyPrice: 12,
    yearlyPrice: 120, // $10/mo billed yearly ($120/yr)
    monthlyAiBudget: 15.0,
    maxLinks: 500,
    priceIdMonthly: process.env.STRIPE_PRICE_PLUS_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_PLUS_YEARLY,
  },
  ultra: {
    id: "ultra",
    name: "Ultra",
    monthlyPrice: 29,
    yearlyPrice: 290, // ~$24/mo billed yearly ($290/yr)
    monthlyAiBudget: 50.0,
    maxLinks: 999999,
    priceIdMonthly: process.env.STRIPE_PRICE_ULTRA_MONTHLY,
    priceIdYearly: process.env.STRIPE_PRICE_ULTRA_YEARLY,
  },
};
