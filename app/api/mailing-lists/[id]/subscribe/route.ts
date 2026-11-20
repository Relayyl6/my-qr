import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";
import crypto from "crypto";
import { sendEmail, buildDoubleOptInEmailHtml } from "@/lib/email/send";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const body = await req.json();
    const rawEmail = (body.email || "").toString().trim().toLowerCase();
    const firstName = (body.firstName || "").toString().trim().slice(0, 50);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const list = await prisma.customerMailList.findUnique({
      where: { id: listId },
      include: {
        user: { select: { id: true, tier: true } },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Mailing list not found" }, { status: 404 });
    }

    const userTier = (list.user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    // Check contact limit for this user
    const currentContacts = await prisma.customerMailContact.count({
      where: { userId: list.userId },
    });

    if (currentContacts >= entitlements.subscribers_max) {
      return NextResponse.json(
        { error: "This mailing list is currently at full subscriber capacity." },
        { status: 429 }
      );
    }

    const token = crypto.randomBytes(24).toString("hex");

    await prisma.customerMailContact.upsert({
      where: {
        listId_email: {
          listId,
          email: rawEmail,
        },
      },
      create: {
        userId: list.userId,
        listId,
        email: rawEmail,
        firstName: firstName || null,
        status: "active",
        token,
        source: "qr_embed",
      },
      update: {
        firstName: firstName || undefined,
        status: "active",
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co";
    const confirmUrl = `${baseUrl}/api/mailing-lists/${listId}/confirm?token=${token}`;
    const unsubscribeUrl = `${baseUrl}/api/mailing-lists/${listId}/unsubscribe?token=${token}`;

    const optInHtml = buildDoubleOptInEmailHtml({
      confirmUrl,
      unsubscribeUrl,
      siteUrl: baseUrl,
      businessName: list.name,
    });

    // Dispatch confirmation
    await sendEmail({
      to: rawEmail,
      subject: `Confirm subscription to ${list.name}`,
      html: optInHtml,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Please check your inbox to confirm your subscription.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to subscribe" }, { status: 500 });
  }
}
