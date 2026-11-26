import { NextResponse } from 'next/server';
import { searchDomains } from '@/lib/domains/namelaunch';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const limit = Math.max(1, Math.min(10, parseInt(searchParams.get('limit') || '10', 10)));

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const searchResponse = await searchDomains(query, { offset, limit });
    return NextResponse.json(
      {
        results: searchResponse,
        hasMore: (searchResponse as any).hasMore ?? false,
        nextOffset: (searchResponse as any).nextOffset ?? null,
        totalAvailableTlds: (searchResponse as any).totalAvailableTlds ?? searchResponse.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error: any) {
    console.error('Domain search error:', error);
    return NextResponse.json(
      { error: error.message || 'Unable to search domains at this time' },
      { status: 500 }
    );
  }
}
