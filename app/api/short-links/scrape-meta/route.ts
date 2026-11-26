import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let html = '';
    try {
      const res = await fetch(parsedUrl.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; DynamicQROGBot/1.0; +https://dynamicqr.co/bot)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      html = await res.text();
    } catch (e: any) {
      console.warn('[scrape-meta] Fetch error:', e.message);
    } finally {
      clearTimeout(timeout);
    }

    // Heuristic HTML Regex parsing (edge and serverless friendly without heavy DOM parsers)
    const titleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const descMatch =
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

    const imageMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<link\s+rel=["']image_src["']\s+href=["']([^"']+)["']/i);

    const siteNameMatch =
      html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);

    let ogTitle = titleMatch ? titleMatch[1].trim() : '';
    let ogDescription = descMatch ? descMatch[1].trim() : '';
    let ogImage = imageMatch ? imageMatch[1].trim() : '';
    let siteName = siteNameMatch ? siteNameMatch[1].trim() : parsedUrl.hostname;

    // Resolve relative image URLs to absolute
    if (ogImage && !ogImage.startsWith('http')) {
      try {
        ogImage = new URL(ogImage, parsedUrl.origin).toString();
      } catch {}
    }

    // Fallbacks if target website lacks explicit metadata
    if (!ogTitle) {
      const cleanHost = parsedUrl.hostname.replace(/^www\./, '');
      const pathSegment = parsedUrl.pathname.replace(/^\/|\/$/g, '').replace(/[-_]/g, ' ');
      ogTitle = pathSegment
        ? `${pathSegment.charAt(0).toUpperCase() + pathSegment.slice(1)} | ${cleanHost}`
        : `${cleanHost.charAt(0).toUpperCase() + cleanHost.slice(1)} — Official Link`;
    }

    if (!ogDescription) {
      ogDescription = `Fast, secure link redirect to ${parsedUrl.hostname} with device and location routing powered by DynamicQR.`;
    }

    return NextResponse.json({
      success: true,
      ogTitle,
      ogDescription,
      ogImage,
      siteName,
      targetUrl: parsedUrl.toString(),
      favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to extract metadata' },
      { status: 500 }
    );
  }
}
