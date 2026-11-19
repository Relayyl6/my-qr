import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

/**
 * Executes full GDPR/CCPA compliant data erasure for a user account:
 * - Purges personal identifiable information (PII): name, email, password, tokens
 * - Purges custom domain bindings, landing pages, QR artworks, and conditional rules
 * - Anonymizes and decouples QR links (sets userId: null, archives with inactive destination)
 * - Retains aggregated anonymous metrics (historical scan telemetry, hourly distribution, compute latency)
 */
export async function purgeUserDataPreservingMetrics(userId: string): Promise<{ deletedEmail: string; linksAnonymized: number }> {
  // 1. Fetch user to verify existence
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error('User account not found or already deleted.');
  }

  // 2. Cancel active Stripe subscriptions if any
  if (user.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20' as any,
      });
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
      });
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    } catch (e) {
      console.warn('[PurgeUser] Stripe subscription cancellation skipped:', e);
    }
  }

  // 3. Find and sanitize all QR links owned by user
  const userLinks = await prisma.qrLink.findMany({
    where: { userId },
    select: { id: true },
  });
  const linkIds = userLinks.map((l) => l.id);

  if (linkIds.length > 0) {
    // Purge user's custom artworks (prompts, images)
    await prisma.qrArtwork.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });

    // Purge custom landing pages
    await prisma.landingPage.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });

    // Purge custom routing rules
    await prisma.routingRule.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });

    // Detach links from user and custom domains, archive safely
    // Historical Scan records referencing qrLinkId remain preserved for platform metrics!
    await prisma.qrLink.updateMany({
      where: { id: { in: linkIds } },
      data: {
        userId: null,
        customDomainId: null,
        isArchived: true,
        label: '[Anonymized - Account Erased]',
        destinationUrl: 'https://my-qr-sandy.vercel.app/inactive',
      },
    });
  }

  // 4. Delete user's custom domains
  await prisma.customDomain.deleteMany({
    where: { userId },
  });

  // 5. Delete user's AI credits
  await prisma.aiCredit.deleteMany({
    where: { userId },
  });

  // 6. Decouple AI invocation compute records (preserves global latency & token metrics)
  await prisma.aiInvocation.updateMany({
    where: { userId },
    data: { userId: null },
  });

  // 7. Delete the user row permanently
  await prisma.user.delete({
    where: { id: userId },
  });

  return {
    deletedEmail: user.email,
    linksAnonymized: linkIds.length,
  };
}
