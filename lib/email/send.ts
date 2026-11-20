import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

// 1. Create reusable Nodemailer transporter using Gmail App Password or SMTP variables
function getTransporter() {
  const gmailUser = process.env.GMAIL_USER || "yemuelinc@gmail.com";
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const isRealGmailPass = gmailPass && gmailPass !== "placeholder_app_password" && gmailPass.trim().length > 0;

  if (isRealGmailPass) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
  }

  // Fallback to SMTP_HOST / SMTP_USER / SMTP_PASS if provided in .env
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
}

/**
 * Tracks Gmail daily volume to prevent account suspension (>500/day hard Google cap).
 * Queries NewsletterCampaigns and CustomerMailCampaigns sent today via Gmail.
 */
export async function getGmailSentTodayCount(): Promise<number> {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [platformCampaigns, customerCampaigns] = await Promise.all([
      prisma.newsletterCampaign.findMany({
        where: {
          sentVia: "gmail",
          sentAt: { gte: startOfDay },
        },
        select: { recipientCount: true },
      }),
      prisma.customerMailCampaign.findMany({
        where: {
          status: "sent",
          sentAt: { gte: startOfDay },
        },
        select: { sentCount: true },
      }),
    ]);

    const platformTotal = platformCampaigns.reduce((sum, c) => sum + (c.recipientCount || 0), 0);
    const customerTotal = customerCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);

    return platformTotal + customerTotal;
  } catch (err) {
    console.error("[Email Quota Tracker] Error calculating Gmail daily volume:", err);
    return 0;
  }
}

/**
 * Sends a single transactional or test email.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  headers,
}: EmailPayload): Promise<{ success: boolean; id?: string; error?: string }> {
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || '"DynamicQR" <hello@dynamicqr.co>';
  const defaultReplyTo = replyTo || process.env.EMAIL_REPLY_TO || "hello@dynamicqr.co";
  const transporter = getTransporter();

  // If SMTP is not yet configured with active credentials, log cleanly for dev and test
  if (!transporter) {
    console.info(`[Nodemailer - Dev/Mock Dispatch]`);
    console.info(`  From: ${from}`);
    console.info(`  Reply-To: ${defaultReplyTo}`);
    console.info(`  To: ${to}`);
    console.info(`  Subject: "${subject}"`);
    console.info(`  Notice: Set GMAIL_APP_PASSWORD in .env to send real emails via Gmail.`);
    return { success: true, id: `mock_email_${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail({
      from,
      replyTo: defaultReplyTo,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      html,
      headers: headers || {},
    });

    console.info(`[Nodemailer] Email dispatched to ${to}. MessageId: ${info.messageId}`);
    return { success: true, id: info.messageId };
  } catch (error: any) {
    console.error("[Nodemailer Send Error]:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Builds HTML template for Newsletter Double Opt-In Verification (Spec Section 3)
 */
export function buildDoubleOptInEmailHtml({
  confirmUrl,
  unsubscribeUrl,
  siteUrl = "https://dynamicqr.co",
  businessName = "DynamicQR",
  businessAddress = "San Francisco, CA & Lagos, NG",
}: {
  confirmUrl: string;
  unsubscribeUrl: string;
  siteUrl?: string;
  businessName?: string;
  businessAddress?: string;
}): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03);">
        <tr><td style="padding:32px 32px 12px;font-size:16px;line-height:1.6;color:#111111;">
          <div style="font-size:20px;font-weight:800;color:#11140f;letter-spacing:-0.5px;margin-bottom:20px;">
            ${businessName}
          </div>
          <h1 style="font-size:20px;font-weight:700;color:#11140f;margin:0 0 16px;">
            Confirm your subscription
          </h1>
          <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Please confirm your email address to receive updates and exclusive announcements.
          </p>
          <div style="text-align:left;margin:28px 0;">
            <a href="${confirmUrl}" style="background:#11140F;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 28px;border-radius:8px;display:inline-block;">
              Confirm My Subscription &rarr;
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:20px 0 0;">
            This single-use confirmation link will expire in 72 hours. If you did not sign up, you can safely ignore this message.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px;font-size:12px;line-height:1.5;color:#666666;border-top:1px solid #eeeeee;background:#fafafa;">
          You're receiving this because you subscribed at <a href="${siteUrl}" style="color:#666666;">${siteUrl}</a>.<br>
          ${businessName}, ${businessAddress}<br>
          <a href="${unsubscribeUrl}" style="color:#666666;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Builds standard 600px table layout for broadcast campaigns (Spec Section 3)
 */
