import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CustomerJoinView from '@/components/CustomerJoinView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = await prisma.customerMailList.findUnique({
    where: { id },
  });

  if (!list) {
    return { title: 'Mailing List Not Found | DynamicQR' };
  }

  return {
    title: `Join ${list.name} | VIP Subscriber List`,
    description: list.description || `Subscribe to ${list.name} for exclusive updates and promotions.`,
  };
}

export default async function CustomerJoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  return (
    <CustomerJoinView
      listId={list.id}
      listName={list.name}
      listDescription={list.description}
      badgeText={list.badgeText}
      headline={list.headline}
      ctaText={list.ctaText}
      successMessage={list.successMessage}
      doubleOptIn={list.doubleOptIn}
      showBranding={isFree}
    />
  );
}
