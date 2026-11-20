import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const contacts = await prisma.customerMailContact.findMany({
      where: { listId: id, userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ contacts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    // Verify list belongs to user
    const list = await prisma.customerMailList.findFirst({
      where: { id, userId: user.id },
    });
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    // Check total contacts quota across user account
    const totalContacts = await prisma.customerMailContact.count({
      where: { userId: user.id },
    });

    if (totalContacts >= entitlements.subscribers_max) {
      return NextResponse.json(
        {
          error: `Subscriber contact limit reached (${totalContacts}/${entitlements.subscribers_max} contacts on ${entitlements.name} plan). Upgrade your plan to store more contacts.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const rawEmail = (body.email || "").toString().trim().toLowerCase();
    const firstName = (body.firstName || "").toString().trim().slice(0, 50);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    const contact = await prisma.customerMailContact.upsert({
      where: {
        listId_email: {
          listId: id,
          email: rawEmail,
        },
      },
      create: {
        userId: user.id,
        listId: id,
        email: rawEmail,
        firstName: firstName || null,
        status: "active",
        source: "manual",
      },
      update: {
        firstName: firstName || undefined,
        status: "active",
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const contactId = req.nextUrl.searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json({ error: "contactId is required" }, { status: 400 });
    }

    await prisma.customerMailContact.deleteMany({
      where: { id: contactId, listId: id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
