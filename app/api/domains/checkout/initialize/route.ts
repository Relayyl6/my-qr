import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateNgnPricing, WHOLESALE_USD_PRICING } from '@/lib/domains/namelaunch';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const domainName = String(body.domainName || '').trim().toLowerCase();
    const desiredAlias = String(body.desiredAlias || 'hello')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');
    const userEmail = String(body.userEmail || user?.email || '').trim().toLowerCase();

    if (!domainName.includes('.') || !userEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid domain name and forwarding email are required.' },
        { status: 400 }
      );
    }

    const tld = domainName.split('.').pop() || 'com';
    const wholesaleUsd = WHOLESALE_USD_PRICING[tld] || 10.5;
    const pricing = calculateNgnPricing(wholesaleUsd);
    const reference = `DOM_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    // 1. Create order in PostgreSQL
    const order = await prisma.domainOrder.create({
      data: {
        userId: user?.id || null,
        userEmail,
        domainName,
        desiredAlias,
        wholesaleUsd: pricing.wholesaleUsd,
        exchangeRate: Number(process.env.USD_TO_NGN_RATE || 1650),
        platformMarkupNgn: pricing.platformFeeNgn,
        totalPaidNgn: pricing.totalNgn,
        paystackRef: reference,
        status: 'PENDING_PAYMENT',
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my-qr-sandy.vercel.app';
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // 2. If Paystack Live/Test key is available, initialize Paystack transaction
    if (paystackSecret && !paystackSecret.includes('placeholder')) {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          amount: pricing.totalNgn * 100, // Naira to Kobo
          currency: 'NGN',
          reference,
          callback_url: `${appUrl}/?section=namelaunch&ref=${reference}`,
          metadata: {
            orderId: order.id,
            domainName,
            desiredAlias: `${desiredAlias}@${domainName}`,
            custom_fields: [
              {
                display_name: 'Domain Name',
                variable_name: 'domain_name',
                value: domainName,
              },
              {
                display_name: 'Custom Email',
                variable_name: 'custom_email',
                value: `${desiredAlias}@${domainName}`,
              },
            ],
          },
        }),
      });

      const paystackData = await paystackRes.json();
      if (!paystackData.status) {
        throw new Error(paystackData.message || 'Paystack initialization failed');
      }

      return NextResponse.json({
        authorizationUrl: paystackData.data.authorization_url,
        reference,
        amountNgn: pricing.totalNgn,
      });
    }

    // 3. Fallback Test/Sandbox Mode (when Paystack key is pending setup in environment):
    // Provide direct instant test simulation route
    const testCallbackUrl = `${appUrl}/?section=namelaunch&ref=${reference}&test_paid=true`;
    return NextResponse.json({
      authorizationUrl: testCallbackUrl,
      reference,
      amountNgn: pricing.totalNgn,
      isSimulation: true,
    });
  } catch (error: any) {
    console.error('Checkout initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize checkout session' },
      { status: 500 }
    );
  }
}
