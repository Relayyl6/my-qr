'use client';

import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import SessionReplayClient from './SessionReplayClient';
import PaginationControls from './PaginationControls';

export interface VisitorSessionItem {
  id: string;
  country: string | null;
  region: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
  isp: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  screenWidth: number | null;
  screenHeight: number | null;
  language: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  entryPath: string | null;
  duration: number | null;
  pageCount: number;
  createdAt: Date | string;
  _count: { events: number };
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '< 1s';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function deviceIcon(device: string | null) {
  if (!device) return '💻';
  if (device === 'ios' || device === 'android' || device === 'tablet') return '📱';
  return '💻';
}

export default function SessionReplayList({ sessions }: { sessions: VisitorSessionItem[] }) {
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const dev = (s.device || '').toLowerCase();
      const isMobile = dev === 'ios' || dev === 'android' || dev === 'tablet';
      if (deviceFilter === 'mobile' && !isMobile) return false;
      if (deviceFilter === 'desktop' && isMobile) return false;

      if (!q) return true;
      return (
        (s.city || '').toLowerCase().includes(q) ||
        (s.region || '').toLowerCase().includes(q) ||
        (s.country || '').toLowerCase().includes(q) ||
        (s.isp || '').toLowerCase().includes(q) ||
        (s.entryPath || '').toLowerCase().includes(q) ||
        (s.browser || '').toLowerCase().includes(q)
      );
    });
  }, [sessions, search, deviceFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSessions.slice(start, start + perPage);
  }, [filteredSessions, page, perPage]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#101211] p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-bold text-[#11140F] dark:text-white">
            Recorded Sessions
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-[#34D399] font-mono text-[11px] font-bold">
            {filteredSessions.length} total
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 sm:w-64 min-w-[180px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#11140F]/40 dark:text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search city, ISP, path..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/12 bg-[#F7F8F5] dark:bg-black/40 text-xs text-[#11140F] dark:text-white placeholder:text-[#11140F]/40 dark:placeholder:text-white/35 outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
            />
          </div>

          <select
            value={deviceFilter}
            onChange={(e) => {
              setDeviceFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/12 bg-[#F7F8F5] dark:bg-[#161917] text-xs text-[#11140F] dark:text-white outline-none cursor-pointer"
          >
            <option value="all">All Devices</option>
            <option value="mobile">Mobile / Tablet</option>
            <option value="desktop">Desktop</option>
          </select>
        </div>
      </div>

      {/* Session List */}
      <div className="grid gap-3">
        {paginated.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#101211] border border-[#11140F]/10 dark:border-white/10 rounded-2xl text-[#11140F]/50 dark:text-white/50 text-sm">
            {sessions.length === 0
              ? 'No sessions recorded yet. Sessions appear after visitors load any page.'
              : 'No sessions match your search or device filter.'}
          </div>
        ) : (
          paginated.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-[#101211] border border-[#11140F]/10 dark:border-white/10 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="text-2xl shrink-0">{deviceIcon(s.device)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[14px] text-[#11140F] dark:text-white">
                        {s.city || 'Unknown City'}
                        {s.region ? `, ${s.region}` : ''}
                        {s.country ? ` · ${s.country}` : ''}
                      </span>
                      {s.lat != null && s.lng != null && (
                        <a
                          href={`https://maps.google.com/?q=${s.lat},${s.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/25 transition-colors font-mono inline-flex items-center gap-1"
                        >
                          {s.lat.toFixed(4)}, {s.lng.toFixed(4)} ↗
                        </a>
                      )}
                    </div>
                    <div className="text-[12px] text-[#11140F]/55 dark:text-white/55 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                      {s.isp && <span>🌐 {s.isp.replace(/^AS\d+ /, '')}</span>}
                      {s.timezone && <span>⏱ {s.timezone}</span>}
                      {s.browser && <span>{s.browser.charAt(0).toUpperCase() + s.browser.slice(1)}</span>}
                      {s.os && <span>{s.os.toUpperCase()}</span>}
                      {s.screenWidth && (
                        <span>
                          {s.screenWidth}×{s.screenHeight}
                        </span>
                      )}
                      {s.language && <span>🗣 {s.language}</span>}
                    </div>
                    <div className="text-[11.5px] text-[#11140F]/45 dark:text-white/45 mt-1 flex flex-wrap gap-3">
                      <span>
                        Entry: <code className="bg-[#11140F]/5 dark:bg-white/10 px-1 rounded">{s.entryPath || '/'}</code>
                      </span>
                      <span>
                        {s.pageCount} page{s.pageCount !== 1 ? 's' : ''}
                      </span>
                      <span>{formatDuration(s.duration)}</span>
                      {s.utmSource && (
                        <span>
                          utm: {s.utmSource}
                          {s.utmCampaign ? `/${s.utmCampaign}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#11140F]/8 dark:border-white/8">
                  <span className="text-[11px] text-[#11140F]/45 dark:text-white/45 font-mono">
                    {new Date(s.createdAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#11140F]/45 dark:text-white/45">
                      {s._count.events} events
                    </span>
                    {s._count.events > 0 && <SessionReplayClient sessionId={s.id} />}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {filteredSessions.length > 0 && (
        <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#101211] px-4 pb-3 pt-1">
          <PaginationControls
            currentPage={page}
            totalItems={filteredSessions.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={setPerPage}
            pageSizeOptions={[10, 25, 50, 100]}
            itemLabel="sessions"
            className="border-t-0 pt-2"
          />
        </div>
      )}
    </div>
  );
}
