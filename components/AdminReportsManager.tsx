'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Flag, CheckCircle2, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { PlatformAbuseReport, adminUpdateReportStatus } from '@/app/admin/actions';
import PaginationControls from './PaginationControls';

interface AdminReportsManagerProps {
  initialReports: PlatformAbuseReport[];
}

export default function AdminReportsManager({ initialReports = [] }: AdminReportsManagerProps) {
  const [reports, setReports] = useState<PlatformAbuseReport[]>(initialReports);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  const filteredReports = useMemo(
    () =>
      reports.filter((r) => {
        if (filter === 'pending') return r.status === 'pending';
        if (filter === 'resolved') return r.status === 'reviewed' || r.status === 'dismissed';
        return true;
      }),
    [reports, filter]
  );

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredReports.slice(start, start + perPage);
  }, [filteredReports, page, perPage]);

  const handleStatusChange = async (reportId: string, newStatus: 'pending' | 'reviewed' | 'dismissed') => {
    setLoadingId(reportId);
    try {
      const res = await adminUpdateReportStatus(reportId, newStatus);
      if (res.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error('Failed to update report status:', err);
    } finally {
      setLoadingId(null);
    }
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'spam':
        return { label: 'Spam / Commercial Abuse', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' };
      case 'impersonation':
        return { label: 'Impersonation / Fake ID', color: 'bg-red-500/15 text-red-700 border-red-500/30' };
      case 'inappropriate':
        return { label: 'Harmful Content', color: 'bg-purple-500/15 text-purple-700 border-purple-500/30' };
      case 'copyright':
        return { label: 'Copyright / IP', color: 'bg-blue-500/15 text-blue-700 border-blue-500/30' };
      default:
        return { label: reason, color: 'bg-gray-500/15 text-gray-700 border-gray-500/30' };
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0E1017] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#11140F]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Flag className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[16px] text-[#11140F] dark:text-white">
                Trust & Safety Reports
              </h3>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-700 text-[11px] font-bold">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-[#11140F]/50 dark:text-white/50">
              Community flags submitted from public vCards, landing pages, and dynamic QR routes
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 bg-[#11140F]/5 dark:bg-white/[0.06] rounded-xl text-xs">
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white dark:bg-[#1E2330] text-[#11140F] dark:text-white shadow-xs font-semibold'
                : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
            }`}
          >
            All ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('pending');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-white dark:bg-[#1E2330] text-[#11140F] dark:text-white shadow-xs font-semibold'
                : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter('resolved');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filter === 'resolved'
                ? 'bg-white dark:bg-[#1E2330] text-[#11140F] dark:text-white shadow-xs font-semibold'
                : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
            }`}
          >
            Resolved ({reports.length - pendingCount})
          </button>
        </div>
      </div>

      {/* Body */}
      {filteredReports.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-[#11140F] dark:text-white">No abuse reports in this view</p>
          <p className="text-xs text-[#11140F]/50 dark:text-white/50 max-w-sm mx-auto">
            All public digital vCards and dynamic routing links are currently clean with zero outstanding safety flags.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5]/80 dark:bg-white/[0.03] text-[11px] uppercase font-semibold text-[#11140F]/50 dark:text-white/50 tracking-wider">
                <th className="py-3 px-4">Flagged Target</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Details & Reporter</th>
                <th className="py-3 px-4">Reported</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11140F]/5 dark:divide-white/5 text-xs">
              {paginatedReports.map((report) => {
                const badge = getReasonBadge(report.reason);
                const isLoading = loadingId === report.id;

                return (
                  <tr key={report.id} className="hover:bg-[#11140F]/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    {/* Target */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-[#11140F] dark:text-white">{report.targetTitle}</p>
                        <Link
                          href={report.targetUrl}
                          target="_blank"
                          className="font-mono text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <span>{report.targetUrl}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-[11.5px] text-[#11140F]/70 dark:text-white/70 truncate" title={report.details || 'No details provided'}>
                        {report.details || 'Community flag'}
                      </p>
                      <p className="text-[10px] text-[#11140F]/40 dark:text-white/40 font-mono mt-0.5">
                        IP: {report.reporterIp || 'anonymous'}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-[#11140F]/60 dark:text-white/60 font-mono text-[11px]">
                      {new Date(report.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {report.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10.5px] font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Pending</span>
                        </span>
                      ) : report.status === 'reviewed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10.5px] font-semibold">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Reviewed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-600 border border-gray-500/20 text-[10.5px] font-semibold">
                          <XCircle className="w-2.5 h-2.5" />
                          <span>Dismissed</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {report.status !== 'reviewed' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleStatusChange(report.id, 'reviewed')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-500/30 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Mark Reviewed
                          </button>
                        )}
                        {report.status !== 'dismissed' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleStatusChange(report.id, 'dismissed')}
                            className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/10 text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/20 font-medium text-[11px] border border-gray-200 dark:border-white/15 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <PaginationControls
              currentPage={page}
              totalItems={filteredReports.length}
              itemsPerPage={perPage}
              onPageChange={setPage}
              onItemsPerPageChange={setPerPage}
              pageSizeOptions={[10, 25, 50]}
              itemLabel="reports"
            />
          </div>
        </div>
      )}
    </div>
  );
}
