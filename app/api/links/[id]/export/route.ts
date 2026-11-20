import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = user.email.toLowerCase() === adminEmail;

  const link = await prisma.qrLink.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      shortCode: true,
      label: true,
      destinationUrl: true,
      userId: true,
      scans: {
        orderBy: { scannedAt: 'desc' },
      },
    },
  });

  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }

  if (link.userId !== user.id && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const userTier = (user.tier || 'free').toLowerCase();
  const isEligible = isAdmin || ['pro', 'plus', 'ultra'].includes(userTier);
  if (!isEligible) {
    return NextResponse.json(
      { error: 'CSV Scan History export requires a Pro, Plus, or Ultra subscription.' },
      { status: 403 }
    );
  }

  // Row limits per plan: Pro 100 rows, Plus 1,000 rows (Matrix #75), Ultra uncapped
  const maxRows = isAdmin || userTier === 'ultra' ? 999999 : userTier === 'plus' ? 1000 : 100;
  const scansToExport = link.scans.slice(0, maxRows);

  // Build CSV content
  const headers = ['Scanned At (UTC)', 'Device OS', 'Country', 'City', 'Rule Matched', 'Referrer', 'User Agent'];
  const rows = scansToExport.map((s) => [
    s.scannedAt.toISOString(),
    s.device || 'Unknown',
    s.country || 'Unknown',
    s.city || 'Unknown',
    s.ruleFiredId || 'Default Destination',
    s.referrer ? `"${s.referrer.replace(/"/g, '""')}"` : 'Direct / Camera App',
    s.userAgent ? `"${s.userAgent.replace(/"/g, '""')}"` : 'Unknown',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="dynamicqr-scans-${link.shortCode}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
