import nodemailer from "nodemailer";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create reusable Nodemailer transporter using standard SMTP environment variables
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

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

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: EmailPayload): Promise<{ success: boolean; id?: string }> {
  const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"DynamicQR" <notifications@dynamicqr.co>';
  const transporter = getTransporter();

  // If SMTP is not yet configured in .env, log cleanly and return mock success
  if (!transporter) {
    console.info(`[Nodemailer - Dev/Mock Dispatch]`);
    console.info(`  To: ${to}`);
    console.info(`  Subject: "${subject}"`);
    console.info(`  Notice: Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send real emails.`);
    return { success: true, id: `mock_email_${Date.now()}` };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      html,
    });

    console.info(`[Nodemailer] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, id: info.messageId };
  } catch (error: any) {
    console.error("[Nodemailer Send Error]:", error.message);
    return { success: false };
  }
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

