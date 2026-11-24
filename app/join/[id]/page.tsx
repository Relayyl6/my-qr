import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { APP_URL } from '@/lib/config';
import CustomerJoinView from '@/components/CustomerJoinView';

export async function generateMetadata({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(params);
  const list = await prisma.customerMailList.findUnique({
    where: { id },
  });

  if (!list) {
    return { title: 'Mailing List Not Found | DynamicQR' };
  }

  const pageTitle = `Join ${list.name} — Exclusive VIP Subscriber List | DynamicQR`;
  const pageDesc = list.description ||
    `Subscribe to ${list.name} for exclusive private updates, announcements, and VIP perks. One-tap signup powered by DynamicQR.`;
  const canonicalUrl = `${APP_URL}/join/${id}`;

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
          alt: `${list.name} VIP List`,
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
    },
  };
}

export default async function CustomerJoinPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(params);

  const list = await prisma.customerMailList.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          tier: true,
        },
      },
    },
  });

  if (!list) {
    notFound();
  }

  const isFree = !list.user?.tier || list.user.tier.toLowerCase() === 'free';

  const metaRecord = await prisma.aiCache.findUnique({
    where: { key: `maillist_meta_${list.id}` },
  }).catch(() => null);
  const meta = (metaRecord?.value as any) || {};

  return (
    <CustomerJoinView
      listId={list.id}
      listName={list.name}
      listDescription={list.description}
      badgeText={list.badgeText}
      headline={list.headline}
      ctaText={list.ctaText}
      successMessage={list.successMessage}
      logoUrl={meta.logoUrl || null}
      bannerUrl={meta.bannerUrl || null}
      doubleOptIn={list.doubleOptIn}
      showBranding={isFree}
    />
  );
}
