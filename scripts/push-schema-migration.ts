// Script to push schema changes via Neon serverless HTTP (bypasses TCP firewall)
// Run with: npx tsx scripts/push-schema-migration.ts

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Running schema migration via Neon HTTP API...');

  // 1. Add new columns to SiteVisit
  const siteVisitAlters = [
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "sessionId" TEXT`,
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "region" TEXT`,
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION`,
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION`,
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "timezone" TEXT`,
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "isp" TEXT`,
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "screenWidth" INTEGER`,
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "screenHeight" INTEGER`,
    `ALTER TABLE "SiteVisit" ADD COLUMN IF NOT EXISTS "language" TEXT`,
  ];

  for (const stmt of siteVisitAlters) {
    console.log(` → ${stmt.slice(0, 60)}...`);
    await sql.unsafe(stmt);
  }

  // 2. Add index for sessionId on SiteVisit
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS "SiteVisit_sessionId_idx" ON "SiteVisit"("sessionId")`);

  // 3. Create VisitorSession table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "VisitorSession" (
      "id"           TEXT NOT NULL,
      "ipHash"       TEXT,
      "country"      TEXT,
      "region"       TEXT,
      "city"         TEXT,
      "lat"          DOUBLE PRECISION,
      "lng"          DOUBLE PRECISION,
      "timezone"     TEXT,
      "isp"          TEXT,
      "device"       TEXT,
      "browser"      TEXT,
      "os"           TEXT,
      "userAgent"    TEXT,
      "screenWidth"  INTEGER,
      "screenHeight" INTEGER,
      "language"     TEXT,
      "referrer"     TEXT,
      "utmSource"    TEXT,
      "utmMedium"    TEXT,
      "utmCampaign"  TEXT,
      "entryPath"    TEXT,
      "duration"     INTEGER,
      "pageCount"    INTEGER NOT NULL DEFAULT 1,
      "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VisitorSession_pkey" PRIMARY KEY ("id")
    )
  `);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS "VisitorSession_createdAt_idx" ON "VisitorSession"("createdAt")`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS "VisitorSession_ipHash_idx" ON "VisitorSession"("ipHash")`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS "VisitorSession_country_idx" ON "VisitorSession"("country")`);

  // 4. Create SessionEvent table
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "SessionEvent" (
      "id"        TEXT NOT NULL,
      "sessionId" TEXT NOT NULL,
      "type"      INTEGER NOT NULL,
      "data"      JSONB NOT NULL DEFAULT '{}',
      "timestamp" BIGINT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SessionEvent_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "SessionEvent_sessionId_fkey" FOREIGN KEY ("sessionId")
        REFERENCES "VisitorSession"("id") ON DELETE CASCADE
    )
  `);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS "SessionEvent_sessionId_timestamp_idx" ON "SessionEvent"("sessionId", "timestamp")`);
  await sql.unsafe(`CREATE INDEX IF NOT EXISTS "SessionEvent_createdAt_idx" ON "SessionEvent"("createdAt")`);

  // 5. Record migration in _prisma_migrations table (optional — just mark it)
  console.log('\n✅ Migration complete!');
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
