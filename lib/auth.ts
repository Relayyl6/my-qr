import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const COOKIE_NAME = 'qr_session';
const SECRET = process.env.AUTH_SECRET || 'dynamic-qr-micro-saas-secret-key-32-chars-minimum-prod';

function sign(value: string): string {
  const signature = crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
  return `${value}.${signature}`;
}

function verify(signedValue: string): string | null {
  const [value, signature] = signedValue.split('.');
  if (!value || !signature) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(value).digest('base64url');
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return value;
  }
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = cookies();
  const token = sign(userId);
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, tier: true, stripeCustomerId: true },
    });
    return user;
  } catch (error) {
    return null;
  }
}
