import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";

export const dynamic = "force-dynamic";

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
    const utmTerm = (body.utmTerm || "").toString().trim();
    const utmContent = (body.utmContent || "").toString().trim();
    const iosUrl = (body.iosUrl || "").toString().trim();
    const androidUrl = (body.androidUrl || "").toString().trim();
    const ogTitle = (body.ogTitle || "").toString().trim();
    const ogDescription = (body.ogDescription || "").toString().trim();
    const ogImage = (body.ogImage || "").toString().trim();
    const maxClicks = body.maxClicks ? parseInt(body.maxClicks, 10) : undefined;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    const password = (body.password || "").toString().trim();

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
      utmTerm: utmTerm || undefined,
      utmContent: utmContent || undefined,
      iosUrl: iosUrl || undefined,
      androidUrl: androidUrl || undefined,
      ogTitle: ogTitle || undefined,
      ogDescription: ogDescription || undefined,
      ogImage: ogImage || undefined,
      maxClicks: !isNaN(maxClicks as number) && (maxClicks as number) > 0 ? maxClicks : undefined,
      expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt.toISOString() : undefined,
      password: password || undefined,
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

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "Missing link ID" }, { status: 400 });

    const existing = await prisma.microSaasItem.findFirst({
      where: { id, userId: user.id, type: "shortener" },
    });
    if (!existing) return NextResponse.json({ error: "Short link not found" }, { status: 404 });

    const destinationUrl = (body.destinationUrl || "").toString().trim();
    const title = (body.title || existing.title).toString().trim();
    const utmSource = (body.utmSource || "").toString().trim();
    const utmMedium = (body.utmMedium || "").toString().trim();
    const utmCampaign = (body.utmCampaign || "").toString().trim();
    const utmTerm = (body.utmTerm || "").toString().trim();
    const utmContent = (body.utmContent || "").toString().trim();
    const iosUrl = (body.iosUrl || "").toString().trim();
    const androidUrl = (body.androidUrl || "").toString().trim();
    const ogTitle = (body.ogTitle || "").toString().trim();
    const ogDescription = (body.ogDescription || "").toString().trim();
    const ogImage = (body.ogImage || "").toString().trim();
    const maxClicks = body.maxClicks ? parseInt(body.maxClicks, 10) : undefined;
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    const password = (body.password || "").toString().trim();

    if (destinationUrl && !destinationUrl.startsWith("http")) {
      return NextResponse.json({ error: "Please enter a valid HTTP/HTTPS destination URL" }, { status: 400 });
    }

    const prevSpec = (existing.spec as any) || {};
    const updatedSpec = {
      ...prevSpec,
      destinationUrl: destinationUrl || prevSpec.destinationUrl,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      utmTerm: utmTerm || undefined,
      utmContent: utmContent || undefined,
      iosUrl: iosUrl || undefined,
      androidUrl: androidUrl || undefined,
      ogTitle: ogTitle || undefined,
      ogDescription: ogDescription || undefined,
      ogImage: ogImage || undefined,
      maxClicks: !isNaN(maxClicks as number) && (maxClicks as number) > 0 ? maxClicks : undefined,
      expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt.toISOString() : undefined,
      password: password || undefined,
    };

    const updated = await prisma.microSaasItem.update({
      where: { id: existing.id },
      data: {
        title,
        spec: updatedSpec,
      },
    });

    return NextResponse.json({ success: true, shortener: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
