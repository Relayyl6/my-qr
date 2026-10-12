'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface InvocationItem {
  id: string;
  createdAt: Date | string;
  feature: string;
  promptKey: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: any;
  latencyMs: number;
  success: boolean;
  error?: string | null;
}

interface AiInvocationsTableProps {
  invocations: InvocationItem[];
}

export default function AiInvocationsTable({ invocations }: AiInvocationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [featureFilter, setFeatureFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OK' | 'FAIL'>('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvocation, setSelectedInvocation] = useState<InvocationItem | null>(null);

  // Extract unique feature names for the filter dropdown
  const uniqueFeatures = useMemo(() => {
    const set = new Set<string>();
    invocations.forEach((inv) => set.add(inv.feature));
    return Array.from(set).sort();
  }, [invocations]);

  // Filter invocations
  const filteredInvocations = useMemo(() => {
    return invocations.filter((inv) => {
      // Status filter
      if (statusFilter === 'OK' && !inv.success) return false;
      if (statusFilter === 'FAIL' && inv.success) return false;

      // Feature filter
      if (featureFilter !== 'ALL' && inv.feature !== featureFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesFeature = inv.feature.toLowerCase().includes(query);
        const matchesPrompt = inv.promptKey.toLowerCase().includes(query);
        const matchesModel = inv.model.toLowerCase().includes(query);
        const matchesError = inv.error?.toLowerCase().includes(query);
        if (!matchesFeature && !matchesPrompt && !matchesModel && !matchesError) {
          return false;
        }
      }

      return true;
    });
  }, [invocations, searchTerm, featureFilter, statusFilter]);

  // Pagination calculation
  const totalItems = filteredInvocations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedInvocations = filteredInvocations.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 shadow-sm space-y-4">
      {/* Table Header & Interactive Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[#11140F] flex items-center gap-2">
            <span>Recent AI Invocations</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {totalItems} total
            </span>
          </h2>
          <p className="text-[12px] text-[#11140F]/50 mt-0.5">
            Paginated audit trail of real-time model requests, costs, and latencies
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#11140F]/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search prompt, model..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-[#11140F]/15 text-[12px] bg-slate-50/50 focus:bg-white focus:border-[#11140F] outline-none transition-colors w-40 sm:w-48"
            />
          </div>

          {/* Feature Filter Dropdown */}
          <select
            value={featureFilter}
            onChange={(e) => {
              setFeatureFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#11140F]/15 text-[12px] bg-slate-50/50 text-[#11140F] outline-none cursor-pointer"
          >
            <option value="ALL">All Features</option>
            {uniqueFeatures.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#11140F]/15 text-[12px] bg-slate-50/50 text-[#11140F] outline-none cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="OK">OK Only</option>
            <option value="FAIL">Errors Only</option>
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#11140F]/15 text-[12px] bg-slate-50/50 text-[#11140F] outline-none cursor-pointer font-mono"
            title="Rows per page"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {/* Contained Scroll Table */}
      <div className="border border-[#11140F]/10 rounded-xl overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="sticky top-0 bg-[#F7F8F5] z-10 border-b border-[#11140F]/10">
              <tr className="text-[#11140F]/60 font-semibold uppercase text-[10.5px]">
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Feature / Prompt</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Tokens (In/Out)</th>
                <th className="py-2.5 px-3">Cost</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11140F]/5">
              {paginatedInvocations.map((inv) => (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => setSelectedInvocation(inv)}
                >
                  <td className="py-2 px-3 text-[#11140F]/60 whitespace-nowrap font-mono text-[11px]">
                    {new Date(inv.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="py-2 px-3 font-mono">
                    <span className="font-semibold text-[#11140F] block truncate max-w-[180px]">
                      {inv.feature}
                    </span>
                    <span className="text-[10.5px] text-[#11140F]/50 block truncate max-w-[180px]">
                      {inv.promptKey}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-[#11140F]/70 text-[11.5px] whitespace-nowrap">
                    {inv.model}
                  </td>
                  <td className="py-2 px-3 font-mono whitespace-nowrap text-[11.5px]">
                    {inv.inputTokens} / {inv.outputTokens}
                  </td>
                  <td className="py-2 px-3 font-mono text-emerald-700 font-semibold whitespace-nowrap text-[11.5px]">
                    ${Number(inv.costUsd).toFixed(5)}
                  </td>
                  <td className="py-2 px-3 font-mono text-[#11140F]/80 whitespace-nowrap text-[11.5px]">
                    {inv.latencyMs}ms
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    {inv.success ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        OK
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10.5px] font-semibold"
                        title={inv.error || ''}
                      >
                        <XCircle className="w-3 h-3 text-red-600" />
                        FAIL
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvocation(inv);
                      }}
                      className="p-1 rounded-lg hover:bg-[#11140F]/5 text-[#11140F]/50 hover:text-[#11140F]"
                      title="View details"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedInvocations.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#11140F]/40 text-[13px]">
                    No invocations match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-[12px] pt-1 border-t border-[#11140F]/5">
        <span className="text-[#11140F]/60">
          Showing <strong className="text-[#11140F]">{totalItems > 0 ? startIndex + 1 : 0}</strong>–
          <strong className="text-[#11140F]">
            {Math.min(startIndex + pageSize, totalItems)}
          </strong>{' '}
          of <strong className="text-[#11140F]">{totalItems}</strong> invocations
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePageChange(safeCurrentPage - 1)}
            disabled={safeCurrentPage <= 1}
            className="p-1.5 rounded-lg border border-[#11140F]/10 hover:bg-[#11140F]/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono px-2 text-[11.5px] text-[#11140F]/80">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(safeCurrentPage + 1)}
            disabled={safeCurrentPage >= totalPages}
            className="p-1.5 rounded-lg border border-[#11140F]/10 hover:bg-[#11140F]/5 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invocation Details Modal */}
      {selectedInvocation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedInvocation(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                  <span>Invocation Telemetry</span>
                  {selectedInvocation.success ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-semibold">
                      SUCCESS
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10.5px] font-semibold">
                      FAILED
                    </span>
                  )}
                </h3>
                <p className="text-[11.5px] font-mono text-slate-500 mt-0.5">
                  ID: {selectedInvocation.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvocation(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12.5px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block uppercase">Feature</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {selectedInvocation.feature}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block uppercase">Model</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {selectedInvocation.model}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block uppercase">Tokens (In / Out)</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {selectedInvocation.inputTokens} / {selectedInvocation.outputTokens}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-medium text-slate-500 block uppercase">Latency / Cost</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {selectedInvocation.latencyMs}ms / ${Number(selectedInvocation.costUsd).toFixed(5)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-500 block uppercase">Prompt Key</span>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[12px] text-slate-800">
                {selectedInvocation.promptKey}
              </div>
            </div>

            {selectedInvocation.error && (
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-red-600 block uppercase font-semibold">
                  Error Details
                </span>
                <div className="p-3 rounded-xl bg-red-50/70 border border-red-200 text-red-800 font-mono text-[11.5px] max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {selectedInvocation.error}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInvocation(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
