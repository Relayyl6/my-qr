import { NextResponse } from "next/server";
import { adminGetPromoConfig } from "@/app/admin/actions";
import { DEFAULT_PROMO_CONFIG } from "@/lib/promo";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const [config, user] = await Promise.all([
      adminGetPromoConfig(),
      getCurrentUser().catch(() => null),
    ]);

    const userTier = (user?.tier || "free").toLowerCase();
    const isPaidUser = Boolean(user && userTier !== "free");

    return NextResponse.json({
      ...config,
      user: {
        loggedIn: Boolean(user),
        tier: userTier,
        isPaidUser,
      },
      isPaidUser,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ...DEFAULT_PROMO_CONFIG,
        user: { loggedIn: false, tier: "free", isPaidUser: false },
        isPaidUser: false,
      },
      { status: 200 }
    );
  }
}
