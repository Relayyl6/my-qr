import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/newsletter/unsubscribed?status=invalid", req.url));
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { token },
    });

    if (!subscriber) {
      return NextResponse.redirect(new URL("/newsletter/unsubscribed?status=not_found", req.url));
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL("/newsletter/unsubscribed?status=success", req.url));
  } catch (err) {
    console.error("[Newsletter Unsubscribe Error]:", err);
    return NextResponse.redirect(new URL("/newsletter/unsubscribed?status=error", req.url));
  }
}

// RFC 8058 One-Click Unsubscribe (List-Unsubscribe-Post)
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { token },
    });

    if (subscriber) {
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: {
          status: "unsubscribed",
          unsubscribedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, message: "Unsubscribed successfully" });
  } catch (err) {
    console.error("[One-Click Unsubscribe Error]:", err);
    return NextResponse.json({ error: "Failed to process unsubscribe" }, { status: 500 });
  }
}
