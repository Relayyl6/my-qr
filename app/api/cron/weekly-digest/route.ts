import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aggregateUserScans } from "@/lib/analytics/aggregate";
import { runAI } from "@/lib/ai/run";
import { CampaignAnalystOutput } from "@/lib/ai/prompts/campaign-analyst.v1";
import "@/lib/ai/prompts/campaign-analyst.v1";

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

        summaries.push({
          userId: user.id,
          email: user.email,
          totalScans: stats.totalScans,
          brief: result.data.summary,
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
