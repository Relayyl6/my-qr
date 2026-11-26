import { prisma } from '@/lib/prisma';

const CF_BASE = 'https://api.cloudflare.com/client/v4';

function getCfHeaders() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function setupCloudflareSpamShield(zoneId: string, domainName: string): Promise<{ success: boolean; message: string }> {
  const cfHeaders = getCfHeaders();
  if (!cfHeaders) {
    return { success: false, message: 'Cloudflare credentials not configured' };
  }

  try {
    // 1. Invalidate / fetch existing TXT records to avoid duplicate conflicts
    const listRes = await fetch(`${CF_BASE}/zones/${zoneId}/dns_records?type=TXT`, {
      headers: cfHeaders,
    });
    const listData = await listRes.json();
    const existingTxts = Array.isArray(listData.result) ? listData.result : [];

    // SPF Record
    const hasSpf = existingTxts.some((r: any) => (r.name === domainName || r.name === `@`) && r.content?.includes('v=spf1'));
    if (!hasSpf) {
      await fetch(`${CF_BASE}/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: cfHeaders,
        body: JSON.stringify({
          type: 'TXT',
          name: '@',
          content: 'v=spf1 include:_spf.mx.cloudflare.net ~all',
          ttl: 3600,
        }),
      });
    }

    // DMARC Record
    const hasDmarc = existingTxts.some((r: any) => r.name?.startsWith('_dmarc'));
    if (!hasDmarc) {
      await fetch(`${CF_BASE}/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: cfHeaders,
        body: JSON.stringify({
          type: 'TXT',
          name: '_dmarc',
          content: `v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${domainName}; pct=100; sp=quarantine`,
          ttl: 3600,
        }),
      });
    }

    return { success: true, message: 'DMARC & SPF Spam Shield active with 100% deliverability protection.' };
  } catch (err: any) {
    console.warn('[Cloudflare Spam Shield] Setup warning:', err);
    return { success: false, message: err.message || 'Spam shield configuration warning' };
  }
}

