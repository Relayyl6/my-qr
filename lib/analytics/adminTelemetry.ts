import { prisma } from '@/lib/prisma';

export interface TelemetryMetrics {
  timeframe: '24h' | '7d' | '30d' | 'all';
  // High-level KPIs
  totalPageViews: number;
  uniqueVisitors: number;
  totalScans: number;
  totalUsers: number;
  freeUsersCount: number;
  paidUsersCount: number;
  proUsersCount: number;
  plusUsersCount: number;
  ultraUsersCount: number;
  activeLinksCount: number;
  
  // Financial Unit Economics
  mrr: number;
  arr: number;
  arpu: number;
  conversionRateVisitorsToSignups: number;
  conversionRateFreeToPaid: number;

  // Device & Platform Breakdown
  devices: { name: string; count: number; percentage: number }[];
  operatingSystems: { name: string; count: number; percentage: number }[];
  browsers: { name: string; count: number; percentage: number }[];

  // Traffic Sources & Referrers
  referrers: { source: string; count: number; percentage: number }[];
  utmCampaigns: { source: string; medium: string; campaign: string; count: number }[];

  // Top Visited Paths
  topPaths: { path: string; count: number }[];

  // Top Scanned Links
  topLinks: {
    id: string;
    shortCode: string;
    destinationUrl: string;
    label: string | null;
    scanCount: number;
    ownerEmail: string | null;
  }[];

  // Geographic Reach
  topCountries: { country: string; count: number; percentage: number }[];
  topCities: { city: string; country: string | null; count: number }[];

  // Hourly Activity Heatmap (0 - 23 UTC)
  hourlyDistribution: { hour: number; visits: number; scans: number }[];

  // Daily Trend Timeline (up to 30 days)
  dailyTrends: { date: string; visits: number; scans: number; signups: number }[];
}

