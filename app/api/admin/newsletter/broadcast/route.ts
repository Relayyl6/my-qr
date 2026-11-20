import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { broadcastNewsletterCampaign, getGmailSentTodayCount } from "@/lib/email/send";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const adminEmail = (process.env.ADMIN_EMAIL || "oseghaleleonard39@gmail.com").toLowerCase();
    const isAdmin = Boolean(user && user.email.toLowerCase() === adminEmail);

    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { subject, bodyHtml, campaignId } = body;

    if (!subject || !bodyHtml) {
      return NextResponse.json({ error: "Subject and bodyHtml are required" }, { status: 400 });
    }

    // Upsert or fetch campaign record
    let targetCampaignId = campaignId;
    if (!targetCampaignId) {
      const created = await prisma.newsletterCampaign.create({
        data: {
          subject,
          bodyHtml,
          status: "sending",
        },
      });
      targetCampaignId = created.id;
    }

    const result = await broadcastNewsletterCampaign({
      campaignId: targetCampaignId,
      subject,
      bodyHtml,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          provider: result.provider,
          sentCount: result.sentCount,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      campaignId: targetCampaignId,
      sentCount: result.sentCount,
      provider: result.provider,
      warning: result.warning,
    });
  } catch (err: any) {
    console.error("[Broadcast Campaign Error]:", err);
    return NextResponse.json({ error: err.message || "Failed to broadcast campaign" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const adminEmail = (process.env.ADMIN_EMAIL || "oseghaleleonard39@gmail.com").toLowerCase();
    const isAdmin = Boolean(user && user.email.toLowerCase() === adminEmail);

    if (!user || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sentToday = await getGmailSentTodayCount();
    const activeSubscribers = await prisma.newsletterSubscriber.count({
      where: { status: "active" },
    });
    const pendingSubscribers = await prisma.newsletterSubscriber.count({
      where: { status: "pending" },
    });

    const isResendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0);

    return NextResponse.json({
      activeSubscribers,
      pendingSubscribers,
      sentTodayGmail: sentToday,
      gmailDailyLimit: 450,
      remainingGmailQuota: Math.max(0, 450 - sentToday),
      isResendConfigured,
      activeProvider: isResendConfigured ? "resend" : "gmail",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
