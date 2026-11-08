'use client';

import { useState, useTransition } from 'react';
import { TelemetryMetrics } from '@/lib/analytics/adminTelemetry';
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
} from 'lucide-react';

interface Props {
  initialData: TelemetryMetrics;
}

export default function AdminAnalyticsDashboard({ initialData }: Props) {
  const [data, setData] = useState<TelemetryMetrics>(initialData);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>(initialData.timeframe);
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
    rows.push(['KPI', 'Free Tier Users', data.freeUsersCount, '-'].join(','));
    rows.push(['KPI', 'Paid Tier Users', data.paidUsersCount, '-'].join(','));
    rows.push(['KPI', 'Estimated MRR ($)', data.mrr, '-'].join(','));
    rows.push(['KPI', 'Estimated ARR ($)', data.arr, '-'].join(','));
    rows.push(['KPI', 'Visitor-to-Signup Conversion', `${data.conversionRateVisitorsToSignups}%`, '-'].join(','));

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

  return (
    <div className="space-y-8">
      {/* Control Bar: Timeframe Filters & CSV Export */}
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
          {isPending && <RefreshCw className="w-4 h-4 text-[#11140F]/40 animate-spin ml-2" />}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#11140F]/15 text-[#11140F] text-[12.5px] font-medium hover:bg-[#EEF0EA] transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            Export Telemetry (.CSV)
          </button>
        </div>
      </div>

      {/* Topline KPI Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>Site Visits</span>
            <Eye className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            {data.totalPageViews.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#11140F]/50">Total page loads</p>
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
            <span>QR Scans</span>
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            {data.totalScans.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#11140F]/50">307 Edge redirects</p>
        </div>

        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>Total Accounts</span>
            <Layers className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            {data.totalUsers}
          </p>
          <p className="text-[11px] text-[#11140F]/50">
            {data.freeUsersCount} Free • {data.paidUsersCount} Paid
          </p>
        </div>

        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#11140F]/50 uppercase tracking-wider">
            <span>Estimated MRR</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-[#11140F] tracking-tight">
            ${data.mrr.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#11140F]/50">
            ARR: <strong className="text-[#11140F]">${data.arr.toLocaleString()}</strong>
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

      {/* Traffic & Scan Volume Timeline (Daily Trends) */}
      <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              Traffic & Scan Velocity Timeline
            </h3>
            <p className="text-[12px] text-[#11140F]/55">
              Daily volume trend of website visitors vs physical QR code edge redirects
            </p>
          </div>
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
        </div>

        {data.dailyTrends.length === 0 ? (
          <div className="py-12 text-center text-[#11140F]/40 text-[13px]">
            No activity recorded yet in this window.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-7 sm:grid-cols-14 md:grid-cols-30 gap-1.5 items-end h-40 pt-4">
              {data.dailyTrends.map((day) => {
                const maxVal = Math.max(
                  ...data.dailyTrends.map((d) => Math.max(d.visits, d.scans)),
                  1
                );
                const visitHeight = Math.max(4, Math.round((day.visits / maxVal) * 100));
                const scanHeight = Math.max(4, Math.round((day.scans / maxVal) * 100));

                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#11140F] text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap">
                      <span className="font-bold">{day.date}</span>
                      <span>{day.visits} visits • {day.scans} scans</span>
                    </div>

                    <div className="w-full flex gap-0.5 items-end h-28">
                      <div
                        className="w-1/2 bg-blue-400 rounded-t transition-all group-hover:bg-blue-600"
                        style={{ height: `${visitHeight}%` }}
                      />
                      <div
                        className="w-1/2 bg-emerald-400 rounded-t transition-all group-hover:bg-emerald-600"
                        style={{ height: `${scanHeight}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-[#11140F]/40 truncate w-full text-center">
                      {day.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Hourly Scan Activity Heatmap (00:00 - 23:00 UTC) */}
      <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Peak Scan Hours Heatmap (00:00 – 23:00 UTC)
            </h3>
            <p className="text-[12px] text-[#11140F]/55">
              Hourly distribution showing when physical flyers, menus, and posters are most actively engaged
            </p>
          </div>
          <span className="text-[11.5px] font-mono text-[#11140F]/50">24h Diurnal Heatmap</span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 md:grid-cols-24 gap-1.5 pt-2">
          {data.hourlyDistribution.map((h) => {
            const maxActivity = Math.max(
              ...data.hourlyDistribution.map((item) => item.scans + item.visits),
              1
            );
            const totalActivity = h.scans + h.visits;
            const intensity = totalActivity / maxActivity;

            return (
              <div
                key={h.hour}
                className="flex flex-col items-center p-2 rounded-xl border border-[#11140F]/5 bg-[#11140F]/[0.02] text-center space-y-1 group relative"
              >
                {/* Tooltip */}
                <div className="absolute -top-10 z-20 hidden group-hover:flex bg-[#11140F] text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap">
                  {h.scans} scans, {h.visits} visits
                </div>

                <span className="text-[10px] font-mono font-semibold text-[#11140F]/60">
                  {String(h.hour).padStart(2, '0')}:00
                </span>
                <div
                  className="w-full h-8 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold transition-all"
                  style={{
                    backgroundColor:
                      totalActivity === 0
                        ? '#F7F8F5'
                        : intensity > 0.6
                        ? '#059669'
                        : intensity > 0.3
                        ? '#34D399'
                        : '#A7F3D0',
                    color: intensity > 0.6 ? '#FFFFFF' : '#064E3B',
                  }}
                >
                  {totalActivity}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Column Telemetry: Devices & Browsers + Referrers & Acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hardware & Platform Breakdown */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Hardware & Platform Telemetry
            </h3>
            <span className="text-[11.5px] font-mono text-[#11140F]/50">Client User-Agents</span>
          </div>

          <div className="space-y-4">
            {data.devices.map((dev) => (
              <div key={dev.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-[#11140F]">{dev.name}</span>
                  <span className="font-mono text-[12px] text-[#11140F]/60">
                    {dev.count.toLocaleString()} ({dev.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#11140F]/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${dev.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Operating Systems & Browsers Mini-Grid */}
          <div className="pt-4 border-t border-[#11140F]/10 grid grid-cols-2 gap-4 text-[12px]">
            <div>
              <span className="font-semibold text-[#11140F]/70 block mb-2 uppercase text-[11px] tracking-wider">
                Operating Systems
              </span>
              <ul className="space-y-1.5">
                {data.operatingSystems.map((os) => (
                  <li key={os.name} className="flex items-center justify-between font-mono">
                    <span className="text-[#11140F]/70">{os.name}</span>
                    <span className="font-bold text-[#11140F]">{os.count} ({os.percentage}%)</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-semibold text-[#11140F]/70 block mb-2 uppercase text-[11px] tracking-wider">
                Browsers
              </span>
              <ul className="space-y-1.5">
                {data.browsers.map((b) => (
                  <li key={b.name} className="flex items-center justify-between font-mono">
                    <span className="text-[#11140F]/70">{b.name}</span>
                    <span className="font-bold text-[#11140F]">{b.count} ({b.percentage}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Traffic Sources & Referrers */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              Traffic Sources & Inbound Attribution
            </h3>
            <span className="text-[11.5px] font-mono text-[#11140F]/50">Referrer Channels</span>
          </div>

          <div className="space-y-3">
            {data.referrers.length === 0 ? (
              <p className="text-[13px] text-[#11140F]/45 py-6 text-center">
                No inbound referrers logged yet in this timeframe.
              </p>
            ) : (
              data.referrers.map((ref) => (
                <div
                  key={ref.source}
                  className="p-3 rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.015] flex items-center justify-between"
                >
                  <span className="font-medium text-[13px] text-[#11140F] truncate">
                    {ref.source}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[12px] font-bold text-[#11140F]">
                      {ref.count.toLocaleString()}
                    </span>
                    <span className="font-mono text-[11px] text-[#11140F]/50">
                      ({ref.percentage}%)
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* UTM Attribution Matrix */}
          {data.utmCampaigns.length > 0 && (
            <div className="pt-4 border-t border-[#11140F]/10 space-y-2">
              <span className="font-semibold text-[#11140F]/70 block uppercase text-[11px] tracking-wider">
                Active UTM Campaigns
              </span>
              <div className="space-y-1.5">
                {data.utmCampaigns.map((utm, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11.5px] font-mono p-2 rounded-lg bg-[#EEF0EA]/50"
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

      {/* 2-Column: Top Visited Paths & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Visited Routes */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-600" />
              Top Visited Application Routes
            </h3>
            <span className="text-[11.5px] font-mono text-[#11140F]/50">Page Impressions</span>
          </div>

          <div className="space-y-2">
            {data.topPaths.length === 0 ? (
              <p className="text-[13px] text-[#11140F]/45 py-6 text-center">
                No route hits recorded yet.
              </p>
            ) : (
              data.topPaths.map((p) => (
                <div
                  key={p.path}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.015] text-[13px]"
                >
                  <span className="font-mono text-emerald-800 font-medium truncate">
                    {p.path}
                  </span>
                  <span className="font-mono font-bold text-[#11140F] shrink-0">
                    {p.count.toLocaleString()} visits
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              Global Geographic Footprint
            </h3>
            <span className="text-[11.5px] font-mono text-[#11140F]/50">Edge Ingress Points</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-semibold text-[#11140F]/70 block mb-2 uppercase text-[11px] tracking-wider">
                Top Countries
              </span>
              {data.topCountries.length === 0 ? (
                <p className="text-[12px] text-[#11140F]/45">Pending traffic data.</p>
              ) : (
                <ul className="space-y-1.5 text-[12.5px]">
                  {data.topCountries.map((c) => (
                    <li key={c.country} className="flex items-center justify-between font-mono">
                      <span>{c.country}</span>
                      <span className="font-bold text-[#11140F]">
                        {c.count} ({c.percentage}%)
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <span className="font-semibold text-[#11140F]/70 block mb-2 uppercase text-[11px] tracking-wider">
                Top Ingress Cities
              </span>
              {data.topCities.length === 0 ? (
                <p className="text-[12px] text-[#11140F]/45">Pending traffic data.</p>
              ) : (
                <ul className="space-y-1.5 text-[12.5px]">
                  {data.topCities.map((ct) => (
                    <li key={ct.city} className="flex items-center justify-between font-mono">
                      <span className="truncate">{ct.city}</span>
                      <span className="font-bold text-[#11140F] shrink-0">{ct.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
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
