import { prisma } from '@/lib/prisma';
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { getCurrentUser } from '@/lib/auth';
import LinkForm from '@/components/LinkForm';
import LinkList from '@/components/LinkList';
import HeroRouteDemo from '@/components/HeroRouteDemo';
import WorkspaceLocked from '@/components/WorkspaceLocked';
import CampaignAnalyst from '@/components/CampaignAnalyst';
import WorkspaceHeaderActions from '@/components/WorkspaceHeaderActions';
import BrandedDomainsManager from '@/components/BrandedDomainsManager';
import PlanUsageMeter from '@/components/PlanUsageMeter';
import HomeTabs from '@/components/HomeTabs';

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

const STEPS = [
  { n: 1, title: 'Create a link', body: 'Pick a short code and set where it should send people today.' },
  { n: 2, title: 'Generate the code', body: 'Export a print-ready PNG, sized and padded for the material it’s going on.' },
  { n: 3, title: 'Print it anywhere', body: 'Flyers, packaging, signage, badges — the code itself never has to change.' },
  { n: 4, title: 'Change the destination', body: 'Swap the URL whenever the campaign moves on. No new file, no reprint.' },
  { n: 5, title: 'Every scan follows along', body: 'Codes already out in the world pick up the new destination the next time they’re scanned.' },
];

const FEATURES = [
  {
    title: 'Instant redirects',
    body: 'Scans resolve with a 307 redirect — no interstitial page, no waiting on a splash screen.',
    meta: 'HTTP 307',
  },
  {
    title: 'AI Smart Routing',
    body: 'Dynamic redirects based on visitor device, country, time-of-day, and plain-English routing rules.',
    meta: 'AI Compiled',
  },
  {
    title: 'Print-ready export',
    body: 'Download high-contrast 1024×1024px PNG with 10% quiet zone — sharp at 300 DPI on physical prints.',
    meta: '300 DPI',
  },
  {
    title: 'Built to scale',
    body: 'Backed by pooled, serverless Neon Postgres, so a link works the same at ten scans or ten thousand.',
    meta: 'Neon Postgres',
  },
];

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
    <>
      {/* Hero */}
      <section id="top" className="bg-[#11140F] w-full overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-16 md:py-28 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-14 items-center">
          <div>
            <h1
              className="text-white text-[2.2rem] sm:text-[2.8rem] md:text-[3.4rem] leading-[1.08] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              A QR code you print once.
              <br />
              <span className="text-[#96A689]">AI-routed as long as it needs to be.</span>
            </h1>
            <p className="mt-5 text-[#EEF0EA]/70 text-[15px] sm:text-[17px] leading-relaxed max-w-[50ch]">
              Generate intelligent dynamic QR codes that adapt in real time. Switch destinations anytime, route iOS vs Android automatically, and extract AI campaign intelligence from physical flyers.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 items-center">
              <a
                href="#workspace"
                className="rounded-xl bg-white px-5 py-3 text-[14px] font-medium text-[#11140F] hover:bg-[#EEF0EA] transition-colors"
              >
                Open workspace &rarr;
              </a>
              <a
                href="#how-it-works"
                className="rounded-xl border border-white/20 px-5 py-3 text-[14px] font-medium text-white/80 hover:text-white hover:border-white/40 transition-colors"
              >
                How it works
              </a>
            </div>
          </div>

          <HeroRouteDemo />
        </div>
      </section>

      {/* The flyer problem */}
      <section className="max-w-[1200px] mx-auto px-5 md:px-8 py-16 md:py-24">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-8 md:gap-14 items-start">
          <p
            className="text-[1.3rem] sm:text-[1.5rem] md:text-[1.75rem] leading-snug tracking-tight text-[#11140F]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            A static QR code on a printed flyer is a single point of failure.
          </p>
          <div className="space-y-4 text-[14px] sm:text-[15px] text-[#11140F]/65 leading-relaxed">
            <p>
              You print 5,000 flyers for an event. Two weeks before the date, the venue changes or the ticketing link breaks. A static QR code leaves you with 5,000 pieces of expensive paper pointing into the void.
            </p>
            <p>
              With DynamicQR, the printed code points to a permanent address you control. When plans shift, you don't reprint — you update where it sends people.
            </p>
            <ol className="list-decimal pl-5 space-y-1 pt-2 font-medium text-[#11140F]">
              <li>Notice the issue.</li>
              <li>Open your workspace.</li>
              <li>Fix the link. Every flyer updates before the ink's dry.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white border-y border-[#11140F]/10">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 py-20 md:py-28">
          <h2
            className="text-[2rem] md:text-[2.5rem] leading-tight tracking-tight max-w-[18ch]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            From first print to next campaign
          </h2>
          <div className="mt-14 grid md:grid-cols-5 gap-8 md:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-[#2F6B4F] text-[15px] font-medium"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {String(step.n).padStart(2, '0')}
                  </span>
                  {i < STEPS.length - 1 && <span className="hidden md:block h-px flex-1 bg-[#11140F]/10 ml-2" />}
                </div>
                <h3 className="mt-3 font-medium text-[15px]">{step.title}</h3>
                <p className="mt-2 text-[14px] text-[#11140F]/55 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-[1200px] mx-auto px-5 md:px-8 py-20 md:py-28">
        <h2
          className="text-[2rem] md:text-[2.5rem] leading-tight tracking-tight max-w-[18ch]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          What's actually running under the hood
        </h2>
        <div className="mt-12 grid sm:grid-cols-2 gap-px bg-[#11140F]/10 rounded-2xl overflow-hidden">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-[#EEF0EA] p-8 md:p-10">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-[17px]">{f.title}</h3>
                <span
                  className="text-[11px] text-[#11140F]/45 border border-[#11140F]/15 rounded-full px-2.5 py-1"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {f.meta}
                </span>
              </div>
              <p className="mt-3 text-[14px] text-[#11140F]/60 leading-relaxed max-w-[42ch]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
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

        {user && <WorkspaceHeaderActions />}
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
