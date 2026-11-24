import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { APP_URL } from '@/lib/config';
import { getOptimizedStorageUrl } from '@/lib/media';
import VCardInteractiveView from '@/components/VCardInteractiveView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'vcard') {
    return { title: 'Contact Not Found | DynamicQR' };
  }

  const spec = (item.spec as any) || {};
  const pageTitle = `${item.title} — Digital Contact Card`;
  const roleInfo = spec.title ? `${spec.title}${spec.company ? ` at ${spec.company}` : ''}. ` : '';
  const pageDesc = spec.bio
    ? `${roleInfo}${spec.bio}`
    : `${roleInfo}Connect with ${item.title}. Save contact directly to phone, view social links, and exchange info.`;

  const canonicalUrl = `${APP_URL}/c/${slug}`;
  const rawImage = spec.avatarUrl || spec.logoUrl || spec.bannerUrl;
  const ogImageUrl = rawImage ? getOptimizedStorageUrl(rawImage) : `${canonicalUrl}/opengraph-image`;

  return {
    metadataBase: new URL(APP_URL),
    title: pageTitle,
    description: pageDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${item.title} | Digital Business Card`,
      description: pageDesc,
      url: canonicalUrl,
      siteName: 'DynamicQR',
      type: 'profile',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${item.title} Digital Business Card`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${item.title} | Digital Business Card`,
      description: pageDesc,
      images: [ogImageUrl],
    },
    other: {
      'theme-color': spec.accentColor || '#10B981',
      'profile:first_name': item.title.split(' ')[0] || item.title,
      'profile:last_name': item.title.split(' ').slice(1).join(' ') || '',
      'profile:username': slug,
    },
  };
}

export default async function VCardPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const item = await prisma.microSaasItem.findUnique({
    where: { slug },
  });

  if (!item || item.type !== 'vcard') {
    notFound();
  }

  // Increment view/scan counter
  prisma.microSaasItem
    .update({
      where: { id: item.id },
      data: { scansCount: { increment: 1 } },
    })
    .catch(() => {});

  const currentUser = await getCurrentUser().catch(() => null);
  const isOwner = Boolean(currentUser?.id && currentUser.id === item.userId);

  const spec = (item.spec as any) || {};
  const rawImage = spec.avatarUrl || spec.logoUrl || spec.bannerUrl;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${item.title} — Digital Contact Card`,
    url: `${APP_URL}/c/${slug}`,
    mainEntity: {
      '@type': 'Person',
      name: item.title,
      jobTitle: spec.title || undefined,
      worksFor: spec.company ? { '@type': 'Organization', name: spec.company } : undefined,
      description: spec.bio || undefined,
      image: rawImage ? getOptimizedStorageUrl(rawImage) : undefined,
      email: spec.email ? `mailto:${spec.email}` : undefined,
      telephone: spec.phone || undefined,
      url: spec.website || `${APP_URL}/c/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VCardInteractiveView
      itemId={item.id}
      isOwner={isOwner}
      slug={slug}
      fullName={item.title}
      title={spec.title || ''}
      company={spec.company || ''}
      phone={spec.phone || ''}
      email={spec.email || ''}
      website={spec.website || ''}
      bio={spec.bio || ''}
      address={spec.address || ''}
      whatsapp={spec.whatsapp || ''}
      telegram={spec.telegram || ''}
      theme={spec.theme || 'minimal_dark'}
      accentColor={spec.accentColor}
      showBranding={spec.showBranding !== false}
      avatarUrl={spec.avatarUrl || ''}
      logoUrl={spec.logoUrl || ''}
      bannerUrl={spec.bannerUrl || ''}
      socials={{
        linkedin: spec.linkedin || '',
        twitter: spec.twitter || '',
        instagram: spec.instagram || '',
        github: spec.github || '',
        youtube: spec.youtube || '',
        tiktok: spec.tiktok || '',
        spotify: spec.spotify || '',
        facebook: spec.facebook || '',
        appleMusic: spec.appleMusic || '',
      }}
      customLinks={Array.isArray(spec.customLinks) ? spec.customLinks : []}
      rawSpec={spec}
    />
    </>
  );
}
