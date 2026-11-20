import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";

// GET user's digital vCards
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const vcards = await prisma.microSaasItem.findMany({
      where: { userId: user.id, type: "vcard" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      vcards,
      used: vcards.length,
      max: entitlements.microsaas.vcard,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create digital vCard
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const existingCount = await prisma.microSaasItem.count({
      where: { userId: user.id, type: "vcard" },
    });

    if (existingCount >= entitlements.microsaas.vcard) {
      return NextResponse.json(
        {
          error: `vCard limit reached (${existingCount}/${entitlements.microsaas.vcard} on ${entitlements.name} plan). Upgrade your plan to create more cards.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      title,
      company,
      phone,
      email,
      website,
      bio,
      slug,
      linkedin,
      twitter,
      instagram,
    } = body;

    if (!firstName || !email) {
      return NextResponse.json({ error: "First name and email are required" }, { status: 400 });
    }

    // Generate clean unique slug
    const baseSlug = (slug || `${firstName}-${lastName || ""}-${Date.now().toString(36).slice(-4)}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const specPayload = {
      firstName,
      lastName: lastName || "",
      title: title || "",
      company: company || "",
      phone: phone || "",
      email,
      website: website || "",
      bio: bio || "",
      linkedin: linkedin || "",
      twitter: twitter || "",
      instagram: instagram || "",
      avatarUrl: body.avatarUrl || null,
      showBranding: entitlements.branded_footer,
    };

    const created = await prisma.microSaasItem.create({
      data: {
        userId: user.id,
        type: "vcard",
        slug: baseSlug,
        title: `${firstName} ${lastName || ""}`.trim(),
        spec: specPayload,
      },
    });

    return NextResponse.json({ success: true, vcard: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create vCard" }, { status: 500 });
  }
}
