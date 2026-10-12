import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildMonthlyResetEmailHtml } from "@/lib/email/send";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(0, 0, 0, 0);

    // Reset usedThisMonth to 0 for all active user AI credits
    const resetResult = await prisma.aiCredit.updateMany({
      data: {
        usedThisMonth: 0,
        resetAt: nextMonth,
      },
    });

    console.info(`[Monthly AI Credit Reset] Reset ${resetResult.count} user credits.`);

    // Notify active users that their monthly scan and AI limits have reset
    const activeUsers = await prisma.user.findMany({
      where: {
        links: {
          some: { isArchived: false },
        },
      },
      select: { id: true, email: true, tier: true },
    });

    for (const u of activeUsers) {
      if (u.email) {
        await sendEmail({
          to: u.email,
          subject: "🎉 Your DynamicQR monthly limits have been reset!",
          html: buildMonthlyResetEmailHtml({
            email: u.email,
            tier: u.tier || "free",
          }),
        }).catch((err) => console.error(`[Monthly Reset Email Error for ${u.email}]:`, err));
      }
    }

    return NextResponse.json({
      success: true,
      creditsReset: resetResult.count,
      notifiedUsers: activeUsers.length,
      nextReset: nextMonth.toISOString(),
    });
  } catch (error: any) {
    console.error("[Monthly Credit Reset Failed]:", error);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
