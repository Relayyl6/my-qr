'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeUrl } from '@/lib/normalizeUrl';
import { getCurrentUser } from '@/lib/auth';

// Prevent overriding application routes
const reservedCodes = ['api', 'id', 'admin', '_next', 'favicon.ico', 'login', 'signup', 'inactive'];

// Zod schemas for validation
const linkSchema = z.object({
  shortCode: z
    .string()
    .min(3, 'Must be at least 3 characters')
    .max(32, 'Must be at most 32 characters')
    .regex(/^[a-z0-9-_]+$/, 'Only lowercase letters, numbers, hyphens, and underscores allowed')
    .refine((val) => !reservedCodes.includes(val), 'This short code is reserved'),
  destinationUrl: z.string().min(1, 'Destination URL is required'),
  label: z.string().optional(),
});

export type ActionState = {
  success?: boolean;
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createLink(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: 'You must be signed in to create a link.' };
  }

  const validated = linkSchema.safeParse({
    shortCode: formData.get('shortCode'),
    destinationUrl: formData.get('destinationUrl'),
    label: formData.get('label'),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { shortCode, destinationUrl, label } = validated.data;

  try {
    const normalizedUrl = normalizeUrl(destinationUrl);
    // Check active link limit based on subscription tier
    const tier = (user.tier || 'free').toLowerCase();
    const linkLimits: Record<string, number> = {
      free: 5,
      pro: 50,
      plus: 500,
      ultra: 999999,
    };
    const maxAllowed = linkLimits[tier] ?? 5;
    const activeCount = await prisma.qrLink.count({
      where: { userId: user.id, isArchived: false },
    });

    if (activeCount >= maxAllowed) {
      return {
        message: `You have reached your limit of ${maxAllowed} active links on the ${(user.tier || 'Free').toUpperCase()} plan. Please upgrade to Pro or Plus to create more.`,
      };
    }

    const existing = await prisma.qrLink.findUnique({ where: { shortCode } });
    if (existing) {
      return { errors: { shortCode: ['This short code is already taken'] } };
    }

    await prisma.qrLink.create({
      data: {
        shortCode,
        destinationUrl: normalizedUrl,
        label: label || null,
        userId: user.id,
      },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { message: 'Database error: Failed to create link.' };
  }
}

export async function updateLink(id: string, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: 'You must be signed in to update links.' };
  }

  const destinationUrl = formData.get('destinationUrl') as string;
  if (!destinationUrl) return { message: 'URL is required' };

  try {
    const link = await prisma.qrLink.findUnique({ where: { id } });
    if (!link || (link.userId && link.userId !== user.id)) {
      return { message: 'Link not found or access denied.' };
    }

    await prisma.qrLink.update({
      where: { id },
      data: { destinationUrl: normalizeUrl(destinationUrl) },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { message: 'Database error: Failed to update link.' };
  }
}

export async function toggleArchiveLink(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: 'You must be signed in to archive links.' };
  }

  try {
    const link = await prisma.qrLink.findUnique({ where: { id } });
    if (!link || (link.userId && link.userId !== user.id)) {
      return { message: 'Link not found or access denied.' };
    }

    await prisma.qrLink.update({
      where: { id },
      data: { isArchived: !link.isArchived },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { message: 'Database error: Failed to toggle archive state.' };
  }
}

export async function deleteLink(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: 'You must be signed in to delete links.' };
  }

  try {
    const link = await prisma.qrLink.findUnique({ where: { id } });
    if (!link || (link.userId && link.userId !== user.id)) {
      return { message: 'Link not found or access denied.' };
    }

    await prisma.qrLink.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { message: 'Database error: Failed to delete link.' };
  }
}
