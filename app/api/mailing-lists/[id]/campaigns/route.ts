import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: listId } = await params;

    // Strict tenant isolation: verify list belongs to this user
    const list = await prisma.customerMailList.findFirst({
      where: { id: listId, userId: user.id },
      select: { id: true },
    });

    if (!list) return NextResponse.json({ error: "Mailing list not found" }, { status: 404 });

    const campaigns = await prisma.customerMailCampaign.findMany({
      where: { listId, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        subject: true,
        bodyHtml: true,
        status: true,
        sentAt: true,
        sentCount: true,
        recipientCount: true,
        recipients: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ campaigns });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch campaigns" }, { status: 500 });
  }
}
