'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { TelemetryMetrics } from '@/lib/analytics/adminTelemetry';
import { formatUsdMetric } from '@/lib/domains/profit';
import { adminGetTelemetryAction } from '@/app/admin/actions';
import {
  Activity,
  Users,
  Eye,
  QrCode,
  TrendingUp,
  Download,
  Smartphone,
  Globe,
  Layers,
  Clock,
  Compass,
  DollarSign,
  Monitor,
  Flame,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Video,
  MapPin,
  Crosshair,
  ExternalLink,
  Wifi,
} from 'lucide-react';

interface Props {
  initialData: TelemetryMetrics;
}

export default function AdminAnalyticsDashboard({ initialData }: Props) {
  const [data, setData] = useState<TelemetryMetrics>(initialData);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>(initialData.timeframe);
  const [hoveredTrend, setHoveredTrend] = useState<{ date: string; visits: number; scans: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTimeframeChange = (tf: '24h' | '7d' | '30d' | 'all') => {
    setTimeframe(tf);
    startTransition(async () => {
      try {
        const updated = await adminGetTelemetryAction(tf);
        setData(updated);
      } catch (err) {
        console.error('Failed to update telemetry:', err);
      }
    });
  };

  const handleExportCsv = () => {
    const rows: string[] = [];
    rows.push(['Metric Category', 'Metric Name', 'Count / Value', 'Percentage'].join(','));

    // KPIs
    rows.push(['KPI', 'Total Page Views', data.totalPageViews, '100%'].join(','));
    rows.push(['KPI', 'Unique Visitors', data.uniqueVisitors, '-'].join(','));
    rows.push(['KPI', 'Total QR Scans', data.totalScans, '-'].join(','));
    rows.push(['KPI', 'Total Registered Users', data.totalUsers, '-'].join(','));
    rows.push(['KPI', 'Total Visitor Sessions', data.totalSessions ?? 0, '-'].join(','));
    rows.push(['KPI', 'Sessions with Replays', data.sessionsWithReplaysCount ?? 0, '-'].join(','));
    rows.push(['KPI', 'Free Tier Users', data.freeUsersCount, '-'].join(','));
    rows.push(['KPI', 'Paid Tier Users', data.paidUsersCount, '-'].join(','));
    rows.push(['KPI', 'Estimated MRR ($)', data.mrr, '-'].join(','));
    rows.push(['KPI', 'Estimated ARR ($)', data.arr, '-'].join(','));
    rows.push(['KPI', 'Visitor-to-Signup Conversion', `${data.conversionRateVisitorsToSignups}%`, '-'].join(','));

    // Entry Pages
    (data.entryPages || []).forEach((ep) => {
      rows.push(['Entry Page', `"${ep.path}"`, ep.entryCount, `${ep.percentage}%`].join(','));
    });

    // Triangulated Geo
    (data.triangulatedLocations || []).forEach((tl) => {
      rows.push(['Triangulated Geo', `"${tl.city}, ${tl.region || ''} (${tl.country || ''})"`, tl.count, `"${tl.isp || ''}"`].join(','));
    });

    // Devices
    data.devices.forEach((d) => {
      rows.push(['Device', `"${d.name}"`, d.count, `${d.percentage}%`].join(','));
    });

    // Referrers
    data.referrers.forEach((r) => {
      rows.push(['Referrer', `"${r.source}"`, r.count, `${r.percentage}%`].join(','));
    });

    // Top Paths
    data.topPaths.forEach((p) => {
      rows.push(['Site Path', `"${p.path}"`, p.count, '-'].join(','));
    });

    // Top Links
    data.topLinks.forEach((l) => {
      rows.push(['QR Link', `"/id/${l.shortCode}"`, l.scanCount, `"${l.destinationUrl}"`].join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `dynamicqr-analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPageViews = data.totalPageViews || 0;
  const maxTrend = Math.max(...data.dailyTrends.map((t) => Math.max(t.visits, t.scans)), 1);

  return (
    <div className="space-y-8">
      {/* Control Bar: Timeframe Filters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#11140F]/10 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#11140F]/50 shrink-0" />
          <span className="text-[13px] font-semibold text-[#11140F]">Reporting Window:</span>
          <div className="inline-flex rounded-xl bg-[#F0F2EB] p-1 border border-[#11140F]/10">
            {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                disabled={isPending}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  timeframe === tf
                    ? 'bg-[#11140F] text-white shadow-xs font-semibold'
                    : 'text-[#11140F]/65 hover:text-[#11140F]'
                }`}
              >
                {tf === '24h'
                  ? 'Past 24h'
                  : tf === '7d'
                  ? 'Past 7 Days'
                  : tf === '30d'
                  ? 'Past 30 Days'
                  : 'All-Time'}
              </button>
            ))}
          </div>
          {isPending && (
            <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin ml-1" />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[12.5px] font-medium hover:bg-rose-100 transition-colors shadow-xs"
          >
            <Video className="w-4 h-4 text-rose-600" />
            <span>Replay Video Audits</span>
            {(data.sessionsWithReplaysCount ?? 0) > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10.5px] font-bold">
                {data.sessionsWithReplaysCount}
              </span>
            )}
          </Link>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#11140F]/15 text-[#11140F] text-[12.5px] font-medium hover:bg-[#EEF0EA] transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-[#11140F]/70" />
            <span>Export Raw CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Headline Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>Total Views</span>
            <Eye className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            {totalPageViews.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#11140F]/50">All page impressions</p>
        </div>

        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>Unique Visitors</span>
            <Users className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            {data.uniqueVisitors.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#11140F]/50">Deduped unique reach</p>
        </div>

        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>Total Sessions</span>
            <Compass className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            {(data.totalSessions ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-[#11140F]/50">
            {data.sessionsWithReplaysCount ?? 0} with full audit replay
          </p>
        </div>

        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>QR Scans</span>
            <QrCode className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            {data.totalScans.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#11140F]/50">Edge redirects</p>
        </div>

        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>Estimated MRR</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            ${formatUsdMetric(data.mrr)}
          </p>
          <p className="text-[11px] text-[#11140F]/50">
            ARR: <strong className="text-[#11140F]">${formatUsdMetric(data.arr)}</strong>
            {(data.domainProfit30dUsd ?? 0) > 0 && (
              <span className="block text-[10px] font-mono text-emerald-700">
                +${formatUsdMetric(data.domainProfit30dUsd || 0)} domains
              </span>
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>Conversion</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            {data.conversionRateVisitorsToSignups}%
          </p>
          <p className="text-[11px] text-[#11140F]/50">Visitor &rarr; Signup rate</p>
        </div>
      </div>

      {/* Traffic & Scan Volume Timeline (Daily & Hourly Trends) */}
      <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Traffic & Scan Velocity Timeline
            </h3>
            <p className="text-[12px] text-[#11140F]/55">
              {timeframe === '24h'
                ? 'Hourly velocity distribution across the day (00:00 – 23:00 UTC)'
                : `${timeframe === '7d' ? '7-Day' : timeframe === '30d' ? '30-Day' : 'All-Time'} volume trend of website visitors vs physical QR code edge redirects`}
            </p>
          </div>

          {hoveredTrend ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#11140F] text-white text-[11px] font-mono shadow-xs">
              <span className="text-emerald-400 font-bold">{hoveredTrend.date}</span>
              <span className="text-white/30">|</span>
              <span className="text-blue-300 font-medium">{hoveredTrend.visits} visits</span>
              <span className="text-white/30">•</span>
              <span className="text-emerald-300 font-medium">{hoveredTrend.scans} scans</span>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-[11.5px] font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Website Visits
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                QR Code Scans
              </span>
            </div>
          )}
        </div>

        {data.dailyTrends.length === 0 ? (
          <div className="py-12 text-center text-[#11140F]/40 text-[13px]">
            No activity recorded yet in this window.
          </div>
        ) : (
          <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6">
            {data.dailyTrends.map((t, idx) => {
              const visitHeight = Math.max(Math.round((t.visits / maxTrend) * 100), t.visits > 0 ? 8 : 2);
              const scanHeight = Math.max(Math.round((t.scans / maxTrend) * 100), t.scans > 0 ? 8 : 2);

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredTrend(t)}
                  onMouseLeave={() => setHoveredTrend(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-32">
                    <div
                      style={{ height: `${visitHeight}%` }}
                      className="w-1/2 max-w-[14px] bg-blue-500/80 rounded-t group-hover:bg-blue-600 transition-all"
                    />
                    <div
                      style={{ height: `${scanHeight}%` }}
                      className="w-1/2 max-w-[14px] bg-emerald-500/80 rounded-t group-hover:bg-emerald-600 transition-all"
                    />
                  </div>
                  <span className="text-[10px] text-[#11140F]/40 font-mono mt-2 truncate w-full text-center">
                    {timeframe === '24h' ? t.date : t.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2-Column: Entry Per Page Intelligence & Precision Location Triangulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entry Per Page Intelligence */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600" />
                Entry Per Page (Landing Ingress)
              </h3>
              <p className="text-[12px] text-[#11140F]/55">
                Exact first pages visitors land on when entering the site
              </p>
            </div>
            <span className="text-[11.5px] font-mono text-[#11140F]/50">First Touch</span>
          </div>

          <div className="space-y-3">
            {!data.entryPages || data.entryPages.length === 0 ? (
              <p className="text-[13px] text-[#11140F]/45 py-6 text-center">
                Pending visitor session entry data.
              </p>
            ) : (
              data.entryPages.map((ep) => (
                <div key={ep.path} className="space-y-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                        {ep.path}
                      </span>
                      <span className="text-[11px] text-[#11140F]/45">
                        ({ep.uniqueVisitors} unique)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-[#11140F]">{ep.entryCount} entries</span>
                      <span className="text-[11px] text-[#11140F]/40">({ep.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#11140F]/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.max(ep.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Precision Geolocation Triangulation Matrix */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-emerald-600" />
                Precision Location Triangulation
              </h3>
              <p className="text-[12px] text-[#11140F]/55">
                Sub-city coordinates & carrier ISP (bypasses generic regional carrier proxy bias)
              </p>
            </div>
            <span className="text-[11.5px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
              GPS & Multi-IP
            </span>
          </div>

          <div className="space-y-2.5">
            {!data.triangulatedLocations || data.triangulatedLocations.length === 0 ? (
              <p className="text-[13px] text-[#11140F]/45 py-6 text-center">
                Pending triangulated ingress telemetry.
              </p>
            ) : (
              data.triangulatedLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.015] text-[12.5px]"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-[#11140F] truncate">
                        {loc.city}{loc.region ? `, ${loc.region}` : ''}
                      </span>
                      {loc.country && (
                        <span className="text-[11px] font-mono font-bold text-[#11140F]/50">
                          [{loc.country}]
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#11140F]/50 pl-5">
                      {loc.isp && <span className="truncate">ISP: {loc.isp}</span>}
                      {loc.lat !== null && loc.lng !== null && (
                        <a
                          href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-mono"
                        >
                          Pinpoint ({loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}) ↗
                        </a>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-[#11140F] shrink-0">
                    {loc.count} sessions
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* High-Value Technical Entry Metrics Grid */}
      <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-600" />
            High-Value Technical Ingress Metrics
          </h3>
          <p className="text-[12px] text-[#11140F]/55">
            Client viewports, device timezones, language preferences, and network providers
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Screen Resolutions */}
          <div className="p-3.5 rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.015] space-y-2">
            <span className="font-semibold text-[#11140F]/70 text-[11px] uppercase tracking-wider block">
              Screen Viewports
            </span>
            {(!data.entryMetrics?.screenResolutions || data.entryMetrics.screenResolutions.length === 0) ? (
              <p className="text-[11.5px] text-[#11140F]/40">Collecting...</p>
            ) : (
              <ul className="space-y-1 text-[12px] font-mono">
                {data.entryMetrics.screenResolutions.map((r) => (
                  <li key={r.resolution} className="flex justify-between items-center">
                    <span>{r.resolution}</span>
                    <span className="font-bold text-[#11140F]">{r.percentage}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Timezones */}
          <div className="p-3.5 rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.015] space-y-2">
            <span className="font-semibold text-[#11140F]/70 text-[11px] uppercase tracking-wider block">
              Device Timezones
            </span>
            {(!data.entryMetrics?.timezones || data.entryMetrics.timezones.length === 0) ? (
              <p className="text-[11.5px] text-[#11140F]/40">Collecting...</p>
            ) : (
              <ul className="space-y-1 text-[12px] font-mono">
                {data.entryMetrics.timezones.map((tz) => (
                  <li key={tz.timezone} className="flex justify-between items-center">
                    <span className="truncate max-w-[130px]">{tz.timezone}</span>
                    <span className="font-bold text-[#11140F]">{tz.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Client Languages */}
          <div className="p-3.5 rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.015] space-y-2">
            <span className="font-semibold text-[#11140F]/70 text-[11px] uppercase tracking-wider block">
              Client Languages
            </span>
            {(!data.entryMetrics?.languages || data.entryMetrics.languages.length === 0) ? (
              <p className="text-[11.5px] text-[#11140F]/40">Collecting...</p>
            ) : (
              <ul className="space-y-1 text-[12px] font-mono">
                {data.entryMetrics.languages.map((l) => (
                  <li key={l.language} className="flex justify-between items-center">
                    <span>{l.language}</span>
                    <span className="font-bold text-[#11140F]">{l.percentage}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Network Providers */}
          <div className="p-3.5 rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.015] space-y-2">
            <span className="font-semibold text-[#11140F]/70 text-[11px] uppercase tracking-wider block">
              Network Carriers
            </span>
            {(!data.entryMetrics?.networks || data.entryMetrics.networks.length === 0) ? (
              <p className="text-[11.5px] text-[#11140F]/40">Collecting...</p>
            ) : (
              <ul className="space-y-1 text-[12px] font-mono">
                {data.entryMetrics.networks.map((net) => (
                  <li key={net.isp} className="flex justify-between items-center">
                    <span className="truncate max-w-[120px]">{net.isp}</span>
                    <span className="font-bold text-[#11140F]">{net.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Hardware & User-Agent Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[14px] text-[#11140F] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Device Hardware
            </h4>
            <span className="text-[11px] font-mono text-[#11140F]/45">Platform Share</span>
          </div>

          <div className="space-y-2">
            {data.devices.map((d) => (
              <div key={d.name} className="space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#11140F]/70">{d.name}</span>
                  <span className="font-mono font-bold text-[#11140F]">
                    {d.count} ({d.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#11140F]/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-1.5 rounded-full"
                    style={{ width: `${Math.max(d.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[14px] text-[#11140F] flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Operating Systems
            </h4>
            <span className="text-[11px] font-mono text-[#11140F]/45">Top 5</span>
          </div>

          <div className="space-y-2">
            {data.operatingSystems.map((os) => (
              <div key={os.name} className="space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#11140F]/70 font-mono text-[12px]">{os.name}</span>
                  <span className="font-mono font-bold text-[#11140F]">
                    {os.count} ({os.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#11140F]/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${Math.max(os.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browsers */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-[14px] text-[#11140F] flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-600" />
              Client Browsers
            </h4>
            <span className="text-[11px] font-mono text-[#11140F]/45">Top 5</span>
          </div>

          <div className="space-y-2">
            {data.browsers.map((b) => (
              <div key={b.name} className="space-y-1">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#11140F]/70">{b.name}</span>
                  <span className="font-mono font-bold text-[#11140F]">
                    {b.count} ({b.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-[#11140F]/5 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-purple-600 h-1.5 rounded-full"
                    style={{ width: `${Math.max(b.percentage, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referrers & Attribution */}
      <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
            Inbound Traffic Sources & Campaign Attribution
          </h3>
          <span className="text-[11.5px] font-mono text-[#11140F]/50">Acquisition Channels</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="font-semibold text-[#11140F]/70 block mb-2 uppercase text-[11px] tracking-wider">
              Top Referring Domains
            </span>
            {data.referrers.map((ref) => (
              <div
                key={ref.source}
                className="flex items-center justify-between p-2 rounded-lg bg-[#11140F]/[0.02] text-[12.5px]"
              >
                <span className="truncate max-w-xs">{ref.source}</span>
                <span className="font-mono font-bold text-[#11140F]">
                  {ref.count} ({ref.percentage}%)
                </span>
              </div>
            ))}
          </div>

          {data.utmCampaigns.length > 0 && (
            <div className="space-y-2">
              <span className="font-semibold text-[#11140F]/70 block mb-2 uppercase text-[11px] tracking-wider">
                Active UTM Campaigns
              </span>
              <div className="space-y-1.5">
                {data.utmCampaigns.map((utm, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#11140F]/[0.02] text-[12.5px] font-mono"
                  >
                    <span className="truncate">
                      <strong>{utm.source}</strong> / {utm.medium} &bull; {utm.campaign}
                    </span>
                    <span className="font-bold text-[#11140F] shrink-0">{utm.count} hits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 10 Scanned Dynamic QR Codes Across Platform */}
      <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              Platform QR Code Leaderboard (Top 10 High Traffic Destinations)
            </h3>
            <p className="text-[12px] text-[#11140F]/55">
              Live ranking of active dynamic links driving the largest physical scan volume
            </p>
          </div>
          <span className="text-[11.5px] font-mono text-[#11140F]/50">307 Edge Handoff</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#11140F]/10 text-[11.5px] font-semibold text-[#11140F]/50 uppercase tracking-wider">
                <th className="pb-3">Shortcode</th>
                <th className="pb-3">Target Destination</th>
                <th className="pb-3">Owner Account</th>
                <th className="pb-3 text-right">Total Scans</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11140F]/5 font-mono">
              {data.topLinks.map((link) => (
                <tr key={link.id} className="hover:bg-[#11140F]/[0.015]">
                  <td className="py-3 font-bold text-emerald-800">
                    /id/{link.shortCode}
                  </td>
                  <td className="py-3 text-[#11140F]/70 truncate max-w-xs">
                    {link.destinationUrl}
                  </td>
                  <td className="py-3 text-[#11140F]/60 text-[12px]">
                    {link.ownerEmail}
                  </td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[12px]">
                      {link.scanCount.toLocaleString()} scans
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
