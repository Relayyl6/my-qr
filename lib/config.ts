/**
 * Centralized Application Configuration
 * Single source of truth for the primary public domain and application URLs.
 */

export const APP_URL = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://my-qr-sandy.vercel.app"
).replace(/\/$/, "");
