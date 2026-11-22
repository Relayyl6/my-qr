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

    const listIds = lists.map((l) => `maillist_meta_${l.id}`);
    const metaRecords = await prisma.aiCache.findMany({
      where: { key: { in: listIds } },
    }).catch(() => []);
    const metaMap = new Map(metaRecords.map((r) => [r.key, (r.value as any) || {}]));

    const enrichedLists = lists.map((l) => {
      const meta = metaMap.get(`maillist_meta_${l.id}`) || {};
      return {
        ...l,
        logoUrl: meta.logoUrl || null,
        bannerUrl: meta.bannerUrl || null,
      };
    });

    return NextResponse.json({
      lists: enrichedLists,
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

    if (body.logoUrl || body.bannerUrl) {
      await prisma.aiCache.upsert({
        where: { key: `maillist_meta_${created.id}` },
        create: {
          key: `maillist_meta_${created.id}`,
          value: { logoUrl: body.logoUrl || null, bannerUrl: body.bannerUrl || null },
          expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        },
        update: {
          value: { logoUrl: body.logoUrl || null, bannerUrl: body.bannerUrl || null },
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      list: {
        ...created,
        logoUrl: body.logoUrl || null,
        bannerUrl: body.bannerUrl || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create mailing list" }, { status: 500 });
  }
}
