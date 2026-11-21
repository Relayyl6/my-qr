import { NextResponse } from "next/server";
import { adminGetPromoConfig } from "@/app/admin/actions";
import { DEFAULT_PROMO_CONFIG } from "@/lib/promo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const config = await adminGetPromoConfig();
    return NextResponse.json(config);
  } catch (err: any) {
    return NextResponse.json(DEFAULT_PROMO_CONFIG, { status: 200 });
  }
}
