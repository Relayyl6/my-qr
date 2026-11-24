import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Footer from '@/components/Footer';
import AnnouncementBar from '@/components/AnnouncementBar';
import HeaderNav from '@/components/HeaderNav';
import AppleProductTour from '@/components/AppleProductTour';
import MaintenanceScreen from '@/components/MaintenanceScreen';
import { ChevronRight } from 'lucide-react';
import { Metadata } from 'next';
import { APP_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'Interactive Product Tour — DynamicQR',
  description: 'Explore DynamicQR features: Intelligent routing, digital business cards, interactive contactless menus, and real-time scan analytics.',
  alternates: {
    canonical: `${APP_URL}/product-tour`,
  },
  openGraph: {
    title: 'DynamicQR Interactive Product Tour',
    description: 'Experience intelligent QR routing, digital vCards, and real-time scan diagnostics.',
    url: `${APP_URL}/product-tour`,
    siteName: 'DynamicQR',
    type: 'website',
    images: [
      {
        url: `${APP_URL}/icon.svg`,
        width: 800,
        height: 800,
        alt: 'DynamicQR Product Tour',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'DynamicQR Interactive Product Tour',
    description: 'Experience intelligent QR routing, digital vCards, and real-time scan diagnostics.',
    images: [`${APP_URL}/icon.svg`],
  },
};

export default async function ProductTourPage() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = !!(user && user.email.toLowerCase() === adminEmail);

  let isMaintenanceActive = false;
  let promoBanner: any = null;
  let announcementBanner: string | null = null;

  try {
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
  } catch (err) {}

  if (isMaintenanceActive && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="w-full min-h-screen bg-[#11140F] text-white flex flex-col">
      {/* Sticky Top Header */}
      <div className="sticky top-0 inset-x-0 z-50 w-full">
        <AnnouncementBar initialBanner={promoBanner} />
        <HeaderNav
          user={user}
          isAdmin={isAdmin}
          activeTab="overview"
          announcementBanner={announcementBanner}
        />
      </div>

      {/* Main Tour Content */}
      <main className="flex-1 w-full bg-[#11140F]">
        <AppleProductTour />

        {/* Bottom Banner prompting user to enter Workspace */}
        <div className="bg-[#11140F] text-white py-14 px-4 sm:px-6 border-t border-white/10">
          <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Ready to manage your dynamic codes?
              </h3>
              <p className="text-white/60 text-[14px] mt-1">
                Access your active QR links, campaign analyst, and custom branded domains.
              </p>
            </div>
            <Link
              href="/#workspace"
              className="px-6 py-3 rounded-xl bg-white text-[#11140F] font-semibold text-[14px] hover:bg-[#EEF0EA] transition-colors flex items-center gap-2 shrink-0 shadow-sm cursor-pointer"
            >
              <span>Go to Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer theme="dark" />
    </div>
  );
}
