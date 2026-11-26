import { NextResponse } from 'next/server';
import { searchDomains } from '@/lib/domains/namelaunch';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    const results = await searchDomains(query);
    return NextResponse.json(
      { results },
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
