import { prisma } from '@/lib/prisma';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { getCurrentUser } from '@/lib/auth';
import LinkForm from '@/components/LinkForm';
import LinkList from '@/components/LinkList';
import WorkspaceLocked from '@/components/WorkspaceLocked';
import CampaignAnalyst from '@/components/CampaignAnalyst';
import WorkspaceHeaderActions from '@/components/WorkspaceHeaderActions';
import BrandedDomainsManager from '@/components/BrandedDomainsManager';
import PlanUsageMeter from '@/components/PlanUsageMeter';
import HomeTabs from '@/components/HomeTabs';
import AppleProductTour from '@/components/AppleProductTour';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-display' });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

function QrMark({ className = 'w-6 h-6', fill = '#11140F' }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="1" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="4" width="3" height="3" fill={fill} />
      <rect x="14" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="17" y="4" width="3" height="3" fill={fill} />
      <rect x="1" y="14" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="17" width="3" height="3" fill={fill} />
      <rect x="15" y="15" width="3" height="3" fill={fill} />
      <rect x="20" y="15" width="3" height="3" fill={fill} />
      <rect x="15" y="20" width="3" height="3" fill={fill} />
      <rect x="20" y="20" width="3" height="3" fill={fill} />
    </svg>
  );
}

export default async function Home() {
  const user = await getCurrentUser();

  // Security: Only the owner's admin account can claim the original legacy links!
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (user && user.email.toLowerCase() === adminEmail) {
    await prisma.qrLink.updateMany({
      where: { userId: null },
      data: { userId: user.id },
    });
  }

  const links = user
    ? await prisma.qrLink.findMany({
        where: { userId: user.id },
        include: { landingPage: true, customDomain: true, routingRules: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const customDomains = user
    ? await prisma.customDomain.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  let announcementBanner: string | null = null;
  try {
    const sysRecord = await prisma.aiCache.findUnique({
      where: { key: 'system_sovereignty_config' },
    });
    if (sysRecord && (sysRecord.value as any)?.announcementBanner) {
      announcementBanner = (sysRecord.value as any).announcementBanner;
    }
  } catch (e) {}

  const isAdmin = !!(user && user.email.toLowerCase() === adminEmail);

  // Plan capacity & usage calculations
  const tier = (user?.tier || 'free').toLowerCase();
  const linkLimits: Record<string, number> = {
    free: 5,
    pro: 50,
    plus: 500,
    ultra: 999999,
  };
  const scanLimits: Record<string, number> = {
    free: 1000,
    pro: 25000,
    plus: 250000,
    ultra: 999999,
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.max(1, Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  const monthlyScansCount = user
    ? await prisma.scan.count({
        where: {
          qrLink: { userId: user.id },
          scannedAt: { gte: startOfMonth },
        },
      })
    : 0;

  const aiCredit = user
    ? await prisma.aiCredit.findUnique({
        where: { userId: user.id },
      })
    : null;

  const activeLinksCount = links.filter((l) => !l.isArchived).length;
  const maxLinks = isAdmin ? 999999 : (linkLimits[tier] ?? 5);
  const maxScans = isAdmin ? 999999 : (scanLimits[tier] ?? 1000);
  const aiUsedUsd = aiCredit?.usedThisMonth ? Number(aiCredit.usedThisMonth) : 0;
  const aiLimitUsd = isAdmin
    ? 999.0
    : aiCredit?.monthlyLimitUsd
    ? Number(aiCredit.monthlyLimitUsd)
    : tier === 'ultra'
    ? 50
    : tier === 'plus'
    ? 15
    : tier === 'pro'
    ? 5
    : 0.5;

  const overviewContent = (
    <AppleProductTour />
  );

  const workspaceContent = (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-[1.5rem] sm:text-[1.75rem] tracking-tight font-medium"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {user ? `${user.name ? `${user.name}'s` : 'Your'} Workspace` : 'Your Workspace'}
          </h2>
          <p className="mt-1 text-[#11140F]/55 text-[14px] sm:text-[15px]">
            {user
              ? 'Create, manage, smart-route, and analyze your dynamic QR codes.'
              : 'Sign in to generate, route, and track your dynamic QR codes.'}
          </p>
        </div>

        {user && <WorkspaceHeaderActions isAdmin={isAdmin} />}
      </div>

      {user ? (
        <div className="space-y-8">
          {/* Plan Capacity & Usage Meter with Real-time Counters */}
          <PlanUsageMeter
            userTier={user.tier || 'free'}
            isAdmin={isAdmin}
            activeLinksCount={activeLinksCount}
            maxLinks={maxLinks}
            monthlyScansCount={monthlyScansCount}
            maxScans={maxScans}
            aiUsedUsd={aiUsedUsd}
            aiLimitUsd={aiLimitUsd}
            daysUntilReset={daysUntilReset}
          />

          {/* Feature 3: AI Campaign Analyst Panel */}
          <CampaignAnalyst />

          {/* Feature 4: Custom Branded Domains (Plus & Ultra) */}
          <BrandedDomainsManager
            initialDomains={customDomains}
            userTier={user.tier || 'free'}
            isAdmin={isAdmin}
          />

          {/* Link creation & Link list workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start w-full min-w-0">
            <section className="w-full min-w-0 max-w-full h-fit rounded-2xl border border-[#11140F]/10 bg-white p-4 sm:p-7 shadow-xs lg:sticky lg:top-36">
              <h3 className="mb-5 sm:mb-7 text-[16px] sm:text-[17px] font-medium">Create new link</h3>
              <LinkForm customDomains={customDomains} />
            </section>

            <section className="w-full min-w-0 max-w-full rounded-2xl border border-[#11140F]/10 bg-white p-4 sm:p-7 shadow-xs">
              <h3 className="mb-5 sm:mb-7 text-[16px] sm:text-[17px] font-medium">
                Active links <span className="text-[#11140F]/35 font-normal">({links.filter((l) => !l.isArchived).length})</span>
              </h3>
              <LinkList links={links} userTier={user.tier || 'free'} isAdmin={isAdmin} />
            </section>
          </div>
        </div>
      ) : (
        <WorkspaceLocked />
      )}
    </div>
  );

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} bg-[#EEF0EA] text-[#11140F] min-h-screen w-full overflow-x-clip`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Unified Navigation & Tabbed View: Dedicated Workspace vs Product Tour */}
      <HomeTabs
        user={user}
        isAdmin={isAdmin}
        overviewContent={overviewContent}
        workspaceContent={workspaceContent}
        announcementBanner={announcementBanner}
      />

      <footer className="max-w-[1200px] mx-auto px-5 md:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#11140F]/55 border-t border-[#11140F]/10">
        <div className="flex items-center gap-2">
          <QrMark className="w-4 h-4" fill="#11140F99" />
          <span className="font-medium text-[#11140F]">DynamicQR</span>
        </div>
        <div className="flex items-center gap-6 flex-wrap text-[12.5px]">
          <a href="/pricing" className="hover:text-[#11140F] transition-colors">Pricing</a>
          <a href="/terms" className="hover:text-[#11140F] transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-[#11140F] transition-colors">Privacy</a>
          <a href="/refund" className="hover:text-[#11140F] transition-colors">Refund Policy</a>
        </div>
        <p className="text-[12px] text-[#11140F]/45">One code, printed once. Routed as long as it needs to be.</p>
      </footer>
    </div>
  );
}
