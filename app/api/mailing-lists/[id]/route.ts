import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const list = await prisma.customerMailList.findFirst({
      where: { id, userId: user.id },
      include: {
        contacts: {
          orderBy: { createdAt: "desc" },
        },
        campaigns: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Mailing list not found" }, { status: 404 });
    }

    const metaRecord = await prisma.aiCache.findUnique({
      where: { key: `maillist_meta_${list.id}` },
    }).catch(() => null);
    const meta = (metaRecord?.value as any) || {};

    return NextResponse.json({
      list: {
        ...list,
        logoUrl: meta.logoUrl || null,
        bannerUrl: meta.bannerUrl || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const name = (body.name || "").toString().trim();
    const description = (body.description || "").toString().trim();
    const badgeText = (body.badgeText || "").toString().trim();
    const headline = (body.headline || "").toString().trim();
    const ctaText = (body.ctaText || "").toString().trim();
    const successMessage = (body.successMessage || "").toString().trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updated = await prisma.customerMailList.updateMany({
      where: { id, userId: user.id },
      data: {
        name,
        description: description || null,
        badgeText: badgeText || "VIP Subscriber Form",
        headline: headline || null,
        ctaText: ctaText || "Subscribe to Updates",
        successMessage: successMessage || null,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Mailing list not found" }, { status: 404 });
    }

    if (body.logoUrl !== undefined || body.bannerUrl !== undefined) {
      const currentRecord = await prisma.aiCache.findUnique({
        where: { key: `maillist_meta_${id}` },
      }).catch(() => null);
      const currentVal = (currentRecord?.value as any) || {};

      await prisma.aiCache.upsert({
        where: { key: `maillist_meta_${id}` },
        create: {
          key: `maillist_meta_${id}`,
          value: {
            logoUrl: body.logoUrl !== undefined ? body.logoUrl : currentVal.logoUrl || null,
            bannerUrl: body.bannerUrl !== undefined ? body.bannerUrl : currentVal.bannerUrl || null,
          },
          expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
        },
        update: {
          value: {
            logoUrl: body.logoUrl !== undefined ? body.logoUrl : currentVal.logoUrl || null,
            bannerUrl: body.bannerUrl !== undefined ? body.bannerUrl : currentVal.bannerUrl || null,
          },
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const deleted = await prisma.customerMailList.deleteMany({
      where: { id, userId: user.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Mailing list not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
