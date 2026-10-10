# Pre-Production Deployment Checklist

## 1. Protect the Dashboard (No Auth Currently)
Right now, anyone who visits your root URL (`/`) can see the dashboard, create links, edit destinations, and delete them.
- [ ] **Action:** Before sharing your main domain, add authentication. The quickest method is to add a simple HTTP Basic Auth `middleware.ts` to block the `/` route with a password. For a more robust solution, drop in **Clerk** or **NextAuth.js**.

## 2. Aggressive Next.js Caching on Redirects
Next.js 14 tries to aggressively cache `GET` routes. While we set browser headers not to cache the redirect, Vercel's Edge Network might have accidentally cached the database lookup.
- [x] **Action:** (Patched!) Added `export const dynamic = 'force-dynamic';` to `app/id/[shortCode]/route.ts`. This acts as an iron-clad guarantee that Vercel will look at the database fresh on *every single scan*.

## 3. Connection Pooling for Postgres
Since Vercel scales using serverless functions, a viral QR code could spawn 500 Vercel functions at once. If all 500 try to open a direct connection to your new Postgres database, the database will crash.
- [ ] **Action:** When setting up your Neon database, ensure you use the **Connection Pool** or **Transaction** URL (often adding `?pgbouncer=true` or checking the pooler URL).

## 4. Malformed URLs & XSS Protection
If someone figures out how to bypass the form and pushes `javascript:alert('hacked')` into your database as a destination URL, scanning the QR code could execute an XSS attack.
- [x] **Action:** (Protected!) The `normalizeUrl` utility aggressively forces `https://` onto anything that doesn't start with a valid HTTP protocol, turning potential XSS payloads into broken links.

## 5. Missing Environment Variables on Vercel
When you push to GitHub and Vercel builds the project, it won't have access to your local `.env` file. 
- [ ] **Action:** Add `DATABASE_URL` in the Vercel project settings *first*, before pushing. Go to Vercel > Settings > Environment Variables, add `DATABASE_URL`, and *then* push your code!
