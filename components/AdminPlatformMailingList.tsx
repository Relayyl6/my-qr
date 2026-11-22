'use client';

import React, { useState, useTransition } from 'react';
import {
  Mail,
  Search,
  Plus,
  Trash2,
  Edit2,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  X,
} from 'lucide-react';
import {
  adminAddPlatformSubscriber,
  adminUpdatePlatformSubscriber,
  adminDeletePlatformSubscriber,
} from '@/app/admin/actions';
import ConfirmModal from '@/components/ConfirmModal';

export interface PlatformSubscriberItem {
  id: string;
  email: string;
  firstName: string | null;
  status: string;
  source: string;
  consentAt: Date | string;
  confirmedAt: Date | string | null;
  createdAt: Date | string;
}

interface Props {
  initialSubscribers: PlatformSubscriberItem[];
}

export default function AdminPlatformMailingList({ initialSubscribers }: Props) {
  const [subscribers, setSubscribers] = useState<PlatformSubscriberItem[]>(initialSubscribers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed' | 'pending'>('all');
  const [isPending, startTransition] = useTransition();

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PlatformSubscriberItem | null>(null);
  const [subscriberToDelete, setSubscriberToDelete] = useState<{ id: string; email: string } | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtered subscribers
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      sub.email.toLowerCase().includes(query) ||
      (sub.firstName && sub.firstName.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const handleOpenAdd = () => {
    setFormEmail('');
    setFormName('');
    setFormStatus('active');
    setErrorMsg(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: PlatformSubscriberItem) => {
    setEditingItem(item);
    setFormEmail(item.email);
    setFormName(item.firstName || '');
    setFormStatus(item.status);
    setErrorMsg(null);
    setShowEditModal(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) return;

    startTransition(async () => {
      try {
        const res = await adminAddPlatformSubscriber({
          email: formEmail.trim(),
          firstName: formName.trim() || undefined,
          status: formStatus,
        });
        if (res.success && res.subscriber) {
          const newSub: PlatformSubscriberItem = {
            id: res.subscriber.id,
            email: res.subscriber.email,
            firstName: res.subscriber.firstName,
            status: res.subscriber.status,
            source: res.subscriber.source,
            consentAt: res.subscriber.consentAt,
            confirmedAt: res.subscriber.confirmedAt,
            createdAt: res.subscriber.createdAt,
          };
          setSubscribers((prev) => [newSub, ...prev.filter((s) => s.id !== newSub.id)]);
          setShowAddModal(false);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to add subscriber');
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !formEmail.trim()) return;

    startTransition(async () => {
      try {
        const res = await adminUpdatePlatformSubscriber({
          id: editingItem.id,
          email: formEmail.trim(),
          firstName: formName.trim() || undefined,
          status: formStatus,
        });
        if (res.success && res.subscriber) {
          setSubscribers((prev) =>
            prev.map((s) =>
              s.id === editingItem.id
                ? {
                    ...s,
                    email: res.subscriber.email,
                    firstName: res.subscriber.firstName,
                    status: res.subscriber.status,
                  }
                : s
            )
          );
          setShowEditModal(false);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to update subscriber');
      }
    });
  };

  const handleDelete = (id: string, email: string) => {
    setSubscriberToDelete({ id, email });
  };

  const executeDelete = () => {
    if (!subscriberToDelete) return;
    const { id } = subscriberToDelete;

    startTransition(async () => {
      try {
        await adminDeletePlatformSubscriber(id);
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        setSubscriberToDelete(null);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete subscriber');
        setSubscriberToDelete(null);
      }
    });
  };

  const handleExportCsv = () => {
    const headers = ['Email', 'Name', 'Status', 'Source', 'Date Added'];
    const rows = filteredSubscribers.map((s) => [
      `"${s.email}"`,
      `"${s.firstName || ''}"`,
      `"${s.status}"`,
      `"${s.source}"`,
      `"${new Date(s.createdAt).toISOString()}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `platform_subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-lg border border-[#11140F]/10 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#11140F]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#2F6B4F]" />
            <h3 className="font-semibold text-[16px] text-[#11140F]">
              Platform Mailing List ({subscribers.length})
            </h3>
          </div>
          <p className="text-[12.5px] text-[#11140F]/60 mt-0.5">
            Registered accounts, newsletter subscribers, and platform announcement recipients.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredSubscribers.length === 0}
            className="px-3 py-1.5 rounded-md border border-[#11140F]/15 bg-white text-xs font-medium text-[#11140F] hover:bg-[#F7F8F5] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subscriber</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#F7F8F5] border-b border-[#11140F]/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#11140F]/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-[#11140F]/15 bg-white text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto">
          {(['all', 'active', 'unsubscribed', 'pending'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#11140F] text-white'
                  : 'text-[#11140F]/60 hover:text-[#11140F] hover:bg-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#11140F]/10 bg-white text-[11px] uppercase font-semibold text-[#11140F]/50 tracking-wider">
              <th className="py-2.5 px-4">Email</th>
              <th className="py-2.5 px-4">Name</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Source</th>
              <th className="py-2.5 px-4">Joined</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#11140F]/5 text-xs text-[#11140F]">
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#11140F]/50">
                  No subscribers match your search or filter.
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#F7F8F5]/60 transition-colors">
                  <td className="py-3 px-4 font-medium text-[#11140F]">{sub.email}</td>
                  <td className="py-3 px-4 text-[#11140F]/70">{sub.firstName || '—'}</td>
                  <td className="py-3 px-4">
                    {sub.status === 'active' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    )}
                    {sub.status === 'unsubscribed' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                        <XCircle className="w-3 h-3" />
                        Unsubscribed
                      </span>
                    )}
                    {sub.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[11px] font-mono text-[#11140F]/60 capitalize">
                    {sub.source}
                  </td>
                  <td className="py-3 px-4 text-[11px] text-[#11140F]/50">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="p-1 rounded-md text-[#11140F]/60 hover:text-[#11140F] hover:bg-[#EEF0EA] transition-colors cursor-pointer"
                        title="Edit subscriber"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(sub.id, sub.email)}
                        className="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove subscriber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-lg p-5 border border-[#11140F]/15 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#11140F]/10">
              <h4 className="font-semibold text-sm text-[#11140F]">Add Platform Subscriber</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#11140F]/40 hover:text-[#11140F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-md bg-red-50 text-red-700 text-xs">{errorMsg}</div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Name (Optional)</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Alex Doe"
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                >
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Subscriber</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-lg p-5 border border-[#11140F]/15 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#11140F]/10">
              <h4 className="font-semibold text-sm text-[#11140F]">Edit Platform Subscriber</h4>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-[#11140F]/40 hover:text-[#11140F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-md bg-red-50 text-red-700 text-xs">{errorMsg}</div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                >
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Subscriber</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Centered Mobile-Responsive Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!subscriberToDelete}
        onClose={() => setSubscriberToDelete(null)}
        onConfirm={executeDelete}
        title="Remove Platform Subscriber?"
        description={`Are you sure you want to remove "${subscriberToDelete?.email}" from the platform mailing list?`}
        confirmLabel="Remove Subscriber"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={isPending}
      />
    </div>
  );
}
