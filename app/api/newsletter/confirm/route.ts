import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/newsletter/confirmed?status=invalid", req.url));
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { token },
    });

    if (!subscriber) {
      return NextResponse.redirect(new URL("/newsletter/confirmed?status=invalid", req.url));
    }

    // Check token age (72 hours expiration)
    const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
    if (subscriber.consentAt < seventyTwoHoursAgo && subscriber.status !== "active") {
      return NextResponse.redirect(new URL("/newsletter/confirmed?status=expired", req.url));
    }

    // Mark active
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "active",
        confirmedAt: new Date(),
      },
    });

    return NextResponse.redirect(new URL("/newsletter/confirmed?status=success", req.url));
  } catch (err) {
    console.error("[Newsletter Confirm Error]:", err);
    return NextResponse.redirect(new URL("/newsletter/confirmed?status=error", req.url));
  }
}
