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
    const promoCodeStr = (body.promoCode || "").toString().trim().toUpperCase();

    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Validate Promo Code if provided
    let discountPercent = 0;
    let appliedPromoRecord: any = null;

    if (promoCodeStr) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCodeStr },
      });

      if (promo && promo.active) {
        const notExpired = !promo.expiresAt || promo.expiresAt > new Date();
        const hasUses = !promo.maxRedemptions || promo.redemptionsCount < promo.maxRedemptions;
        const matchesPlan = promo.appliesTo === "all" || promo.appliesTo === planId;
        const matchesBilling =
          promo.billingPeriod === "both" ||
          promo.billingPeriod === (interval === "year" ? "annual" : "monthly");

        if (notExpired && hasUses && matchesPlan && matchesBilling) {
          appliedPromoRecord = promo;
          discountPercent = promo.type === "percent" ? Number(promo.value) : 0;
        }
      } else if (promoCodeStr === "BLACKFRIDAY40") {
        // Fallback default 40% discount
        discountPercent = 40;
      }
    }

    // If Stripe secret key is not set, provide seamless test upgrade mode
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder_key") {
      console.info(
        `[Billing] Stripe key not configured. Executing instant development upgrade to ${planId} with discount: ${discountPercent}% (${promoCodeStr || 'no promo'})`
      );

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

      // Increment redemption count if promo used
      if (appliedPromoRecord) {
        await prisma.promoCode.update({
          where: { id: appliedPromoRecord.id },
          data: { redemptionsCount: { increment: 1 } },
        }).catch(() => {});
      }

      const redirectParams = new URLSearchParams({
        tier: planId,
        mode: "dev",
        ...(promoCodeStr ? { promo: promoCodeStr, discount: String(discountPercent) } : {}),
      });

      return NextResponse.json({
        url: `${origin}/billing/success?${redirectParams.toString()}`,
      });
    }

    // Real Stripe Checkout Session creation
    const basePriceAmount = interval === "year" ? plan.yearlyPrice * 100 : plan.monthlyPrice * 100;
    let finalPriceAmount = basePriceAmount;

    if (discountPercent > 0) {
      finalPriceAmount = Math.max(50, Math.round(basePriceAmount * (1 - discountPercent / 100)));
    }

    // Check or create Stripe Customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      try {
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
      } catch (custErr: any) {
        console.warn("[Billing] Stripe customer create non-fatal warning:", custErr.message);
      }
    }

    const lineItem = {
      price_data: {
        currency: "usd",
        product_data: {
          name: `DynamicQR ${plan.name} Plan${
            discountPercent > 0 ? ` (${discountPercent}% OFF with ${promoCodeStr})` : ""
          }`,
          description: `AI-powered dynamic QR codes, analytics, and ${plan.monthlyAiBudget}/mo AI budget.${
            discountPercent > 0 ? ` Promo code ${promoCodeStr} applied.` : ""
          }`,
        },
        unit_amount: finalPriceAmount,
        recurring: {
          interval: interval === "year" ? "year" : "month",
        },
      },
      quantity: 1,
    };

    const sessionParams: any = {
      line_items: [lineItem],
      mode: "subscription",
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        userId: user.id,
        tier: planId,
        promoCode: promoCodeStr || undefined,
        discountPercent: discountPercent > 0 ? String(discountPercent) : undefined,
      },
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Increment redemption count
    if (appliedPromoRecord) {
      await prisma.promoCode.update({
        where: { id: appliedPromoRecord.id },
        data: { redemptionsCount: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe Checkout Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
