'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, Plus, Trash2, Shield, AlertTriangle, CheckCircle2, Globe } from 'lucide-react';
import { DnsRecord, RecordType, ALLOWED_DNS_TYPES } from '@/lib/domains/dnsManager';
import ConfirmModal from './ConfirmModal';

interface Props {
  orderId: string;
  domainName: string;
  onClose: () => void;
}

const PLACEHOLDERS: Record<RecordType, { name: string; content: string; hint: string }> = {
  A: {
    name: '@ or www',
    content: '76.76.21.21',
    hint: 'Points a domain or subdomain to an IPv4 server address.',
  },
  CNAME: {
    name: 'www or blog',
    content: 'cname.vercel-dns.com',
    hint: 'Aliases a subdomain to another hostname (e.g. for Vercel/Netlify hosting).',
  },
  MX: {
    name: '@',
    content: 'route1.mx.cloudflare.net',
    hint: 'Directs incoming email to a mail server. Lower priority numbers are tried first.',
  },
  TXT: {
    name: '@ or _dmarc',
    content: 'v=spf1 include:_spf.mx.cloudflare.net ~all',
    hint: 'Used for domain ownership verification, SPF, DKIM, and DMARC policies.',
  },
};

export default function DnsManagerModal({ orderId, domainName, onClose }: Props) {
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [nameservers, setNameservers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DnsRecord | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);

  // Form state
  const [type, setType] = useState<RecordType>('A');
  const [name, setName] = useState('@');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState(10);
  const [ttl, setTtl] = useState(1);
  const [proxied, setProxied] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/domains/${orderId}/dns`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load DNS records');
      setRecords(data.records || []);
      setNameservers(data.nameservers || []);
    } catch (err: any) {
      setError(err.message || 'Error loading DNS records');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  async function handleAddRecord(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/domains/${orderId}/dns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          name: name.trim() || '@',
          content: content.trim(),
          ttl,
          proxied: type === 'A' || type === 'CNAME' ? proxied : false,
          priority: type === 'MX' ? priority : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add record');

      setRecords((prev) => [data.record, ...prev]);
      setContent('');
      setSuccessMsg(`${type} record added successfully!`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Could not add DNS record');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteRecord(record: DnsRecord) {
    setRecordToDelete(record);
  }

  async function confirmDeleteRecord() {
    if (!recordToDelete) return;
    const record = recordToDelete;
    setDeletingRecord(true);

    try {
      const res = await fetch(
        `/api/domains/${orderId}/dns?recordId=${encodeURIComponent(record.id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      setRecords((prev) => prev.filter((r) => r.id !== record.id));
      setSuccessMsg('Record deleted.');
      setTimeout(() => setSuccessMsg(null), 3000);
      setRecordToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete record');
    } finally {
      setDeletingRecord(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-[#11140F] border border-[#11140F]/15 dark:border-white/15 rounded-2xl shadow-2xl p-5 sm:p-7 space-y-6 text-[#11140F] dark:text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#11140F]/10 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">DNS Management</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
                  {domainName}
                </span>
              </div>
              <p className="text-xs text-[#11140F]/60 dark:text-white/60">
                Manage A, CNAME, MX, and TXT records. Propagation happens within seconds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nameserver Notice */}
        {nameservers.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase font-mono text-[10px]">
                Active Edge Nameservers:
              </span>
              <div className="font-mono text-[#11140F]/80 dark:text-white/80">
                {nameservers.join('  •  ')}
              </div>
            </div>
            <button
              type="button"
              onClick={fetchRecords}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#1A1F16] font-medium hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 shrink-0 cursor-pointer text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
        )}

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Add Record Form */}
        <form
          onSubmit={handleAddRecord}
          className="p-4 sm:p-5 rounded-2xl bg-[#F7F8F5] dark:bg-[#151912] border border-[#11140F]/10 dark:border-white/10 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Add New DNS Record
            </h3>
            <span className="text-[11px] text-[#11140F]/50 dark:text-white/50">
              {PLACEHOLDERS[type].hint}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            {/* Record Type */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#11140F]/70 dark:text-white/70 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value as RecordType);
                  setProxied(false);
                }}
                className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 px-3 py-2 text-xs bg-white dark:bg-[#1C2218] text-[#11140F] dark:text-white outline-none focus:border-emerald-500 font-semibold"
              >
                {ALLOWED_DNS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Name / Host */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-[#11140F]/70 dark:text-white/70 mb-1">
                Name (@ for root)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={PLACEHOLDERS[type].name}
                required
                className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 px-3 py-2 text-xs bg-white dark:bg-[#1C2218] text-[#11140F] dark:text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Content / Target */}
            <div className={type === 'MX' ? 'sm:col-span-4' : 'sm:col-span-5'}>
              <label className="block text-[11px] font-semibold text-[#11140F]/70 dark:text-white/70 mb-1">
                {type === 'A'
                  ? 'IPv4 Address'
                  : type === 'CNAME'
                  ? 'Target Hostname'
                  : type === 'MX'
                  ? 'Mail Server Hostname'
                  : 'TXT Value'}
              </label>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={PLACEHOLDERS[type].content}
                required
                className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 px-3 py-2 text-xs bg-white dark:bg-[#1C2218] text-[#11140F] dark:text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Priority (MX only) */}
            {type === 'MX' && (
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-[#11140F]/70 dark:text-white/70 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  min={0}
                  max={65535}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 px-2.5 py-2 text-xs bg-white dark:bg-[#1C2218] text-[#11140F] dark:text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            )}

            {/* TTL */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-[#11140F]/70 dark:text-white/70 mb-1">
                TTL
              </label>
              <select
                value={ttl}
                disabled={proxied}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 px-3 py-2 text-xs bg-white dark:bg-[#1C2218] text-[#11140F] dark:text-white outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                <option value={1}>Auto</option>
                <option value={60}>1 min</option>
                <option value={300}>5 min</option>
                <option value={3600}>1 hour</option>
              </select>
            </div>
          </div>

          {/* Proxy checkbox & submit button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {type === 'A' || type === 'CNAME' ? (
              <label className="inline-flex items-center gap-2 text-xs text-[#11140F]/80 dark:text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={proxied}
                  onChange={(e) => {
                    setProxied(e.target.checked);
                    if (e.target.checked) setTtl(1);
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium">Edge Proxy (CDN &amp; DDoS protection)</span>
                <span className="text-[11px] text-[#11140F]/40 dark:text-white/40">
                  (Keep OFF for Vercel/Netlify custom domains)
                </span>
              </label>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{submitting ? 'Adding…' : 'Save Record'}</span>
            </button>
          </div>
        </form>

        {/* Existing Records Table */}
        <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 overflow-hidden bg-white dark:bg-[#151912] shadow-2xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#11140F]/10 dark:divide-white/10 text-xs">
              <thead className="bg-[#F7F8F5] dark:bg-white/[0.02] text-left text-[11px] font-mono text-[#11140F]/50 dark:text-white/50 uppercase">
                <tr>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Host / Name</th>
                  <th className="px-4 py-3">Value / Target</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">TTL</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#11140F]/5 dark:divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#11140F]/50 dark:text-white/50">
                      Loading DNS records…
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#11140F]/50 dark:text-white/50">
                      No DNS records found for this domain yet. Add your first record above.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        {rec.type}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#11140F]/80 dark:text-white/80">
                        {rec.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#11140F]/70 dark:text-white/70 max-w-xs truncate">
                        {rec.content}
                      </td>
                      <td className="px-4 py-3">
                        {rec.type === 'MX' ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[10px] font-mono">
                            Priority {rec.priority}
                          </span>
                        ) : rec.type === 'A' || rec.type === 'CNAME' ? (
                          rec.proxied ? (
                            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-300 text-[10px] font-semibold flex items-center gap-1 w-fit">
                              <Shield className="w-2.5 h-2.5" />
                              Proxied
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#11140F]/60 dark:text-white/60 text-[10px] font-mono">
                              DNS Only
                            </span>
                          )
                        ) : (
                          <span className="text-[#11140F]/30 dark:text-white/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#11140F]/60 dark:text-white/60">
                        {rec.ttl === 1 ? 'Auto' : `${rec.ttl}s`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec)}
                          className="p-1 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                          title="Delete DNS record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for DNS Record Deletion */}
      <ConfirmModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={confirmDeleteRecord}
        title={
          recordToDelete?.content.includes('mx.cloudflare.net')
            ? 'Delete Email Forwarding Record?'
            : `Delete ${recordToDelete?.type} Record?`
        }
        description={
          recordToDelete?.content.includes('mx.cloudflare.net')
            ? `Warning: This ${recordToDelete?.type} record powers your custom business email forwarding. Deleting it will immediately stop incoming emails from reaching your inbox.`
            : `Are you sure you want to delete the ${recordToDelete?.type} record pointing "${recordToDelete?.name}" to "${recordToDelete?.content}"?`
        }
        confirmLabel="Yes, Delete Record"
        cancelLabel="Keep Record"
        isDestructive={true}
        loading={deletingRecord}
      />
    </div>
  );
}
