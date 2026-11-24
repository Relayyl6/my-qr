import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetType = 'vcard', targetSlug, targetTitle, reason = 'spam', details = '' } = body;

    if (!targetSlug || typeof targetSlug !== 'string') {
      return NextResponse.json({ error: 'targetSlug is required.' }, { status: 400 });
    }

    const reportId = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const forwardedFor = req.headers.get('x-forwarded-for') || '';
    const reporterIp = forwardedFor.split(',')[0].trim() || 'unknown';

    let targetUrl = `/c/${targetSlug}`;
    if (targetType === 'link') targetUrl = `/id/${targetSlug}`;
    else if (targetType === 'menu') targetUrl = `/m/${targetSlug}`;
    else if (targetType === 'wifi') targetUrl = `/w/${targetSlug}`;

    const newReport = {
      id: reportId,
      targetType,
      targetSlug,
      targetTitle: targetTitle || targetSlug,
      targetUrl,
      reason,
      details: typeof details === 'string' ? details.slice(0, 500) : '',
      reporterIp,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    const existing = await prisma.aiCache.findUnique({
      where: { key: 'platform_abuse_reports' },
    });

    const reports = existing && Array.isArray(existing.value) ? (existing.value as any[]) : [];
    reports.unshift(newReport);
    const trimmed = reports.slice(0, 100); // Retain latest 100 reports

    await prisma.aiCache.upsert({
      where: { key: 'platform_abuse_reports' },
      create: {
        key: 'platform_abuse_reports',
        value: trimmed as any,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      update: {
        value: trimmed as any,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({ success: true, reportId });
  } catch (err: any) {
    console.error('[Abuse Report API Error]:', err);
    return NextResponse.json({ error: 'Failed to record report.' }, { status: 500 });
  }
}
