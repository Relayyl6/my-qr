import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: listId } = await params;
    const list = await prisma.customerMailList.findFirst({
      where: { id: listId, userId: user.id },
    });

    if (!list) return NextResponse.json({ error: "Mailing list not found" }, { status: 404 });

    const body = await req.json();
    const rows = Array.isArray(body.contacts) ? body.contacts : [];

    if (rows.length === 0) {
      return NextResponse.json({ error: "No contacts provided for import" }, { status: 400 });
    }

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const currentContacts = await prisma.customerMailContact.count({
      where: { userId: user.id },
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRows = rows
      .map((r: any) => ({
        email: (r.email || "").toString().trim().toLowerCase(),
        firstName: (r.firstName || r.name || "").toString().trim().slice(0, 50) || null,
      }))
      .filter((r: { email: string; firstName: string | null }) => r.email && emailRegex.test(r.email));

    if (validRows.length === 0) {
      return NextResponse.json({ error: "No valid email addresses found in import data" }, { status: 400 });
    }

    if (currentContacts + validRows.length > entitlements.subscribers_max) {
      const allowed = Math.max(0, entitlements.subscribers_max - currentContacts);
      return NextResponse.json(
        {
          error: `Import exceeds plan subscriber capacity. Current contacts: ${currentContacts}/${entitlements.subscribers_max}. You can only add up to ${allowed} more contacts on ${entitlements.name} plan.`,
        },
        { status: 403 }
      );
    }

    let importedCount = 0;
    for (const row of validRows) {
      await prisma.customerMailContact.upsert({
        where: {
          listId_email: {
            listId,
            email: row.email,
          },
        },
        create: {
          userId: user.id,
          listId,
          email: row.email,
          firstName: row.firstName,
          status: "active",
          source: "csv_import",
          token: crypto.randomBytes(24).toString("hex"),
          confirmedAt: new Date(),
        },
        update: {
          firstName: row.firstName || undefined,
          status: "active",
          confirmedAt: new Date(),
        },
      });
      importedCount++;
    }

    return NextResponse.json({
      success: true,
      importedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to import contacts" }, { status: 500 });
  }
}
