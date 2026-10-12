import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { TIER_CONFIGS } from "@/lib/ai/flags";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // In dev mode without webhook signing secret
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Error]:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const tier = (session.metadata?.tier || "pro").toLowerCase();
        const subscriptionId = session.subscription as string;

        if (userId) {
          const tierConfig = TIER_CONFIGS[tier] || TIER_CONFIGS.pro;

          await prisma.user.update({
            where: { id: userId },
            data: {
              tier,
              stripeSubscriptionId: subscriptionId || null,
              stripeCustomerId: (session.customer as string) || undefined,
            },
          });

          await prisma.aiCredit.upsert({
            where: { userId },
            create: {
              userId,
              monthlyLimitUsd: tierConfig.monthlyLimitUsd,
              usedThisMonth: 0,
            },
            update: {
              monthlyLimitUsd: tierConfig.monthlyLimitUsd,
            },
          });

          console.log(`[Stripe Webhook] Successfully upgraded user ${userId} to ${tier}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await prisma.user.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              tier: "free",
              stripeSubscriptionId: null,
            },
          });

          await prisma.aiCredit.updateMany({
            where: { userId: user.id },
            data: {
              monthlyLimitUsd: TIER_CONFIGS.free.monthlyLimitUsd,
            },
          });

          console.log(`[Stripe Webhook] Downgraded user ${user.id} to free due to cancelled subscription`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe Webhook Processing Error]:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
