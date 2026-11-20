import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const code = (body.code || "").toString().trim().toUpperCase();
    const plan = (body.plan || "pro").toString().toLowerCase();

    if (!code) {
      return NextResponse.json({ error: "Please enter a promo code" }, { status: 400 });
    }

    // Default seeded Black Friday promo check
    if (code === "BLACKFRIDAY40") {
      return NextResponse.json({
        valid: true,
        code: "BLACKFRIDAY40",
        type: "percent",
        value: 40,
        appliesTo: "all",
        description: "Black Friday Special: 40% OFF all plans",
      });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code },
      include: { campaign: true },
    });

    if (!promo || !promo.active) {
      return NextResponse.json({ error: "Invalid or inactive promo code" }, { status: 404 });
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return NextResponse.json({ error: "This promo code has expired" }, { status: 410 });
    }

    if (promo.maxRedemptions && promo.redemptionsCount >= promo.maxRedemptions) {
      return NextResponse.json({ error: "This promo code has reached its maximum redemptions" }, { status: 410 });
    }

    if (promo.appliesTo !== "all" && promo.appliesTo !== plan) {
      return NextResponse.json({ error: `This promo code only applies to the ${promo.appliesTo.toUpperCase()} plan` }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: promo.code,
      type: promo.type,
      value: Number(promo.value),
      appliesTo: promo.appliesTo,
      description: `${promo.type === "percent" ? `${promo.value}% OFF` : `$${promo.value} OFF`} with code ${promo.code}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Validation failed" }, { status: 500 });
  }
}
