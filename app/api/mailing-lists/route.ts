import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";

// GET: List user's mailing lists + quota usage
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const lists = await prisma.customerMailList.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            contacts: true,
            campaigns: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalContactsCount = await prisma.customerMailContact.count({
      where: { userId: user.id },
    });

    // Count campaigns sent this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const campaignsThisMonth = await prisma.customerMailCampaign.count({
      where: {
        userId: user.id,
        status: "sent",
        sentAt: { gte: startOfMonth },
      },
    });

    return NextResponse.json({
      lists,
      quotas: {
        tier: entitlements.name,
        listsUsed: lists.length,
        listsMax: entitlements.mailing_lists,
        contactsUsed: totalContactsCount,
        contactsMax: entitlements.subscribers_max,
        campaignsUsedThisMonth: campaignsThisMonth,
        campaignsMaxPerMonth: entitlements.campaigns_per_month,
        hasBrandedFooter: entitlements.branded_footer,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch mailing lists" }, { status: 500 });
  }
}

// POST: Create a new mailing list
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const existingCount = await prisma.customerMailList.count({
      where: { userId: user.id },
    });

    if (existingCount >= entitlements.mailing_lists) {
      return NextResponse.json(
        {
          error: `Mailing list limit reached (${existingCount}/${entitlements.mailing_lists} on ${entitlements.name} plan). Upgrade your plan to create more lists.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const name = (body.name || "").toString().trim();
    const description = (body.description || "").toString().trim();
    const badgeText = (body.badgeText || "").toString().trim();
    const headline = (body.headline || "").toString().trim();
    const ctaText = (body.ctaText || "").toString().trim();
    const successMessage = (body.successMessage || "").toString().trim();

    if (!name || name.length > 64) {
      return NextResponse.json({ error: "Please enter a valid list name (1-64 characters)" }, { status: 400 });
    }

    const created = await prisma.customerMailList.create({
      data: {
        userId: user.id,
        name,
        description: description || null,
        badgeText: badgeText || "VIP Subscriber Form",
        headline: headline || null,
        ctaText: ctaText || "Subscribe to Updates",
        successMessage: successMessage || null,
        doubleOptIn: true,
      },
    });

    return NextResponse.json({ success: true, list: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create mailing list" }, { status: 500 });
  }
}
