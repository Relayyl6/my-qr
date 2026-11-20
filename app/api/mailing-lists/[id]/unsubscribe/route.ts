import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/newsletter/unsubscribed?status=invalid", req.url));
  }

  try {
    const contact = await prisma.customerMailContact.findFirst({
      where: { listId, token },
    });

    if (contact) {
      await prisma.customerMailContact.update({
        where: { id: contact.id },
        data: {
          status: "unsubscribed",
          unsubscribedAt: new Date(),
        },
      });
    }

    return NextResponse.redirect(new URL("/newsletter/unsubscribed?status=success", req.url));
  } catch (err) {
    return NextResponse.redirect(new URL("/newsletter/unsubscribed?status=error", req.url));
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const contact = await prisma.customerMailContact.findFirst({
      where: { listId, token },
    });

    if (contact) {
      await prisma.customerMailContact.update({
        where: { id: contact.id },
        data: {
          status: "unsubscribed",
          unsubscribedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
