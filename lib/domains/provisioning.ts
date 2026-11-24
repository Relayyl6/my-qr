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

export async function provisionDomainAndEmail(order: {
  id: string;
  domainName: string;
  desiredAlias: string;
  userEmail: string;
}): Promise<{ zoneId: string; nameservers: string[] }> {
  const cfHeaders = getCfHeaders();

  // If Cloudflare token is not configured, run in development/staging simulation mode
  if (!cfHeaders) {
    console.log(`[NameLaunch Simulation] Cloudflare API token not set. Simulating instant zone & email routing for ${order.domainName}`);
    const simulatedZoneId = `sim_zone_${Math.random().toString(36).substring(2, 10)}`;
    const simulatedNs = ['ada.ns.cloudflare.com', 'bob.ns.cloudflare.com'];
    return { zoneId: simulatedZoneId, nameservers: simulatedNs };
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
  const dnaUsername = process.env.DNA_USERNAME;
  const dnaPassword = process.env.DNA_PASSWORD;

  if (dnaUsername && dnaPassword) {
    const dnaRes = await fetch('https://api.domainnameapi.com/api/Domain/Register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        UserName: dnaUsername,
        Password: dnaPassword,
        DomainName: order.domainName,
        Period: 1,
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

  // STEP 4: Add Email Forwarding Rule (e.g. hello@domain.com -> user@gmail.com)
  try {
    await fetch(`${CF_BASE}/zones/${zoneId}/email/routing/rules`, {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify({
        name: `Forward ${order.desiredAlias}`,
        enabled: true,
        matchers: [
          {
            type: 'literal',
            field: 'to',
            value: `${order.desiredAlias}@${order.domainName}`,
          },
        ],
        actions: [
          {
            type: 'forward',
            value: [order.userEmail],
          },
        ],
      }),
    });
  } catch (err) {
    console.warn('Failed to create email routing rule:', err);
  }

  return { zoneId, nameservers };
}
