'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { AdminPromoConfig, DEFAULT_PROMO_CONFIG } from '@/lib/promo';

async function verifyAdmin() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    throw new Error('Unauthorized: Super-Admin sovereignty required.');
  }
  return user;
}

export interface SystemSovereigntyConfig {
  aiGatewayMode: 'neon' | 'openai' | 'gemini' | 'heuristic_offline';
  maintenanceMode: boolean;
  announcementBanner: string | null;
  globalScanLogging: boolean;
}

const DEFAULT_CONFIG: SystemSovereigntyConfig = {
  aiGatewayMode: 'neon',
  maintenanceMode: false,
  announcementBanner: null,
  globalScanLogging: true,
};

export async function adminGetSystemConfig(): Promise<SystemSovereigntyConfig> {
  await verifyAdmin();
  try {
    const record = await prisma.aiCache.findUnique({
      where: { key: 'system_sovereignty_config' },
    });
    if (record && record.value) {
      return { ...DEFAULT_CONFIG, ...(record.value as any) };
    }
  } catch (e) {
    console.warn('[adminGetSystemConfig] Failed to read config:', e);
  }
  return DEFAULT_CONFIG;
}

export async function adminSaveSystemConfig(config: Partial<SystemSovereigntyConfig>) {
  const admin = await verifyAdmin();
  const current = await adminGetSystemConfig();
  const updated: SystemSovereigntyConfig = { ...current, ...config };

  await prisma.aiCache.upsert({
    where: { key: 'system_sovereignty_config' },
    create: {
      key: 'system_sovereignty_config',
      value: updated as any,
      expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000), // 10 years
    },
    update: {
      value: updated as any,
      expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
    },
  });

  await logAdminAction(admin.email, 'Updated System Sovereignty Configuration', JSON.stringify(config));
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/pricing');
  return { success: true, config: updated };
}

export async function adminUpdateUserTier(userId: string, newTier: string) {
  const admin = await verifyAdmin();
  const validTiers = ['free', 'pro', 'plus', 'ultra', 'enterprise'];
  if (!validTiers.includes(newTier.toLowerCase())) {
    throw new Error('Invalid tier specified.');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { tier: newTier.toLowerCase() },
  });

  await logAdminAction(admin.email, `Elevated user ${updatedUser.email} to tier: ${newTier.toUpperCase()}`);
  revalidatePath('/admin');
  return { success: true };
}

