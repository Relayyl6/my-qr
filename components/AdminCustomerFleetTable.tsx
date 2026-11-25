'use client';

import React, { useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import AdminUserRow from './AdminUserRow';
import PaginationControls from './PaginationControls';

interface CustomerUserItem {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  createdAt: Date | string;
  stripeCustomerId: string | null;
  isDeactivated?: boolean;
  deactivatedAt?: Date | string | null;
  _count: { links: number };
}

export default function AdminCustomerFleetTable({
  users,
  adminEmail,
}: {
  users: CustomerUserItem[];
  adminEmail: string;
}) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro' | 'plus' | 'ultra'>('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (tierFilter !== 'all' && u.tier.toLowerCase() !== tierFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, tierFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredUsers.slice(start, start + perPage);
  }, [filteredUsers, page, perPage]);

  return (
    <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0E1017] overflow-hidden shadow-xs space-y-0">
      <div className="p-5 border-b border-[#11140F]/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[16px] text-[#11140F] dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Customer Fleet Directory ({users.length})</span>
          </h3>
          <p className="text-[12.5px] text-[#11140F]/50 dark:text-white/50">
            Manage user subscription tiers, inspect links, and adjust AI compute budgets directly.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#11140F]/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search email or name…"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/10 bg-[#F7F8F5] dark:bg-white/[0.04] text-xs text-[#11140F] dark:text-white outline-none focus:border-[#2F6B4F]"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value as any);
              setPage(1);
            }}
            className="px-2.5 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/10 bg-[#F7F8F5] dark:bg-white/[0.04] text-xs text-[#11140F] dark:text-white outline-none cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="plus">Plus</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5]/80 dark:bg-white/[0.03] text-[11.5px] uppercase font-semibold text-[#11140F]/50 dark:text-white/50 tracking-wider">
              <th className="py-3 px-4">Customer Email</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4">Current Plan</th>
              <th className="py-3 px-4">Link Fleet</th>
              <th className="py-3 px-4">Billing Status</th>
              <th className="py-3 px-4 text-right">Sovereign Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-[#11140F]/50">
                  No customer accounts match your filter.
                </td>
              </tr>
            ) : (
              paginated.map((u) => (
                <AdminUserRow
                  key={u.id}
                  user={u as any}
                  isSelf={u.email.toLowerCase() === adminEmail}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > 0 && (
        <div className="px-5 pb-4">
          <PaginationControls
            currentPage={page}
            totalItems={filteredUsers.length}
            itemsPerPage={perPage}
            onPageChange={setPage}
            onItemsPerPageChange={setPerPage}
            pageSizeOptions={[10, 25, 50]}
            itemLabel="customers"
          />
        </div>
      )}
    </div>
  );
}
