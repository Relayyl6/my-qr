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
 * - Decouples user QR links: sets `userId: null`, tags `deactivatedUserId: user.id`
 * - Saves `originalLabel` so it can be cleanly restored upon reactivation
 * - Archives links (`isArchived: true`) so scans route gracefully to `/inactive`
 * - Decouples AI invocations (`userId: null`)
 * - PRESERVES all historical Scan telemetry and platform edge health benchmarks
 * - Marks `User.isDeactivated = true` with `deactivatedAt = now()`
 * - Cancels active Stripe billing
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
    throw new Error('User account not found.');
  }

  // Cancel Stripe billing
  await cancelStripeSubscriptions(user.stripeCustomerId);

  // Find user links
  const userLinks = await prisma.qrLink.findMany({
    where: { userId },
    select: { id: true, label: true },
  });

  for (const l of userLinks) {
    await prisma.qrLink.update({
      where: { id: l.id },
      data: {
        userId: null,
        deactivatedUserId: userId,
        originalLabel: l.label,
        isArchived: true,
        label: '[Deactivated Account]',
      },
    });
  }

  // Delete custom domains and AI credit consumption balance
  await prisma.customDomain.deleteMany({ where: { userId } });
  await prisma.aiCredit.deleteMany({ where: { userId } });

  // Decouple AI invocations (userId: null)
  await prisma.aiInvocation.updateMany({
    where: { userId },
    data: { userId: null },
  });

  // Mark user as deactivated (retains user account for self-service or admin reactivation)
  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeactivated: true,
      deactivatedAt: new Date(),
    },
  });

  return {
    deletedEmail: user.email,
    linksAnonymized: userLinks.length,
  };
}

/**
 * Backward compatibility alias
 */
export const purgeUserDataPreservingMetrics = deactivateAccountPreservingMetrics;

/**
 * 2. REACTIVATE ACCOUNT:
 * - Restores `User.isDeactivated = false` and clears `deactivatedAt`
 * - Restores all QR links tagged with `deactivatedUserId == userId`:
 *   - Re-attaches `userId = userId`
 *   - Clears `deactivatedUserId = null`
 *   - Unarchives `isArchived = false` (links immediately resume active traffic!)
 *   - Restores original label from `originalLabel`
 * - Re-initializes baseline AI credit allowance
 */
export async function reactivateAccount(userId: string): Promise<{
  reactivatedEmail: string;
  linksRestored: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, tier: true, isDeactivated: true },
  });

  if (!user) {
    throw new Error('User account not found.');
  }

  // Find all links decoupled during deactivation
  const deactivatedLinks = await prisma.qrLink.findMany({
    where: { deactivatedUserId: userId },
    select: { id: true, originalLabel: true, label: true },
  });

  for (const l of deactivatedLinks) {
    await prisma.qrLink.update({
      where: { id: l.id },
      data: {
        userId,
        deactivatedUserId: null,
        isArchived: false,
        label: l.originalLabel || (l.label === '[Deactivated Account]' ? 'Restored QR Link' : l.label),
        originalLabel: null,
      },
    });
  }

  // Restore User active state
  await prisma.user.update({
    where: { id: userId },
    data: {
      isDeactivated: false,
      deactivatedAt: null,
    },
  });

  // Re-create baseline AI credit if missing
  const existingCredit = await prisma.aiCredit.findUnique({ where: { userId } });
  if (!existingCredit) {
    const defaultLimits: Record<string, number> = {
      free: 0.5,
      pro: 5.0,
      plus: 15.0,
      ultra: 50.0,
    };
    const monthlyLimitUsd = defaultLimits[user.tier] || 0.5;
    await prisma.aiCredit.create({
      data: {
        userId,
        monthlyLimitUsd,
        usedThisMonth: 0,
        resetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      },
    });
  }

  return {
    reactivatedEmail: user.email,
    linksRestored: deactivatedLinks.length,
  };
}

/**
 * 3. DELETE ACCOUNT & WIPE EVERYTHING (Nuclear Deletion):
 * - Permanently wipes EVERY SINGLE THING associated with the user:
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

  // Find all QR links owned or deactivated by this user
  const userLinks = await prisma.qrLink.findMany({
    where: {
      OR: [{ userId }, { deactivatedUserId: userId }],
    },
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
