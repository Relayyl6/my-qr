'use server';

import { z } from 'zod';
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
      },
    });

    // Send welcome onboarding email asynchronously via Nodemailer
    sendEmail({
      to: email,
      subject: '🚀 Welcome to DynamicQR - One code, printed once',
      html: buildWelcomeEmailHtml({
        email,
        name: user.name,
      }),
    }).catch((err) => console.error('[Welcome Email Error]:', err));

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
