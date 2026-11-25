'use client';

import React, { useMemo, useState } from 'react';
import { Globe, RefreshCw, CheckCircle2, Clock, Mail, Search, Trash2 } from 'lucide-react';
import { adminRetryDomainProvision, adminDeleteDomainOrder } from '@/app/domains-actions';
import PaginationControls from './PaginationControls';

interface AdminDomainOrder {
  id: string;
  userEmail: string;
  domainName: string;
  desiredAlias: string;
  wholesaleUsd: number;
  totalPaidNgn: number;
  platformMarkupNgn: number;
  paystackRef: string;
  status: string;
  cloudflareZoneId: string | null;
  nameservers: string[];
  errorMessage: string | null;
  createdAt: Date | string;
}

export default function AdminDomainOrdersManager({ initialOrders }: { initialOrders: AdminDomainOrder[] }) {
  const [orders, setOrders] = useState<AdminDomainOrder[]>(initialOrders);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; success: boolean } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.domainName.toLowerCase().includes(q) ||
        o.userEmail.toLowerCase().includes(q) ||
        o.paystackRef.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredOrders.slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  const handleRetry = async (orderId: string) => {
    setRetryingId(orderId);
    setFeedback(null);
    try {
      const res = await adminRetryDomainProvision(orderId);
      if (res.success && res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? (res.order as any) : o)));
        setFeedback({ id: orderId, msg: 'Provisioned successfully!', success: true });
      } else {
        setFeedback({ id: orderId, msg: res.message || 'Retry failed', success: false });
      }
    } catch (e: any) {
      setFeedback({ id: orderId, msg: e.message || 'Error occurred', success: false });
    } finally {
      setRetryingId(null);
    }
  };

  const handleDelete = async (orderId: string, domainName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the domain order for "${domainName}"?`)) return;
    setDeletingId(orderId);
    setFeedback(null);
    try {
      const res = await adminDeleteDomainOrder(orderId);
      if (res.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setFeedback({ id: orderId, msg: res.message || 'Delete failed', success: false });
      }
    } catch (e: any) {
      setFeedback({ id: orderId, msg: e.message || 'Error occurred', success: false });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ACTIVE
          </span>
        );
      case 'PROVISIONING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[11px] font-bold animate-pulse">
            <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
            PROVISIONING
          </span>
        );
      case 'PAID_AWAITING_FUNDS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold">
            <Clock className="w-3 h-3 text-amber-500" />
            PAID (WAITING RESELLER TOPUP)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20 text-[11px] font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/10 bg-white overflow-hidden shadow-xs space-y-0">
      <div className="p-5 border-b border-[#11140F]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-[16px] text-[#11140F]">
              NameLaunch Registrar & Custom Email Fleet ({orders.length})
            </h3>
          </div>
          <p className="text-[12.5px] text-[#11140F]/50 mt-0.5">
            Domain registrations, managed DNS zones, and automated email forwarding provisioning.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#11140F]/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search domain or email…"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#11140F]/15 bg-[#F7F8F5] text-xs text-[#11140F] outline-none focus:border-[#2F6B4F]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#11140F]/15 bg-[#F7F8F5] text-xs text-[#11140F] outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID_AWAITING_FUNDS">Paid Awaiting Funds</option>
            <option value="PROVISIONING">Provisioning</option>
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#11140F]/60">
          {orders.length === 0
            ? 'No domain orders processed yet. Customers can search and buy domains directly in Domains.'
            : 'No domain orders match your filter.'}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#11140F]/10 bg-[#F7F8F5]/80 text-[11.5px] uppercase font-semibold text-[#11140F]/50 tracking-wider">
                  <th className="py-3 px-4">Domain & Email</th>
                  <th className="py-3 px-4">Customer Email</th>
                  <th className="py-3 px-4">Paid (NGN)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">DNS Zone</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((o) => (
                <tr key={o.id} className="border-b border-[#11140F]/5 hover:bg-[#F7F8F5]/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-sm text-[#11140F]">{o.domainName}</div>
                    <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" />
                      <span>{o.desiredAlias}@{o.domainName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-[#11140F]/80">
                    {o.userEmail}
                    <div className="text-[10px] text-[#11140F]/40 font-mono mt-0.5">Ref: {o.paystackRef}</div>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-[#11140F]">
                    ₦{o.totalPaidNgn?.toLocaleString()}
                    <div className="text-[10px] text-emerald-700 font-normal">Markup: +₦{o.platformMarkupNgn}</div>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(o.status)}
                    {o.errorMessage && (
                      <div className="text-[10.5px] text-red-600 max-w-xs truncate mt-1" title={o.errorMessage}>
                        {o.errorMessage}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-[#11140F]/70">
                    {o.cloudflareZoneId ? (
                      <span className="truncate max-w-[140px] block" title={o.cloudflareZoneId}>
                        {o.cloudflareZoneId}
                      </span>
                    ) : (
                      <span className="text-[#11140F]/40 italic">None yet</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {o.status !== 'ACTIVE' && (
                        <button
                          type="button"
                          disabled={retryingId === o.id || deletingId === o.id}
                          onClick={() => handleRetry(o.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${retryingId === o.id ? 'animate-spin' : ''}`} />
                          <span>{retryingId === o.id ? 'Retrying...' : 'Retry Provision'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={deletingId === o.id || retryingId === o.id}
                        onClick={() => handleDelete(o.id, o.domainName)}
                        className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Domain Order"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {feedback && feedback.id === o.id && (
                      <div
                        className={`text-[10.5px] mt-1 font-medium ${
                          feedback.success ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {feedback.msg}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 pb-4">
          <PaginationControls
            currentPage={page}
            totalItems={filteredOrders.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={setPerPage}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="orders"
          />
        </div>
      </>
      )}
    </div>
  );
}
