import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  if (!user || user.email.toLowerCase() !== adminEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const rawEvents = await prisma.sessionEvent.findMany({
    where: { sessionId },
    orderBy: { timestamp: 'asc' },
    take: 5000, // cap at 5k events per session for safety
    select: { type: true, data: true, timestamp: true },
  });

  // rrweb-player expects { type, data, timestamp } with number timestamp
  const events = rawEvents.map((e) => ({
    type: e.type,
    data: e.data,
    timestamp: Number(e.timestamp),
  }));

  return NextResponse.json({ events });
}
