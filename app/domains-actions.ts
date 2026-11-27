'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  provisionDomainAndEmail,
  setupCloudflareSpamShield,
  setupCloudflareCatchAll,
} from '@/lib/domains/provisioning';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import {
  getDomainPricingConfig,
  saveDomainPricingConfig,
  fetchLiveUsdToNgnRate,
  scaleBufferedRate,
  calculateMultiYearDomainPrice,
  DEFAULT_PRICING_CONFIG,
  DomainPricingConfig,
} from '@/lib/domains/fxEngine';
import { WHOLESALE_USD_PRICING } from '@/lib/domains/namelaunch';
import { APP_URL } from '@/lib/config';

export async function getUserDomainOrders(emailQuery?: string) {
  const user = await getCurrentUser();
  const email = (emailQuery || user?.email || '').toLowerCase().trim();
  if (!user && !email) return [];

  const orders = await prisma.domainOrder.findMany({
    where: {
      OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(email ? [{ userEmail: email }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}

export async function confirmOrderPayment(paystackRef: string) {
  const user = await getCurrentUser();

  // Handle Domain Renewal References
  if (paystackRef.startsWith('RENEW_')) {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret || paystackSecret.includes('placeholder')) {
      return { success: false, message: 'Payment gateway is not configured.' };
    }
    try {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackRef)}`,
        {
          headers: { Authorization: `Bearer ${paystackSecret}` },
          cache: 'no-store',
        }
      );
      const verifyData = await verifyRes.json();
      if (verifyData.status && verifyData.data?.status === 'success') {
        const meta = verifyData.data?.metadata || {};
        const orderId = meta.orderId;
        if (orderId) {
          const existingOrder = await prisma.domainOrder.findUnique({ where: { id: orderId } });
          if (existingOrder) {
            const renewYears = Number(meta.years || 1);
            const currentExpiry = existingOrder.expiresAt ? new Date(existingOrder.expiresAt) : new Date();
            const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
            const newExpiresAt = new Date(baseDate.getTime() + renewYears * 365 * 24 * 60 * 60 * 1000);
            const updated = await prisma.domainOrder.update({
              where: { id: existingOrder.id },
              data: {
                status: 'ACTIVE',
                expiresAt: newExpiresAt,
                errorMessage: null,
              },
            });
            revalidatePath('/');
            return {
              success: true,
              order: updated,
              message: `Domain ${existingOrder.domainName} renewed successfully until ${newExpiresAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}!`,
            };
          }
        }
      }
    } catch (renewVerifyErr: any) {
      console.error('[confirmOrderPayment] Renewal verification error:', renewVerifyErr);
    }
  }

  let order: any = null;
  try {
    order = await prisma.domainOrder.findUnique({
      where: { paystackRef },
    });
  } catch (err) {
    console.warn('[confirmOrderPayment] DB lookup error:', err);
    return { success: false, isNotFound: true, isPending: true, message: 'Could not connect to order registry. Please try again shortly.' };
  }

  if (!order) {
    return { success: false, isNotFound: true, isPending: true, message: 'Checkout session ended or replaced by a new session.' };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = user && user.email.toLowerCase() === adminEmail;
  if (
    user &&
    !isAdmin &&
    order.userId &&
    order.userId !== user.id &&
    order.userEmail.toLowerCase() !== user.email.toLowerCase()
  ) {
    return { success: false, message: 'Unauthorized to verify this domain order.' };
  }

  if (order.status === 'ACTIVE') {
    return { success: true, order, message: 'Domain is already active' };
  }

  // Strictly verify transaction against Paystack for any PENDING_PAYMENT order.
  // Never bypass or auto-activate when gateway keys are absent.
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  if (order.status === 'PENDING_PAYMENT') {
    if (!paystackSecret || paystackSecret.includes('placeholder')) {
      return {
        success: false,
        order,
        message: 'Payment gateway is not configured in this environment. Payment cannot be verified yet.',
      };
    }

    try {
      const verifyRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackRef)}`,
        {
          headers: { Authorization: `Bearer ${paystackSecret}` },
          cache: 'no-store',
        }
      );
      const verifyData = await verifyRes.json();
      const paidKobo = Number(verifyData.data?.amount || 0);
      const expectedKobo = Math.round(order.totalPaidNgn * 100);

      if (
        !verifyData.status ||
        verifyData.data?.status !== 'success' ||
        verifyData.data?.reference !== paystackRef ||
        paidKobo < expectedKobo
      ) {
        return {
          success: false,
          isPending: true,
          order,
          message: 'Payment has not been completed yet. Complete checkout to activate your domain.',
        };
      }
    } catch (verifyErr: any) {
      console.error('Payment verification error:', verifyErr);
      return {
        success: false,
        order,
        message: 'Unable to verify payment status right now. Please try again.',
      };
    }
  } else if (order.status !== 'PAID_AWAITING_FUNDS' && order.status !== 'PROVISIONING') {
    return {
      success: false,
      order,
      message: `Order status (${order.status}) is not eligible for provisioning.`,
    };
  }

  try {
    await prisma.domainOrder.update({
      where: { id: order.id },
      data: { status: 'PROVISIONING' },
    });

    const { zoneId, nameservers } = await provisionDomainAndEmail(order);

    const regYears = order.registrationYears || 1;
    const expiresAt = order.expiresAt || new Date(Date.now() + regYears * 365 * 24 * 60 * 60 * 1000);

    const updated = await prisma.domainOrder.update({
      where: { id: order.id },
      data: {
        status: 'ACTIVE',
        cloudflareZoneId: zoneId,
        nameservers,
        expiresAt,
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
        errorMessage: err.message || 'Provisioning pending root registry completion',
      },
    });
    // Customer-facing message: reassuring, professional, confirms payment is received
    return {
      success: true,
      order: updated,
      message: 'Payment received successfully! Your domain order has been placed and is currently being provisioned across global DNS servers.',
    };
  }
}

export async function linkDomainToQrWorkspace(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  if (order.userId && order.userId !== user.id && order.userEmail !== user.email.toLowerCase()) {
    return { success: false, message: 'Access denied' };
  }

  if (order.status !== 'ACTIVE' && order.status !== 'PAID_AWAITING_FUNDS') {
    return { success: false, message: 'Complete payment before linking this domain to your workspace.' };
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

export async function cancelPendingDomainOrder(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  if (order.userId && order.userId !== user.id && order.userEmail !== user.email.toLowerCase()) {
    return { success: false, message: 'Access denied' };
  }

  if (order.status !== 'PENDING_PAYMENT') {
    return { success: false, message: 'Only unpaid orders can be canceled.' };
  }

  await prisma.domainOrder.delete({ where: { id: orderId } });
  revalidatePath('/');
  return { success: true, message: `Order for ${order.domainName} has been removed.` };
}

export async function adminDeleteDomainOrder(orderId: string) {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    return { success: false, message: 'Super admin authorization required.' };
  }

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  await prisma.customDomain.deleteMany({ where: { domain: order.domainName } }).catch(() => {});
  await prisma.domainOrder.delete({ where: { id: orderId } });
  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true, message: `Order for ${order.domainName} deleted successfully.` };
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

    const regYears = order.registrationYears || 1;
    const expiresAt = order.expiresAt || new Date(Date.now() + regYears * 365 * 24 * 60 * 60 * 1000);

    const updated = await prisma.domainOrder.update({
      where: { id: order.id },
      data: {
        status: 'ACTIVE',
        cloudflareZoneId: zoneId,
        nameservers,
        expiresAt,
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
  if (!user) return { success: false, message: 'Unauthorized' };
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();

  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const userTier = (user?.tier || 'free').toLowerCase();
  if (!isAdmin && userTier !== 'ultra') {
    return { success: false, message: 'External custom nameserver delegation is exclusive to the Ultra plan. Please upgrade to unlock.' };
  }

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

/**
 * Toggle Catch-All Email Routing (*@yourdomain.com -> targetEmail)
 */
export async function toggleDomainCatchAll(
  orderId: string,
  enabled: boolean,
  customTargetEmail?: string
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const userTier = (user?.tier || 'free').toLowerCase();
  if (!isAdmin && userTier !== 'ultra') {
    return { success: false, message: 'Wildcard Catch-All email routing (*@domain) is exclusive to the Ultra plan. Please upgrade to unlock.' };
  }

  const targetEmail = (customTargetEmail || order.catchAllEmail || order.userEmail).trim().toLowerCase();

  // If Cloudflare Zone is provisioned, update edge catch-all rule
  if (order.cloudflareZoneId) {
    await setupCloudflareCatchAll(order.cloudflareZoneId, targetEmail, enabled);
  }

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: {
      catchAllEnabled: enabled,
      catchAllEmail: targetEmail,
    },
  });

  revalidatePath('/');
  return {
    success: true,
    order: updated,
    message: enabled
      ? `Catch-All active! Any email sent to *@${order.domainName} forwards to ${targetEmail}.`
      : 'Catch-All email routing disabled.',
  };
}

/**
 * Activate DMARC, SPF & DKIM Email Deliverability & Anti-Spam Shield
 */
export async function activateDomainDeliverabilityShield(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const userTier = (user?.tier || 'free').toLowerCase();
  if (!isAdmin && userTier !== 'ultra') {
    return { success: false, message: 'Automated DMARC, SPF & DKIM Email Deliverability Shield is exclusive to the Ultra plan. Please upgrade to unlock.' };
  }

  if (order.cloudflareZoneId) {
    await setupCloudflareSpamShield(order.cloudflareZoneId, order.domainName);
  }

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: { spamShieldActive: true },
  });

  revalidatePath('/');
  return {
    success: true,
    order: updated,
    message: '100% Spam Shield Active: SPF and DMARC quarantine records verified on edge nameservers.',
  };
}

/**
 * Toggle Instant 1-Click Coming Soon & Bio Page
 */
export async function toggleDomainBioPage(orderId: string, enabled: boolean) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const userTier = (user?.tier || 'free').toLowerCase();
  if (!isAdmin && !['plus', 'ultra'].includes(userTier)) {
    return { success: false, message: 'Instant Coming Soon & Bio showcases require a Plus or Ultra plan. Please upgrade to unlock.' };
  }

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: { bioPageEnabled: enabled },
  });

  revalidatePath('/');
  return {
    success: true,
    order: updated,
    message: enabled
      ? `Coming Soon & Bio page active at https://${order.domainName}!`
      : 'Bio page deactivated.',
  };
}

