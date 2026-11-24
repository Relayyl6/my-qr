import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const item = await prisma.microSaasItem.findUnique({
      where: { slug },
    });

    if (!item || item.type !== "vcard") {
      return new NextResponse("vCard not found", { status: 404 });
    }

    const spec = item.spec as any;
    const firstName = spec.firstName || "";
    const lastName = spec.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const org = spec.company || "";
    const title = spec.title || "";
    const phone = spec.phone || "";
    const whatsapp = spec.whatsapp || "";
    const email = spec.email || "";
    const website = spec.website || "";
    const bio = spec.bio || "";
    const address = spec.address || "";
    const instagram = spec.instagram || "";

    // Generate standard RFC 6350 vCard
    const vcardContent = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName};;;`,
      `FN:${fullName}`,
      org ? `ORG:${org}` : null,
      title ? `TITLE:${title}` : null,
      phone ? `TEL;TYPE=CELL,VOICE:${phone}` : null,
      whatsapp ? `TEL;TYPE=WHATSAPP:${whatsapp}` : null,
      email ? `EMAIL;TYPE=WORK,INTERNET:${email}` : null,
      website ? `URL:${website}` : null,
      address ? `ADR;TYPE=WORK:;;${address};;;;` : null,
      instagram ? `X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${instagram.replace(/^@/, '')}` : null,
      bio ? `NOTE:${bio.replace(/\n/g, "\\n")}` : null,
      "REV:" + new Date().toISOString(),
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");

    return new NextResponse(vcardContent, {
      status: 200,
      headers: {
        "Content-Type": "text/vcard; charset=utf-8",
        "Content-Disposition": `attachment; filename="${slug}.vcf"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    return new NextResponse("Failed to download vCard", { status: 500 });
  }
}