export async function adminSetUserAiLimit(userId: string, monthlyLimitUsd: number) {
  const admin = await verifyAdmin();

  await prisma.aiCredit.upsert({
    where: { userId },
    create: {
      userId,
      monthlyLimitUsd,
      usedThisMonth: 0,
      resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    },
    update: {
      monthlyLimitUsd,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  await logAdminAction(admin.email, `Set monthly AI compute limit for ${user?.email} to $${monthlyLimitUsd}`);
  revalidatePath('/admin');
  return { success: true };
}

export async function adminResetAiCredit(userId: string) {
  const admin = await verifyAdmin();

  await prisma.aiCredit.upsert({
    where: { userId },
    update: { usedThisMonth: 0 },
    create: {
      userId,
      usedThisMonth: 0,
      monthlyLimitUsd: 5.0,
      resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  await logAdminAction(admin.email, `Reset monthly AI credit consumption to $0 for ${user?.email}`);
  revalidatePath('/admin');
  return { success: true };
}

export async function adminForceVerifyDomain(domainId: string) {
  const admin = await verifyAdmin();

  const domain = await prisma.customDomain.update({
    where: { id: domainId },
    data: { status: 'verified' },
    include: { user: { select: { email: true } } },
  });

  await logAdminAction(admin.email, `Force-Verified custom domain: ${domain.domain} for ${domain.user.email}`);
  revalidatePath('/admin');
  return { success: true, domain: domain.domain };
}

export async function adminInspectUserLinks(userId: string) {
  await verifyAdmin();

  const links = await prisma.qrLink.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      shortCode: true,
      destinationUrl: true,
      label: true,
      type: true,
      scanCount: true,
      lastScannedAt: true,
      createdAt: true,
      isArchived: true,
    },
  });

  return links;
}

export async function adminGetAuditLogs(): Promise<Array<{ adminEmail: string; action: string; details?: string; timestamp: string }>> {
  await verifyAdmin();
  try {
    const record = await prisma.aiCache.findUnique({
      where: { key: 'admin_audit_trail_log' },
    });
    if (record && record.value && Array.isArray(record.value)) {
      return record.value as any;
    }
  } catch (e) {}
  return [];
}

async function logAdminAction(adminEmail: string, action: string, details?: string) {
  try {
    const existing = await prisma.aiCache.findUnique({
      where: { key: 'admin_audit_trail_log' },
    });
    const logs: any[] = existing && Array.isArray(existing.value) ? existing.value : [];
    logs.unshift({
      adminEmail,
      action,
      details,
      timestamp: new Date().toISOString(),
    });
    const trimmed = logs.slice(0, 50); // Keep last 50 actions

    await prisma.aiCache.upsert({
      where: { key: 'admin_audit_trail_log' },
      create: {
        key: 'admin_audit_trail_log',
        value: trimmed as any,
        expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
      },
      update: {
        value: trimmed as any,
        expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
      },
    });
  } catch (e) {
    console.warn('[logAdminAction] Failed to log audit:', e);
  }
}

export async function adminGetTelemetryAction(timeframe: '24h' | '7d' | '30d' | 'all' = '7d') {
  await verifyAdmin();
  const { getAdminTelemetry } = await import('@/lib/analytics/adminTelemetry');
  return getAdminTelemetry(timeframe);
}

export async function adminDeactivateUserAccount(targetUserId: string) {
  const admin = await verifyAdmin();
  if (admin.id === targetUserId) {
    throw new Error('Cannot deactivate your own Super-Admin account.');
  }

  const { deactivateAccountPreservingMetrics } = await import('@/lib/user/deleteAccount');
  const result = await deactivateAccountPreservingMetrics(targetUserId);

  await logAdminAction(
    admin.email,
    `Deactivated user account for ${result.deletedEmail}`,
    `Soft deactivation: decoupled ${result.linksAnonymized} links (userId: null) and preserved platform telemetry`
  );

  revalidatePath('/admin');
  return { success: true, ...result };
}

export async function adminReactivateUserAccount(targetUserId: string) {
  const admin = await verifyAdmin();
  const { reactivateAccount } = await import('@/lib/user/deleteAccount');
  const result = await reactivateAccount(targetUserId);

  await logAdminAction(
    admin.email,
    `Reactivated user account for ${result.reactivatedEmail}`,
    `Restored active status and re-attached ${result.linksRestored} QR destinations`
  );

  revalidatePath('/admin');
  return { success: true, ...result };
}

export async function adminPurgeUserAccount(targetUserId: string) {
  const admin = await verifyAdmin();
  if (admin.id === targetUserId) {
    throw new Error('Cannot purge your own Super-Admin account.');
  }

  const { wipeUserAccountCompletely } = await import('@/lib/user/deleteAccount');
  const result = await wipeUserAccountCompletely(targetUserId);

  await logAdminAction(
    admin.email,
    `Completely wiped user account and all data for ${result.deletedEmail}`,
    `Hard wipe: permanently deleted ${result.linksWiped} links and ${result.scansWiped} scans`
  );

  revalidatePath('/admin');
  return { success: true, ...result };
}

export async function adminGetPromoConfig(): Promise<AdminPromoConfig> {
  try {
    const record = await prisma.aiCache.findUnique({
      where: { key: 'platform_promo_config' },
    });
    if (record && record.value) {
      return {
        banner: { ...DEFAULT_PROMO_CONFIG.banner, ...(record.value as any).banner },
        modal: { ...DEFAULT_PROMO_CONFIG.modal, ...(record.value as any).modal },
      };
    }
  } catch (e) {
    console.warn('[adminGetPromoConfig] Failed to read promo config:', e);
  }
  return DEFAULT_PROMO_CONFIG;
}

export async function adminSavePromoConfig(config: Partial<AdminPromoConfig>) {
  const admin = await verifyAdmin();
  const current = await adminGetPromoConfig();
  const updated: AdminPromoConfig = {
    banner: { ...current.banner, ...(config.banner || {}) },
    modal: { ...current.modal, ...(config.modal || {}) },
  };

  await prisma.aiCache.upsert({
    where: { key: 'platform_promo_config' },
    create: {
      key: 'platform_promo_config',
      value: updated as any,
      expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
    },
    update: {
      value: updated as any,
      expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
    },
  });

  await logAdminAction(admin.email, 'Updated Platform Promo & Banner Configuration');
  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/pricing');
  return { success: true, config: updated };
}

export async function adminGetPromoCodes() {
  await verifyAdmin();
  // Ensure default BLACKFRIDAY40 code exists
  const existingBf = await prisma.promoCode.findUnique({
    where: { code: 'BLACKFRIDAY40' },
  });
  if (!existingBf) {
    await prisma.promoCode.create({
      data: {
        code: 'BLACKFRIDAY40',
        type: 'percent',
        value: 40.0,
        appliesTo: 'all',
        billingPeriod: 'both',
        active: true,
      },
    });
  }

  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return codes.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    appliesTo: c.appliesTo,
    billingPeriod: c.billingPeriod,
    maxRedemptions: c.maxRedemptions,
    redemptionsCount: c.redemptionsCount,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function adminCreatePromoCode(payload: {
  code: string;
  type?: string;
  value: number;
  appliesTo?: string;
  billingPeriod?: string;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
}) {
  const admin = await verifyAdmin();
  const cleanCode = (payload.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (!cleanCode) throw new Error('Valid promo code string is required.');
  if (isNaN(payload.value) || payload.value <= 0) throw new Error('Discount value must be greater than 0.');

  const existing = await prisma.promoCode.findUnique({ where: { code: cleanCode } });
  if (existing) throw new Error(`Promo code "${cleanCode}" already exists.`);

  const created = await prisma.promoCode.create({
    data: {
      code: cleanCode,
      type: payload.type || 'percent',
      value: payload.value,
      appliesTo: payload.appliesTo || 'all',
      billingPeriod: payload.billingPeriod || 'both',
      maxRedemptions: payload.maxRedemptions ? Number(payload.maxRedemptions) : null,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      active: true,
    },
  });

  await logAdminAction(admin.email, `Created promo code: ${cleanCode} (${payload.value}% / $)`);
  revalidatePath('/admin');
  return { success: true, promoCode: created };
}

export async function adminTogglePromoCode(id: string, active: boolean) {
  const admin = await verifyAdmin();
  const updated = await prisma.promoCode.update({
    where: { id },
    data: { active },
  });

  await logAdminAction(admin.email, `Toggled promo code ${updated.code} active: ${active}`);
  revalidatePath('/admin');
  return { success: true, updated };
}

export async function adminDeletePromoCode(id: string) {
  const admin = await verifyAdmin();
  const deleted = await prisma.promoCode.delete({
    where: { id },
  });

  await logAdminAction(admin.email, `Deleted promo code: ${deleted.code}`);
  revalidatePath('/admin');
  return { success: true };
}
