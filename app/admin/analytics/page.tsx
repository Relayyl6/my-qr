import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Sparkles, Activity } from 'lucide-react';
import { getAdminTelemetry } from '@/lib/analytics/adminTelemetry';
import AdminAnalyticsDashboard from '@/components/AdminAnalyticsDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  // Strict Super-Admin Guard
  if (!user || user.email.toLowerCase() !== adminEmail) {
    redirect('/');
  }

  const initialTelemetry = await getAdminTelemetry('7d');

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#11140F] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
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
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Industry-Grade Telemetry Engine
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/ai-usage"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#11140F]/15 text-[#11140F] text-[12.5px] font-medium hover:bg-[#EEF0EA] transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              AI Observability & Costs &rarr;
            </Link>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#11140F]">
            Platform-Wide Analytics & Ingress Telemetry
          </h1>
          <p className="text-[14px] text-[#11140F]/60 mt-1 max-w-[70ch]">
            Real-time tracking of website visits, physical QR scans, device user-agents, conversion funnels, diurnal peak hours, and inbound campaign attribution.
          </p>
        </div>

        {/* Interactive Analytics Dashboard Client Component */}
        <AdminAnalyticsDashboard initialData={initialTelemetry} />
      </div>
    </div>
  );
}
