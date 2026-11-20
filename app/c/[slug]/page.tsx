import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import VCardInteractiveView from '@/components/VCardInteractiveView';

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

  return {
    title: `${item.title} — Digital Contact Card`,
    description: `Connect with ${item.title}. Save directly to your phone contacts.`,
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

  const spec = (item.spec as any) || {};

  return (
    <VCardInteractiveView
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
      socials={{
        linkedin: spec.linkedin,
        twitter: spec.twitter,
        instagram: spec.instagram,
        github: spec.github,
        youtube: spec.youtube,
      }}
    />
  );
}
