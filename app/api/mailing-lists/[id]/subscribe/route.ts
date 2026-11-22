import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";
import crypto from "crypto";
import { sendEmail, buildCustomerSubscriptionConfirmedEmailHtml } from "@/lib/email/send";
import { APP_URL } from "@/lib/config";

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
        user: { select: { id: true, tier: true, email: true } },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "Mailing list not found" }, { status: 404 });
    }

    // Check if contact already exists and is active
    const existingContact = await prisma.customerMailContact.findUnique({
      where: {
        listId_email: {
          listId,
          email: rawEmail,
        },
      },
    });

    if (existingContact && existingContact.status === "active") {
      return NextResponse.json({
        success: true,
        message: `You are already subscribed to ${list.name}!`,
      });
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
        source: "qr_entry",
        confirmedAt: new Date(),
      },
      update: {
        firstName: firstName || undefined,
        status: "active",
        confirmedAt: new Date(),
      },
    });

    const unsubscribeUrl = `${APP_URL}/api/mailing-lists/${listId}/unsubscribe?token=${token}`;

    const confirmationHtml = buildCustomerSubscriptionConfirmedEmailHtml({
      businessName: list.name,
      unsubscribeUrl,
      firstName: firstName || undefined,
    });

    // Dispatch instant subscription confirmation notice (no confirmation click required)
    await sendEmail({
      to: rawEmail,
      subject: `You're subscribed to ${list.name}`,
      html: confirmationHtml,
      replyTo: list.user.email || process.env.EMAIL_REPLY_TO || "hello@dynamicqr.co",
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }).catch((err) => console.error("[Customer Subscribe Email Error]:", err));

    return NextResponse.json({
      success: true,
      message: `You're subscribed to ${list.name}!`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to subscribe" }, { status: 500 });
  }
}
