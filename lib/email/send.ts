/**
 * Transactional Email Dispatcher for DynamicQR
 * Integrates with Resend API when RESEND_API_KEY is configured,
 * otherwise logs cleanly to server console in development.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<{ success: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[Email Dispatch - Dev Mode] To: ${to} | Subject: "${subject}"`);
    return { success: true, id: `dev_mock_${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "DynamicQR <notifications@dynamicqr.co>",
        to,
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn("[Email Dispatch Failed]:", data);
      return { success: false };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("[Email Dispatch Exception]:", error.message);
    return { success: false };
  }
}

/**
 * Builds high-converting HTML email template for Weekly AI Scan Digest
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
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #EEF0EA; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid rgba(17,20,15,0.1); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
    <div style="background: #11140F; padding: 32px 32px 28px; text-align: left;">
      <span style="font-family: monospace; font-size: 11px; color: #96A689; text-transform: uppercase; letter-spacing: 1.5px; font-weight: bold;">Weekly Brief</span>
      <h1 style="color: #ffffff; font-size: 24px; margin: 8px 0 0; font-weight: 700; letter-spacing: -0.5px;">Your QR Performance</h1>
    </div>
    
    <div style="padding: 32px;">
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        <div style="background: #F7F8F5; border-radius: 12px; padding: 16px 20px; border: 1px solid rgba(17,20,15,0.06); width: 100%;">
          <div style="font-size: 11px; text-transform: uppercase; color: #6B7280; font-weight: 600; letter-spacing: 1px;">7-Day Scans</div>
          <div style="font-size: 32px; font-weight: 800; color: #11140F; margin-top: 4px;">${totalScans.toLocaleString()}</div>
        </div>
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
