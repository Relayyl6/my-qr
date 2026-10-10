import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  const shortCode = params.shortCode;

  if (!shortCode) {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  // 1. Find the destination URL
  const link = await prisma.qrLink.findUnique({
    where: { shortCode },
  });

  if (!link) {
    return NextResponse.redirect(new URL('/not-found', request.url));
  }

  // 2. Fire-and-forget analytics update
  // We don't await this so the redirect happens instantly for the user.
  // Using updateMany avoids throwing an error if the record is concurrently modified.
  prisma.qrLink.updateMany({
    where: { id: link.id },
    data: {
      scanCount: { increment: 1 },
      lastScannedAt: new Date(),
    },
  }).catch((err) => console.error('Failed to update scan analytics:', err));

  // 3. Return a 307 Temporary Redirect
  const response = NextResponse.redirect(link.destinationUrl, 307);
  
  // 4. Set strict cache-control headers
  // The QR code is permanent, but the destination is dynamic. We MUST tell
  // the browser/CDN never to cache this 307 response.
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');

  return response;
}