export function buildBroadcastEmailHtml({
  body,
  unsubscribeUrl,
  siteUrl = "https://dynamicqr.co",
  businessName = "DynamicQR",
  businessAddress = "San Francisco, CA & Lagos, NG",
  showPoweredBy = false,
}: {
  body: string;
  unsubscribeUrl: string;
  siteUrl?: string;
  businessName?: string;
  businessAddress?: string;
  showPoweredBy?: boolean;
}): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;font-size:16px;line-height:1.6;color:#111111;">
          ${body}
        </td></tr>
        <tr><td style="padding:24px 32px;font-size:12px;line-height:1.5;color:#666666;border-top:1px solid #eeeeee;background:#fafafa;">
          ${
            showPoweredBy
              ? `<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #eeeeee;font-size:11.5px;color:#888888;text-align:center;">
                   Powered by <a href="https://dynamicqr.co" style="color:#11140F;font-weight:bold;text-decoration:none;">DynamicQR</a> — Smart Dynamic QR & Micro-SaaS
                 </div>`
              : ""
          }
          You're receiving this because you subscribed at <a href="${siteUrl}" style="color:#666666;">${siteUrl}</a>.<br>
          ${businessName}, ${businessAddress}<br>
          <a href="${unsubscribeUrl}" style="color:#666666;text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Dispatches double opt-in confirmation email to a new subscriber.
 */
