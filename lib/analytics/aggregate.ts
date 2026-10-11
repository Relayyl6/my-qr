import { prisma } from "@/lib/prisma";

export interface AggregatedStatsBlob {
  periodDays: number;
  totalLinks: number;
  totalScans: number;
  deviceBreakdown: {
    ios: number;
    android: number;
    desktop: number;
  };
  timeOfDayBreakdown: {
    morning: number;   // 6am - 12pm
    afternoon: number; // 12pm - 6pm
    evening: number;   // 6pm - 12am
    night: number;     // 12am - 6am
  };
  links: Array<{
    id: string;
    shortCode: string;
    label: string | null;
    destinationUrl: string;
    totalScans: number;
    periodScans: number;
    topDevice: string;
    lastScannedDaysAgo: number | null;
  }>;
  staleLinksCount: number;
}

export async function aggregateUserScans(
  userId: string,
  days = 30
): Promise<AggregatedStatsBlob> {
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Fetch all user links with recent scan details
  const links = await prisma.qrLink.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: {
      scans: {
        where: { scannedAt: { gte: sinceDate } },
        select: {
          scannedAt: true,
          device: true,
          country: true,
        },
      },
    },
    orderBy: { scanCount: "desc" },
  });

  let totalScansInPeriod = 0;
  const deviceCounts: Record<string, number> = { ios: 0, android: 0, desktop: 0 };
  const timeCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  const linkSummaries = links.map((link) => {
    const periodScans = link.scans.length;
    totalScansInPeriod += periodScans;

    const linkDevices: Record<string, number> = {};
    for (const scan of link.scans) {
      const dev = scan.device?.toLowerCase() || "desktop";
      linkDevices[dev] = (linkDevices[dev] || 0) + 1;
      if (dev in deviceCounts) {
        deviceCounts[dev]++;
      } else {
        deviceCounts.desktop++;
      }

      const hour = new Date(scan.scannedAt).getHours();
      if (hour >= 6 && hour < 12) timeCounts.morning++;
      else if (hour >= 12 && hour < 18) timeCounts.afternoon++;
      else if (hour >= 18 && hour < 24) timeCounts.evening++;
      else timeCounts.night++;
    }

    let topDevice = "desktop";
    let maxDevCount = 0;
    for (const [dev, count] of Object.entries(linkDevices)) {
      if (count > maxDevCount) {
        maxDevCount = count;
        topDevice = dev;
      }
    }

    const lastScannedDaysAgo = link.lastScannedAt
      ? Math.floor((Date.now() - new Date(link.lastScannedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: link.id,
      shortCode: link.shortCode,
      label: link.label,
      destinationUrl: link.destinationUrl,
      totalScans: link.scanCount,
      periodScans,
      topDevice,
      lastScannedDaysAgo,
    };
  });

  const staleLinksCount = linkSummaries.filter(
    (l) => l.lastScannedDaysAgo === null || l.lastScannedDaysAgo > 7
  ).length;

  return {
    periodDays: days,
    totalLinks: links.length,
    totalScans: totalScansInPeriod,
    deviceBreakdown: deviceCounts as { ios: number; android: number; desktop: number },
    timeOfDayBreakdown: timeCounts,
    links: linkSummaries,
    staleLinksCount,
  };
}
