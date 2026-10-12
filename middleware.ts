import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

const DEFAULT_HOSTS = [
  'localhost',
  '127.0.0.1',
  'my-qr-sandy.vercel.app',
];

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const url = req.nextUrl;
  const hostname = host.split(':')[0].toLowerCase();

  // If host is the primary app domain or local dev, standard routing applies
  const isDefaultHost = DEFAULT_HOSTS.some(
    (dh) => hostname === dh || hostname.endsWith('.vercel.app')
  );

  if (!isDefaultHost) {
    // This request comes from a custom branded domain
    const pathname = url.pathname;

    // If visiting root of the custom domain
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/id', req.url));
    }

    // If pathname is a direct short code (e.g., qr.acme.com/promo-2024)
    if (
      !pathname.startsWith('/id/') &&
      !pathname.startsWith('/page/') &&
      !pathname.startsWith('/admin') &&
      !pathname.startsWith('/pricing') &&
      !pathname.startsWith('/billing')
    ) {
      const shortCode = pathname.replace(/^\//, '');
      return NextResponse.rewrite(new URL(`/id/${shortCode}`, req.url));
    }
  }

  return NextResponse.next();
}
