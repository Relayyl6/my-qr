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
  Globe,
  Flame,
  ExternalLink,
} from 'lucide-react';
import AdminUserRow from '@/components/AdminUserRow';
import AdminDomainRow from '@/components/AdminDomainRow';
import AdminSovereigntyControls from '@/components/AdminSovereigntyControls';
import { adminGetSystemConfig, adminGetAuditLogs } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  // Strict Admin Authorization Guard
  if (!user || user.email.toLowerCase() !== adminEmail) {
    redirect('/');
  }

  // Load aggregated SaaS metrics & sovereign records concurrently
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
    topLinks,
    customDomains,
    systemConfig,
    auditLogs,
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
    prisma.qrLink.findMany({
      orderBy: { scanCount: 'desc' },
      take: 8,
      select: {
        id: true,
        shortCode: true,
        destinationUrl: true,
        label: true,
        scanCount: true,
        lastScannedAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.customDomain.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        domain: true,
        status: true,
        cnameTarget: true,
        verificationTxt: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
    adminGetSystemConfig(),
    adminGetAuditLogs(),
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
              Super-Admin Sovereign Command
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
            Super-Admin Sovereign Console
          </h1>
          <p className="text-[14px] text-[#11140F]/60 mt-1">
            Authoritative platform-wide governance, customer link fleets, instant domain overrides & MRR telemetry.
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

        {/* Sovereignty Governance Panel */}
        <AdminSovereigntyControls
          initialConfig={systemConfig}
          auditLogs={auditLogs}
        />

        {/* Top 8 Scanned Links Across Entire Platform */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#11140F]">
                  Top Scanned QR Codes Across Platform
                </h3>
                <p className="text-[12px] text-[#11140F]/50">
                  Real-time leaderboard of highest traffic dynamic destinations
                </p>
              </div>
            </div>
            <span className="text-[11.5px] font-mono text-[#11140F]/50">
              Live Edge Traffic
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {topLinks.map((link) => (
              <div
                key={link.id}
                className="p-3.5 rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.015] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[13px] text-emerald-800 truncate">
                    /id/{link.shortCode}
                  </span>
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {link.scanCount} scans
                  </span>
                </div>
                <p className="text-[11px] text-[#11140F]/50 truncate font-mono">
                  → {link.destinationUrl}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-[#11140F]/5 text-[10.5px] text-[#11140F]/40">
                  <span className="truncate max-w-[120px]">{link.user?.email || 'System'}</span>
                  <span>
                    {link.lastScannedAt ? new Date(link.lastScannedAt).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Domain Registry (Instant Sovereign Force-Verify) */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white overflow-hidden shadow-xs space-y-0">
          <div className="p-5 border-b border-[#11140F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[16px] text-[#11140F]">
                  Branded Custom Domains ({customDomains.length})
                </h3>
                <p className="text-[12.5px] text-[#11140F]/50">
                  Instant force-verification bypass for customer domains without waiting for DNS propagation
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#11140F]/10 bg-[#F7F8F5]/80 text-[11.5px] uppercase font-semibold text-[#11140F]/50 tracking-wider">
                  <th className="py-3 px-4">Custom Domain</th>
                  <th className="py-3 px-4">Owner Email</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">CNAME Target</th>
                  <th className="py-3 px-4 text-right">Sovereign Action</th>
                </tr>
              </thead>
              <tbody>
                {customDomains.map((d) => (
                  <AdminDomainRow key={d.id} domain={d} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Directory Management */}
        <div className="rounded-2xl border border-[#11140F]/10 bg-white overflow-hidden shadow-xs space-y-0">
          <div className="p-5 border-b border-[#11140F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-[16px] text-[#11140F]">
                Customer Fleet Directory ({recentUsers.length})
              </h3>
              <p className="text-[12.5px] text-[#11140F]/50">
                Manage user subscription tiers, inspect links, and adjust AI compute budgets directly.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#11140F]/10 bg-[#F7F8F5]/80 text-[11.5px] uppercase font-semibold text-[#11140F]/50 tracking-wider">
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Current Plan</th>
                  <th className="py-3 px-4">Link Fleet</th>
                  <th className="py-3 px-4">Stripe Billing</th>
                  <th className="py-3 px-4 text-right">Sovereign Actions</th>
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
