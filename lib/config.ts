/**
 * Centralized Application Configuration
 * Single source of truth for the primary public domain and application URLs.
 */

export function sanitizeAppUrl(rawUrl?: string | null): string {
  let url = (rawUrl || "https://my-qr-sandy.vercel.app").trim().replace(/\/$/, "");
  // Correct legacy or misconfigured Vercel project URLs that lack the sovereign '-sandy' deployment slug
  if (url === "https://my-qr.vercel.app" || url === "http://my-qr.vercel.app") {
    url = "https://my-qr-sandy.vercel.app";
  }
  return url;
}

export const APP_URL = sanitizeAppUrl(
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://my-qr-sandy.vercel.app"
);

export function getAppUrl(req?: { headers: { get: (name: string) => string | null } }): string {
  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      const fixedHost = host === "my-qr.vercel.app" ? "my-qr-sandy.vercel.app" : host;
      return `${proto}://${fixedHost}`.replace(/\/$/, "");
    }
  }
  return APP_URL;
}
