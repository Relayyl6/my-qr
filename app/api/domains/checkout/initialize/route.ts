import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateNgnPricing, WHOLESALE_USD_PRICING } from '@/lib/domains/namelaunch';
import { getDomainPricingConfig } from '@/lib/domains/fxEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    const reference = `DOM_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    let order: any = null;
    let domainName = '';
    let desiredAlias = 'hello';
    let userEmail = '';
    let totalPaidNgn = 0;

    // Option A: Resume payment for an existing PENDING_PAYMENT order
    if (body.orderId) {
      const existing = await prisma.domainOrder.findUnique({
        where: { id: String(body.orderId) },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
      }
      if (existing.status !== 'PENDING_PAYMENT') {
        return NextResponse.json({ error: 'This order is already paid or active.' }, { status: 400 });
      }
      if (
        existing.userId &&
        user &&
        existing.userId !== user.id &&
        existing.userEmail !== user.email.toLowerCase()
      ) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
      }

      order = await prisma.domainOrder.update({
        where: { id: existing.id },
        data: {
          paystackRef: reference,
          userId: user?.id || existing.userId,
        },
      });

      domainName = order.domainName;
      desiredAlias = order.desiredAlias;
      userEmail = order.userEmail;
      totalPaidNgn = order.totalPaidNgn;
    } else {
      // Option B: Create or update pending order for domain + email
      domainName = String(body.domainName || '').trim().toLowerCase();
      desiredAlias = String(body.desiredAlias || 'hello')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '');
      userEmail = String(body.userEmail || user?.email || '').trim().toLowerCase();

      if (!domainName.includes('.') || !userEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Valid domain name and forwarding email are required.' },
          { status: 400 }
        );
      }

      const tld = domainName.split('.').pop() || 'com';
      const wholesaleUsd = WHOLESALE_USD_PRICING[tld] || 10.5;
      const pricingConfig = await getDomainPricingConfig().catch(() => null);
      const pricing = calculateNgnPricing(wholesaleUsd, tld, pricingConfig || undefined);
      const effectiveRate = pricingConfig
        ? pricingConfig.mode === 'manual_override'
          ? pricingConfig.manualOverrideRate
          : pricingConfig.bufferedRate
        : 1400;

      // Reuse existing PENDING_PAYMENT order for the same domain & customer if present
      const existingPending = await prisma.domainOrder.findFirst({
        where: {
          domainName,
          status: 'PENDING_PAYMENT',
          OR: [
            ...(user ? [{ userId: user.id }] : []),
            { userEmail },
          ],
        },
      });

      if (existingPending) {
        order = await prisma.domainOrder.update({
          where: { id: existingPending.id },
          data: {
            userId: user?.id || existingPending.userId,
            userEmail,
            desiredAlias,
            wholesaleUsd: pricing.wholesaleUsd,
            exchangeRate: effectiveRate,
            platformMarkupNgn: pricing.platformFeeNgn,
            totalPaidNgn: pricing.totalNgn,
            paystackRef: reference,
          },
        });
      } else {
        order = await prisma.domainOrder.create({
          data: {
            userId: user?.id || null,
            userEmail,
            domainName,
            desiredAlias,
            wholesaleUsd: pricing.wholesaleUsd,
            exchangeRate: effectiveRate,
            platformMarkupNgn: pricing.platformFeeNgn,
            totalPaidNgn: pricing.totalNgn,
            paystackRef: reference,
            status: 'PENDING_PAYMENT',
          },
        });
      }

      totalPaidNgn = pricing.totalNgn;
    }

    const appUrl =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://my-qr-sandy.vercel.app';
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // 2. If Paystack Live/Test key is available, initialize transaction
    if (paystackSecret && !paystackSecret.includes('placeholder')) {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          amount: totalPaidNgn * 100, // Naira to Kobo
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
        throw new Error(paystackData.message || 'Checkout initialization failed');
      }

      return NextResponse.json({
        authorizationUrl: paystackData.data.authorization_url,
        reference,
        amountNgn: totalPaidNgn,
      });
    }

    // 3. Fallback Sandbox Mode (when gateway key is pending setup in environment)
    const testCallbackUrl = `${appUrl}/?section=namelaunch&ref=${reference}&test_paid=true`;
    return NextResponse.json({
      authorizationUrl: testCallbackUrl,
      reference,
      amountNgn: totalPaidNgn,
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
