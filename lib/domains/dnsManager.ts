const CF_BASE = 'https://api.cloudflare.com/client/v4';
export const ALLOWED_DNS_TYPES = ['A', 'CNAME', 'MX', 'TXT'] as const;
export type RecordType = (typeof ALLOWED_DNS_TYPES)[number];

export interface DnsRecord {
  id: string;
  type: RecordType;
  name: string;
  content: string;
  ttl: number;
  proxied?: boolean;
  priority?: number;
}

function getCfHeaders() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchZoneDnsRecords(zoneId: string, domainName: string): Promise<DnsRecord[]> {
  const cfHeaders = getCfHeaders();
  if (!cfHeaders || zoneId.startsWith('sim_zone_')) {
    // Return standard default active records in simulation mode
    return [
      {
        id: `rec_${domainName}_cname`,
        type: 'CNAME',
        name: `qr.${domainName}`,
        content: 'cname.vercel-dns.com',
        ttl: 1,
        proxied: false,
      },
      {
        id: `rec_${domainName}_mx1`,
        type: 'MX',
        name: domainName,
        content: 'route1.mx.cloudflare.net',
        ttl: 1,
        priority: 10,
      },
      {
        id: `rec_${domainName}_txt_spf`,
        type: 'TXT',
        name: domainName,
        content: 'v=spf1 include:_spf.mx.cloudflare.net ~all',
        ttl: 1,
      },
    ];
  }

  const res = await fetch(`${CF_BASE}/zones/${zoneId}/dns_records?per_page=100`, {
    headers: cfHeaders,
    cache: 'no-store',
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Failed to fetch DNS records from Cloudflare');
  }

  return (data.result || [])
    .filter((r: any) => ALLOWED_DNS_TYPES.includes(r.type as RecordType))
    .map((r: any) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      content: r.content,
      ttl: r.ttl,
      proxied: r.proxied,
      priority: r.priority,
    }));
}

export async function createZoneDnsRecord(
  zoneId: string,
  record: {
    type: RecordType;
    name: string;
    content: string;
    ttl?: number;
    proxied?: boolean;
    priority?: number;
  }
): Promise<DnsRecord> {
  const cfHeaders = getCfHeaders();
  if (!cfHeaders || zoneId.startsWith('sim_zone_')) {
    return {
      id: `sim_rec_${Date.now()}`,
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl || 1,
      proxied: record.proxied,
      priority: record.priority,
    };
  }

  const payload: Record<string, unknown> = {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl || 1,
  };

  if (record.type === 'A' || record.type === 'CNAME') {
    payload.proxied = !!record.proxied;
    if (record.proxied) payload.ttl = 1;
  }

  if (record.type === 'MX') {
    payload.priority = record.priority ?? 10;
  }

  const res = await fetch(`${CF_BASE}/zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: cfHeaders,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Cloudflare rejected DNS record');
  }

  return data.result;
}

export async function deleteZoneDnsRecord(zoneId: string, recordId: string): Promise<boolean> {
  const cfHeaders = getCfHeaders();
  if (!cfHeaders || zoneId.startsWith('sim_zone_')) {
    return true;
  }

  const res = await fetch(`${CF_BASE}/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'DELETE',
    headers: cfHeaders,
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Cloudflare failed to delete DNS record');
  }

  return true;
}
