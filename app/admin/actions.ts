'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    throw new Error('Unauthorized: Admin access required.');
  }
  return user;
}

export async function adminUpdateUserTier(userId: string, newTier: string) {
  await verifyAdmin();
  const validTiers = ['free', 'pro', 'plus', 'ultra'];
  if (!validTiers.includes(newTier.toLowerCase())) {
    throw new Error('Invalid tier specified.');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { tier: newTier.toLowerCase() },
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function adminResetAiCredit(userId: string) {
  await verifyAdmin();

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

  revalidatePath('/admin');
  return { success: true };
}
