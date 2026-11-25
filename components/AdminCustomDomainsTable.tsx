'use client';

import React, { useMemo, useState } from 'react';
import { Globe, Search } from 'lucide-react';
import AdminDomainRow from './AdminDomainRow';
import PaginationControls from './PaginationControls';

interface CustomDomainItem {
  id: string;
  domain: string;
  status: string;
  cnameTarget: string;
  verificationTxt: string;
  createdAt: Date | string;
  user: { email: string } | null;
}

export default function AdminCustomDomainsTable({ domains }: { domains: CustomDomainItem[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return domains;
    return domains.filter(
      (d) =>
        d.domain.toLowerCase().includes(q) ||
        (d.user?.email || '').toLowerCase().includes(q)
    );
  }, [domains, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  return (
    <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0E1017] overflow-hidden shadow-xs space-y-0">
      <div className="p-5 border-b border-[#11140F]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-[16px] text-[#11140F] dark:text-white">
              Branded Custom Domains ({domains.length})
            </h3>
            <p className="text-[12.5px] text-[#11140F]/50 dark:text-white/50">
              Instant verification override for customer domains without waiting for DNS propagation
            </p>
          </div>
        </div>

        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#11140F]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search domain or owner…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/10 bg-[#F7F8F5] dark:bg-white/[0.04] text-xs text-[#11140F] dark:text-white outline-none focus:border-[#2F6B4F]"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5]/80 dark:bg-white/[0.03] text-[11.5px] uppercase font-semibold text-[#11140F]/50 dark:text-white/50 tracking-wider">
              <th className="py-3 px-4">Custom Domain</th>
              <th className="py-3 px-4">Owner Email</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">CNAME Target</th>
              <th className="py-3 px-4 text-right">Sovereign Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-[#11140F]/50 dark:text-white/50">
                  No custom domains found.
                </td>
              </tr>
            ) : (
              paginated.map((d) => <AdminDomainRow key={d.id} domain={d as any} />)
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div className="px-5 pb-4">
          <PaginationControls
            currentPage={page}
            totalItems={filtered.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={setPerPage}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="domains"
          />
        </div>
      )}
    </div>
  );
}
