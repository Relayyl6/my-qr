'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { provisionDomainAndEmail } from '@/lib/domains/provisioning';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import {
  getDomainPricingConfig,
  saveDomainPricingConfig,
  fetchLiveUsdToNgnRate,
  scaleBufferedRate,
  DomainPricingConfig,
} from '@/lib/domains/fxEngine';

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

// -------------------------------------------------------------
// FX EXCHANGE RATE & DOMAIN PRICING SOVEREIGNTY (ADMIN)
// -------------------------------------------------------------

export async function adminGetPricingConfig(): Promise<DomainPricingConfig> {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    throw new Error('Unauthorized');
  }
  return await getDomainPricingConfig();
}

export async function adminSavePricingConfig(updates: Partial<DomainPricingConfig>) {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    return { success: false, message: 'Super admin authorization required.' };
  }

  const saved = await saveDomainPricingConfig(updates);
  revalidatePath('/admin');
  revalidatePath('/?section=namelaunch');
  return { success: true, config: saved, message: 'Domain pricing configuration saved!' };
}

export async function adminRefreshLiveFx() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    return { success: false, message: 'Unauthorized' };
  }

  const { rate, source } = await fetchLiveUsdToNgnRate();
  const config = await getDomainPricingConfig();
  const buffered = scaleBufferedRate(rate, config.bufferPercent);

  const updated = await saveDomainPricingConfig({
    liveMarketRate: Number(rate.toFixed(2)),
    bufferedRate: buffered,
    source,
    lastFetchedAt: new Date().toISOString(),
  });

  revalidatePath('/admin');
  return { success: true, config: updated, message: `Live FX refreshed: ₦${rate.toFixed(2)} ($1) -> Scaled: ₦${buffered}` };
}

// -------------------------------------------------------------
// NAMECHEAP & GODADDY DOMAIN FLEET OPERABILITIES (USER & ADMIN)
// -------------------------------------------------------------

/**
 * Toggle WhoisGuard privacy, Transfer Lock, or Auto-Renew
 */
export async function updateDomainFleetSettings(
  orderId: string,
  settings: {
    whoisPrivacy?: boolean;
    transferLocked?: boolean;
    autoRenew?: boolean;
  }
) {
  const user = await getCurrentUser();
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!isOwner && !isAdmin) {
    return { success: false, message: 'Unauthorized' };
  }

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: {
      ...(typeof settings.whoisPrivacy === 'boolean' ? { whoisPrivacy: settings.whoisPrivacy } : {}),
      ...(typeof settings.transferLocked === 'boolean' ? { transferLocked: settings.transferLocked } : {}),
      ...(typeof settings.autoRenew === 'boolean' ? { autoRenew: settings.autoRenew } : {}),
    },
  });

  revalidatePath('/');
  return { success: true, order: updated, message: 'Domain security settings updated.' };
}

/**
 * URL / Web Forwarding (Forward domain.com to any external destination e.g. Instagram, WhatsApp, Shopify)
 */
export async function setDomainWebForwarding(
  orderId: string,
  targetUrl: string,
  redirectType: '301' | '302' | 'cloaked' = '301'
) {
  const user = await getCurrentUser();
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const cleanUrl = targetUrl.trim();

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: {
      urlRedirectUrl: cleanUrl || null,
      urlRedirectType: redirectType,
    },
  });

  revalidatePath('/');
  return {
    success: true,
    order: updated,
    message: cleanUrl ? `Web forwarding to ${cleanUrl} configured!` : 'Web forwarding disabled.',
  };
}

/**
 * Multi-Alias Custom Business Email Forwarding (e.g. info@, support@, sales@, billing@)
 */
export async function addDomainEmailAlias(
  orderId: string,
  aliasHandle: string,
  forwardToEmail: string
) {
  const user = await getCurrentUser();
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const cleanAlias = aliasHandle.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const cleanForward = forwardToEmail.trim().toLowerCase();

  if (!cleanAlias || !cleanForward.includes('@')) {
    return { success: false, message: 'Invalid alias handle or destination email' };
  }

  const existingAliases = Array.isArray(order.emailAliases) ? (order.emailAliases as any[]) : [];
  if (existingAliases.some((a) => a.alias === cleanAlias)) {
    return { success: false, message: `Alias ${cleanAlias}@${order.domainName} already exists.` };
  }

  const nextAliases = [...existingAliases, { alias: cleanAlias, forwardTo: cleanForward, enabled: true }];

  // If live Cloudflare Zone is active, create routing rule
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (cfToken && order.cloudflareZoneId) {
    try {
      await fetch(`https://api.cloudflare.com/client/v4/zones/${order.cloudflareZoneId}/email/routing/rules`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Forward ${cleanAlias}`,
          enabled: true,
          matchers: [{ type: 'literal', field: 'to', value: `${cleanAlias}@${order.domainName}` }],
          actions: [{ type: 'forward', value: [cleanForward] }],
        }),
      });
    } catch (e) {
      console.warn('Cloudflare email rule creation warning:', e);
    }
  }

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: { emailAliases: nextAliases },
  });

  revalidatePath('/');
  return { success: true, order: updated, message: `Email ${cleanAlias}@${order.domainName} created!` };
}

/**
 * Remove an email forwarding alias
 */
export async function removeDomainEmailAlias(orderId: string, aliasHandle: string) {
  const user = await getCurrentUser();
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const existingAliases = Array.isArray(order.emailAliases) ? (order.emailAliases as any[]) : [];
  const nextAliases = existingAliases.filter((a) => a.alias !== aliasHandle);

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: { emailAliases: nextAliases },
  });

  revalidatePath('/');
  return { success: true, order: updated, message: `Alias ${aliasHandle} removed.` };
}

/**
 * Generate EPP Domain Transfer Authorization Code (Namecheap/GoDaddy transfer standard)
 */
export async function requestDomainEppCode(orderId: string) {
  const user = await getCurrentUser();
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  let epp = order.eppCode;
  if (!epp) {
    epp = `EPP-${crypto.randomBytes(6).toString('hex').toUpperCase()}!${Math.floor(1000 + Math.random() * 9000)}`;
    await prisma.domainOrder.update({
      where: { id: orderId },
      data: { eppCode: epp },
    });
  }

  return { success: true, eppCode: epp, message: 'Authorization EPP code generated.' };
}

/**
 * Switch to Custom External Nameservers (AWS Route53, cPanel, Namecheap, Google Cloud DNS)
 */
export async function updateDomainCustomNameservers(orderId: string, nameservers: string[]) {
  const user = await getCurrentUser();
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const cleanNs = nameservers.map((ns) => ns.trim().toLowerCase()).filter(Boolean);

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: { customNameservers: cleanNs },
  });

  revalidatePath('/');
  return {
    success: true,
    order: updated,
    message: cleanNs.length > 0 ? 'Custom nameservers saved.' : 'Reverted to Cloudflare Managed DNS.',
  };
}
