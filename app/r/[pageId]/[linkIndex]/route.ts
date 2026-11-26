// app/r/[pageId]/[linkIndex]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { migrateLegacySpec } from "@/lib/page/migrate";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string; linkIndex: string } }
) {
  const { pageId, linkIndex } = params;

  try {
    // 1. Fetch LandingPage record by id or qrLinkId
    const landingPage = await prisma.landingPage.findFirst({
      where: {
        OR: [{ id: pageId }, { qrLinkId: pageId }],
      },
      include: {
        qrLink: true,
      },
    });

    if (!landingPage) {
      return NextResponse.redirect(new URL("/", request.url), 302);
    }

    const fallbackUrl = landingPage.qrLink?.destinationUrl || "https://example.com";
    const page = migrateLegacySpec(landingPage.spec, fallbackUrl);

    // 2. Resolve destination URL based on linkIndex
    let destination = page.cta.url || fallbackUrl;

    if (linkIndex !== "cta") {
      const idx = parseInt(linkIndex, 10);
      if (!isNaN(idx) && page.links && page.links[idx]?.url) {
        destination = page.links[idx].url;
      }
    }

    // 3. Fast non-blocking async telemetry logging
    const userAgent = request.headers.get("user-agent") || undefined;
    const country =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      undefined;

    // Fire and forget click tracking record via Scan table
    if (landingPage.qrLinkId) {
      prisma.scan
        .create({
          data: {
            qrLinkId: landingPage.qrLinkId,
            country,
            userAgent,
            referrer: request.headers.get("referer") || undefined,
            ruleFiredId: `click:${linkIndex}`,
          },
        })
        .catch((err) => {
          console.warn("[ClickTracker] Non-fatal log failure:", err.message);
        });
    }

    // 4. Return fast temporary redirect (307 preserve cache semantics)
    return NextResponse.redirect(destination, 307);
  } catch (error) {
    console.error("[ClickTracker] Error resolving redirect:", error);
    return NextResponse.redirect(new URL("/", request.url), 302);
  }
}
