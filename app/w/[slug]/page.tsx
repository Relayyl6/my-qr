import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import WifiInteractiveView from '@/components/WifiInteractiveView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'wifi') {
    return { title: 'Wi-Fi Network Not Found | DynamicQR' };
  }

  const spec = (item.spec as any) || {};

  return {
    title: `Connect to ${item.title} — Instant Wi-Fi Access`,
    description: `Fast contactless Wi-Fi access for ${item.title}. Scan QR code to connect instantly or copy network password.`,
  };
}

export default async function WifiPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'wifi') {
    notFound();
  }

  // Increment scan/view count asynchronously
  prisma.microSaasItem
    .update({
      where: { id: item.id },
      data: { scansCount: { increment: 1 } },
    })
    .catch(() => {});

  const spec = (item.spec as any) || {};

  return (
    <WifiInteractiveView
      ssid={spec.ssid || item.title}
      password={spec.password || ''}
      authType={spec.authType || 'WPA'}
      welcomeMessage={spec.welcomeMessage}
      location={spec.location}
      wifiQrString={spec.wifiQrString || `WIFI:T:${spec.authType || 'WPA'};S:${spec.ssid || item.title};P:${spec.password || ''};;`}
      showBranding={spec.showBranding !== false}
    />
  );
}
