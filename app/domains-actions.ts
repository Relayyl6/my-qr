'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { provisionDomainAndEmail } from '@/lib/domains/provisioning';
import { revalidatePath } from 'next/cache';

export async function getUserDomainOrders() {
  const user = await getCurrentUser();
  if (!user) return [];

  const orders = await prisma.domainOrder.findMany({
    where: {
      OR: [
        { userId: user.id },
        { userEmail: user.email.toLowerCase() },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}

export async function confirmOrderPayment(paystackRef: string) {
  const user = await getCurrentUser();
  const order = await prisma.domainOrder.findUnique({
    where: { paystackRef },
  });

  if (!order) {
    return { success: false, message: 'Order reference not found' };
  }

  if (order.status === 'ACTIVE') {
    return { success: true, order, message: 'Domain is already active' };
  }

  try {
    await prisma.domainOrder.update({
      where: { id: order.id },
      data: { status: 'PROVISIONING' },
    });

    const { zoneId, nameservers } = await provisionDomainAndEmail(order);

    const updated = await prisma.domainOrder.update({
      where: { id: order.id },
      data: {
        status: 'ACTIVE',
        cloudflareZoneId: zoneId,
        nameservers,
        userId: user?.id || order.userId,
        errorMessage: null,
      },
    });

    // Also automatically register into CustomDomain so user can immediately use it for QR codes!
    if (user) {
      await prisma.customDomain.upsert({
        where: { domain: order.domainName },
        create: {
          domain: order.domainName,
          userId: user.id,
          status: 'verified',
          cnameTarget: 'cname.vercel-dns.com',
          verificationTxt: `dynamicqr-verified=${order.paystackRef}`,
        },
        update: {
          status: 'verified',
        },
      }).catch(() => {});
    }

    revalidatePath('/');
    return { success: true, order: updated, message: 'Domain and email forwarding activated successfully!' };
  } catch (err: any) {
    console.error('Provisioning caught error in confirmOrderPayment:', err);
    const updated = await prisma.domainOrder.update({
      where: { id: order.id },
      data: {
        status: 'PAID_AWAITING_FUNDS',
        errorMessage: err.message || 'Provisioning error',
      },
    });
    return { success: false, order: updated, message: err.message || 'Provisioning pending funds' };
  }
}

export async function linkDomainToQrWorkspace(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  if (order.userId && order.userId !== user.id) {
    return { success: false, message: 'Access denied' };
  }

  await prisma.customDomain.upsert({
    where: { domain: order.domainName },
    create: {
      domain: order.domainName,
      userId: user.id,
      status: 'verified',
      cnameTarget: 'cname.vercel-dns.com',
      verificationTxt: `dynamicqr-verified=${order.paystackRef}`,
    },
    update: {
      status: 'verified',
      userId: user.id,
    },
  });

  revalidatePath('/');
  return { success: true, message: `Domain ${order.domainName} linked to your QR Workspace!` };
}

export async function adminRetryDomainProvision(orderId: string) {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    return { success: false, message: 'Super admin authorization required.' };
  }

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  try {
    await prisma.domainOrder.update({
      where: { id: order.id },
      data: { status: 'PROVISIONING', errorMessage: null },
    });

    const { zoneId, nameservers } = await provisionDomainAndEmail(order);

    const updated = await prisma.domainOrder.update({
      where: { id: order.id },
      data: {
        status: 'ACTIVE',
        cloudflareZoneId: zoneId,
        nameservers,
        errorMessage: null,
      },
    });

    revalidatePath('/admin');
    return { success: true, order: updated, message: 'Provisioning succeeded!' };
  } catch (err: any) {
    await prisma.domainOrder.update({
      where: { id: order.id },
      data: {
        status: 'PAID_AWAITING_FUNDS',
        errorMessage: err.message || 'Retry failed',
      },
    });
    return { success: false, message: err.message || 'Retry failed' };
  }
}
