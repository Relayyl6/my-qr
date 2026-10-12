import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  TrendingUp,
  QrCode,
  Sparkles,
  ArrowLeft,
  Activity,
  Shield,
  Layers,
  Database,
  Mail,
  CreditCard,
} from 'lucide-react';
import AdminUserRow from '@/components/AdminUserRow';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  // Strict Admin Authorization Guard
  if (!user || user.email.toLowerCase() !== adminEmail) {
    redirect('/');
  }

  // Load aggregated SaaS metrics
  const [
    totalUsers,
    freeUsersCount,
    proUsersCount,
    plusUsersCount,
    ultraUsersCount,
    totalActiveLinks,
    totalScansCount,
    totalCustomDomains,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { tier: 'free' } }),
    prisma.user.count({ where: { tier: 'pro' } }),
    prisma.user.count({ where: { tier: 'plus' } }),
    prisma.user.count({ where: { tier: 'ultra' } }),
    prisma.qrLink.count({ where: { isArchived: false } }),
    prisma.scan.count(),
    prisma.customDomain.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        createdAt: true,
        stripeCustomerId: true,
        _count: {
          select: { links: true },
        },
      },
    }),
  ]);

  // Calculate MRR & ARR Run Rate
  const mrr = proUsersCount * 5 + plusUsersCount * 12 + ultraUsersCount * 29;
  const arr = mrr * 12;

  return (
    <div className="min-h-screen bg-[#F7F8F5] text-[#11140F] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#11140F]/60 hover:text-[#11140F] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Workspace
            </Link>
            <span className="text-[#11140F]/20">/</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11140F] text-white text-[12px] font-mono uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Super-Admin Command Center
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/ai-usage"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#11140F]/15 text-[#11140F] text-[12.5px] font-medium hover:bg-[#EEF0EA] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              AI Observability & Costs &rarr;
            </Link>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#11140F]">
            MicroSaaS Executive Overview
          </h1>
          <p className="text-[14px] text-[#11140F]/60 mt-1">
            Real-time subscriber tiers, MRR revenue run-rate, active volume, and customer directory.
          </p>
        </div>

        {/* Financial & Volume Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#11140F]/50 uppercase tracking-wider">
              <span>Estimated MRR</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#11140F]">
              ${mrr.toLocaleString()}
            </p>
            <p className="text-[11.5px] text-[#11140F]/50">
              ARR Run Rate: <strong className="text-[#11140F]">${arr.toLocaleString()}</strong>
            </p>
          </div>

          <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#11140F]/50 uppercase tracking-wider">
              <span>Total Customers</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#11140F]">
              {totalUsers}
            </p>
            <p className="text-[11.5px] text-[#11140F]/50">
              {proUsersCount + plusUsersCount + ultraUsersCount} paid subscribers
            </p>
          </div>

          <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#11140F]/50 uppercase tracking-wider">
              <span>Active Dynamic Links</span>
              <QrCode className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#11140F]">
              {totalActiveLinks}
            </p>
            <p className="text-[11.5px] text-[#11140F]/50">
              In physical circulation
            </p>
          </div>

          <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-[12px] font-semibold text-[#11140F]/50 uppercase tracking-wider">
              <span>Redirect Scans</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#11140F]">
              {totalScansCount.toLocaleString()}
            </p>
            <p className="text-[11.5px] text-[#11140F]/50">
              Served via 307 edge redirects
            </p>
          </div>
        </div>

        {/* Subscription Tier Breakdown */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[15px] text-[#11140F] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2F6B4F]" />
              Subscriber Distribution by Tier
            </h3>
            <span className="text-[12px] font-mono text-[#11140F]/50">
              {totalCustomDomains} Custom Domains Registered
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
              <span className="text-[11px] font-semibold text-gray-500 uppercase">Free Plan</span>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{freeUsersCount}</p>
              <span className="text-[11px] text-gray-500">5 links limit</span>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Pro ($5/mo)</span>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">{proUsersCount}</p>
              <span className="text-[11px] text-emerald-600">${proUsersCount * 5}/mo revenue</span>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
              <span className="text-[11px] font-semibold text-blue-700 uppercase">Plus ($12/mo)</span>
              <p className="text-xl font-bold text-blue-900 mt-0.5">{plusUsersCount}</p>
              <span className="text-[11px] text-blue-600">${plusUsersCount * 12}/mo revenue</span>
            </div>

            <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
              <span className="text-[11px] font-semibold text-purple-700 uppercase">Ultra ($29/mo)</span>
              <p className="text-xl font-bold text-purple-900 mt-0.5">{ultraUsersCount}</p>
              <span className="text-[11px] text-purple-600">${ultraUsersCount * 29}/mo revenue</span>
            </div>
          </div>
        </div>

        {/* System Health Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#11140F]/10 bg-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[12px] text-[#11140F]/50 font-medium">Database Layer</span>
              <p className="text-[13px] font-semibold text-[#11140F]">Neon Serverless Postgres</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#11140F]/10 bg-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[12px] text-[#11140F]/50 font-medium">Billing Pipeline</span>
              <p className="text-[13px] font-semibold text-[#11140F]">Stripe Subscriptions</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#11140F]/10 bg-white p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[12px] text-[#11140F]/50 font-medium">Transactional Email</span>
              <p className="text-[13px] font-semibold text-[#11140F]">Nodemailer SMTP</p>
            </div>
          </div>
        </div>

        {/* User Management Directory */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white overflow-hidden shadow-xs space-y-0">
          <div className="p-5 border-b border-[#11140F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[16px] text-[#11140F]">
                Customer Directory ({recentUsers.length})
              </h3>
              <p className="text-[12.5px] text-[#11140F]/50">
                Manage user subscription tiers and reset AI quotas directly.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#11140F]/10 bg-[#F7F8F5]/80 text-[11.5px] uppercase font-semibold text-[#11140F]/50 tracking-wider">
                  <th className="py-3 px-4">User Email</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Current Plan</th>
                  <th className="py-3 px-4">Links</th>
                  <th className="py-3 px-4">Stripe Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <AdminUserRow
                    key={u.id}
                    user={u}
                    isSelf={u.email.toLowerCase() === adminEmail}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
