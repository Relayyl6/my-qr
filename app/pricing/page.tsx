import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import PricingTable from '@/components/PricingTable';
import ComprehensiveFeatureMatrix from '@/components/ComprehensiveFeatureMatrix';
import MaintenanceScreen from '@/components/MaintenanceScreen';

export const dynamic = 'force-dynamic';

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

export default async function PricingPage() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = !!(user && user.email.toLowerCase() === adminEmail);

  let isMaintenanceActive = false;
  let promoBanner: any = null;
  try {
    const [sysRecord, promoRecord] = await Promise.all([
      prisma.aiCache.findUnique({
        where: { key: 'system_sovereignty_config' },
      }).catch(() => null),
      prisma.aiCache.findUnique({
        where: { key: 'platform_promo_config' },
      }).catch(() => null),
    ]);
    if (sysRecord && (sysRecord.value as any)?.maintenanceMode) {
      isMaintenanceActive = true;
    }
    if (promoRecord && (promoRecord.value as any)?.banner) {
      promoBanner = (promoRecord.value as any).banner;
    }
  } catch (err) {}

  if (isMaintenanceActive && !isAdmin) {
    return <MaintenanceScreen />;
  }

  const currentTier = user?.tier || 'free';

  return (
    <div className="bg-[#EEF0EA] dark:bg-[#080907] text-[#11140F] dark:text-[#EEF0EA] min-h-screen w-full flex flex-col justify-between transition-colors duration-200">
      {/* Sticky Header with Announcement Bar & Navigation */}
      <div className="sticky top-0 inset-x-0 z-50">
        <AnnouncementBar initialBanner={promoBanner} />
        <nav className="bg-[#EEF0EA]/90 dark:bg-[#0D0F0C]/90 backdrop-blur-md border-b border-[#11140F]/10 dark:border-white/10">
          <div className="max-w-[1360px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 font-medium text-[15px] hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#11140F] dark:bg-white/10 shadow-xs">
                <QrMark className="w-4.5 h-4.5" fill="#FFFFFF" />
              </div>
              <span className="font-bold text-[#11140F] dark:text-white text-lg tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                DynamicQR
              </span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[14px] text-[#11140F]/70 dark:text-white/70 hover:text-[#11140F] dark:hover:text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to workspace
            </Link>
          </div>
        </nav>
      </div>

      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-8 pt-10 sm:pt-14 pb-24 space-y-16 flex-1 w-full">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11140F]/5 dark:bg-white/10 text-[#11140F] dark:text-white text-[12px] font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#2F6B4F] dark:text-[#34D399]" />
            Simple, Transparent Pricing
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#11140F] dark:text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Predictable plans for growing campaigns.
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#11140F]/65 dark:text-white/70 leading-relaxed">
            Every plan includes lightning-fast 307 redirects on Neon Postgres, 300 DPI print-ready exports, and generous monthly AI intelligence budgets.
          </p>
        </div>

        {/* Pricing Cards Component */}
        <PricingTable currentTier={currentTier} isLoggedIn={!!user} />

        {/* Trust & Guarantee Banner */}
        <div className="max-w-3xl mx-auto rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#2F6B4F]/10 dark:bg-[#34D399]/20 text-[#2F6B4F] dark:text-[#34D399] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-[15px] text-[#11140F] dark:text-white">Cancel or switch plans anytime</h4>
            <p className="text-[13px] text-[#11140F]/60 dark:text-white/70">
              No long-term contracts. Your active printed QR codes will never break even if you downgrade — they seamlessly remain live on your permanent short links.
            </p>
          </div>
        </div>

        {/* Master 100+ Feature Matrix Comparison */}
        <div className="pt-6 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight text-[#11140F] dark:text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Complete 100+ Capability Matrix
            </h2>
            <p className="text-[14px] text-[#11140F]/65 dark:text-white/70">
              Deep-dive into every routing algorithm, security mechanism, marketing pixel, and print standard.
            </p>
          </div>

          <ComprehensiveFeatureMatrix />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto pt-8 space-y-8">
          <h2
            className="text-2xl font-bold tracking-tight text-center text-[#11140F] dark:text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-5 sm:p-6 space-y-2 shadow-xs">
              <h3 className="font-medium text-[15px] text-[#11140F] dark:text-white">What happens if I update a QR destination URL?</h3>
              <p className="text-[14px] text-[#11140F]/65 dark:text-white/70 leading-relaxed">
                The QR matrix never changes because people scan your short permanent URL (`/id/shortcode`). When someone scans your flyer, our edge router immediately redirects them to your newest destination URL in under 20ms.
              </p>
            </div>

            <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-5 sm:p-6 space-y-2 shadow-xs">
              <h3 className="font-medium text-[15px] text-[#11140F] dark:text-white">How does AI credit budgeting work?</h3>
              <p className="text-[14px] text-[#11140F]/65 dark:text-white/70 leading-relaxed">
                Every plan includes a generous monthly AI compute allowance. Because our optimized neural models run at ultra-low cost per query, a $5.00/mo Pro budget provides roughly 15,000 AI routing, enrichment, and analysis operations each month.
              </p>
            </div>

            <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-5 sm:p-6 space-y-2 shadow-xs">
              <h3 className="font-medium text-[15px] text-[#11140F] dark:text-white">Can I print codes on physical materials at 300 DPI?</h3>
              <p className="text-[14px] text-[#11140F]/65 dark:text-white/70 leading-relaxed">
                Yes. DynamicQR exports 1080×1350px high-contrast posters and 1024×1024px PNG assets with exact 10% quiet-zone buffers ready for offset printing, table tents, and billboards.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer theme="dark" />
    </div>
  );
}
