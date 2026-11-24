import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { APP_URL } from '@/lib/config';
import { getOptimizedStorageUrl } from '@/lib/media';
import MenuInteractiveView from '@/components/MenuInteractiveView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'menu') {
    return { title: 'Menu Not Found | DynamicQR' };
  }

  const spec = (item.spec as any) || {};
  const pageTitle = `${item.title} — Contactless Digital Menu`;
  const pageDesc = spec.description || `Explore the live contactless menu for ${item.title}. View delicious dishes, pricing, and ingredients directly on your phone.`;
  const canonicalUrl = `${APP_URL}/m/${slug}`;
  const rawImage = spec.coverUrl || spec.logoUrl;
  const ogImageUrl = rawImage ? getOptimizedStorageUrl(rawImage) : `${APP_URL}/icon.svg`;

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
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${item.title} Digital Menu`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: [ogImageUrl],
    },
  };
}

export default async function MenuPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'menu') {
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
    <MenuInteractiveView
      title={item.title}
      currency={spec.currency || '$'}
      sections={spec.sections || []}
      bannerUrl={spec.bannerUrl || ''}
      logoUrl={spec.logoUrl || ''}
      showBranding={spec.showBranding !== false}
    />
  );
}
