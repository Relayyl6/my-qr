import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
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

  return {
    title: `${item.title} — Digital Menu`,
    description: `Explore the contactless menu for ${item.title}. View fresh dishes, pricing, and dietary options.`,
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
      showBranding={spec.showBranding !== false}
    />
  );
}
