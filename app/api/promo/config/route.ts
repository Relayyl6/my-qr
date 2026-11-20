import { NextResponse } from "next/server";
import { adminGetPromoConfig } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const config = await adminGetPromoConfig();
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json(
      {
        banner: {
          enabled: true,
          badgeText: "BLACK FRIDAY",
          messageText: "Save 40% OFF all annual plans with code",
          promoCode: "BLACKFRIDAY40",
          ctaText: "Claim Offer",
          ctaUrl: "/pricing?promo=BLACKFRIDAY40",
        },
        modal: {
          enabled: true,
          badgeText: "BLACK FRIDAY SPECIAL",
          headline: "Unlock 40% Off DynamicQR Pro & Plus",
          bodyText: "Get high-converting QR codes, 307 speed redirects, branded domains, and AI routing.",
          discountPercent: 40,
          promoCode: "BLACKFRIDAY40",
          ctaText: "Claim 40% Discount",
          frequencyDays: 7,
        },
      },
      { status: 200 }
    );
  }
}