export async function getAdminTelemetry(
  timeframe: '24h' | '7d' | '30d' | 'all' = '7d'
): Promise<TelemetryMetrics> {
  const now = new Date();
  let since = new Date(0);

  if (timeframe === '24h') {
    since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (timeframe === '7d') {
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (timeframe === '30d') {
    since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Run queries in parallel
  const [
    totalVisitsInPeriod,
    allVisits,
    allScans,
    totalUsers,
    freeUsersCount,
    proUsersCount,
    plusUsersCount,
    ultraUsersCount,
    activeLinksCount,
    topLinksRaw,
    signupsInPeriod,
  ] = await Promise.all([
    prisma.siteVisit.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.siteVisit.findMany({
      where: { createdAt: { gte: since } },
      select: {
        id: true,
        path: true,
        referrer: true,
        device: true,
        browser: true,
        os: true,
        country: true,
        city: true,
        ipHash: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    }),
    prisma.scan.findMany({
      where: { scannedAt: { gte: since } },
      select: {
        id: true,
        qrLinkId: true,
        device: true,
        country: true,
        city: true,
        scannedAt: true,
      },
      orderBy: { scannedAt: 'desc' },
      take: 10000,
    }),
    prisma.user.count(),
    prisma.user.count({ where: { tier: 'free' } }),
    prisma.user.count({ where: { tier: 'pro' } }),
    prisma.user.count({ where: { tier: 'plus' } }),
    prisma.user.count({ where: { tier: 'ultra' } }),
    prisma.qrLink.count({ where: { isArchived: false } }),
    prisma.qrLink.findMany({
      orderBy: { scanCount: 'desc' },
      take: 10,
      select: {
        id: true,
        shortCode: true,
        destinationUrl: true,
        label: true,
        scanCount: true,
        user: { select: { email: true } },
      },
    }),
    prisma.user.count({
      where: { createdAt: { gte: since } },
    }),
  ]);

  // Aggregate Unique Visitors (deduped by ipHash)
  const uniqueIpHashes = new Set<string>();
  allVisits.forEach((v) => {
    if (v.ipHash) uniqueIpHashes.add(v.ipHash);
  });
  const uniqueVisitors = Math.max(uniqueIpHashes.size, allVisits.length > 0 ? 1 : 0);

  // Device breakdown
  const deviceCounts: Record<string, number> = {
    ios: 0,
    android: 0,
    desktop: 0,
    tablet: 0,
    other: 0,
  };
  allVisits.forEach((v) => {
    const d = (v.device || 'other').toLowerCase();
    deviceCounts[d] = (deviceCounts[d] || 0) + 1;
  });
  allScans.forEach((s) => {
    const d = (s.device || 'other').toLowerCase();
    deviceCounts[d] = (deviceCounts[d] || 0) + 1;
  });
  const totalDeviceSamples = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;
  const devices = [
    { name: 'Apple iOS (iPhone/iPad)', count: (deviceCounts['ios'] || 0) + (deviceCounts['tablet'] || 0), percentage: Math.round((((deviceCounts['ios'] || 0) + (deviceCounts['tablet'] || 0)) / totalDeviceSamples) * 100) },
    { name: 'Google Android', count: deviceCounts['android'] || 0, percentage: Math.round(((deviceCounts['android'] || 0) / totalDeviceSamples) * 100) },
    { name: 'Desktop & Workstations', count: deviceCounts['desktop'] || 0, percentage: Math.round(((deviceCounts['desktop'] || 0) / totalDeviceSamples) * 100) },
    { name: 'Other / In-App Scanners', count: deviceCounts['other'] || 0, percentage: Math.round(((deviceCounts['other'] || 0) / totalDeviceSamples) * 100) },
  ].sort((a, b) => b.count - a.count);

  // OS breakdown
  const osCounts: Record<string, number> = {};
  allVisits.forEach((v) => {
    const os = v.os || 'other';
    osCounts[os] = (osCounts[os] || 0) + 1;
  });
  const totalOsSamples = Object.values(osCounts).reduce((a, b) => a + b, 0) || 1;
  const operatingSystems = Object.entries(osCounts)
    .map(([name, count]) => ({
      name: name.toUpperCase(),
      count,
      percentage: Math.round((count / totalOsSamples) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Browser breakdown
  const browserCounts: Record<string, number> = {};
  allVisits.forEach((v) => {
    const b = v.browser || 'other';
    browserCounts[b] = (browserCounts[b] || 0) + 1;
  });
  const totalBrowserSamples = Object.values(browserCounts).reduce((a, b) => a + b, 0) || 1;
  const browsers = Object.entries(browserCounts)
    .map(([name, count]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count,
      percentage: Math.round((count / totalBrowserSamples) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Referrers
  const referrerCounts: Record<string, number> = {};
  allVisits.forEach((v) => {
    let ref = v.referrer;
    if (!ref) {
      ref = 'Direct / Physical QR Scan';
    } else {
      try {
        const u = new URL(ref);
        ref = u.hostname.replace(/^www\./, '');
      } catch {
        ref = 'Other Referral';
      }
    }
    referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
  });
  const totalRefs = Object.values(referrerCounts).reduce((a, b) => a + b, 0) || 1;
  const referrers = Object.entries(referrerCounts)
    .map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalRefs) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // UTM campaigns
  const utmMap: Record<string, { source: string; medium: string; campaign: string; count: number }> = {};
  allVisits.forEach((v) => {
    if (v.utmSource || v.utmCampaign) {
      const key = `${v.utmSource || 'direct'}_${v.utmMedium || 'none'}_${v.utmCampaign || 'organic'}`;
      if (!utmMap[key]) {
        utmMap[key] = {
          source: v.utmSource || 'direct',
          medium: v.utmMedium || 'none',
          campaign: v.utmCampaign || 'organic',
          count: 0,
        };
      }
      utmMap[key].count += 1;
    }
  });
  const utmCampaigns = Object.values(utmMap).sort((a, b) => b.count - a.count).slice(0, 6);

  // Top Paths
  const pathCounts: Record<string, number> = {};
  allVisits.forEach((v) => {
    pathCounts[v.path] = (pathCounts[v.path] || 0) + 1;
  });
  const topPaths = Object.entries(pathCounts)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Top Scanned Links
  const topLinks = topLinksRaw.map((l) => ({
    id: l.id,
    shortCode: l.shortCode,
    destinationUrl: l.destinationUrl,
    label: l.label,
    scanCount: l.scanCount,
    ownerEmail: l.user?.email || 'System / Unassigned',
  }));

  // Geographic distribution
  const countryCounts: Record<string, number> = {};
  const cityCounts: Record<string, { country: string | null; count: number }> = {};
  
  [...allVisits, ...allScans].forEach((item) => {
    if (item.country) {
      const c = item.country.toUpperCase();
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    }
    if (item.city) {
      const k = `${item.city}`;
      if (!cityCounts[k]) cityCounts[k] = { country: item.country, count: 0 };
      cityCounts[k].count += 1;
    }
  });

  const totalGeoSamples = Object.values(countryCounts).reduce((a, b) => a + b, 0) || 1;
  const topCountries = Object.entries(countryCounts)
    .map(([country, count]) => ({
      country,
      count,
      percentage: Math.round((count / totalGeoSamples) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topCities = Object.entries(cityCounts)
    .map(([city, data]) => ({
      city,
      country: data.country,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Hourly distribution heatmap (0 - 23 UTC)
  const hourlyMap: { visits: number; scans: number }[] = Array.from({ length: 24 }, () => ({
    visits: 0,
    scans: 0,
  }));
  allVisits.forEach((v) => {
    const h = new Date(v.createdAt).getUTCHours();
    hourlyMap[h].visits += 1;
  });
  allScans.forEach((s) => {
    const h = new Date(s.scannedAt).getUTCHours();
    hourlyMap[h].scans += 1;
  });
  const hourlyDistribution = hourlyMap.map((data, hour) => ({
    hour,
    visits: data.visits,
    scans: data.scans,
  }));

  // Velocity Trends Timeline (stretches across 24h, 7d, 30d, or All-Time)
  let dailyTrends: { date: string; visits: number; scans: number; signups: number }[] = [];

  if (timeframe === '24h') {
    // 24 Hourly Buckets (00:00 - 23:00 UTC) stretching across the full card width
    const hourlyTrendsMap: Record<string, { visits: number; scans: number; signups: number }> = {};
    for (let h = 0; h < 24; h++) {
      const hourKey = `${h.toString().padStart(2, '0')}:00`;
      hourlyTrendsMap[hourKey] = { visits: 0, scans: 0, signups: 0 };
    }

    allVisits.forEach((v) => {
      const h = new Date(v.createdAt).getUTCHours();
      const key = `${h.toString().padStart(2, '0')}:00`;
      if (hourlyTrendsMap[key]) hourlyTrendsMap[key].visits += 1;
    });

    allScans.forEach((s) => {
      const h = new Date(s.scannedAt).getUTCHours();
      const key = `${h.toString().padStart(2, '0')}:00`;
      if (hourlyTrendsMap[key]) hourlyTrendsMap[key].scans += 1;
    });

    dailyTrends = Object.entries(hourlyTrendsMap).map(([date, counts]) => ({
      date,
      visits: counts.visits,
      scans: counts.scans,
      signups: counts.signups,
    }));
  } else {
    // Determine days span based on timeframe
    let daysCount = 7;
    if (timeframe === '7d') {
      daysCount = 7;
    } else if (timeframe === '30d') {
      daysCount = 30;
    } else if (timeframe === 'all') {
      // Find earliest record across all visits and scans
      const allTimestamps = [
        ...allVisits.map((v) => new Date(v.createdAt).getTime()),
        ...allScans.map((s) => new Date(s.scannedAt).getTime()),
      ];
      const earliest = allTimestamps.length > 0
        ? Math.min(...allTimestamps)
        : now.getTime() - 30 * 24 * 60 * 60 * 1000;
      const spanDays = Math.ceil((now.getTime() - earliest) / (24 * 60 * 60 * 1000)) + 1;
      daysCount = Math.max(14, Math.min(spanDays, 120));
    }

    const dailyMap: Record<string, { visits: number; scans: number; signups: number }> = {};
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { visits: 0, scans: 0, signups: 0 };
    }

    allVisits.forEach((v) => {
      const key = new Date(v.createdAt).toISOString().split('T')[0];
      if (dailyMap[key]) dailyMap[key].visits += 1;
    });

    allScans.forEach((s) => {
      const key = new Date(s.scannedAt).toISOString().split('T')[0];
      if (dailyMap[key]) dailyMap[key].scans += 1;
    });

    dailyTrends = Object.entries(dailyMap).map(([date, counts]) => ({
      date,
      visits: counts.visits,
      scans: counts.scans,
      signups: counts.signups,
    }));
  }

  // Unit Economics
  const paidUsersCount = proUsersCount + plusUsersCount + ultraUsersCount;
  const mrr = proUsersCount * 5 + plusUsersCount * 12 + ultraUsersCount * 29;
  const arr = mrr * 12;
  const arpu = paidUsersCount > 0 ? Math.round((mrr / paidUsersCount) * 100) / 100 : 0;
  
  const conversionRateVisitorsToSignups =
    uniqueVisitors > 0 ? Math.round((signupsInPeriod / uniqueVisitors) * 1000) / 10 : 0;
  const conversionRateFreeToPaid =
    totalUsers > 0 ? Math.round((paidUsersCount / totalUsers) * 1000) / 10 : 0;

  return {
    timeframe,
    totalPageViews: totalVisitsInPeriod,
    uniqueVisitors,
    totalScans: allScans.length,
    totalUsers,
    freeUsersCount,
    paidUsersCount,
    proUsersCount,
    plusUsersCount,
    ultraUsersCount,
    activeLinksCount,
    mrr,
    arr,
    arpu,
    conversionRateVisitorsToSignups,
    conversionRateFreeToPaid,
    devices,
    operatingSystems,
    browsers,
    referrers,
    utmCampaigns,
    topPaths,
    topLinks,
    topCountries,
    topCities,
    hourlyDistribution,
    dailyTrends,
  };
}
