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

    const wifis = await prisma.microSaasItem.findMany({
      where: { userId: user.id, type: "wifi" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      wifis,
      used: wifis.length,
      max: entitlements.microsaas.wifi,
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
      where: { userId: user.id, type: "wifi" },
    });

    if (existingCount >= entitlements.microsaas.wifi) {
      return NextResponse.json(
        {
          error: `Wi-Fi network limit reached (${existingCount}/${entitlements.microsaas.wifi} on ${entitlements.name} plan). Upgrade to add more networks.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const ssid = (body.ssid || "").toString().trim();
    const password = (body.password || "").toString().trim();
    const authType = (body.authType || "WPA").toString().trim().toUpperCase(); // 'WPA' | 'WEP' | 'nopass'
    const isHidden = Boolean(body.isHidden);
    const location = (body.location || "").toString().trim();
    const welcomeMessage = (body.welcomeMessage || "").toString().trim();

    if (!ssid) {
      return NextResponse.json({ error: "Wi-Fi SSID network name is required" }, { status: 400 });
    }

    const customSlug = (body.slug || `wifi-${ssid.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${Date.now().toString(36).slice(-4)}`);
    const finalSlug = customSlug.toLowerCase().replace(/^-|-$/g, "");

    const existing = await prisma.microSaasItem.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ error: `Slug '${finalSlug}' already exists` }, { status: 409 });
    }

    // Standard Wi-Fi connection string: WIFI:T:WPA;S:MySSID;P:MyPassword;H:false;;
    const wifiQrString = `WIFI:T:${authType};S:${ssid};P:${password};H:${isHidden ? "true" : "false"};;`;

    const specPayload = {
      ssid,
      password,
      authType,
      isHidden,
      location: location || null,
      welcomeMessage: welcomeMessage || "Welcome! Scan or copy password below to connect to guest Wi-Fi.",
      bannerUrl: body.bannerUrl || null,
      logoUrl: body.logoUrl || null,
      wifiQrString,
      showBranding: entitlements.branded_footer,
    };

    const created = await prisma.microSaasItem.create({
      data: {
        userId: user.id,
        type: "wifi",
        slug: finalSlug,
        title: ssid,
        spec: specPayload,
      },
    });

    return NextResponse.json({ success: true, wifi: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
