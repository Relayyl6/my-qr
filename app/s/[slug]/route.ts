import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const item = await prisma.microSaasItem.findUnique({
      where: { slug },
    });

    if (!item || item.type !== "shortener" || !item.active) {
      return NextResponse.redirect(new URL("/?error=link_not_found", req.url));
    }

    // Increment scan / click count asynchronously
    prisma.microSaasItem
      .update({
        where: { id: item.id },
        data: { scansCount: { increment: 1 } },
      })
      .catch(() => {});

    const spec = (item.spec as any) || {};
    let target = spec.destinationUrl || APP_URL;

    // 1. Device OS Routing
    const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIos && spec.iosUrl) {
      target = spec.iosUrl;
    } else if (isAndroid && spec.androidUrl) {
      target = spec.androidUrl;
    }

    // 2. UTM Parameter Injection
    try {
      const urlObj = new URL(target);
      if (spec.utmSource) urlObj.searchParams.set("utm_source", spec.utmSource);
      if (spec.utmMedium) urlObj.searchParams.set("utm_medium", spec.utmMedium);
      if (spec.utmCampaign) urlObj.searchParams.set("utm_campaign", spec.utmCampaign);
      target = urlObj.toString();
    } catch (e) {
      // If URL parsing fails, continue with base target
    }

    return NextResponse.redirect(target, { status: 307 });
  } catch (err) {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
