import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aggregateUserScans } from "@/lib/analytics/aggregate";
import { runAI } from "@/lib/ai/run";
import { CampaignAnalystOutput } from "@/lib/ai/prompts/campaign-analyst.v1";
import "@/lib/ai/prompts/campaign-analyst.v1";
import { sendEmail, buildWeeklyDigestEmailHtml } from "@/lib/email/send";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Authorization check for cron invocation (e.g. CRON_SECRET)
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usersWithLinks = await prisma.user.findMany({
      where: {
        links: {
          some: { isArchived: false },
        },
      },
      select: { id: true, email: true },
    });

    const summaries = [];

    for (const user of usersWithLinks) {
      const stats = await aggregateUserScans(user.id, 7);
      if (stats.totalScans > 0) {
        const result = await runAI<CampaignAnalystOutput>({
          feature: "campaign-analyst",
          promptKey: "campaign-analyst.v1",
          input: stats,
          userId: user.id,
          cacheKey: `weekly-digest-${user.id}-${Date.now()}`,
        });

        const emailHtml = buildWeeklyDigestEmailHtml({
          email: user.email,
          totalScans: stats.totalScans,
          summary: result.data.summary,
          recommendations: (result.data.suggestedActions || []).map((a) => `${a.title}: ${a.description}`),
        });

        const emailResult = await sendEmail({
          to: user.email,
          subject: `📈 Your DynamicQR Weekly Report: ${stats.totalScans} scans this week`,
          html: emailHtml,
        });

        summaries.push({
          userId: user.id,
          email: user.email,
          totalScans: stats.totalScans,
          brief: result.data.summary,
          emailDispatched: emailResult.success,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedUsers: usersWithLinks.length,
      digestsGenerated: summaries.length,
      digests: summaries,
    });
  } catch (error: any) {
    console.error("Weekly digest cron failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
