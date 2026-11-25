import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video, Eye } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import SessionReplayList from '@/components/SessionReplayList';

export const dynamic = 'force-dynamic';

export default async function AdminSessionsPage() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!user || user.email.toLowerCase() !== adminEmail) {
    redirect('/');
  }

  const sessions = await prisma.visitorSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 250,
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
            Passwords are masked. Geographic data via precision lookup.
          </p>
        </div>

        <SessionReplayList sessions={sessions} />
      </div>
    </div>
  );
}