export async function sendDoubleOptInEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}): Promise<{ success: boolean; error?: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co";
  const confirmUrl = `${baseUrl}/api/newsletter/confirm?token=${token}`;
  const unsubscribeUrl = `${baseUrl}/api/newsletter/unsubscribe?token=${token}`;

  const html = buildDoubleOptInEmailHtml({
    confirmUrl,
    unsubscribeUrl,
    siteUrl: baseUrl,
  });

  return await sendEmail({
    to: email,
    subject: "Confirm your subscription to DynamicQR",
    html,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

/**
 * Broadcasts Platform Newsletter strictly via Gmail Nodemailer:
 * - Stays strictly within Gmail's 500/day limit (with a 490 safe ceiling)
 * - Emits List-Unsubscribe & List-Unsubscribe-Post headers
 */
export async function broadcastNewsletterCampaign({
  campaignId,
  subject,
  bodyHtml,
  siteUrl = "https://dynamicqr.co",
}: {
  campaignId: string;
  subject: string;
  bodyHtml: string;
  siteUrl?: string;
}): Promise<{
  success: boolean;
  sentCount: number;
  provider: "gmail";
  error?: string;
}> {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { status: "active" },
    select: { id: true, email: true, token: true, firstName: true },
  });

  if (subscribers.length === 0) {
    return { success: true, sentCount: 0, provider: "gmail" };
  }

  // Gmail Daily Cap Enforcement (Max 490/day rolling ceiling)
  const sentToday = await getGmailSentTodayCount();
  const GMAIL_DAILY_CEILING = 490;

  if (sentToday + subscribers.length > GMAIL_DAILY_CEILING) {
    const remainingQuota = Math.max(0, GMAIL_DAILY_CEILING - sentToday);
    return {
      success: false,
      sentCount: 0,
      provider: "gmail",
      error: `Gmail daily sending limit reached (${sentToday}/500 sent today). Remaining capacity today is ${remainingQuota} recipients. Please send later or reduce recipient count to protect your Gmail account.`,
    };
  }

  let sentCount = 0;
  for (const subscriber of subscribers) {
    const unsubUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${subscriber.token}`;
    const personalizedBody = bodyHtml
      .replace(/{{first_name}}/g, subscriber.firstName || "there")
      .replace(/{{unsubscribe_url}}/g, unsubUrl)
      .replace(/{{site_url}}/g, siteUrl);

    const fullHtml = buildBroadcastEmailHtml({
      body: personalizedBody,
      unsubscribeUrl: unsubUrl,
      siteUrl,
    });

    const res = await sendEmail({
      to: subscriber.email,
      subject,
      html: fullHtml,
      replyTo: process.env.EMAIL_REPLY_TO || "hello@dynamicqr.co",
      headers: {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (res.success) sentCount++;
  }

  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: {
      status: "sent",
      sentAt: new Date(),
      recipientCount: sentCount,
      sentVia: "gmail",
    },
  });

  return { success: true, sentCount, provider: "gmail" };
}

/**
 * Broadcasts Customer Mailing List campaign strictly via Gmail Nodemailer:
 * - Free tier: max 10 contacts, Pro: 50, Plus: 100, Ultra: 500 (Gmail ceiling)
 * - Checks daily Gmail 490 ceiling across the entire system
 * - Adds "Powered by DynamicQR" footer badge for Free tier
 */
export async function broadcastCustomerMailCampaign({
  userId,
  listId,
  subject,
  bodyHtml,
  siteUrl = "https://dynamicqr.co",
}: {
  userId: string;
  listId: string;
  subject: string;
  bodyHtml: string;
  siteUrl?: string;
}): Promise<{
  success: boolean;
  sentCount: number;
  error?: string;
}> {
  // 1. Fetch user & verify tier entitlements
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, tier: true },
  });

  if (!user) {
    return { success: false, sentCount: 0, error: "User not found" };
  }

  const userTier = (user.tier || "free").toLowerCase() as PlanTier;
  const entitlements = PLANS[userTier] || PLANS.free;

  // 2. Fetch list & active contacts
  const list = await prisma.customerMailList.findFirst({
    where: { id: listId, userId },
    include: {
      contacts: {
        where: { status: "active" },
        take: entitlements.subscribers_max, // Strictly enforce tier contact cap: 10, 50, 100, 500
      },
    },
  });

  if (!list) {
    return { success: false, sentCount: 0, error: "Mailing list not found" };
  }

  if (list.contacts.length === 0) {
    return { success: false, sentCount: 0, error: "No active contacts found in this list" };
  }

  // 3. Monthly campaign frequency check per tier
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const campaignsThisMonth = await prisma.customerMailCampaign.count({
    where: {
      userId,
      status: "sent",
      sentAt: { gte: startOfMonth },
    },
  });

  if (campaignsThisMonth >= entitlements.campaigns_per_month) {
    return {
      success: false,
      sentCount: 0,
      error: `Monthly campaign limit reached (${campaignsThisMonth}/${entitlements.campaigns_per_month} on ${entitlements.name} plan). Upgrade your plan to send more campaigns.`,
    };
  }

  // 4. Check global daily Gmail ceiling (490 cap)
  const sentToday = await getGmailSentTodayCount();
  const GMAIL_DAILY_CEILING = 490;

  if (sentToday + list.contacts.length > GMAIL_DAILY_CEILING) {
    const remaining = Math.max(0, GMAIL_DAILY_CEILING - sentToday);
    return {
      success: false,
      sentCount: 0,
      error: `Gmail daily capacity reached (${sentToday}/500 sent today). Remaining capacity is ${remaining}. Please try again tomorrow to protect sender reputation.`,
    };
  }

  // 5. Create campaign record
  const campaign = await prisma.customerMailCampaign.create({
    data: {
      userId,
      listId,
      subject,
      bodyHtml,
      status: "sending",
    },
  });

  let sentCount = 0;
  for (const contact of list.contacts) {
    const unsubUrl = `${siteUrl}/api/mailing-lists/${listId}/unsubscribe?token=${contact.token}`;
    const personalizedBody = bodyHtml
      .replace(/{{first_name}}/g, contact.firstName || "there")
      .replace(/{{unsubscribe_url}}/g, unsubUrl)
      .replace(/{{list_name}}/g, list.name)
      .replace(/{{site_url}}/g, siteUrl);

    const fullHtml = buildBroadcastEmailHtml({
      body: personalizedBody,
      unsubscribeUrl: unsubUrl,
      siteUrl,
      businessName: list.name,
      showPoweredBy: entitlements.branded_footer,
    });

    const res = await sendEmail({
      to: contact.email,
      subject,
      html: fullHtml,
      replyTo: process.env.EMAIL_REPLY_TO || "hello@dynamicqr.co",
      headers: {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    if (res.success) sentCount++;
  }

  // 6. Finalize campaign record
  await prisma.customerMailCampaign.update({
    where: { id: campaign.id },
    data: {
      status: "sent",
      sentAt: new Date(),
      sentCount,
    },
  });

  return { success: true, sentCount };
}

/**
 * Builds HTML template to warn users when their usage approaches or reaches plan capacity
 */
export function buildLimitWarningEmailHtml({
  email,
  tier,
  metricName,
  used,
  limit,
  percentUsed,
  resetDate,
}: {
  email: string;
  tier: string;
  metricName: string;
  used: number | string;
  limit: number | string;
  percentUsed: number;
  resetDate?: string;
}): string {
  const isCapped = percentUsed >= 100;
  const badgeColor = isCapped ? "#DC2626" : "#D97706";
  const badgeText = isCapped ? "Capacity Reached (100%)" : `Limit Warning (${percentUsed}%)`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Usage Alert: DynamicQR Plan Limits</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #EEF0EA; margin: 0; padding: 40px 20px;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid rgba(17,20,15,0.1); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background: #11140F; padding: 30px; text-align: left;">
      <span style="font-family: monospace; font-size: 11px; color: ${badgeColor}; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 999px;">
        ${badgeText}
      </span>
      <h1 style="color: #ffffff; font-size: 22px; margin: 12px 0 0; font-weight: 700;">
        ${isCapped ? "Your plan limit has been reached" : "You're approaching your monthly limit"}
      </h1>
    </div>

    <div style="padding: 32px; color: #11140F;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #374151;">
        Hi there, you have used <strong>${used} of ${limit} ${metricName}</strong> on your <strong>${tier.toUpperCase()}</strong> plan (${percentUsed}% capacity).
      </p>

      <div style="background: #F7F8F5; border: 1px solid rgba(17,20,15,0.08); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
          <span>${metricName}</span>
          <span>${used} / ${limit}</span>
        </div>
        <div style="background: rgba(17,20,15,0.1); border-radius: 999px; height: 8px; overflow: hidden;">
          <div style="background: ${badgeColor}; width: ${Math.min(100, percentUsed)}%; height: 100%;"></div>
        </div>
        ${
          resetDate
            ? `<div style="font-size: 12px; color: #6B7280; margin-top: 10px;">📅 Monthly counter resets on <strong>${resetDate}</strong>.</div>`
            : ""
        }
      </div>

      <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 0 0 24px;">
        ${
          isCapped
            ? "To create more links and prevent scan interruptions, upgrade to the next tier or archive previous unused links."
            : "Upgrade now to ensure your printed marketing flyers and customer traffic never hit a redirect limit."
        }
      </p>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co"}/pricing" style="display: inline-block; background: #11140F; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 12px;">
          View Upgrade Options &rarr;
        </a>
      </div>
    </div>

    <div style="background: #FAFAFA; border-top: 1px solid #EEEEEE; padding: 18px 30px; text-align: center; font-size: 12px; color: #9CA3AF;">
      DynamicQR • Sent to ${email} • <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co"}/pricing" style="color: #6B7280;">Manage Plan</a>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Builds HTML template for Weekly AI Scan Digest
 */
export function buildWeeklyDigestEmailHtml({
  email,
  totalScans,
  summary,
  recommendations,
}: {
  email: string;
  totalScans: number;
  summary: string;
  recommendations: string[];
}): string {
  const recListHtml = recommendations
    .map(
      (r) =>
        `<li style="margin-bottom: 8px; color: #374151; font-size: 14px;"><strong>•</strong> ${r}</li>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Weekly DynamicQR Intelligence Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #EEF0EA; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid rgba(17,20,15,0.1); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background: #11140F; padding: 32px 32px 28px; text-align: left;">
      <span style="font-family: monospace; font-size: 11px; color: #96A689; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">Weekly Performance Report</span>
      <h1 style="color: #ffffff; font-size: 24px; margin: 8px 0 0; font-weight: 700; letter-spacing: -0.5px;">Your QR Performance</h1>
    </div>
    
    <div style="padding: 32px;">
      <div style="background: #F7F8F5; border-radius: 12px; padding: 16px 20px; border: 1px solid rgba(17,20,15,0.06); margin-bottom: 24px;">
        <div style="font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 1px;">7-Day Scans Logged</div>
        <div style="font-size: 32px; font-weight: 800; color: #11140F; margin-top: 4px;">${totalScans.toLocaleString()}</div>
      </div>

      <div style="margin-bottom: 28px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #2F6B4F; font-weight: 700; letter-spacing: 0.8px; margin: 0 0 8px;">AI Campaign Analysis</h3>
        <p style="font-size: 14.5px; line-height: 1.6; color: #1F2937; margin: 0;">${summary}</p>
      </div>

      ${
        recommendations.length > 0
          ? `
      <div style="margin-bottom: 32px; background: #F9FAFB; border-radius: 12px; padding: 20px; border: 1px solid #E5E7EB;">
        <h4 style="font-size: 13px; text-transform: uppercase; color: #4B5563; font-weight: 700; margin: 0 0 12px;">Strategic Next Steps</h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${recListHtml}
        </ul>
      </div>
      `
          : ""
      }

      <div style="text-align: center; padding-top: 8px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co"}/#workspace" style="display: inline-block; background: #11140F; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 12px;">
          Open DynamicQR Workspace &rarr;
        </a>
      </div>
    </div>

    <div style="background: #FAFAFA; border-top: 1px solid #EEEEEE; padding: 20px 32px; text-align: center; font-size: 12px; color: #9CA3AF;">
      DynamicQR • One code, printed once. Routed as long as it needs to be.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Builds HTML template for 1st-of-month Limit Reset Notification
 */
export function buildMonthlyResetEmailHtml({
  email,
  tier,
}: {
  email: string;
  tier: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Monthly Limits Have Reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #EEF0EA; margin: 0; padding: 40px 20px;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid rgba(17,20,15,0.1); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background: #11140F; padding: 32px; text-align: left;">
      <span style="font-family: monospace; font-size: 11px; color: #2F6B4F; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 999px;">
        1st of the Month Reset
      </span>
      <h1 style="color: #ffffff; font-size: 24px; margin: 12px 0 0; font-weight: 700;">
        Your limits have been refreshed!
      </h1>
    </div>

    <div style="padding: 32px; color: #11140F;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 20px; color: #374151;">
        Welcome to a new month! Your <strong>${tier.toUpperCase()}</strong> plan usage counters have officially reset back to zero.
      </p>

      <div style="background: #F7F8F5; border: 1px solid rgba(17,20,15,0.08); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 10px; font-size: 13px; font-weight: 600; color: #2F6B4F;">
          ✓ Redirect scans refreshed
        </div>
        <div style="font-size: 13px; font-weight: 600; color: #2F6B4F;">
          ✓ Monthly AI compute budget renewed
        </div>
      </div>

      <p style="font-size: 14px; color: #4B5563; line-height: 1.5; margin: 0 0 24px;">
        All your active printed QR codes and destination routing rules remain permanently live and active. If you need more link slots, you can archive old campaigns or upgrade at any time.
      </p>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co"}/#workspace" style="display: inline-block; background: #11140F; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 12px;">
          Go to Workspace &rarr;
        </a>
      </div>
    </div>

    <div style="background: #FAFAFA; border-top: 1px solid #EEEEEE; padding: 18px 30px; text-align: center; font-size: 12px; color: #9CA3AF;">
      DynamicQR • Sent to ${email} • <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co"}/pricing" style="color: #6B7280;">Manage Subscription</a>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Builds HTML template for New User Welcome & Onboarding
 */
export function buildWelcomeEmailHtml({
  email,
  name,
}: {
  email: string;
  name?: string;
}): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to DynamicQR</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #EEF0EA; margin: 0; padding: 40px 20px;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid rgba(17,20,15,0.1); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background: #11140F; padding: 32px; text-align: left;">
      <span style="font-family: monospace; font-size: 11px; color: #96A689; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">
        Welcome to DynamicQR
      </span>
      <h1 style="color: #ffffff; font-size: 24px; margin: 10px 0 0; font-weight: 700;">
        One code, printed once.
      </h1>
    </div>

    <div style="padding: 32px; color: #11140F;">
      <p style="font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #374151;">
        ${greeting} thank you for creating your DynamicQR account! You'll never have to worry about broken printed flyers, outdated event brochures, or reprinting expensive materials again.
      </p>

      <div style="background: #F7F8F5; border: 1px solid rgba(17,20,15,0.08); border-radius: 14px; padding: 20px; margin: 24px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #11140F; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          🚀 Quick-Start Checklist:
        </div>
        <div style="margin-bottom: 10px; font-size: 13.5px; line-height: 1.5; color: #374151;">
          <strong>1. Create your dynamic link:</strong> Choose a memorable short code and set today's destination URL.
        </div>
        <div style="margin-bottom: 10px; font-size: 13.5px; line-height: 1.5; color: #374151;">
          <strong>2. Export print-ready PNG:</strong> High-contrast 1024×1024px assets with 10% quiet-zone buffers ready for 300 DPI physical prints.
        </div>
        <div style="font-size: 13.5px; line-height: 1.5; color: #374151;">
          <strong>3. Update anytime:</strong> Whenever your campaign changes, edit the destination in your workspace. Every flyer out in the world updates immediately!
        </div>
      </div>

      <div style="text-align: center; margin-top: 28px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co"}/#workspace" style="display: inline-block; background: #11140F; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 14px 28px; border-radius: 12px;">
          Open Your Workspace &rarr;
        </a>
      </div>
    </div>

    <div style="background: #FAFAFA; border-top: 1px solid #EEEEEE; padding: 18px 30px; text-align: center; font-size: 12px; color: #9CA3AF;">
      DynamicQR • Sent to ${email} • <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co"}/privacy" style="color: #6B7280;">Privacy Policy</a>
    </div>
  </div>
</body>
</html>
  `;
}
