'use server';

import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, createSession, destroySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { sendEmail, buildWelcomeEmailHtml } from '@/lib/email/send';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export type AuthState = {
  success?: boolean;
  errors?: {
    email?: string[];
    password?: string[];
    name?: string[];
  };
  message?: string;
};

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const name = (formData.get('name') as string)?.trim();

  const validated = authSchema.safeParse({ email, password, name });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { errors: { email: ['An account with this email already exists'] } };
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        tier: 'free',
      },
    });

    // Automatically enroll user in platform's own mailing list
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: {
        email,
        firstName: name || null,
        status: 'active',
        source: 'signup',
        token: crypto.randomBytes(24).toString('hex'),
        consentAt: new Date(),
        confirmedAt: new Date(),
      },
      update: {
        status: 'active',
        firstName: name || undefined,
        confirmedAt: new Date(),
      },
    }).catch((err) => console.error('[Platform Mailing List Auto-Enroll Error]:', err));

    // Send registration confirmation email once on signup
    sendEmail({
      to: email,
      subject: 'Welcome to DynamicQR — Your account is ready',
      html: buildWelcomeEmailHtml({
        email,
        name: user.name || undefined,
      }),
    }).catch((err) => console.error('[Registration Email Error]:', err));

    await createSession(user.id);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { message: 'Failed to create account. Please try again.' };
  }
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { message: 'Please enter both email and password.' };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'Invalid email or password.' };
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { message: 'Invalid email or password.' };
    }

    await createSession(user.id);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { message: 'Failed to sign in. Please try again.' };
  }
}

export async function signOut(): Promise<void> {
  await destroySession();
  revalidatePath('/');
}

export async function deactivateSelfAccount(confirmationText: string): Promise<{ success?: boolean; error?: string }> {
  if (confirmationText.trim().toUpperCase() !== 'DEACTIVATE') {
    return { error: 'Please type "DEACTIVATE" exactly to confirm account deactivation.' };
  }

  const { getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to deactivate your account.' };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (user.email.toLowerCase() === adminEmail) {
    return { error: 'Super-Admin account cannot be deactivated via self-service.' };
  }

  try {
    const { deactivateAccountPreservingMetrics } = await import('@/lib/user/deleteAccount');
    await deactivateAccountPreservingMetrics(user.id);
    await destroySession();
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('[deactivateSelfAccount Error]:', err);
    return { error: err.message || 'Failed to deactivate account. Please try again.' };
  }
}

export async function reactivateSelfAccount(): Promise<{ success?: boolean; error?: string }> {
  const { getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to reactivate your account.' };
  }

  try {
    const { reactivateAccount } = await import('@/lib/user/deleteAccount');
    await reactivateAccount(user.id);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('[reactivateSelfAccount Error]:', err);
    return { error: err.message || 'Failed to reactivate account.' };
  }
}

export async function reactivateAccountByCredentials(
  emailInput: string,
  passwordInput: string
): Promise<{ success?: boolean; error?: string }> {
  const email = emailInput?.trim().toLowerCase();
  if (!email || !passwordInput) {
    return { error: 'Please enter both email and password.' };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: 'Account not found with this email.' };
    }

    const isValid = await verifyPassword(passwordInput, user.password);
    if (!isValid) {
      return { error: 'Incorrect password.' };
    }

    if (!user.isDeactivated) {
      return { error: 'Account is already active.' };
    }

    const { reactivateAccount } = await import('@/lib/user/deleteAccount');
    await reactivateAccount(user.id);
    await createSession(user.id);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('[reactivateAccountByCredentials Error]:', err);
    return { error: err.message || 'Failed to reactivate account.' };
  }
}

export async function deleteSelfAccount(confirmationText: string): Promise<{ success?: boolean; error?: string }> {
  if (confirmationText.trim().toUpperCase() !== 'DELETE') {
    return { error: 'Please type "DELETE" exactly to confirm permanent account deletion.' };
  }

  const { getCurrentUser } = await import('@/lib/auth');
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to delete your account.' };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (user.email.toLowerCase() === adminEmail) {
    return { error: 'Super-Admin account cannot be deleted via self-service.' };
  }

  try {
    const { wipeUserAccountCompletely } = await import('@/lib/user/deleteAccount');
    await wipeUserAccountCompletely(user.id);
    await destroySession();
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('[deleteSelfAccount Error]:', err);
    return { error: err.message || 'Failed to delete account. Please try again.' };
  }
}

export async function updateUserProfileAvatar(avatarUrl: string): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    // Store in AiCache key-value store in Postgres (zero schema migration required)
    await prisma.aiCache.upsert({
      where: { key: `user_avatar_${user.id}` },
      create: {
        key: `user_avatar_${user.id}`,
        value: { avatarUrl },
        expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
      },
      update: {
        value: { avatarUrl },
      },
    });

    revalidatePath('/');
    return { success: true, avatarUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update avatar' };
  }
}

export async function getUserProfileAvatar(): Promise<string | null> {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return null;

    const record = await prisma.aiCache.findUnique({
      where: { key: `user_avatar_${user.id}` },
    });
    return (record?.value as any)?.avatarUrl || null;
  } catch {
    return null;
  }
}

export async function saveUserNotificationPrefs(prefs: { weeklyDigest: boolean }): Promise<{ success: boolean; error?: string }> {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    await prisma.aiCache.upsert({
      where: { key: `user_notif_${user.id}` },
      create: {
        key: `user_notif_${user.id}`,
        value: { weeklyDigest: prefs.weeklyDigest },
        expiresAt: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
      },
      update: {
        value: { weeklyDigest: prefs.weeklyDigest },
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save notification preferences' };
  }
}

export async function getUserNotificationPrefs(): Promise<{ weeklyDigest: boolean }> {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return { weeklyDigest: true };

    const record = await prisma.aiCache.findUnique({
      where: { key: `user_notif_${user.id}` },
    });
    if (!record || !record.value) return { weeklyDigest: true };
    return { weeklyDigest: (record.value as any)?.weeklyDigest !== false };
  } catch {
    return { weeklyDigest: true };
  }
}

export async function sendTestWeeklyDigestAction(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { aggregateUserScans } = await import('@/lib/analytics/aggregate');
    const { sendEmail, buildWeeklyDigestEmailHtml } = await import('@/lib/email/send');

    const stats = await aggregateUserScans(user.id, 7);
    const summary = stats.totalScans > 0
      ? `Your dynamic QR campaigns recorded ${stats.totalScans} verified scans across ${stats.totalLinks} links over the past 7 days.`
      : 'Your dynamic QR campaigns are live and ready. Share your QR codes on social media, posters, or packaging to start capturing verified scans.';

    const recommendations = [
      'Ensure high visual contrast on printed materials for fastest camera acquisition.',
      'Connect a custom branded domain in your workspace for 100% white-label vanity links.',
      'Review daily device analytics to optimize destination URLs for mobile vs desktop visitors.',
    ];

    const emailHtml = buildWeeklyDigestEmailHtml({
      email: user.email,
      totalScans: stats.totalScans,
      summary,
      recommendations,
    });

    const emailRes = await sendEmail({
      to: user.email,
      subject: `📈 [Test Digest] Your DynamicQR Weekly Report: ${stats.totalScans} scans this week`,
      html: emailHtml,
    });

    if (emailRes.success) {
      return { success: true, message: `Test weekly digest sent to ${user.email}!` };
    } else {
      return { success: false, error: 'Email service could not dispatch email. Please check SMTP configuration.' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to dispatch test digest' };
  }
}
