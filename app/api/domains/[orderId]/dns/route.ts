import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  fetchZoneDnsRecords,
  createZoneDnsRecord,
  deleteZoneDnsRecord,
  ALLOWED_DNS_TYPES,
  RecordType,
} from '@/lib/domains/dnsManager';

export const dynamic = 'force-dynamic';

async function getAuthorizedOrder(orderId: string) {
  const user = await getCurrentUser();
  const adminEmail = (process.env.ADMIN_EMAIL || 'oseghaleleonard39@gmail.com').toLowerCase();
  const isAdmin = user && user.email.toLowerCase() === adminEmail;

  const order = await prisma.domainOrder.findUnique({ where: { id: orderId } });
  if (!order) return null;

  // Authorization check: User must own the order or be super admin
  if (!isAdmin && user && order.userId && order.userId !== user.id) {
    return null;
  }

  return order;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
  try {
    const { orderId } = await Promise.resolve(params);
    const order = await getAuthorizedOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Domain order not found or unauthorized' }, { status: 404 });
    }

    const zoneId = order.cloudflareZoneId || `sim_zone_${order.id}`;
    const records = await fetchZoneDnsRecords(zoneId, order.domainName);

    return NextResponse.json({
      domain: order.domainName,
      status: order.status,
      nameservers: order.nameservers,
      records,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch DNS records' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
  try {
    const { orderId } = await Promise.resolve(params);
    const order = await getAuthorizedOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Domain order not found or unauthorized' }, { status: 404 });
    }

    const body = await req.json();
    const type = String(body.type || '').toUpperCase() as RecordType;
    const name = String(body.name || '@').trim();
    const content = String(body.content || '').trim();
    const ttl = Number(body.ttl || 1);
    const proxied = Boolean(body.proxied);
    const priority = Number(body.priority ?? 10);

    if (!ALLOWED_DNS_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Unsupported record type. Allowed: A, CNAME, MX, TXT' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json({ error: 'Record target/content is required' }, { status: 400 });
    }

    const zoneId = order.cloudflareZoneId || `sim_zone_${order.id}`;
    const record = await createZoneDnsRecord(zoneId, {
      type,
      name,
      content,
      ttl,
      proxied,
      priority,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create DNS record' }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
  try {
    const { orderId } = await Promise.resolve(params);
    const order = await getAuthorizedOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Domain order not found or unauthorized' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get('recordId');
    if (!recordId) {
      return NextResponse.json({ error: 'recordId is required' }, { status: 400 });
    }

    const zoneId = order.cloudflareZoneId || `sim_zone_${order.id}`;
    await deleteZoneDnsRecord(zoneId, recordId);

    return NextResponse.json({ deleted: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete DNS record' }, { status: 400 });
  }
}
