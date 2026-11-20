import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminEmail = (process.env.ADMIN_EMAIL || "oseghaleleonard39@gmail.com").toLowerCase();
    const isAdmin = user.email.toLowerCase() === adminEmail;

    const { id } = await params;
    const item = await prisma.microSaasItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.microSaasItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Item deleted successfully" });
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

    const adminEmail = (process.env.ADMIN_EMAIL || "oseghaleleonard39@gmail.com").toLowerCase();
    const isAdmin = user.email.toLowerCase() === adminEmail;

    const { id } = await params;
    const item = await prisma.microSaasItem.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.userId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updated = await prisma.microSaasItem.update({
      where: { id },
      data: {
        active: body.active !== undefined ? Boolean(body.active) : undefined,
        title: body.title ? String(body.title).trim() : undefined,
        spec: body.spec !== undefined ? body.spec : undefined,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
