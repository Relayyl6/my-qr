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
import WorkspaceShell from '@/components/WorkspaceShell';
import AppleProductTour from '@/components/AppleProductTour';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { TIER_CONFIGS } from '@/lib/ai/flags';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-display' });
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' });

export default async function Home() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = !!(user && user.email.toLowerCase() === adminEmail);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilReset = Math.max(1, Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  let links: any[] = [];
  let customDomains: any[] = [];
  let announcementBanner: string | null = null;
  let isMaintenanceActive = false;
  let monthlyScansCount = 0;
  let aiCredit: any = null;
  let promoBanner: any = null;
  let microSaasItems: any[] = [];
  let mailLists: any[] = [];
  let recentScans: any[] = [];

  try {
    // 1. Authoritative System Sovereignty Config (Available to all visitors)
    const [sysRecord, promoRecord] = await Promise.all([
      prisma.aiCache.findUnique({
        where: { key: 'system_sovereignty_config' },
      }).catch(() => null),
      prisma.aiCache.findUnique({
        where: { key: 'platform_promo_config' },
      }).catch(() => null),
    ]);

    if (sysRecord && sysRecord.value) {
      const val = sysRecord.value as any;
      if (val.announcementBanner) announcementBanner = val.announcementBanner;
      if (val.maintenanceMode) isMaintenanceActive = true;
    }

    if (promoRecord && (promoRecord.value as any)?.banner) {
      promoBanner = (promoRecord.value as any).banner;
    }

    // Security: Only the owner's admin account can claim the original legacy links!
    if (user && user.email.toLowerCase() === adminEmail) {
      await prisma.qrLink.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      });
    }

    if (user) {
      const [fetchedLinks, fetchedDomains, scanCount, creditRecord, fetchedMicroItems, fetchedMailLists, fetchedScans] = await Promise.all([
        prisma.qrLink.findMany({
          where: { userId: user.id },
          include: { landingPage: true, customDomain: true, routingRules: true },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.customDomain.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.scan.count({
          where: {
            qrLink: { userId: user.id },
            scannedAt: { gte: startOfMonth },
          },
        }),
        prisma.aiCredit.findUnique({
          where: { userId: user.id },
        }),
        prisma.microSaasItem.findMany({
          where: { userId: user.id },
          select: { id: true, type: true, slug: true, title: true, scansCount: true, createdAt: true, spec: true },
        }),
        prisma.customerMailList.findMany({
          where: { userId: user.id },
          include: { _count: { select: { contacts: true } } },
        }),
        prisma.scan.findMany({
          where: { qrLink: { userId: user.id } },
          take: 8,
          orderBy: { scannedAt: 'desc' },
          include: { qrLink: { select: { label: true, shortCode: true } } },
        }),
      ]);

      links = fetchedLinks;
      customDomains = fetchedDomains;
      monthlyScansCount = scanCount;
      aiCredit = creditRecord;
      microSaasItems = fetchedMicroItems;
      mailLists = fetchedMailLists;
      recentScans = fetchedScans;
    }
  } catch (err) {
    console.error('Safe SSR Fallback in Home page:', err);
  }

  // Emergency Maintenance Bypass: Non-admin visitors see informational maintenance page
  if (isMaintenanceActive && !isAdmin) {
    return <MaintenanceScreen />;
  }

  // If super-admin is browsing while maintenance mode is active, show persistent sovereign warning
  const effectiveAnnouncement = isMaintenanceActive && isAdmin
    ? "⚠️ EMERGENCY MAINTENANCE BYPASS ACTIVE — Public access is temporarily paused. Physical QR codes continue redirecting at full speed."
    : announcementBanner;

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

  const activeLinksCount = links.filter((l) => !l.isArchived).length;
  const maxLinks = isAdmin ? 999999 : (linkLimits[tier] ?? 5);
  const maxScans = isAdmin ? 999999 : (scanLimits[tier] ?? 1000);
  const aiUsedUsd = aiCredit?.usedThisMonth ? Number(aiCredit.usedThisMonth) : 0;
  // Always derive aiLimitUsd from the user's current tier (DB value goes stale on plan downgrade)
  const aiLimitUsd = isAdmin
    ? 999.0
    : (TIER_CONFIGS[tier as string]?.monthlyLimitUsd ?? TIER_CONFIGS.free.monthlyLimitUsd);

  const overviewContent = (
    <AppleProductTour />
  );

  const workspaceContent = user ? (
    <WorkspaceShell
      user={user}
      isAdmin={isAdmin}
      activeLinksCount={activeLinksCount}
      monthlyScansCount={monthlyScansCount}
      links={links}
      microSaasItems={microSaasItems}
      mailLists={mailLists}
      recentScans={recentScans}
      planUsageMeter={
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
      }
      campaignAnalyst={
        <CampaignAnalyst userTier={user.tier || 'free'} isAdmin={isAdmin} />
      }
      brandedDomainsManager={
        <BrandedDomainsManager
          initialDomains={customDomains}
          userTier={user.tier || 'free'}
          isAdmin={isAdmin}
        />
      }
      linkCreationAndList={
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start w-full min-w-0">
          <section className="w-full min-w-0 max-w-full h-fit rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-4 sm:p-7 shadow-xs dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] lg:sticky lg:top-36 text-[#11140F] dark:text-white transition-colors">
            <h3 className="mb-5 sm:mb-7 text-[16px] sm:text-[17px] font-medium text-[#11140F] dark:text-white">Create new link</h3>
            <LinkForm customDomains={customDomains} />
          </section>

          <section className="w-full min-w-0 max-w-full rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-4 sm:p-7 shadow-xs dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-[#11140F] dark:text-white transition-colors">
            <h3 className="mb-5 sm:mb-7 text-[16px] sm:text-[17px] font-medium text-[#11140F] dark:text-white">
              Active links <span className="text-[#11140F]/35 dark:text-white/40 font-normal">({links.filter((l) => !l.isArchived).length})</span>
            </h3>
            <LinkList links={links} userTier={user.tier || 'free'} isAdmin={isAdmin} />
          </section>
        </div>
      }
    />
  ) : (
    <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8 w-full">
      <WorkspaceLocked />
    </div>
  );

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} bg-[#EEF0EA] dark:bg-[#080907] text-[#11140F] dark:text-[#EEF0EA] min-h-screen w-full overflow-x-clip transition-colors duration-200`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Unified Navigation & Tabbed View: Dedicated Workspace vs Product Tour */}
      <HomeTabs
        user={user}
        isAdmin={isAdmin}
        overviewContent={overviewContent}
        workspaceContent={workspaceContent}
        announcementBanner={effectiveAnnouncement}
        promoBanner={promoBanner}
      />
    </div>
  );
}
