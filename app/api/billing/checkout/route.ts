import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { TIER_CONFIGS } from "@/lib/ai/flags";
import { getDomainPricingConfig } from "@/lib/domains/fxEngine";

export const dynamic = "force-dynamic";

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

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://my-qr-sandy.vercel.app";

    // 1. Validate Promo Code if provided
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
      }
    }

    // 2. Compute USD Price (inclusive of +$1 markup across all tiers)
    const baseUsd = interval === "year" ? plan.yearlyPrice : plan.monthlyPrice;
    let finalUsd = baseUsd;
    if (discountPercent > 0) {
      finalUsd = Math.max(1, Number((baseUsd * (1 - discountPercent / 100)).toFixed(2)));
    }

    // 3. Fetch active buffered/manual FX Rate from Sovereignty Engine
    const pricingConfig = await getDomainPricingConfig().catch(() => null);
    const effectiveRate = pricingConfig
      ? pricingConfig.mode === "manual_override"
        ? pricingConfig.manualOverrideRate
        : pricingConfig.bufferedRate
      : 1400;

    // 4. Calculate Final Naira Price (rounded up to nearest ₦100)
    const finalPriceNgn = Math.ceil((finalUsd * effectiveRate) / 100) * 100;
    const amountKobo = finalPriceNgn * 100;

    const reference = `SUB_${planId.toUpperCase()}_${user.id.slice(-6)}_${Date.now()}`;
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // 5. If Paystack Live/Test key is available, initialize Paystack transaction
    if (paystackSecret && !paystackSecret.includes("placeholder")) {
      const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: amountKobo,
          currency: "NGN",
          reference,
          callback_url: `${origin}/billing/success?tier=${planId}&ref=${reference}&session_id=${reference}`,
          metadata: {
            userId: user.id,
            planId,
            interval,
            usdAmount: finalUsd,
            ngnAmount: finalPriceNgn,
            effectiveFxRate: effectiveRate,
            promoCode: promoCodeStr || undefined,
            discountPercent: discountPercent > 0 ? String(discountPercent) : undefined,
            custom_fields: [
              {
                display_name: "Plan Tier",
                variable_name: "plan_tier",
                value: planId.toUpperCase(),
              },
              {
                display_name: "Billing Interval",
                variable_name: "billing_interval",
                value: interval === "year" ? "Annual" : "Monthly",
              },
              {
                display_name: "USD Amount",
                variable_name: "usd_amount",
                value: `$${finalUsd}`,
              },
              {
                display_name: "FX Rate (USD to NGN)",
                variable_name: "fx_rate",
                value: `₦${effectiveRate}/$1`,
              },
            ],
          },
        }),
      });

      const paystackData = await paystackRes.json();
      if (!paystackData.status) {
        throw new Error(paystackData.message || "Paystack checkout initialization failed");
      }

      // Increment redemption count if promo used
      if (appliedPromoRecord) {
        await prisma.promoCode.update({
          where: { id: appliedPromoRecord.id },
          data: { redemptionsCount: { increment: 1 } },
        }).catch(() => {});
      }

      return NextResponse.json({ url: paystackData.data.authorization_url });
    }

    // 6. Reject checkout when payment gateway key is not configured
    return NextResponse.json(
      {
        error:
          "Subscription checkout is temporarily unavailable because the payment gateway is not configured in this environment.",
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error("[Paystack Checkout Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
