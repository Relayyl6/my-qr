import { notFound } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { APP_URL } from '@/lib/config';
import WifiInteractiveView from '@/components/WifiInteractiveView';

export async function generateMetadata({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'wifi') {
    return { title: 'Wi-Fi Network Not Found | DynamicQR' };
  }

  const spec = (item.spec as any) || {};
  const ssid = spec.ssid || item.title;
  const security = spec.encryption || 'WPA2/WPA3';
  const pageTitle = `Connect to ${item.title} — Instant Contactless Wi-Fi | DynamicQR`;
  const pageDesc = spec.notes ||
    `One-tap Wi-Fi connection for ${item.title}. SSID: "${ssid}" (${security} Secured). Scan QR code or tap to connect without typing long passwords.`;
  const canonicalUrl = `${APP_URL}/w/${slug}`;

  return {
    metadataBase: new URL(APP_URL),
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: canonicalUrl,
      siteName: 'DynamicQR',
      type: 'website',
      images: [
        {
          url: `${APP_URL}/icon.svg`,
          width: 800,
          height: 800,
          alt: `${item.title} Wi-Fi Access Card`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: pageTitle,
      description: pageDesc,
      images: [`${APP_URL}/icon.svg`],
    },
    other: {
      'theme-color': '#10B981',
      'wifi:ssid': ssid,
      'wifi:encryption': security,
    },
  };
}

export default async function WifiPublicPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);

  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'wifi') {
    notFound();
  }

  const currentUser = await getCurrentUser().catch(() => null);
  const isOwner = Boolean(currentUser?.id && currentUser.id === item.userId);

  // Prevent inflated scan counts from owner testing, camera prefetches, crawlers, or rapid reloads
  try {
    const headerList = headers();
    const purpose = headerList.get('purpose')?.toLowerCase().trim();
    const secPurpose = headerList.get('sec-purpose')?.toLowerCase().trim();
    const xPurpose = headerList.get('x-purpose')?.toLowerCase().trim();
    const userAgent = headerList.get('user-agent')?.toLowerCase() || '';

    const isPrefetch =
      purpose === 'prefetch' ||
      secPurpose === 'prefetch' ||
      xPurpose === 'preview';

    const isBot = /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|slackbot|twitterbot|telegrambot/i.test(userAgent);

    const cookieStore = cookies();
    const sessionScanKey = `wifi_scanned_${item.id}`;
    const alreadyScanned = cookieStore.get(sessionScanKey);

    if (!isOwner && !isPrefetch && !isBot && !alreadyScanned) {
      cookieStore.set(sessionScanKey, '1', {
        maxAge: 1800, // 30 minutes session deduplication
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });
      prisma.microSaasItem
        .update({
          where: { id: item.id },
          data: { scansCount: { increment: 1 } },
        })
        .catch(() => {});
    }
  } catch (e) {
    // Fallback safe bypass
  }

  const spec = (item.spec as any) || {};

  return (
    <WifiInteractiveView
      ssid={spec.ssid || item.title}
      password={spec.password || ''}
      authType={spec.authType || 'WPA'}
      welcomeMessage={spec.welcomeMessage}
      location={spec.location}
      bannerUrl={spec.bannerUrl || ''}
      logoUrl={spec.logoUrl || ''}
      wifiQrString={spec.wifiQrString || `WIFI:T:${spec.authType || 'WPA'};S:${spec.ssid || item.title};P:${spec.password || ''};;`}
      showBranding={spec.showBranding !== false}
    />
  );
}
