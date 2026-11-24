import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { provisionDomainAndEmail } from '@/lib/domains/provisioning';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (paystackSecret && signature) {
      const hash = crypto
        .createHmac('sha512', paystackSecret)
        .update(rawBody)
        .digest('hex');

      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody || '{}');

    if (event.event === 'charge.success') {
      const reference = event.data?.reference;
      if (!reference) {
        return NextResponse.json({ error: 'Reference missing' }, { status: 400 });
      }

      const order = await prisma.domainOrder.findUnique({
        where: { paystackRef: reference },
      });

      if (order && (order.status === 'PENDING_PAYMENT' || order.status === 'PAID_AWAITING_FUNDS')) {
        try {
          await prisma.domainOrder.update({
            where: { id: order.id },
            data: { status: 'PROVISIONING' },
          });

          const { zoneId, nameservers } = await provisionDomainAndEmail(order);

          await prisma.domainOrder.update({
            where: { id: order.id },
            data: {
              status: 'ACTIVE',
              cloudflareZoneId: zoneId,
              nameservers,
              errorMessage: null,
            },
          });
        } catch (err: any) {
          console.error('Domain provisioning caught error:', err);
          await prisma.domainOrder.update({
            where: { id: order.id },
            data: {
              status: 'PAID_AWAITING_FUNDS',
              errorMessage: err.message || 'Provisioning error',
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Paystack webhook error:', err);
    return NextResponse.json({ error: err.message || 'Webhook error' }, { status: 500 });
  }
}
