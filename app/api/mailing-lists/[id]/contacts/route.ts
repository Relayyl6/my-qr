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
    let contactIds: string[] = [];

    if (contactId) {
      contactIds = contactId.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      try {
        const body = await req.json();
        if (Array.isArray(body.contactIds)) {
          contactIds = body.contactIds;
        } else if (body.contactId) {
          contactIds = [body.contactId];
        }
      } catch {}
    }

    if (contactIds.length === 0) {
      return NextResponse.json({ error: "contactId or contactIds array is required" }, { status: 400 });
    }

    const result = await prisma.customerMailContact.deleteMany({
      where: { id: { in: contactIds }, listId: id, userId: user.id },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { contactId, firstName, email, status } = body;

    if (!contactId) {
      return NextResponse.json({ error: "contactId is required" }, { status: 400 });
    }

    const contact = await prisma.customerMailContact.findFirst({
      where: { id: contactId, listId: id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = String(firstName).trim() || null;
    if (email !== undefined) {
      const cleanEmail = String(email).trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
      }
      updateData.email = cleanEmail;
    }
    if (status !== undefined) {
      updateData.status = ["active", "unsubscribed", "pending"].includes(status) ? status : "active";
    }

    const updated = await prisma.customerMailContact.update({
      where: { id: contactId },
      data: updateData,
    });

    return NextResponse.json({ success: true, contact: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
