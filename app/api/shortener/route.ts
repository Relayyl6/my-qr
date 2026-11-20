import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const shorteners = await prisma.microSaasItem.findMany({
      where: { userId: user.id, type: "shortener" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      shorteners,
      used: shorteners.length,
      max: entitlements.microsaas.shortener,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const existingCount = await prisma.microSaasItem.count({
      where: { userId: user.id, type: "shortener" },
    });

    if (existingCount >= entitlements.microsaas.shortener) {
      return NextResponse.json(
        {
          error: `Short link limit reached (${existingCount}/${entitlements.microsaas.shortener} on ${entitlements.name} plan). Upgrade to create more links.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const destinationUrl = (body.destinationUrl || "").toString().trim();
    const customSlug = (body.slug || "").toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const title = (body.title || customSlug || "Short Link").toString().trim();
    const utmSource = (body.utmSource || "").toString().trim();
    const utmMedium = (body.utmMedium || "").toString().trim();
    const utmCampaign = (body.utmCampaign || "").toString().trim();
    const iosUrl = (body.iosUrl || "").toString().trim();
    const androidUrl = (body.androidUrl || "").toString().trim();

    if (!destinationUrl || !destinationUrl.startsWith("http")) {
      return NextResponse.json({ error: "Please enter a valid HTTP/HTTPS destination URL" }, { status: 400 });
    }

    const finalSlug = customSlug || `s-${Date.now().toString(36)}`;

    // Collision check
    const existing = await prisma.microSaasItem.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ error: `The short code '${finalSlug}' is already taken. Please choose another.` }, { status: 409 });
    }

    const specPayload = {
      destinationUrl,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      iosUrl: iosUrl || undefined,
      androidUrl: androidUrl || undefined,
    };

    const created = await prisma.microSaasItem.create({
      data: {
        userId: user.id,
        type: "shortener",
        slug: finalSlug,
        title,
        spec: specPayload,
      },
    });

    return NextResponse.json({ success: true, shortener: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