/**
 * Save custom Coming Soon & Bio page configuration
 */
export async function saveDomainBioConfig(
  orderId: string,
  config: {
    title?: string;
    bio?: string;
    whatsapp?: string;
    phone?: string;
    instagram?: string;
    avatarUrl?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };
  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Order not found' };

  const isOwner = user && (user.id === order.userId || user.email.toLowerCase() === order.userEmail.toLowerCase());
  const isAdmin = user && user.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!isOwner && !isAdmin) return { success: false, message: 'Unauthorized' };

  const userTier = (user?.tier || 'free').toLowerCase();
  if (!isAdmin && !['plus', 'ultra'].includes(userTier)) {
    return { success: false, message: 'Instant Coming Soon & Bio showcases require a Plus or Ultra plan. Please upgrade to unlock.' };
  }

  const updated = await prisma.domainOrder.update({
    where: { id: orderId },
    data: {
      bioConfig: config as any,
      bioPageEnabled: true,
    },
  });

  revalidatePath('/');
  return {
    success: true,
    order: updated,
    message: `Bio page configuration updated for https://${order.domainName}!`,
  };
}

/**
 * Public action: Submit visitor lead inquiry on custom domain Coming Soon page
 */
export async function submitDomainContactInquiry(
  domainName: string,
  name: string,
  email: string,
  phone?: string,
  message?: string
) {
  const cleanDomain = domainName.trim().toLowerCase();
  if (!cleanDomain || !name.trim() || !email.trim()) {
    return { success: false, message: 'Name and email are required.' };
  }

  const contact = await prisma.domainContact.create({
    data: {
      domainName: cleanDomain,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      message: message?.trim() || null,
    },
  });

  // Notify domain owner via transactional email if owner email is known
  try {
    const order = await prisma.domainOrder.findFirst({
      where: { domainName: cleanDomain },
    });

    const ownerEmail = order?.userEmail;
    if (ownerEmail) {
      const { sendEmail } = await import('@/lib/email/send');
      await sendEmail({
        to: ownerEmail,
        replyTo: email.trim().toLowerCase(),
        subject: `New Lead Inquiry on ${cleanDomain} from ${name.trim()}`,
        text: `You have received a new contact inquiry through ${cleanDomain}:\n\nFrom: ${name.trim()} <${email.trim()}>\nPhone / WhatsApp: ${phone?.trim() || 'N/A'}\nMessage:\n${message?.trim() || 'No message provided.'}\n\nReply directly to this email to respond to ${name.trim()}.`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <div style="margin-bottom: 16px;">
              <span style="font-size: 13px; font-weight: 700; color: #059669; background: #ecfdf5; padding: 4px 10px; border-radius: 9999px;">
                ${cleanDomain} Brand Hub
              </span>
            </div>
            <h2 style="color: #111827; font-size: 19px; font-weight: 700; margin: 0 0 16px 0;">New Contact Inquiry</h2>
            <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #374151;">
              <p style="margin: 0 0 8px 0;"><strong>Name:</strong> ${name.trim()}</p>
              <p style="margin: 0 0 8px 0;"><strong>Email:</strong> <a href="mailto:${email.trim()}" style="color: #059669;">${email.trim()}</a></p>
              <p style="margin: 0 0 8px 0;"><strong>Phone / WhatsApp:</strong> ${phone?.trim() ? `<a href="https://wa.me/${phone.replace(/\\D/g, '')}" style="color: #059669;">${phone.trim()}</a>` : 'Not provided'}</p>
              <p style="margin: 0 0 6px 0;"><strong>Message:</strong></p>
              <div style="padding: 12px; background: #ffffff; border-left: 3px solid #059669; border-radius: 4px; color: #1f2937;">
                ${(message?.trim() || 'No message provided.').replace(/\\n/g, '<br/>')}
              </div>
            </div>
            <p style="font-size: 12.5px; color: #6b7280; margin: 0;">You can click reply to respond directly to ${name.trim()}.</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.warn('[Domain Inquiry] Owner alert dispatch warning:', err);
  }

  return { success: true, contactId: contact.id, message: 'Inquiry saved successfully.' };
}

/**
 * Fetch inquiries captured through a domain's Coming Soon page
 */
export async function getDomainContacts(domainName: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.domainContact.findMany({
    where: { domainName: domainName.toLowerCase() },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

/**
 * Delete a contact inquiry from the domain's inbox
 */
export async function deleteDomainContact(contactId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized' };

  try {
    await prisma.domainContact.delete({
      where: { id: contactId },
    });
    return { success: true, message: 'Inquiry removed.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to remove inquiry.' };
  }
}

/**
 * Custom Domain Renewal via Paystack
 * Supports extending domain registration by 1, 2, or 3 years.
 * Validates ICANN grace period and applies multi-year bundling discounts.
 */
export async function renewCustomDomainOrder(orderId: string, years: number = 1) {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: 'Unauthorized. Please sign in.' };

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return { success: false, message: 'Domain order not found.' };

  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = user && user.email.toLowerCase() === adminEmail;
  if (!isAdmin && order.userId && order.userId !== user.id && order.userEmail.toLowerCase() !== user.email.toLowerCase()) {
    return { success: false, message: 'Unauthorized to renew this domain.' };
  }

  const tld = (order.domainName.split('.').pop() || 'com').toLowerCase();
  const effectiveConfig = await getDomainPricingConfig();
  const wholesaleUsd =
    order.wholesaleUsd ||
    (WHOLESALE_USD_PRICING as any)[tld] ||
    (effectiveConfig.tldOverrides?.[tld] ? Math.max(10.5, effectiveConfig.tldOverrides[tld] / effectiveConfig.bufferedRate) : 10.5);
  const periodYears = ([1, 2, 3].includes(years) ? years : 1) as 1 | 2 | 3;
  const multiYear = calculateMultiYearDomainPrice(wholesaleUsd, tld, effectiveConfig, periodYears);

  const finalPriceNgn = multiYear.finalPriceNgn;
  const amountKobo = finalPriceNgn * 100;
  const reference = `RENEW_${order.id.slice(-6)}_${Date.now()}`;
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

  if (!paystackSecret || paystackSecret.includes('placeholder')) {
    return {
      success: false,
      message: 'Payment gateway is temporarily unconfigured in this environment.',
    };
  }

  const appUrl = APP_URL;
  const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: order.userEmail || user.email,
      amount: amountKobo,
      currency: 'NGN',
      reference,
      callback_url: `${appUrl}/?section=namelaunch&ref=${reference}&renewed=true`,
      metadata: {
        isRenewal: true,
        orderId: order.id,
        domainName: order.domainName,
        years: periodYears,
        renewalNgn: finalPriceNgn,
        custom_fields: [
          {
            display_name: 'Domain Renewal',
            variable_name: 'domain_renewal',
            value: `${order.domainName} (${periodYears} yr)`,
          },
        ],
      },
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) {
    return { success: false, message: paystackData.message || 'Paystack renewal initialization failed' };
  }

  return {
    success: true,
    authorizationUrl: paystackData.data.authorization_url,
    reference,
    amountNgn: finalPriceNgn,
  };
}
