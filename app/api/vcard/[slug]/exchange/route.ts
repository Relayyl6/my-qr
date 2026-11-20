import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const item = await prisma.microSaasItem.findUnique({
      where: { slug },
    });

    if (!item || item.type !== "vcard") {
      return NextResponse.json({ error: "vCard not found" }, { status: 404 });
    }

    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const firstName = (body.name || "").toString().trim().slice(0, 50);
    const phone = (body.phone || "").toString().trim().slice(0, 30);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    // Find user's primary mailing list or create one
    let list = await prisma.customerMailList.findFirst({
      where: { userId: item.userId },
    });

    if (!list) {
      list = await prisma.customerMailList.create({
        data: {
          userId: item.userId,
          name: `${item.title}'s Contacts`,
          description: "Leads captured via digital business card exchange",
        },
      });
    }

    // Save contact
    await prisma.customerMailContact.upsert({
      where: {
        listId_email: {
          listId: list.id,
          email,
        },
      },
      create: {
        userId: item.userId,
        listId: list.id,
        email,
        firstName: firstName || null,
        source: `vcard_exchange:${slug}`,
        status: "active",
      },
      update: {
        firstName: firstName || undefined,
        status: "active",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contact exchanged successfully! Thank you for connecting.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to exchange contact" }, { status: 500 });
  }
}
