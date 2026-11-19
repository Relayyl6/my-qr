import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video, Globe, Monitor, Smartphone, Clock, Eye } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import SessionReplayClient from '@/components/SessionReplayClient';

export const dynamic = 'force-dynamic';

function formatDuration(seconds: number | null) {
  if (!seconds) return '< 1s';
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function deviceIcon(device: string | null) {
  if (!device) return '💻';
  if (device === 'ios' || device === 'android') return '📱';
  if (device === 'tablet') return '📱';
  return '💻';
}

export default async function AdminSessionsPage() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!user || user.email.toLowerCase() !== adminEmail) {
    redirect('/');
  }

  const sessions = await prisma.visitorSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      country: true,
      region: true,
      city: true,
      lat: true,
      lng: true,
      timezone: true,
      isp: true,
      device: true,
      browser: true,
      os: true,
      screenWidth: true,
      screenHeight: true,
      language: true,
      referrer: true,
      utmSource: true,
      utmCampaign: true,
      entryPath: true,
      duration: true,
      pageCount: true,
      createdAt: true,
      _count: { select: { events: true } },
    },
  });

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#11140F] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#11140F]/60 hover:text-[#11140F] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Super-Admin Console
            </Link>
            <span className="text-[#11140F]/20">/</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11140F] text-white text-[12px] font-mono uppercase tracking-wider">
              <Video className="w-3.5 h-3.5 text-emerald-400" />
              Session Replay Studio
            </div>
          </div>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#11140F]/15 text-[#11140F] text-[12.5px] font-medium hover:bg-[#EEF0EA] transition-colors shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            Analytics Dashboard →
          </Link>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Visitor Session Replay
          </h1>
          <p className="text-[14px] text-[#11140F]/60 mt-1 max-w-[70ch]">
            Full DOM session recordings of visitor activity. Click any session to replay it.
            Passwords are masked. Geographic data via ipinfo.io precision lookup.
          </p>
        </div>

        {/* Session list */}
        <div className="grid gap-3">
          {sessions.length === 0 && (
            <div className="text-center py-16 text-[#11140F]/40 text-sm">
              No sessions recorded yet. Sessions appear after visitors load any page.
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-[#11140F]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: geo + device */}
                <div className="flex items-start gap-4">
                  <div className="text-2xl">{deviceIcon(s.device)}</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[14px]">
                        {s.city || 'Unknown City'}{s.region ? `, ${s.region}` : ''}{s.country ? ` · ${s.country}` : ''}
                      </span>
                      {s.lat && s.lng && (
                        <a
                          href={`https://maps.google.com/?q=${s.lat},${s.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-mono inline-flex items-center gap-1"
                        >
                          {s.lat.toFixed(4)}, {s.lng.toFixed(4)} ↗
                        </a>
                      )}
                    </div>
                    <div className="text-[12px] text-[#11140F]/50 mt-0.5 flex flex-wrap gap-3">
                      {s.isp && <span>🌐 {s.isp.replace(/^AS\d+ /, '')}</span>}
                      {s.timezone && <span>⏱ {s.timezone}</span>}
                      {s.browser && <span>{s.browser.charAt(0).toUpperCase() + s.browser.slice(1)}</span>}
                      {s.os && <span>{s.os.toUpperCase()}</span>}
                      {s.screenWidth && <span>{s.screenWidth}×{s.screenHeight}</span>}
                      {s.language && <span>🗣 {s.language}</span>}
                    </div>
                    <div className="text-[11.5px] text-[#11140F]/40 mt-1 flex gap-3">
                      <span>Entry: <code className="bg-[#11140F]/5 px-1 rounded">{s.entryPath || '/'}</code></span>
                      <span>{s.pageCount} page{s.pageCount !== 1 ? 's' : ''}</span>
                      <span>{formatDuration(s.duration)}</span>
                      {s.utmSource && <span>utm: {s.utmSource}{s.utmCampaign ? `/${s.utmCampaign}` : ''}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: timestamp + replay button */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[11px] text-[#11140F]/40 font-mono">
                    {new Date(s.createdAt).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#11140F]/40">
                      {s._count.events} events
                    </span>
                    {s._count.events > 0 && (
                      <SessionReplayClient sessionId={s.id} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
