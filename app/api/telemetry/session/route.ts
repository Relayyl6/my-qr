import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { maskSensitiveFields } from '@/lib/telemetry/maskSensitiveFields';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;
    const events: unknown[] = Array.isArray(body.events) ? body.events : [];

    if (!sessionId || events.length === 0) {
      return NextResponse.json({ ok: false, error: 'missing sessionId or events' }, { status: 400 });
    }

    // Ensure parent visitor session exists so foreign key constraint is always met
    let session = await prisma.visitorSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      try {
        session = await prisma.visitorSession.create({
          data: {
            id: sessionId,
            entryPath: '/',
          },
        });
      } catch {
        // If created concurrently in a race condition, re-read
        session = await prisma.visitorSession.findUnique({ where: { id: sessionId } });
      }
    }

    if (!session) {
      return NextResponse.json({ ok: true, dropped: true });
    }

    // Batch insert events, masking sensitive fields
    await prisma.sessionEvent.createMany({
      data: events.map((e: unknown) => {
        const ev = e as { type?: number; data?: unknown; timestamp?: number };
        return {
          sessionId,
          type: typeof ev.type === 'number' ? ev.type : 0,
          data: maskSensitiveFields(ev.data ?? {}) as object,
          timestamp: BigInt(typeof ev.timestamp === 'number' ? ev.timestamp : Date.now()),
        };
      }),
      skipDuplicates: false,
    });

    // Update session duration based on latest event timestamp
    const lastEvent = events[events.length - 1] as { timestamp?: number };
    if (lastEvent?.timestamp && session.createdAt) {
      const durationSec = Math.round((lastEvent.timestamp - session.createdAt.getTime()) / 1000);
      await prisma.visitorSession.update({
        where: { id: sessionId },
        data: { duration: durationSec > 0 ? durationSec : null, updatedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true, stored: events.length });
  } catch (err: any) {
    console.error('[SessionEvent] failed:', err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
