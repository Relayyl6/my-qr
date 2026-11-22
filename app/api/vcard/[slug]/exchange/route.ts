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

    // Save contact into customer mail contact list
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

    // Save lead into microSaasItem spec.leads array for instant dashboard visibility
    const spec = (item.spec as any) || {};
    const existingLeads = Array.isArray(spec.leads) ? spec.leads : [];
    const newLead = {
      name: firstName || "Anonymous",
      email,
      phone: phone || "",
      exchangedAt: new Date().toISOString(),
    };
    const updatedLeads = [newLead, ...existingLeads.filter((l: any) => l.email !== email)].slice(0, 300);

    await prisma.microSaasItem.update({
      where: { id: item.id },
      data: {
        spec: {
          ...spec,
          leads: updatedLeads,
        },
      },
    }).catch(() => {});

    // Send instant connection emails to both parties
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://my-qr-sandy.vercel.app";
    const vcardUrl = `${siteUrl}/c/${slug}`;
    const vcfDownloadUrl = `${siteUrl}/api/vcard/${slug}/download`;
    const cardOwnerName = spec.fullName || item.title || "DynamicQR User";

    const cardOwnerUser = await prisma.user.findUnique({
      where: { id: item.userId },
      select: { email: true },
    });

    try {
      const { sendEmail } = await import("@/lib/email/send");

      // 1. Notify vCard Owner of the new lead
      if (cardOwnerUser?.email) {
        await sendEmail({
          to: cardOwnerUser.email,
          subject: `🎉 New Connection: ${firstName || email} connected via your vCard "${item.title}"`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
              <div style="font-size:11px;font-weight:700;color:#2F6B4F;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">New Contact Lead</div>
              <h2 style="margin:0 0 12px 0;color:#11140f;font-size:20px;">Someone shared their details with you!</h2>
              <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                A contact just scanned your digital business card <strong>"${item.title}"</strong> and submitted their contact information:
              </p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px;">
                <p style="margin:0 0 8px 0;font-size:14px;color:#111827;"><strong>Full Name:</strong> ${firstName || "Not provided"}</p>
                <p style="margin:0 0 8px 0;font-size:14px;color:#111827;"><strong>Email Address:</strong> <a href="mailto:${email}" style="color:#2F6B4F;font-weight:600;">${email}</a></p>
                ${phone ? `<p style="margin:0;font-size:14px;color:#111827;"><strong>Phone Number:</strong> <a href="tel:${phone}" style="color:#2F6B4F;font-weight:600;">${phone}</a></p>` : ""}
              </div>
              <p style="color:#6b7280;font-size:12px;line-height:1.5;margin:0 0 16px 0;">
                You can view and export all your captured leads directly in your <a href="${siteUrl}/#workspace" style="color:#2F6B4F;font-weight:600;">DynamicQR Workspace</a>.
              </p>
            </div>
          `,
        });
      }

      // 2. Send instant card & .vcf link to the visitor
      await sendEmail({
        to: email,
        subject: `Nice connecting! Here is ${cardOwnerName}'s contact card`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
            <div style="font-size:11px;font-weight:700;color:#2F6B4F;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Contact Exchange</div>
            <h2 style="margin:0 0 12px 0;color:#11140f;font-size:20px;">Great connecting with you!</h2>
            <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
              You recently connected with <strong>${cardOwnerName}</strong>. Tap below to save their full contact card directly to your phone:
            </p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${vcfDownloadUrl}" style="display:inline-block;background:#2F6B4F;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                Save ${cardOwnerName}'s Contact to Phone (.vcf)
              </a>
            </div>
            <p style="text-align:center;font-size:13px;color:#6b7280;margin:0 0 20px 0;">
              Or view the live digital profile: <a href="${vcardUrl}" style="color:#2F6B4F;font-weight:600;">${vcardUrl}</a>
            </p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:20px 0;" />
            <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0;">
              Powered by <a href="${siteUrl}" style="color:#6b7280;text-decoration:underline;font-weight:700;">Dynamic QR</a>
            </p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.warn("[vCard Exchange Mailer Warning]:", mailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Contact exchanged successfully! Thank you for connecting.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to exchange contact" }, { status: 500 });
  }
}
