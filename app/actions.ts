'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeUrl } from '@/lib/normalizeUrl';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail, buildLimitWarningEmailHtml } from '@/lib/email/send';

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
  label: z.string().nullish(),
  customDomainId: z.string().nullish(),
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
    customDomainId: formData.get('customDomainId'),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { shortCode, destinationUrl, label, customDomainId } = validated.data;

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
    const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
    const isAdmin = user.email.toLowerCase() === adminEmail;

    if (!isAdmin) {
      const maxAllowed = linkLimits[tier] ?? 5;
      const activeCount = await prisma.qrLink.count({
        where: { userId: user.id, isArchived: false },
      });

      if (activeCount >= maxAllowed) {
        // Asynchronously notify user via Nodemailer
        if (user.email) {
          sendEmail({
            to: user.email,
            subject: `⚠️ Limit Reached: ${maxAllowed}/${maxAllowed} QR links used on DynamicQR`,
            html: buildLimitWarningEmailHtml({
              email: user.email,
              tier: user.tier || 'free',
              metricName: 'Active QR Links',
              used: activeCount,
              limit: maxAllowed,
              percentUsed: 100,
            }),
          }).catch((err) => console.error('[Limit Email Notification Error]:', err));
        }

        return {
          message: `You have reached your limit of ${maxAllowed} active links on the ${(user.tier || 'Free').toUpperCase()} plan. You can delete or archive previous unused links to free up slots immediately, or upgrade for higher limits.`,
        };
      }
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
        customDomainId: customDomainId && customDomainId !== 'default' ? customDomainId : null,
      },
    });

    // If approaching or at limit (>= 80%), dispatch a notification email
    if (!isAdmin && user.email) {
      const maxAllowed = linkLimits[tier] ?? 5;
      const newActiveCount = await prisma.qrLink.count({
        where: { userId: user.id, isArchived: false },
      });
      const percent = Math.round((newActiveCount / maxAllowed) * 100);
      if (percent >= 80) {
        sendEmail({
          to: user.email,
          subject: percent >= 100
            ? `⚠️ Limit Reached: ${newActiveCount}/${maxAllowed} QR links used on DynamicQR`
            : `⚠️ Plan Notice: You have used ${percent}% of your QR link capacity (${newActiveCount}/${maxAllowed})`,
          html: buildLimitWarningEmailHtml({
            email: user.email,
            tier: user.tier || 'free',
            metricName: 'Active QR Links',
            used: newActiveCount,
            limit: maxAllowed,
            percentUsed: percent,
          }),
        }).catch((err) => console.error('[Limit Email Notification Error]:', err));
      }
    }

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

export async function checkDestinationHealth(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    // 200-399 are live.
    // 403 / 429 from platforms like Google Scholar or Cloudflare indicate automated crawler blocks, but are live for real visitors
    const isBotProtected = res.status === 403 || res.status === 429;
    const ok = (res.status >= 200 && res.status < 400) || isBotProtected;

    return {
      ok,
      status: res.status,
      error: isBotProtected ? 'Bot Shield Active (Live for Visitors)' : undefined,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.name === 'AbortError' ? 'Timeout (6s)' : 'Host unreachable',
    };
  }
}

