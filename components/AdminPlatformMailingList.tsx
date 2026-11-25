'use client';

import React, { useState, useRef, useTransition } from 'react';
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
  Send,
  Radio,
  Eye,
  Smartphone,
  Monitor,
  Bold,
  Italic,
  Link2,
  List,
  Sparkles,
  AlertCircle,
  History,
  Users,
} from 'lucide-react';
import {
  adminAddPlatformSubscriber,
  adminUpdatePlatformSubscriber,
  adminDeletePlatformSubscriber,
  adminSendPlatformBroadcast,
  adminDeletePlatformCampaign,
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

export interface PlatformBroadcastItem {
  id: string;
  subject: string;
  preheader?: string | null;
  bodyHtml: string;
  status: string;
  sentAt?: Date | string | null;
  recipientCount: number;
  deliveredCount?: number;
  sentVia?: string;
  recipients?: any;
  createdAt: Date | string;
}

interface Props {
  initialSubscribers: PlatformSubscriberItem[];
  initialBroadcasts?: PlatformBroadcastItem[];
  adminEmail?: string;
}

// Convert plain newlines into clean HTML paragraphs if not already wrapped
function formatBodyHtml(raw: string): string {
  if (/<(p|div|br|h1|h2|h3|ul|ol|table)/i.test(raw)) {
    return raw;
  }
  return raw
    .split(/\n\s*\n/)
    .map((para) => `<p style="margin:0 0 16px 0;line-height:1.6;">${para.replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export default function AdminPlatformMailingList({
  initialSubscribers,
  initialBroadcasts = [],
  adminEmail = '',
}: Props) {
  const [subscribers, setSubscribers] = useState<PlatformSubscriberItem[]>(initialSubscribers);
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcastItem[]>(initialBroadcasts);
  const [activeTab, setActiveTab] = useState<'subscribers' | 'broadcasts'>('subscribers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed' | 'pending'>('all');
  const [isPending, startTransition] = useTransition();

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Subscriber Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PlatformSubscriberItem | null>(null);
  const [subscriberToDelete, setSubscriberToDelete] = useState<{ id: string; email: string } | null>(null);

  // Form states for Subscriber
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('active');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Broadcast Composer State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [testEmail, setTestEmail] = useState(adminEmail);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);
  const [confirmBroadcastOpen, setConfirmBroadcastOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Broadcast Inspection & Deletion
  const [inspectingBroadcast, setInspectingBroadcast] = useState<PlatformBroadcastItem | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<PlatformBroadcastItem | null>(null);

  const activeSubscribersCount = subscribers.filter((s) => s.status === 'active').length;

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

  // Filtered broadcasts
  const filteredBroadcasts = broadcasts.filter((b) => {
    const query = search.trim().toLowerCase();
    return !query || b.subject.toLowerCase().includes(query);
  });

  // Insert Rich Tag helper for composer
  const insertFormat = (before: string, after: string = '', defaultText: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = broadcastBody.substring(start, end) || defaultText;
    const replacement = `${before}${selected}${after}`;
    const newBody = broadcastBody.substring(0, start) + replacement + broadcastBody.substring(end);
    setBroadcastBody(newBody);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 10);
  };

  // Quick Preset Templates
  const PRESET_TEMPLATES = [
    {
      name: '🚀 Product Release',
      subject: 'Platform Update: New Features & Performance Upgrades',
      body: `Hello {{first_name}},\n\nWe have just released an exciting new set of features on DynamicQR to give you even deeper scan analytics and seamless QR workflows.\n\n<b>What's New:</b>\n• Enhanced AI Scan Intelligence\n• Instant Domain Routing\n• High-Precision Print Exports\n\nLog in today to explore the updates: <a href="{{site_url}}" style="color:#2F6B4F;font-weight:700;">Open DynamicQR</a>\n\nWarm regards,\nThe DynamicQR Team`,
    },
    {
      name: '📣 Platform Notice',
      subject: 'Important Service Update from DynamicQR',
      body: `Hello {{first_name}},\n\nWe are writing to share a brief operational update regarding our platform infrastructure.\n\nAll services remain fully functional with 99.9% uptime. If you notice any brief maintenance notifications, no action is needed on your dynamic links or campaigns.\n\nThank you for choosing DynamicQR.`,
    },
    {
      name: '🎁 Special Offer',
      subject: 'Exclusive DynamicQR Upgrade Offer (Limited Time)',
      body: `Hello {{first_name}},\n\nFor a limited time, upgrade to DynamicQR Plus or Ultra to unlock unlimited dynamic QR links, sovereign branded custom domains, and physical print studio exports.\n\nClaim your special upgrade pricing now: <a href="{{site_url}}/pricing" style="color:#2F6B4F;font-weight:700;">View Upgrade Plans</a>\n\nBest,\nThe DynamicQR Team`,
    },
  ];

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

  const handleOpenBroadcastModal = () => {
    setFeedback(null);
    setErrorMsg(null);
    setShowBroadcastModal(true);
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
          setFeedback({ type: 'success', message: `Subscriber ${newSub.email} added successfully.` });
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
          setFeedback({ type: 'success', message: `Subscriber updated.` });
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
        setFeedback({ type: 'success', message: 'Subscriber removed.' });
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete subscriber');
        setSubscriberToDelete(null);
      }
    });
  };

  // Test send to a single address
  const handleSendTestEmail = async () => {
    if (!testEmail?.trim()) {
      setErrorMsg('Please enter an email address for the test send.');
      return;
    }
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      setErrorMsg('Please enter a subject line and email body before sending a test.');
      return;
    }

    setSendingTest(true);
    setErrorMsg(null);
    try {
      const res = await adminSendPlatformBroadcast({
        subject: broadcastSubject.trim(),
        bodyHtml: formatBodyHtml(broadcastBody.trim()),
        testEmail: testEmail.trim(),
      });
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Test email dispatched to ${res.recipient}. Check your inbox!`,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send test email.');
    } finally {
      setSendingTest(false);
    }
  };

  // Live platform broadcast dispatch
  const executeBroadcast = async () => {
    setConfirmBroadcastOpen(false);
    setSendingBroadcast(true);
    setErrorMsg(null);
    try {
      const res = await adminSendPlatformBroadcast({
        subject: broadcastSubject.trim(),
        bodyHtml: formatBodyHtml(broadcastBody.trim()),
      });

      if (res.success && res.campaignId) {
        const newCampaign: PlatformBroadcastItem = {
          id: res.campaignId,
          subject: broadcastSubject.trim(),
          bodyHtml: formatBodyHtml(broadcastBody.trim()),
          status: 'sent',
          sentAt: new Date(),
          recipientCount: res.sentCount || 0,
          sentVia: res.provider || 'gmail',
          createdAt: new Date(),
        };

        setBroadcasts((prev) => [newCampaign, ...prev]);
        setShowBroadcastModal(false);
        setBroadcastSubject('');
        setBroadcastBody('');
        setActiveTab('broadcasts');
        setFeedback({
          type: 'success',
          message: `Platform broadcast dispatched to ${res.sentCount} active subscribers via ${res.provider}!`,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch platform broadcast.');
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to dispatch platform broadcast.',
      });
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Campaign Deletion
  const executeDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    const { id } = campaignToDelete;
    startTransition(async () => {
      try {
        await adminDeletePlatformCampaign(id);
        setBroadcasts((prev) => prev.filter((b) => b.id !== id));
        setCampaignToDelete(null);
        setFeedback({ type: 'success', message: 'Broadcast campaign deleted from history.' });
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete campaign');
        setCampaignToDelete(null);
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
    <div className="rounded-2xl border border-[#11140F]/10 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#11140F]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#2F6B4F]" />
            <h3 className="font-semibold text-[16px] text-[#11140F]">
              Platform Mailing List & Broadcasts
            </h3>
          </div>
          <p className="text-[12.5px] text-[#11140F]/60 mt-0.5">
            Registered accounts, newsletter subscribers, and platform-wide email announcements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Send Broadcast Button */}
          <button
            type="button"
            onClick={handleOpenBroadcastModal}
            className="px-3.5 py-1.5 rounded-lg bg-[#2F6B4F] text-white text-xs font-semibold hover:bg-[#25553E] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Compose and dispatch platform broadcast"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Broadcast</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredSubscribers.length === 0}
            className="px-3 py-1.5 rounded-lg border border-[#11140F]/15 bg-white text-xs font-medium text-[#11140F] hover:bg-[#F7F8F5] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 rounded-lg bg-[#11140F] text-white text-xs font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Subscriber</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[#11140F]/40 hover:text-[#11140F] p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tabs Row: Subscribers vs Broadcast History */}
      <div className="flex items-center border-b border-[#11140F]/10 px-5 bg-[#FBFBFA]">
        <button
          type="button"
          onClick={() => setActiveTab('subscribers')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'subscribers'
              ? 'border-[#2F6B4F] text-[#2F6B4F]'
              : 'border-transparent text-[#11140F]/60 hover:text-[#11140F]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Subscribers ({subscribers.length})</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 font-mono font-bold">
            {activeSubscribersCount} Active
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('broadcasts')}
          className={`py-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'broadcasts'
              ? 'border-[#2F6B4F] text-[#2F6B4F]'
              : 'border-transparent text-[#11140F]/60 hover:text-[#11140F]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Broadcast History ({broadcasts.length})</span>
        </button>
      </div>

      {/* TAB 1: SUBSCRIBERS TABLE */}
      {activeTab === 'subscribers' && (
        <>
          {/* Filter and Search Bar */}
          <div className="p-3 bg-[#F7F8F5] border-b border-[#11140F]/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#11140F]/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or name..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#11140F]/15 bg-white text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
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
                            className="p-1.5 rounded-md text-[#11140F]/60 hover:text-[#11140F] hover:bg-[#EEF0EA] transition-colors cursor-pointer"
                            title="Edit subscriber"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sub.id, sub.email)}
                            className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
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
        </>
      )}

      {/* TAB 2: BROADCAST CAMPAIGNS HISTORY */}
      {activeTab === 'broadcasts' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#11140F]/10 bg-white text-[11px] uppercase font-semibold text-[#11140F]/50 tracking-wider">
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Audience Sent</th>
                <th className="py-2.5 px-4">Provider</th>
                <th className="py-2.5 px-4">Dispatched At</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#11140F]/5 text-xs text-[#11140F]">
              {filteredBroadcasts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#11140F]/50 space-y-2">
                    <Radio className="w-6 h-6 mx-auto text-[#11140F]/30" />
                    <p className="font-medium text-sm">No platform broadcasts sent yet</p>
                    <p className="text-xs text-[#11140F]/40 max-w-sm mx-auto">
                      Click the &ldquo;Send Broadcast&rdquo; button above to compose and dispatch your first announcement to all platform subscribers.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBroadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F7F8F5]/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#11140F] max-w-xs truncate">
                      {b.subject}
                    </td>
                    <td className="py-3 px-4">
                      {b.status === 'sent' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Sent
                        </span>
                      )}
                      {b.status === 'sending' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Sending...
                        </span>
                      )}
                      {b.status === 'draft' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11.5px]">
                      <strong>{b.recipientCount}</strong> {b.recipientCount === 1 ? 'recipient' : 'recipients'}
                    </td>
                    <td className="py-3 px-4 text-[11px] font-mono text-[#11140F]/60 uppercase">
                      {b.sentVia || 'gmail'}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-[#11140F]/50">
                      {b.sentAt ? new Date(b.sentAt).toLocaleString() : new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectingBroadcast(b)}
                          className="p-1.5 rounded-md text-[#11140F]/60 hover:text-[#11140F] hover:bg-[#EEF0EA] transition-colors cursor-pointer"
                          title="View Broadcast Details & Audit Log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCampaignToDelete(b)}
                          className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Broadcast Log"
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
      )}

      {/* ================================================================= */}
      {/* PLATFORM BROADCAST COMPOSER MODAL                                */}
      {/* ================================================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-[#101211] rounded-2xl p-6 border border-[#11140F]/15 dark:border-white/12 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 text-[#11140F] dark:text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#2F6B4F]/10 dark:bg-[#34D399]/15 text-[#2F6B4F] dark:text-[#34D399] flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-[#11140F] dark:text-white">Platform-Wide Email Broadcast</h4>
                  <p className="text-[12px] text-[#11140F]/60 dark:text-white/55">
                    Dispatch sovereign platform updates to all active platform subscribers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="text-[#11140F]/40 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Audience Banner */}
            <div className="p-3 rounded-xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399]" />
                <span className="text-xs text-[#11140F] dark:text-white">
                  Audience: <strong>{activeSubscribersCount} active platform subscriber(s)</strong>
                </span>
              </div>
              {activeSubscribersCount === 0 && (
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/25">
                  ⚠️ No active subscribers found
                </span>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 text-xs border border-red-200 dark:border-red-500/25 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Preset Templates */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-[#11140F]/50 dark:text-white/50 uppercase tracking-wider">
                Quick Template Presets
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      setBroadcastSubject(tmpl.subject);
                      setBroadcastBody(tmpl.body);
                    }}
                    className="p-2 rounded-xl border border-[#11140F]/10 dark:border-white/12 bg-[#F7F8F5] dark:bg-white/[0.04] hover:border-[#2F6B4F] dark:hover:border-[#34D399] text-left text-xs font-medium text-[#11140F] dark:text-white transition-all cursor-pointer"
                  >
                    <span className="block font-semibold">{tmpl.name}</span>
                    <span className="text-[10.5px] text-[#11140F]/50 dark:text-white/45">Click to apply</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Composer Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#11140F] dark:text-white/90 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Major Platform Update: Sovereign QR Routing 2.0"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-black/40 text-xs text-[#11140F] dark:text-white placeholder:text-[#11140F]/35 dark:placeholder:text-white/30 focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                />
              </div>

              {/* Formatting Toolbar */}
              <div>
                <div className="flex items-center justify-between pb-1 text-xs">
                  <label className="font-semibold text-[#11140F] dark:text-white/90">Email Content *</label>
                  <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-[11px] font-semibold text-[#2F6B4F] dark:text-[#34D399] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showPreview ? 'Hide Preview' : 'Show Live Preview'}</span>
                  </button>
                </div>

                <div className="rounded-t-xl bg-[#F7F8F5] dark:bg-white/[0.04] border border-b-0 border-[#11140F]/15 dark:border-white/12 p-1.5 flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => insertFormat('<b>', '</b>', 'bold text')}
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-white/10 text-[#11140F]/70 dark:text-white/75 hover:text-[#11140F] dark:hover:text-white text-xs font-bold"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('<i>', '</i>', 'italic text')}
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-white/10 text-[#11140F]/70 dark:text-white/75 hover:text-[#11140F] dark:hover:text-white text-xs italic"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertFormat(
                        '<a href="https://example.com" style="color:#2F6B4F;font-weight:700;">',
                        '</a>',
                        'link text'
                      )
                    }
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-white/10 text-[#11140F]/70 dark:text-white/75 hover:text-[#11140F] dark:hover:text-white text-xs"
                    title="Hyperlink"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('• ', '\n', 'List item')}
                    className="p-1.5 rounded hover:bg-white dark:hover:bg-white/10 text-[#11140F]/70 dark:text-white/75 hover:text-[#11140F] dark:hover:text-white text-xs"
                    title="Bullet List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>

                  <div className="h-4 w-px bg-[#11140F]/15 dark:bg-white/15 mx-1" />

                  <button
                    type="button"
                    onClick={() => insertFormat('{{first_name}}')}
                    className="px-2 py-1 rounded bg-white dark:bg-white/10 hover:bg-[#EEF0EA] dark:hover:bg-white/15 border border-[#11140F]/10 dark:border-white/12 text-[10.5px] font-mono text-[#11140F]/80 dark:text-white/85"
                    title="Insert recipient first name"
                  >
                    {'{{first_name}}'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('{{site_url}}')}
                    className="px-2 py-1 rounded bg-white dark:bg-white/10 hover:bg-[#EEF0EA] dark:hover:bg-white/15 border border-[#11140F]/10 dark:border-white/12 text-[10.5px] font-mono text-[#11140F]/80 dark:text-white/85"
                    title="Insert platform root URL"
                  >
                    {'{{site_url}}'}
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={8}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Hello {{first_name}},&#10;&#10;Write your platform announcement or newsletter here..."
                  required
                  className="w-full px-3 py-2.5 rounded-b-xl border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-black/40 text-xs font-mono text-[#11140F] dark:text-white placeholder:text-[#11140F]/35 dark:placeholder:text-white/30 focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                />
              </div>

              {/* Live Preview Panel */}
              {showPreview && (
                <div className="rounded-xl border border-[#11140F]/15 dark:border-white/12 bg-gray-100 dark:bg-white/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#11140F]/60 dark:text-white/60">
                    <span className="font-semibold text-[#11140F] dark:text-white">Live Recipient Preview</span>
                    <div className="flex items-center gap-1 bg-white dark:bg-black/40 rounded-lg p-0.5 border border-gray-200 dark:border-white/12">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1 rounded ${
                          previewDevice === 'desktop' ? 'bg-[#11140F] dark:bg-[#34D399] text-white dark:text-[#09110D]' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        title="Desktop view"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1 rounded ${
                          previewDevice === 'mobile' ? 'bg-[#11140F] dark:bg-[#34D399] text-white dark:text-[#09110D]' : 'text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white'
                        }`}
                        title="Mobile view"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`mx-auto bg-white rounded-lg border border-gray-200 shadow-xs p-5 overflow-hidden text-xs leading-relaxed transition-all ${
                      previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#11140F] pb-3 border-b border-gray-100">
                      {broadcastSubject
                        ? broadcastSubject.replace('{{first_name}}', 'Alex')
                        : 'Subject line preview...'}
                    </div>
                    <div
                      className="py-4 text-gray-800 space-y-2 text-xs"
                      dangerouslySetInnerHTML={{
                        __html: broadcastBody
                          ? formatBodyHtml(
                              broadcastBody
                                .replace(/{{first_name}}/g, 'Alex')
                                .replace(/{{site_url}}/g, '#')
                            )
                          : '<p class="text-gray-400 italic">Body preview will appear here as you type...</p>',
                      }}
                    />
                    <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 text-center font-medium space-y-1">
                      <div>You are receiving this update from DynamicQR.</div>
                      <div>
                        DynamicQR, San Francisco, CA &amp; Lagos, NG •{' '}
                        <span className="underline cursor-pointer">Unsubscribe</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Send Section */}
              <div className="p-3.5 rounded-xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/10 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-[#11140F] dark:text-white">Send a Test Preview</div>
                  <span className="text-[10.5px] text-[#11140F]/50 dark:text-white/50">Verify in your inbox before broadcasting</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-black/40 text-xs text-[#11140F] dark:text-white placeholder:text-[#11140F]/35 dark:placeholder:text-white/30 focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest || !broadcastSubject.trim() || !broadcastBody.trim()}
                    className="px-3.5 py-1.5 rounded-lg border border-[#11140F]/20 dark:border-white/12 bg-white dark:bg-white/[0.06] hover:bg-[#EEF0EA] dark:hover:bg-white/10 text-xs font-semibold text-[#11140F] dark:text-white transition-colors flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    {sendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-[#2F6B4F] dark:text-[#34D399]" />}
                    <span>{sendingTest ? 'Sending Test...' : 'Send Test'}</span>
                  </button>
                </div>
              </div>

              {/* Platform Branding Notice */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-[11.5px] text-gray-600 dark:text-white/60">
                Emails are dispatched under the sovereign <strong className="dark:text-white">DynamicQR</strong> brand identity with one-click unsubscribe headers and Gmail delivery.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#11140F]/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setConfirmBroadcastOpen(true)}
                disabled={
                  sendingBroadcast ||
                  activeSubscribersCount === 0 ||
                  !broadcastSubject.trim() ||
                  !broadcastBody.trim()
                }
                className="px-5 py-2 rounded-xl bg-[#2F6B4F] dark:bg-[#34D399] text-white dark:text-[#09110D] text-xs font-bold hover:bg-[#25553E] dark:hover:bg-[#2EC28A] transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {sendingBroadcast ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {sendingBroadcast
                    ? 'Broadcasting via Gmail...'
                    : `Broadcast to ${activeSubscribersCount} Active Subscriber${activeSubscribersCount === 1 ? '' : 's'}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Dispatching Platform Broadcast */}
      <ConfirmModal
        isOpen={confirmBroadcastOpen}
        onClose={() => setConfirmBroadcastOpen(false)}
        onConfirm={executeBroadcast}
        title="Dispatch Platform Email Broadcast?"
        description={`You are about to send "${broadcastSubject}" to ${activeSubscribersCount} active platform subscriber(s). This will be delivered directly to their email inboxes via Gmail.`}
        confirmLabel={`Yes, Broadcast to ${activeSubscribersCount} Recipients`}
        cancelLabel="Review & Edit"
        isDestructive={false}
        loading={sendingBroadcast}
      />

      {/* Broadcast Campaign Audit & Details Modal */}
      {inspectingBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#101211] rounded-2xl p-6 border border-[#11140F]/15 dark:border-white/12 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-[#11140F] dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10 dark:border-white/10">
              <div>
                <h4 className="font-bold text-sm text-[#11140F] dark:text-white">Broadcast Campaign Details</h4>
                <p className="text-xs text-[#11140F]/50 dark:text-white/50">
                  {inspectingBroadcast.sentAt
                    ? new Date(inspectingBroadcast.sentAt).toLocaleString()
                    : new Date(inspectingBroadcast.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBroadcast(null)}
                className="text-[#11140F]/40 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-[#11140F]/60 dark:text-white/60 block mb-0.5">Subject:</span>
                <span className="font-bold text-[#11140F] dark:text-white text-sm">{inspectingBroadcast.subject}</span>
              </div>

              <div className="flex items-center gap-4 py-2 border-y border-[#11140F]/10 dark:border-white/10">
                <div>
                  <span className="text-[#11140F]/50 dark:text-white/50 block">Status</span>
                  <span className="font-bold text-emerald-700 dark:text-[#34D399] capitalize">{inspectingBroadcast.status}</span>
                </div>
                <div>
                  <span className="text-[#11140F]/50 dark:text-white/50 block">Recipients</span>
                  <span className="font-bold text-[#11140F] dark:text-white">{inspectingBroadcast.recipientCount}</span>
                </div>
                <div>
                  <span className="text-[#11140F]/50 dark:text-white/50 block">Provider</span>
                  <span className="font-bold text-[#11140F] dark:text-white uppercase">{inspectingBroadcast.sentVia || 'gmail'}</span>
                </div>
              </div>

              {/* Delivery Audit Logs */}
              {Array.isArray(inspectingBroadcast.recipients) && inspectingBroadcast.recipients.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-[#11140F] dark:text-white">Recipient Delivery Audit:</span>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-[#11140F]/10 dark:border-white/10 divide-y divide-[#11140F]/5 dark:divide-white/5 text-[11px]">
                    {inspectingBroadcast.recipients.map((rec: any, idx: number) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <span className="font-medium text-[#11140F] dark:text-white">{rec.email}</span>
                        <div className="flex items-center gap-1.5">
                          {rec.status === 'sent' ? (
                            <span className="text-emerald-700 dark:text-[#34D399] bg-emerald-50 dark:bg-[#34D399]/15 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                              Delivered
                            </span>
                          ) : (
                            <span className="text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-500/15 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                              Failed: {rec.error || 'Error'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingBroadcast(null)}
                className="px-4 py-1.5 rounded-lg bg-[#11140F] dark:bg-[#34D399] text-white dark:text-[#09110D] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Campaign Confirmation Modal */}
      <ConfirmModal
        isOpen={!!campaignToDelete}
        onClose={() => setCampaignToDelete(null)}
        onConfirm={executeDeleteCampaign}
        title="Delete Broadcast Campaign Record?"
        description={`Are you sure you want to delete the record for "${campaignToDelete?.subject}"? This removes the audit logs from history.`}
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        isDestructive={true}
        loading={isPending}
      />

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#101211] rounded-2xl p-5 border border-[#11140F]/15 dark:border-white/12 shadow-xl space-y-4 text-[#11140F] dark:text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#11140F]/10 dark:border-white/10">
              <h4 className="font-semibold text-sm text-[#11140F] dark:text-white">Add Platform Subscriber</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#11140F]/40 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 text-xs">{errorMsg}</div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#11140F] dark:text-white/90 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-black/40 text-xs text-[#11140F] dark:text-white placeholder:text-[#11140F]/35 dark:placeholder:text-white/30 focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] dark:text-white/90 mb-1">Name (Optional)</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Alex Doe"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-black/40 text-xs text-[#11140F] dark:text-white placeholder:text-[#11140F]/35 dark:placeholder:text-white/30 focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] dark:text-white/90 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-[#161917] text-xs text-[#11140F] dark:text-white focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                >
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg bg-[#11140F] dark:bg-[#34D399] text-white dark:text-[#09110D] text-xs font-semibold hover:bg-[#2A2E25] dark:hover:bg-[#2EC28A] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Subscriber</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscriber Modal */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#101211] rounded-2xl p-5 border border-[#11140F]/15 dark:border-white/12 shadow-xl space-y-4 text-[#11140F] dark:text-white">
            <div className="flex items-center justify-between pb-2 border-b border-[#11140F]/10 dark:border-white/10">
              <h4 className="font-semibold text-sm text-[#11140F] dark:text-white">Edit Platform Subscriber</h4>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-[#11140F]/40 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 text-xs">{errorMsg}</div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#11140F] dark:text-white/90 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-black/40 text-xs text-[#11140F] dark:text-white focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] dark:text-white/90 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-black/40 text-xs text-[#11140F] dark:text-white focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] dark:text-white/90 mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-[#161917] text-xs text-[#11140F] dark:text-white focus:outline-none focus:border-[#2F6B4F] dark:focus:border-[#34D399]"
                >
                  <option value="active">Active</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg bg-[#11140F] dark:bg-[#34D399] text-white dark:text-[#09110D] text-xs font-semibold hover:bg-[#2A2E25] dark:hover:bg-[#2EC28A] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Subscriber</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Centered Mobile-Responsive Confirm Delete Subscriber Modal */}
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
