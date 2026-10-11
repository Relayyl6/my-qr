import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  // 2. Increment scan analytics
  // MUST BE AWAITED: In serverless environments (like Vercel), unawaited promises 
  // are immediately frozen/aborted when the response is returned.
  try {
    await prisma.qrLink.update({
      where: { id: link.id },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: new Date(),
      },
    });
  } catch (err) {
    console.error('Failed to update scan analytics:', err);
  }

  // 3. Return a 307 Temporary Redirect
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
