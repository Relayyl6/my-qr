import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanTier } from "@/lib/plans";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const menus = await prisma.microSaasItem.findMany({
      where: { userId: user.id, type: "menu" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      menus,
      used: menus.length,
      max: entitlements.microsaas.menu,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userTier = (user.tier || "free").toLowerCase() as PlanTier;
    const entitlements = PLANS[userTier] || PLANS.free;

    const existingCount = await prisma.microSaasItem.count({
      where: { userId: user.id, type: "menu" },
    });

    if (existingCount >= entitlements.microsaas.menu) {
      return NextResponse.json(
        {
          error: `Menu limit reached (${existingCount}/${entitlements.microsaas.menu} on ${entitlements.name} plan). Upgrade to create more menus.`,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const title = (body.title || "").toString().trim();
    const currency = (body.currency || "$").toString().trim();
    const customSlug = (body.slug || "").toString().trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const sections = Array.isArray(body.sections) ? body.sections : [];

    if (!title) {
      return NextResponse.json({ error: "Menu title is required" }, { status: 400 });
    }

    const finalSlug = customSlug || `menu-${Date.now().toString(36)}`;

    const existing = await prisma.microSaasItem.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      return NextResponse.json({ error: `Slug '${finalSlug}' already exists` }, { status: 409 });
    }

    const specPayload = {
      currency,
      sections: sections.length > 0 ? sections : [
        {
          name: "Starters & Appetizers",
          items: [
            { id: "1", title: "Crispy Truffle Fries", description: "Parmesan, herbs, black truffle aioli", price: "12", isSoldOut: false, isVegetarian: true },
            { id: "2", title: "Artisan Bruschetta", description: "Heirloom tomatoes, fresh basil, balsamic reduction", price: "14", isSoldOut: false, isVegetarian: true },
          ],
        },
        {
          name: "Main Courses",
          items: [
            { id: "3", title: "Wood-Fired Ribeye", description: "Grass-fed beef, rosemary roasted baby potatoes, red wine demi", price: "34", isSoldOut: false, isSpicy: false },
            { id: "4", title: "Pan-Seared Salmon", description: "Wild Alaskan salmon, asparagus risotto, lemon-dill emulsion", price: "28", isSoldOut: false, isGlutenFree: true },
          ],
        },
        {
          name: "Craft Cocktails & Drinks",
          items: [
            { id: "5", title: "Smoked Old Fashioned", description: "Bourbon, angostura bitters, orange zest, cherry smoke", price: "16", isSoldOut: false },
          ],
        },
      ],
      showBranding: entitlements.branded_footer,
    };

    const created = await prisma.microSaasItem.create({
      data: {
        userId: user.id,
        type: "menu",
        slug: finalSlug,
        title,
        spec: specPayload,
      },
    });

    return NextResponse.json({ success: true, menu: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
