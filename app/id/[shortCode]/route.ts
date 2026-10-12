import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { evaluateRules, detectDevice } from '@/lib/routing/evaluate';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  const rawShortCode = params.shortCode;

  if (!rawShortCode) {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  // Sanitize and decode the incoming shortCode strictly
  const shortCode = decodeURIComponent(rawShortCode).toLowerCase().trim();

  // 1. Find link with its ordered conditional routing rules and landing page
  const link = await prisma.qrLink.findUnique({
    where: { shortCode },
    include: {
      routingRules: {
        orderBy: { priority: 'desc' },
      },
      landingPage: true,
      customDomain: true,
    },
  });

  if (!link) {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  // If the owner archived the link, send to the graceful paused page
  if (link.isArchived) {
    return NextResponse.redirect(new URL('/inactive', request.url));
  }

  // Check if link is a prompt-to-page mobile landing page
  if (link.type === 'landing-page' && link.landingPage && link.landingPage.published) {
    return NextResponse.redirect(new URL(`/page/${shortCode}`, request.url));
  }

  // 2. Ignore camera background prefetch and preview requests
  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('sec-purpose') === 'prefetch' ||
    request.headers.get('x-purpose') === 'preview' ||
    request.headers.get('x-moz') === 'prefetch';

  // Extract contextual headers for condition evaluation
  const userAgent = request.headers.get('user-agent') || '';
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    null;
  const city = request.headers.get('x-vercel-ip-city') || null;
  const referrer = request.headers.get('referer') || null;
  const acceptLanguage = request.headers.get('accept-language') || null;

  // 3. Evaluate conditional rules (Smart Destination Router)
  const evaluation = evaluateRules(link.routingRules, link.destinationUrl, {
    userAgent,
    country,
    referrer,
    acceptLanguage,
    now: new Date(),
  });

  const finalDestination = evaluation.destination;
  const ruleFiredId = evaluation.ruleFiredId;

  // 4. Log detailed scan and increment count
  if (!isPrefetch) {
    try {
      const device = detectDevice(userAgent);

      await prisma.$transaction([
        prisma.qrLink.update({
          where: { id: link.id },
          data: {
            scanCount: { increment: 1 },
            lastScannedAt: new Date(),
          },
        }),
        prisma.scan.create({
          data: {
            qrLinkId: link.id,
            device,
            country,
            city,
            userAgent: userAgent.slice(0, 500),
            referrer: referrer?.slice(0, 500) || null,
            ruleFiredId,
          },
        }),
      ]);
    } catch (err) {
      console.error('Failed to log scan analytics for link:', link.id, err);
    }
  }

  // 5. Return a 307 Temporary Redirect with strict no-cache headers
  const response = NextResponse.redirect(finalDestination, 307);

  response.headers.set(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  );
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  return response;
}
