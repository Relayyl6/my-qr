'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Users,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code,
  Sparkles,
  ChevronRight,
  Shield,
  Copy,
} from 'lucide-react';
import Link from 'next/link';

interface MailingList {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: {
    contacts: number;
    campaigns: number;
  };
}

interface Contact {
  id: string;
  email: string;
  firstName: string | null;
  status: string;
  createdAt: string;
}

interface Quotas {
  tier: string;
  listsUsed: number;
  listsMax: number;
  contactsUsed: number;
  contactsMax: number;
  campaignsUsedThisMonth: number;
  campaignsMaxPerMonth: number;
  hasBrandedFooter: boolean;
}

export default function CustomerMailingListManager({
  userTier = 'free',
  isAdmin = false,
}: {
  userTier?: string;
  isAdmin?: boolean;
}) {
  const [lists, setLists] = useState<MailingList[]>([]);
  const [quotas, setQuotas] = useState<Quotas | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load lists
  const loadLists = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mailing-lists');
      const data = await res.json();
      if (res.ok) {
        setLists(data.lists || []);
        setQuotas(data.quotas || null);
        if (data.lists?.length > 0 && !selectedListId) {
          setSelectedListId(data.lists[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLists();
  }, []);

  // Load contacts when selectedListId changes
  useEffect(() => {
    if (!selectedListId) {
      setContacts([]);
      return;
    }
    const loadContacts = async () => {
      try {
        setLoadingContacts(true);
        const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts`);
        const data = await res.json();
        if (res.ok) {
          setContacts(data.contacts || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingContacts(false);
      }
    };
    loadContacts();
  }, [selectedListId]);

  // Handle Create List
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setCreatingList(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/mailing-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName, description: newListDesc }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setNewListName('');
        setNewListDesc('');
        setFeedback({ type: 'success', message: 'Mailing list created successfully!' });
        await loadLists();
        setSelectedListId(data.list.id);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to create list' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setCreatingList(false);
    }
  };

  // Handle Add Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !newContactEmail.trim()) return;

    setAddingContact(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newContactEmail, firstName: newContactName }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddContactModal(false);
        setNewContactEmail('');
        setNewContactName('');
        setFeedback({ type: 'success', message: 'Contact added to list!' });
        // Refresh contacts & quotas
        const cRes = await fetch(`/api/mailing-lists/${selectedListId}/contacts`);
        const cData = await cRes.json();
        setContacts(cData.contacts || []);
        await loadLists();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to add contact' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setAddingContact(false);
    }
  };

  // Handle Delete Contact
  const handleDeleteContact = async (contactId: string) => {
    if (!selectedListId) return;
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts?contactId=${contactId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        await loadLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Broadcast
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !broadcastSubject.trim() || !broadcastBody.trim()) return;

    setBroadcasting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: broadcastSubject, bodyHtml: broadcastBody }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBroadcastModal(false);
        setBroadcastSubject('');
        setBroadcastBody('');
        setFeedback({
          type: 'success',
          message: `Broadcast delivered to ${data.sentCount} recipients via Gmail Nodemailer!`,
        });
        await loadLists();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Broadcast failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setBroadcasting(false);
    }
  };

  const selectedList = lists.find((l) => l.id === selectedListId);

  const embedCodeSnippet = selectedListId
    ? `<form action="${typeof window !== 'undefined' ? window.location.origin : 'https://dynamicqr.co'}/api/mailing-lists/${selectedListId}/subscribe" method="POST">\n  <input type="email" name="email" placeholder="Enter your email" required />\n  <button type="submit">Subscribe</button>\n</form>`
    : '';

  return (
    <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* 1. Header & Quotas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#11140F]/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2F6B4F]/10 text-[#2F6B4F] flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#11140F] tracking-tight">
              Customer Mailing Lists & Campaigns
            </h3>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#11140F]/5 text-[#11140F]/70 font-semibold">
              {quotas?.tier || userTier.toUpperCase()}
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#11140F]/60">
            Collect subscriber contacts via your printed QR codes and dispatch email broadcasts using dedicated Gmail Nodemailer delivery.
          </p>
        </div>

        {/* Quota Progress Pills */}
        {quotas && (
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-[#F7F8F5] border border-[#11140F]/8 flex items-center gap-1.5">
              <span className="text-[#11140F]/50">Lists:</span>
              <strong className="text-[#11140F]">{quotas.listsUsed} / {quotas.listsMax}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#F7F8F5] border border-[#11140F]/8 flex items-center gap-1.5">
              <span className="text-[#11140F]/50">Contacts:</span>
              <strong className="text-[#11140F]">{quotas.contactsUsed} / {quotas.contactsMax}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-[#F7F8F5] border border-[#11140F]/8 flex items-center gap-1.5">
              <span className="text-[#11140F]/50">Campaigns:</span>
              <strong className="text-[#11140F]">{quotas.campaignsUsedThisMonth} / {quotas.campaignsMaxPerMonth} mo</strong>
            </div>
          </div>
        )}
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-[#2F6B4F]/10 text-[#2F6B4F] border border-[#2F6B4F]/20'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 2. Lists Selector & Actions */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[#11140F]/50 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading mailing lists...
        </div>
      ) : lists.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#11140F]/20 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#11140F]/5 mx-auto flex items-center justify-center text-[#11140F]/60">
            <Mail className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-[#11140F]">No mailing lists yet</h4>
            <p className="text-xs sm:text-sm text-[#11140F]/60 max-w-sm mx-auto">
              Create your first customer list to start collecting emails directly from your printed flyers and dynamic QR codes.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create First Mailing List
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* List selection tabs & Add button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedListId(l.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-[13px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
                    selectedListId === l.id
                      ? 'bg-[#11140F] text-white shadow-xs'
                      : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#11140F]/5 hover:text-[#11140F]'
                  }`}
                >
                  <span>{l.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-mono ${
                      selectedListId === l.id ? 'bg-white/20 text-white' : 'bg-[#11140F]/10 text-[#11140F]/60'
                    }`}
                  >
                    {l._count.contacts}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={quotas ? quotas.listsUsed >= quotas.listsMax : false}
                className="px-3.5 py-2 rounded-xl border border-[#11140F]/15 bg-white text-[#11140F] text-xs font-semibold hover:bg-[#F7F8F5] transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New List</span>
              </button>

              {quotas && quotas.listsUsed >= quotas.listsMax && (
                <Link
                  href="/pricing"
                  className="text-[11px] font-mono text-[#2F6B4F] hover:underline"
                >
                  Upgrade limit
                </Link>
              )}
            </div>
          </div>

          {/* Active List Panel */}
          {selectedList && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-[#11140F]/8">
                <div>
                  <h4 className="text-sm font-bold text-[#11140F]">{selectedList.name}</h4>
                  <p className="text-xs text-[#11140F]/60">
                    {selectedList.description || 'Double opt-in customer subscriber list.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    disabled={quotas ? quotas.contactsUsed >= quotas.contactsMax : false}
                    className="px-3.5 py-2 rounded-lg bg-white border border-[#11140F]/15 text-[#11140F] text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Contact
                  </button>

                  <button
                    onClick={() => setShowEmbedModal(true)}
                    className="px-3.5 py-2 rounded-lg bg-white border border-[#11140F]/15 text-[#11140F] text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5" />
                    Embed Form
                  </button>

                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    disabled={contacts.filter((c) => c.status === 'active').length === 0}
                    className="px-4 py-2 rounded-lg bg-[#2F6B4F] text-white text-xs font-semibold hover:bg-[#25553E] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Broadcast
                  </button>
                </div>
              </div>

              {/* Contacts Table */}
              <div className="rounded-xl border border-[#11140F]/10 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50/50 border-b border-[#11140F]/8 flex items-center justify-between text-xs font-semibold text-[#11140F]/70">
                  <span>Contacts ({contacts.length})</span>
                  <span className="text-[11px] text-[#11140F]/50 font-mono">
                    Tier max: {quotas?.contactsMax || 10} contacts
                  </span>
                </div>

                {loadingContacts ? (
                  <div className="p-8 text-center text-xs text-[#11140F]/50">
                    Loading contacts...
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#11140F]/50">
                    No subscribers in this list yet. Share your QR code or use &quot;Add Contact&quot; above.
                  </div>
                ) : (
                  <div className="divide-y divide-[#11140F]/5 max-h-72 overflow-y-auto">
                    {contacts.map((c) => (
                      <div
                        key={c.id}
                        className="px-4 py-3 flex items-center justify-between gap-4 text-xs hover:bg-[#F7F8F5]/60 transition-colors"
                      >
                        <div className="space-y-0.5">
                          <div className="font-medium text-[#11140F] flex items-center gap-2">
                            <span>{c.email}</span>
                            {c.firstName && (
                              <span className="text-[#11140F]/50 font-normal">
                                ({c.firstName})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#11140F]/40 font-mono">
                            Added {new Date(c.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold ${
                              c.status === 'active'
                                ? 'bg-[#2F6B4F]/10 text-[#2F6B4F]'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {c.status}
                          </span>

                          <button
                            onClick={() => handleDeleteContact(c.id)}
                            className="text-[#11140F]/40 hover:text-red-600 transition-colors p-1"
                            aria-label="Remove contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Create List */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#11140F]/15 space-y-4">
            <h4 className="text-base font-bold text-[#11140F]">Create Mailing List</h4>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">List Name</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. VIP Customers, Event Attendees"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Description (optional)</label>
                <input
                  type="text"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="e.g. In-store flyer scan subscribers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingList}
                  className="px-5 py-2 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creatingList ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Contact */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#11140F]/15 space-y-4">
            <h4 className="text-base font-bold text-[#11140F]">Add Contact</h4>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Email Address</label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="customer@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">First Name (optional)</label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="John"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingContact}
                  className="px-5 py-2 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Broadcast Campaign */}
      {showBroadcastModal && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-[#11140F]/15 space-y-4">
            <div>
              <h4 className="text-base font-bold text-[#11140F]">
                Send Broadcast to {selectedList.name}
              </h4>
              <p className="text-xs text-[#11140F]/60">
                Delivering to {contacts.filter((c) => c.status === 'active').length} active recipients via personal Gmail Nodemailer.
              </p>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Subject Line</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Exclusive Friday Offer for our QR Scanners!"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Email Body (HTML supported)</label>
                <textarea
                  rows={6}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Hello {{first_name}},\n\nThank you for scanning our code! We are excited to announce..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] font-sans focus:outline-none focus:border-[#2F6B4F]"
                />
                <div className="text-[11px] text-[#11140F]/50 font-mono">
                  Supported tags: <code>{'{{first_name}}'}</code>, <code>{'{{list_name}}'}</code>
                </div>
              </div>

              {quotas?.hasBrandedFooter && (
                <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                  <strong>Free Plan Notice:</strong> Your broadcast includes a subtle &quot;Powered by DynamicQR&quot; badge in the footer.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-5 py-2 rounded-xl bg-[#2F6B4F] text-white text-xs font-semibold hover:bg-[#25553E] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {broadcasting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Embed Code */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#11140F]/15 space-y-4">
            <div>
              <h4 className="text-base font-bold text-[#11140F]">Embeddable Signup Code</h4>
              <p className="text-xs text-[#11140F]/60">
                Paste this HTML snippet into your website, Shopify theme, or WordPress blog to capture subscribers directly into this list.
              </p>
            </div>

            <pre className="p-3.5 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all">
              {embedCodeSnippet}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11.5px] text-[#2F6B4F]">
                {copiedEmbed ? 'Copied to clipboard!' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmbedModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(embedCodeSnippet);
                    setCopiedEmbed(true);
                    setTimeout(() => setCopiedEmbed(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
