import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!user.stripeCustomerId || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder_key") {
      return NextResponse.json({
        url: `${origin}/pricing?notice=manage_subscription`,
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("[Stripe Portal Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to create portal session" }, { status: 500 });
  }
}
