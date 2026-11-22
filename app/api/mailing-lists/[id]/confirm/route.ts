import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/config";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const token = req.nextUrl.searchParams.get("token");

  try {
    const list = await prisma.customerMailList.findUnique({
      where: { id: listId },
      select: { name: true },
    });

    const businessParam = encodeURIComponent(list?.name || "your subscribed list");

    if (!token) {
      return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=success&business=${businessParam}`);
    }

    const contact = await prisma.customerMailContact.findFirst({
      where: { listId, token },
    });

    if (contact) {
      await prisma.customerMailContact.update({
        where: { id: contact.id },
        data: {
          status: "active",
          confirmedAt: new Date(),
        },
      });
    }

    return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=success&business=${businessParam}`);
  } catch (err) {
    console.error("[Customer Mail Confirm Legacy Handler Error]:", err);
    return NextResponse.redirect(`${APP_URL}/newsletter/confirmed?status=success`);
  }
}
