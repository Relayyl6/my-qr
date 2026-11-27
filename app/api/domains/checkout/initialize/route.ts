import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateNgnPricing, WHOLESALE_USD_PRICING } from '@/lib/domains/namelaunch';
import {
  getDomainPricingConfig,
  calculateMultiYearDomainPrice,
  DEFAULT_PRICING_CONFIG,
} from '@/lib/domains/fxEngine';
import { getAppUrl } from '@/lib/config';

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

      const tld = (existing.domainName.split('.').pop() || 'com').toLowerCase();
      const pricingConfig = await getDomainPricingConfig();
      const wholesaleUsd =
        existing.wholesaleUsd ||
        WHOLESALE_USD_PRICING[tld] ||
        (pricingConfig.tldOverrides?.[tld] ? Math.max(10.5, pricingConfig.tldOverrides[tld] / pricingConfig.bufferedRate) : 10.5);
      const effectiveRate =
        pricingConfig.mode === 'manual_override'
          ? pricingConfig.manualOverrideRate
          : pricingConfig.bufferedRate;

      const periodYears = ([1, 2, 3].includes(existing.registrationYears)
        ? existing.registrationYears
        : 1) as 1 | 2 | 3;
      const multiYear = calculateMultiYearDomainPrice(
        wholesaleUsd,
        tld,
        pricingConfig,
        periodYears
      );

      const aliasesList = Array.isArray(existing.emailAliases) ? existing.emailAliases : [];
      const extraAliasesCount = Math.max(0, aliasesList.length - 1);
      const extraEmailPriceNgn = pricingConfig?.extraEmailPriceNgn ?? 1500;
      const additionalCostNgn = extraAliasesCount * extraEmailPriceNgn * periodYears;
      const finalChargeNgn = multiYear.finalPriceNgn + additionalCostNgn;
      const finalMarkupNgn = (multiYear.finalPriceNgn - multiYear.wholesaleNgn) + additionalCostNgn;

      order = await prisma.domainOrder.update({
        where: { id: existing.id },
        data: {
          paystackRef: reference,
          userId: user?.id || existing.userId,
          wholesaleUsd: multiYear.wholesaleUsd,
          exchangeRate: effectiveRate,
          platformMarkupNgn: finalMarkupNgn,
          totalPaidNgn: finalChargeNgn,
        },
      });

      domainName = order.domainName;
      desiredAlias = order.desiredAlias;
      userEmail = order.userEmail;
      totalPaidNgn = finalChargeNgn;
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

      const tld = (domainName.split('.').pop() || 'com').toLowerCase();
      const pricingConfig = await getDomainPricingConfig();
      const wholesaleUsd =
        WHOLESALE_USD_PRICING[tld] ||
        (pricingConfig.tldOverrides?.[tld] ? Math.max(10.5, pricingConfig.tldOverrides[tld] / pricingConfig.bufferedRate) : 10.5);
      const pricing = calculateNgnPricing(wholesaleUsd, tld, pricingConfig);
      const effectiveRate =
        pricingConfig.mode === 'manual_override'
          ? pricingConfig.manualOverrideRate
          : pricingConfig.bufferedRate;

      const periodYears = [1, 2, 3].includes(Number(body.periodYears))
        ? (Number(body.periodYears) as 1 | 2 | 3)
        : 1;

      const multiYear = calculateMultiYearDomainPrice(
        wholesaleUsd,
        tld,
        pricingConfig,
        periodYears
      );

      // Parse and validate additional email forwarding aliases (+money per email)
      const rawAdditional = Array.isArray(body.additionalAliases) ? body.additionalAliases : [];
      const validAdditional: Array<{ alias: string; forwardTo: string }> = [];
      const seenAliases = new Set<string>([desiredAlias]);

      for (const item of rawAdditional) {
        if (!item || typeof item !== 'object') continue;
        const a = String(item.alias || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
        const f = String(item.forwardTo || userEmail).trim().toLowerCase();
        if (a && a !== desiredAlias && !seenAliases.has(a) && f.includes('@')) {
          seenAliases.add(a);
          validAdditional.push({ alias: a, forwardTo: f });
        }
      }

      const extraEmailPriceNgn = pricingConfig?.extraEmailPriceNgn ?? 1500;
      const additionalCostNgn = validAdditional.length * extraEmailPriceNgn * periodYears;
      const totalExpectedNgn = multiYear.finalPriceNgn + additionalCostNgn;

      // Strictly rely on the active admin sovereignty pricing calculation
      const finalChargeNgn = totalExpectedNgn;
      const finalMarkupNgn = (multiYear.finalPriceNgn - multiYear.wholesaleNgn) + additionalCostNgn;

      // Verify client expectation against authoritative pricing engine to prevent unexpected charges
      const clientExpectedNgn = body.expectedPriceNgn ? Number(body.expectedPriceNgn) : null;
      if (
        clientExpectedNgn !== null &&
        clientExpectedNgn > 0 &&
        clientExpectedNgn !== totalExpectedNgn
      ) {
        return NextResponse.json(
          {
            error: `Storefront pricing updated: ${domainName} is ₦${multiYear.yearlyPriceNgn.toLocaleString()}/yr (Total: ₦${totalExpectedNgn.toLocaleString()}). Please review and confirm.`,
            requiresConfirmation: true,
            authoritativeYearlyPriceNgn: multiYear.yearlyPriceNgn,
            authoritativeTotalNgn: totalExpectedNgn,
          },
          { status: 409 }
        );
      }

      // Compile complete emailAliases list (primary + additional)
      const compiledEmailAliases = [
        { alias: desiredAlias, forwardTo: userEmail, enabled: true },
        ...validAdditional.map((a) => ({ alias: a.alias, forwardTo: a.forwardTo, enabled: true })),
      ];

      const enableCatchAll = Boolean(body.enableCatchAll);
      const enableBioPage = body.enableBioPage !== undefined ? Boolean(body.enableBioPage) : true;

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
            registrationYears: periodYears,
            catchAllEnabled: enableCatchAll,
            catchAllEmail: enableCatchAll ? userEmail : null,
            bioPageEnabled: enableBioPage,
            spamShieldActive: true,
            emailAliases: compiledEmailAliases as any,
            wholesaleUsd: multiYear.wholesaleUsd,
            exchangeRate: effectiveRate,
            platformMarkupNgn: finalMarkupNgn,
            totalPaidNgn: finalChargeNgn,
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
            registrationYears: periodYears,
            catchAllEnabled: enableCatchAll,
            catchAllEmail: enableCatchAll ? userEmail : null,
            bioPageEnabled: enableBioPage,
            spamShieldActive: true,
            emailAliases: compiledEmailAliases as any,
            wholesaleUsd: multiYear.wholesaleUsd,
            exchangeRate: effectiveRate,
            platformMarkupNgn: finalMarkupNgn,
            totalPaidNgn: finalChargeNgn,
            paystackRef: reference,
            status: 'PENDING_PAYMENT',
          },
        });
      }

      totalPaidNgn = finalChargeNgn;
    }

    const appUrl = getAppUrl(req);
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

    // 3. Reject checkout when payment gateway key is not configured
    return NextResponse.json(
      {
        error:
          'Payment checkout is temporarily unavailable because the payment gateway is not configured in this environment.',
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('Checkout initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize checkout session' },
      { status: 500 }
    );
  }
}
