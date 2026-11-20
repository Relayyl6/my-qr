import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { broadcastCustomerMailCampaign } from "@/lib/email/send";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: listId } = await params;
    const body = await req.json();
    const subject = (body.subject || "").toString().trim();
    const bodyHtml = (body.bodyHtml || "").toString().trim();

    if (!subject || !bodyHtml) {
      return NextResponse.json({ error: "Subject and email body are required" }, { status: 400 });
    }

    const result = await broadcastCustomerMailCampaign({
      userId: user.id,
      listId,
      subject,
      bodyHtml,
      siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://dynamicqr.co",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      sentCount: result.sentCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to broadcast" }, { status: 500 });
  }
}