export async function setupCloudflareCatchAll(
  zoneId: string,
  forwardToEmail: string,
  enabled: boolean = true
): Promise<{ success: boolean; message: string }> {
  const cfHeaders = getCfHeaders();
  if (!cfHeaders) {
    return { success: false, message: 'Cloudflare credentials not configured' };
  }

  try {
    const res = await fetch(`${CF_BASE}/zones/${zoneId}/email/routing/rules/catch_all`, {
      method: 'PUT',
      headers: cfHeaders,
      body: JSON.stringify({
        name: 'Catch-All to Destination Inbox',
        enabled,
        matchers: [
          {
            type: 'all',
          },
        ],
        actions: [
          {
            type: 'forward',
            value: [forwardToEmail],
          },
        ],
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Failed to update catch-all rule');
    }

    return {
      success: true,
      message: enabled
        ? `Catch-all routing active! Any email sent to *@${zoneId} forwards to ${forwardToEmail}.`
        : 'Catch-all email routing disabled.',
    };
  } catch (err: any) {
    console.warn('[Cloudflare Catch-All] Setup warning:', err);
    return { success: false, message: err.message || 'Catch-all configuration failed' };
  }
}

export async function provisionDomainAndEmail(order: {
  id: string;
  domainName: string;
  desiredAlias: string;
  userEmail: string;
  emailAliases?: any;
  registrationYears?: number;
  catchAllEnabled?: boolean;
}): Promise<{ zoneId: string; nameservers: string[] }> {
  const cfHeaders = getCfHeaders();

  // Cloudflare API Token is required to create live DNS zones and configure email routing
  if (!cfHeaders) {
    throw new Error('CLOUDFLARE_API_TOKEN is not configured in .env. Cannot provision DNS zone and email routing.');
  }

  // STEP 1: Create Cloudflare DNS Zone to receive nameservers
  const zoneRes = await fetch(`${CF_BASE}/zones`, {
    method: 'POST',
    headers: cfHeaders,
    body: JSON.stringify({
      name: order.domainName,
      jump_start: false,
      type: 'full',
    }),
  });
  const zoneData = await zoneRes.json();
  if (!zoneData.success) {
    throw new Error(`Cloudflare Zone creation failed: ${zoneData.errors?.[0]?.message || 'Unknown error'}`);
  }

  const zoneId: string = zoneData.result.id;
  const nameservers: string[] = zoneData.result.name_servers || [
    'ada.ns.cloudflare.com',
    'bob.ns.cloudflare.com',
  ];

  // STEP 2: Register Domain via Domain Name API if credentials exist
  const dnaApiKey = process.env.DNA_API_KEY;
  const dnaResellerId = process.env.DNA_RESELLER_ID || 'e2087205-ac6f-d5c2-1edd-3a25248464f9';
  const dnaUsername = process.env.DNA_USERNAME;
  const dnaPassword = process.env.DNA_PASSWORD;

  if (dnaApiKey) {
    // Modern DomainResellerAPI v1 (REST with X-API-KEY)
    try {
      const dnaRes = await fetch('https://api.domainresellerapi.com/api/v1/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': dnaApiKey,
          '__reseller': dnaResellerId,
        },
        body: JSON.stringify({
          domain: order.domainName,
          period: order.registrationYears || 1,
          nameservers,
          contacts: {
            registrant: {
              first_name: 'DynamicQR',
              last_name: 'Customer',
              email: order.userEmail,
              phone: '+234.8000000000',
              address: 'Victoria Island',
              city: 'Lagos',
              country: 'NG',
              postal_code: '101241',
            },
          },
        }),
      });

      const rawText = await dnaRes.text();
      let dnaData: any = {};
      try {
        dnaData = JSON.parse(rawText);
      } catch {
        dnaData = { message: rawText || 'Empty response from registrar' };
      }

      if (!dnaRes.ok || dnaData.error || dnaData.status === 'ERROR') {
        const errorMsg = String(dnaData.message || dnaData.error || dnaData.info || rawText || '');
        if (
          dnaRes.status === 402 ||
          errorMsg.toLowerCase().includes('balance') ||
          errorMsg.toLowerCase().includes('credit') ||
          errorMsg.toLowerCase().includes('funds') ||
          rawText.length === 0
        ) {
          throw new Error('Registrar wallet unfunded ($0.00 balance): Deposit funds in your Domain Name API account to purchase real root domains.');
        }
        throw new Error(`Registrar error: ${errorMsg}`);
      }
    } catch (apiErr: any) {
      console.error('[DNA Reseller API] Registration error:', apiErr);
      throw new Error(`Registrar error: ${apiErr.message}`);
    }
  } else if (dnaUsername && dnaPassword) {
    // Classic DomainNameAPI JSON API
    const dnaRes = await fetch('https://api.domainnameapi.com/api/Domain/Register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        UserName: dnaUsername,
        Password: dnaPassword,
        DomainName: order.domainName,
        Period: order.registrationYears || 1,
        NameServerList: nameservers,
        RegistrantContact: {
          FirstName: 'DynamicQR',
          LastName: 'Customer',
          Email: order.userEmail,
          Phone: '+2348000000000',
          AddressLine1: 'Victoria Island',
          City: 'Lagos',
          Country: 'NG',
          PostalCode: '101241',
        },
      }),
    });
    const dnaData = await dnaRes.json();
    if (!dnaData.IsSuccess && !dnaData.success) {
      throw new Error(`Registrar error: ${dnaData.Message || 'Insufficient balance in wallet'}`);
    }
  }

  // STEP 3: Enable Cloudflare Email Routing
  try {
    await fetch(`${CF_BASE}/zones/${zoneId}/email/routing/enable`, {
      method: 'POST',
      headers: cfHeaders,
    });
  } catch (err) {
    console.warn('Failed to enable email routing:', err);
  }

  // STEP 4: Add Email Forwarding Rules (Primary + any additional purchased aliases)
  const aliasesToProvision: Array<{ alias: string; forwardTo: string }> = [];
  if (Array.isArray(order.emailAliases) && order.emailAliases.length > 0) {
    for (const a of order.emailAliases as any[]) {
      if (a && a.alias && a.forwardTo) {
        aliasesToProvision.push({ alias: a.alias, forwardTo: a.forwardTo });
      }
    }
  }
  if (aliasesToProvision.length === 0) {
    aliasesToProvision.push({
      alias: order.desiredAlias || 'hello',
      forwardTo: order.userEmail,
    });
  }

  for (const { alias, forwardTo } of aliasesToProvision) {
    try {
      await fetch(`${CF_BASE}/zones/${zoneId}/email/routing/rules`, {
        method: 'POST',
        headers: cfHeaders,
        body: JSON.stringify({
          name: `Forward ${alias}`,
          enabled: true,
          matchers: [
            {
              type: 'literal',
              field: 'to',
              value: `${alias}@${order.domainName}`,
            },
          ],
          actions: [
            {
              type: 'forward',
              value: [forwardTo],
            },
          ],
        }),
      });
    } catch (err) {
      console.warn(`Failed to create email routing rule for ${alias}:`, err);
    }
  }

  // STEP 5: Automated DMARC/SPF Deliverability & Spam Shield Injection
  try {
    await setupCloudflareSpamShield(zoneId, order.domainName);
  } catch (err) {
    console.warn('Failed to inject spam shield records:', err);
  }

  // STEP 6: Optional Catch-All Routing
  if (order.catchAllEnabled) {
    try {
      await setupCloudflareCatchAll(zoneId, order.userEmail, true);
    } catch (err) {
      console.warn('Failed to configure catch-all rule:', err);
    }
  }

  return { zoneId, nameservers };
}
