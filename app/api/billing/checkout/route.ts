import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { TIER_CONFIGS } from "@/lib/ai/flags";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in first." }, { status: 401 });
    }

    const body = await req.json();
    const planId = (body.planId || "pro").toLowerCase();
    const interval = body.interval === "year" ? "year" : "month";

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // If Stripe secret key is not set, provide seamless test upgrade mode
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder_key") {
      console.info(`[Billing] Stripe key not configured. Executing instant development upgrade to ${planId}`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { tier: planId },
      });

      const tierConfig = TIER_CONFIGS[planId] || TIER_CONFIGS.pro;
      await prisma.aiCredit.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          monthlyLimitUsd: tierConfig.monthlyLimitUsd,
          usedThisMonth: 0,
        },
        update: {
          monthlyLimitUsd: tierConfig.monthlyLimitUsd,
        },
      });

      return NextResponse.json({
        url: `${origin}/billing/success?tier=${planId}&mode=dev`,
      });
    }

    // Real Stripe Checkout Session creation
    const priceAmount = interval === "year" ? plan.yearlyPrice * 100 : plan.monthlyPrice * 100;
    
    // Check or create Stripe Customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `DynamicQR ${plan.name} Plan`,
              description: `AI-powered dynamic QR codes, analytics, and ${plan.monthlyAiBudget}/mo AI budget.`,
            },
            unit_amount: priceAmount,
            recurring: {
              interval: interval === "year" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        userId: user.id,
        tier: planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe Checkout Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
