import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

/**
 * Helper to cancel Stripe subscription if user has an active billing relationship
 */
async function cancelStripeSubscriptions(stripeCustomerId?: string | null) {
  if (stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20' as any,
      });
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
      });
      for (const sub of subscriptions.data) {
        await stripe.subscriptions.cancel(sub.id);
      }
    } catch (e) {
      console.warn('[StripeCancel] Subscription cancellation skipped:', e);
    }
  }
}

/**
 * 1. DEACTIVATE ACCOUNT (Soft Deactivation / Anonymization):
 * - Decouples user QR links by setting `userId: null`
 * - Archives links with inactive fallback destination
 * - Decouples AI invocations (`userId: null`)
 * - Deletes user credentials & PII, custom domains, and AI credits
 * - PRESERVES Scan history and platform metrics for edge performance benchmarks
 */
export async function deactivateAccountPreservingMetrics(userId: string): Promise<{
  deletedEmail: string;
  linksAnonymized: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error('User account not found or already deactivated.');
  }

  // Cancel Stripe billing
  await cancelStripeSubscriptions(user.stripeCustomerId);

  // Find user links
  const userLinks = await prisma.qrLink.findMany({
    where: { userId },
    select: { id: true },
  });
  const linkIds = userLinks.map((l) => l.id);

  if (linkIds.length > 0) {
    // Purge user's custom artworks & landing pages
    await prisma.qrArtwork.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });
    await prisma.landingPage.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });
    await prisma.routingRule.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });

    // Decouple links: userId set to null, archived, metrics preserved
    await prisma.qrLink.updateMany({
      where: { id: { in: linkIds } },
      data: {
        userId: null,
        customDomainId: null,
        isArchived: true,
        label: '[Deactivated Account]',
        destinationUrl: 'https://my-qr-sandy.vercel.app/inactive',
      },
    });
  }

  // Delete domains and credits
  await prisma.customDomain.deleteMany({ where: { userId } });
  await prisma.aiCredit.deleteMany({ where: { userId } });

  // Decouple AI invocations (userId: null)
  await prisma.aiInvocation.updateMany({
    where: { userId },
    data: { userId: null },
  });

  // Delete user credentials
  await prisma.user.delete({ where: { id: userId } });

  return {
    deletedEmail: user.email,
    linksAnonymized: linkIds.length,
  };
}

/**
 * Backward compatibility alias for deactivateAccountPreservingMetrics
 */
export const purgeUserDataPreservingMetrics = deactivateAccountPreservingMetrics;

/**
 * 2. DELETE ACCOUNT & WIPE EVERYTHING (Nuclear Deletion):
 * - Literally wipes EVERY SINGLE THING associated with the user:
 * - Deletes ALL Scan records belonging to user's QR links
 * - Deletes ALL RoutingRules, QrArtworks, and LandingPages
 * - Deletes ALL QrLinks permanently (not kept as null!)
 * - Deletes ALL CustomDomains
 * - Deletes ALL AiCredits
 * - Deletes ALL AiInvocations created by this user
 * - Deletes the User record
 * - Cancels Stripe subscription
 * - Leaves ZERO trace of user, links, or scans in the database.
 */
export async function wipeUserAccountCompletely(userId: string): Promise<{
  deletedEmail: string;
  linksWiped: number;
  scansWiped: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, stripeCustomerId: true },
  });

  if (!user) {
    throw new Error('User account not found or already deleted.');
  }

  // Cancel Stripe billing
  await cancelStripeSubscriptions(user.stripeCustomerId);

  // Find all QR links owned by this user
  const userLinks = await prisma.qrLink.findMany({
    where: { userId },
    select: { id: true },
  });
  const linkIds = userLinks.map((l) => l.id);

  let scansWiped = 0;

  if (linkIds.length > 0) {
    // 1. Wipe all Scan records for these links
    const scanDeleteResult = await prisma.scan.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });
    scansWiped = scanDeleteResult.count;

    // 2. Wipe all RoutingRules
    await prisma.routingRule.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });

    // 3. Wipe all QrArtworks
    await prisma.qrArtwork.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });

    // 4. Wipe all LandingPages
    await prisma.landingPage.deleteMany({
      where: { qrLinkId: { in: linkIds } },
    });

    // 5. Wipe all QrLinks completely (no NULLs left behind)
    await prisma.qrLink.deleteMany({
      where: { id: { in: linkIds } },
    });
  }

  // 6. Wipe all CustomDomains
  await prisma.customDomain.deleteMany({ where: { userId } });

  // 7. Wipe all AiCredits
  await prisma.aiCredit.deleteMany({ where: { userId } });

  // 8. Wipe all AiInvocations tied to this user
  await prisma.aiInvocation.deleteMany({ where: { userId } });

  // 9. Wipe the User record itself
  await prisma.user.delete({ where: { id: userId } });

  return {
    deletedEmail: user.email,
    linksWiped: linkIds.length,
    scansWiped,
  };
}
