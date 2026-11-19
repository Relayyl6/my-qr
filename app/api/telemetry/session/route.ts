import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Mask password / sensitive field values in rrweb event data
function maskSensitiveFields(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveFields);

  const obj = data as Record<string, unknown>;
  const masked: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    // rrweb stores input mutations under 'attributes' and 'value'
    if (
      key === 'value' &&
      typeof val === 'string' &&
      obj['type'] === 'password'
    ) {
      masked[key] = '••••••••';
    } else if (
      key === 'attributes' &&
      val &&
      typeof val === 'object' &&
      !Array.isArray(val)
    ) {
      const attrs = val as Record<string, unknown>;
      if (attrs['type'] === 'password') {
        masked[key] = { ...attrs, value: '••••••••' };
      } else {
        masked[key] = maskSensitiveFields(val);
      }
    } else if (typeof val === 'object' && val !== null) {
      masked[key] = maskSensitiveFields(val);
    } else {
      masked[key] = val;
    }
  }
  return masked;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;
    const events: unknown[] = Array.isArray(body.events) ? body.events : [];

    if (!sessionId || events.length === 0) {
      return NextResponse.json({ ok: false, error: 'missing sessionId or events' }, { status: 400 });
    }

    // Verify session exists (created by /api/telemetry/visit)
    const session = await prisma.visitorSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      // Silently drop — could be a race condition on first load
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
  } catch (err) {
    console.error('[SessionEvent] failed:', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
