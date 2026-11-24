import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { APP_URL } from '@/lib/config';
import { getOptimizedStorageUrl } from '@/lib/media';
import MenuInteractiveView from '@/components/MenuInteractiveView';

export async function generateMetadata({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);
  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'menu') {
    return { title: 'Menu Not Found | DynamicQR' };
  }

  const spec = (item.spec as any) || {};
  const sectionCount = Array.isArray(spec.sections) ? spec.sections.length : 0;
  const dishCount = Array.isArray(spec.sections)
    ? spec.sections.reduce((acc: number, s: any) => acc + (s.items?.length || 0), 0)
    : 0;

  const pageTitle = `${item.title} — Digital Contactless Menu | DynamicQR`;
  const pageDesc = spec.description ||
    `Explore ${item.title}'s live contactless restaurant menu. Browse ${dishCount > 0 ? `${dishCount} dishes across ${sectionCount} categories` : 'chef specials and dishes'} with live pricing, photos, and dietary details.`;
  const canonicalUrl = `${APP_URL}/m/${slug}`;
  const rawImage = spec.bannerUrl || spec.coverUrl || spec.logoUrl;
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
      type: 'restaurant.menu',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${item.title} Contactless Menu`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: [ogImageUrl],
    },
    other: {
      'theme-color': spec.accentColor || '#10B981',
      'restaurant:menu_sections': String(sectionCount),
      'restaurant:currency': spec.currency || '$',
    },
  };
}

export default async function MenuPublicPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const { slug } = await Promise.resolve(params);

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
