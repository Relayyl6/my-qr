import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

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

    const spec = (item.spec as any) || {};

    // 1. Expiration Date Check
    if (spec.expiresAt) {
      const expirationDate = new Date(spec.expiresAt);
      if (!isNaN(expirationDate.getTime()) && expirationDate < new Date()) {
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head><title>Link Expired — DynamicQR</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0c0f0d; color: #fff; margin: 0; padding: 20px; text-align: center;">
              <div style="max-width: 420px; padding: 32px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;">
                <div style="font-size: 36px; margin-bottom: 12px;">⏳</div>
                <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">This Link Has Expired</h2>
                <p style="font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; margin: 0 0 20px;">The link creator set an expiration date that has passed.</p>
                <a href="${APP_URL}" style="display: inline-block; padding: 10px 20px; background: #059669; color: #fff; text-decoration: none; border-radius: 12px; font-size: 13px; font-weight: 600;">Return to DynamicQR</a>
              </div>
            </body>
          </html>`,
          { status: 410, headers: { 'Content-Type': 'text/html' } }
        );
      }
    }

    // 2. Click Limit Check
    if (spec.maxClicks && Number(spec.maxClicks) > 0) {
      if (item.scansCount >= Number(spec.maxClicks)) {
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head><title>Click Limit Reached — DynamicQR</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0c0f0d; color: #fff; margin: 0; padding: 20px; text-align: center;">
              <div style="max-width: 420px; padding: 32px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;">
                <div style="font-size: 36px; margin-bottom: 12px;">🔒</div>
                <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">Link Limit Reached</h2>
                <p style="font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; margin: 0 0 20px;">This short link has reached its maximum allocated click limit (${spec.maxClicks}).</p>
                <a href="${APP_URL}" style="display: inline-block; padding: 10px 20px; background: #059669; color: #fff; text-decoration: none; border-radius: 12px; font-size: 13px; font-weight: 600;">Return to DynamicQR</a>
              </div>
            </body>
          </html>`,
          { status: 403, headers: { 'Content-Type': 'text/html' } }
        );
      }
    }

    // 3. Password / PIN Protection Check
    if (spec.password && String(spec.password).trim()) {
      const providedPass = req.nextUrl.searchParams.get("pin") || req.nextUrl.searchParams.get("password");
      if (providedPass !== String(spec.password).trim()) {
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head><title>Protected Link — DynamicQR</title><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0c0f0d; color: #fff; margin: 0; padding: 20px;">
              <form method="GET" action="" style="max-width: 380px; width: 100%; padding: 32px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 12px;">🔐</div>
                <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 6px;">Passcode Required</h2>
                <p style="font-size: 12.5px; color: rgba(255,255,255,0.6); margin: 0 0 20px;">This link is protected. Enter the PIN or passcode to proceed.</p>
                ${providedPass ? '<p style="color: #ef4444; font-size: 12px; margin-bottom: 12px;">Incorrect passcode. Please try again.</p>' : ''}
                <input type="password" name="pin" placeholder="Enter PIN or Passcode" required style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); color: #fff; font-size: 14px; text-align: center; box-sizing: border-box; margin-bottom: 16px; outline: none;"/>
                <button type="submit" style="width: 100%; padding: 12px; background: #059669; color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer;">Unlock & Continue →</button>
              </form>
            </body>
          </html>`,
          { status: 401, headers: { 'Content-Type': 'text/html' } }
        );
      }
    }

    let target = spec.destinationUrl || APP_URL;

    // Guard against self-redirect loops
    try {
      const targetUrl = new URL(target);
      const reqUrl = new URL(req.url);
      if (
        (targetUrl.hostname === reqUrl.hostname || targetUrl.hostname.includes('vercel.app')) &&
        (targetUrl.pathname === `/s/${slug}` || targetUrl.pathname === `/s/${slug}/`)
      ) {
        return NextResponse.redirect(new URL("/?error=self_redirect_prevented", req.url));
      }
    } catch (e) {}

    // Increment scan / click count asynchronously only after validating target is not looping
    prisma.microSaasItem
      .update({
        where: { id: item.id },
        data: { scansCount: { increment: 1 } },
      })
      .catch(() => {});

    // 4. Device OS Conditional Routing
    const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIos && spec.iosUrl) {
      target = spec.iosUrl;
    } else if (isAndroid && spec.androidUrl) {
      target = spec.androidUrl;
    }

    // 5. UTM Parameter Injection
    try {
      const urlObj = new URL(target);
      if (spec.utmSource) urlObj.searchParams.set("utm_source", spec.utmSource);
      if (spec.utmMedium) urlObj.searchParams.set("utm_medium", spec.utmMedium);
      if (spec.utmCampaign) urlObj.searchParams.set("utm_campaign", spec.utmCampaign);
      if (spec.utmTerm) urlObj.searchParams.set("utm_term", spec.utmTerm);
      if (spec.utmContent) urlObj.searchParams.set("utm_content", spec.utmContent);
      target = urlObj.toString();
    } catch (e) {
      // If URL parsing fails, continue with base target
    }

    // 6. Social Media Crawler OpenGraph Unfurl
    const isCrawler = /facebookexternalhit|twitterbot|whatsapp|telegrambot|slackbot|linkedinbot|discordbot|applebot|googlebot/i.test(userAgent);
    const ogTitle = spec.ogTitle || item.title || "DynamicQR Short Link";
    const ogDesc = spec.ogDescription || `Visit link on DynamicQR: ${target}`;
    const ogImage = spec.ogImage || "";

    if (isCrawler || (spec.ogTitle && req.nextUrl.searchParams.get('preview') === 'true')) {
      const escapedTitle = ogTitle.replace(/"/g, '&quot;');
      const escapedDesc = ogDesc.replace(/"/g, '&quot;');
      const escapedImage = ogImage.replace(/"/g, '&quot;');
      const safeTarget = target.replace(/"/g, '&quot;');

      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>${escapedTitle}</title>
            <meta name="description" content="${escapedDesc}" />
            <meta property="og:type" content="website" />
            <meta property="og:title" content="${escapedTitle}" />
            <meta property="og:description" content="${escapedDesc}" />
            ${ogImage ? `<meta property="og:image" content="${escapedImage}" />` : ''}
            <meta property="og:url" content="${req.url}" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="${escapedTitle}" />
            <meta name="twitter:description" content="${escapedDesc}" />
            ${ogImage ? `<meta name="twitter:image" content="${escapedImage}" />` : ''}
            <meta http-equiv="refresh" content="0;url=${safeTarget}" />
          </head>
          <body style="font-family: sans-serif; background: #0c0f0d; color: #fff; padding: 40px; text-align: center;">
            <p>Redirecting to <a href="${safeTarget}" style="color: #10b981;">${safeTarget}</a>...</p>
            <script>window.location.replace(${JSON.stringify(target)});</script>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store',
          },
        }
      );
    }

    return NextResponse.redirect(target, { status: 307 });
  } catch (err) {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
