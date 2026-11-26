// app/api/domains/vcard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateVCard, VCardContact } from "@/lib/vcard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain") || "contact";

  let contact: VCardContact = {
    name: searchParams.get("name") || domain,
    email: searchParams.get("email") || undefined,
    phone: searchParams.get("phone") || undefined,
    website: searchParams.get("website") || `https://${domain}`,
    company: searchParams.get("company") || domain,
    title: searchParams.get("title") || "Founder / Business Contact",
    note: `Official digital vCard for ${domain} powered by DynamicQR NameLaunch.`,
  };

  // If orderId is provided, pull stored brand info
  const orderId = searchParams.get("orderId");
  if (orderId) {
    const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
    if (order) {
      const bio = (order.bioConfig as any) || {};
      contact = {
        name: bio.title || order.domainName,
        company: order.domainName,
        title: bio.role || "Founder",
        email: `${order.desiredAlias}@${order.domainName}`,
        phone: bio.phone || undefined,
        website: `https://${order.domainName}`,
        note: bio.bio || `Official brand card for ${order.domainName}.`,
      };
    }
  }

  const vcfContent = generateVCard(contact);
  const safeFilename = `${domain.replace(/[^a-zA-Z0-9.-]/g, "_")}.vcf`;

  return new NextResponse(vcfContent, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
