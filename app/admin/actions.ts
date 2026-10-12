'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

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
