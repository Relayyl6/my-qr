import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

  // 1. Find the unique link record strictly by its shortCode
  const link = await prisma.qrLink.findUnique({
    where: { shortCode },
  });

  if (!link) {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  // If the owner archived the link, send to the graceful paused page
  if (link.isArchived) {
    return NextResponse.redirect(new URL('/inactive', request.url));
  }

  // 2. Ignore camera background prefetch and preview requests
  // Many phone cameras (e.g. iOS Camera / Safari Quick Look) send background prefetch
  // requests when hovering near a QR code. We ONLY count real, intentional navigations!
  const isPrefetch =
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('sec-purpose') === 'prefetch' ||
    request.headers.get('x-purpose') === 'preview' ||
    request.headers.get('x-moz') === 'prefetch';

  if (!isPrefetch) {
    try {
      // Strictly update ONLY this unique record's primary key ID
      await prisma.qrLink.update({
        where: { id: link.id },
        data: {
          scanCount: { increment: 1 },
          lastScannedAt: new Date(),
        },
      });
    } catch (err) {
      console.error('Failed to update scan analytics for link:', link.id, err);
    }
  }

  // 3. Return a 307 Temporary Redirect to the link's destination
  const response = NextResponse.redirect(link.destinationUrl, 307);

  // 4. Set strict cache-control headers
  // The QR code is permanent, but the destination is dynamic. We MUST tell
  // the mobile browser and CDN never to cache this redirect so every scan hits the server.
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');

  return response;
}
