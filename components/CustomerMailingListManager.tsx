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
  Eye,
  FileSpreadsheet,
  Smartphone,
  Monitor,
  Palette,
  Tag,
  Pencil,
  Printer,
  QrCode,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import PrintTemplateModal from './PrintTemplateModal';

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

// 4 Prebuilt Designer Templates
const TEMPLATES = [
  {
    id: 'modern_welcome',
    name: 'Modern Welcome',
    subject: 'Welcome to {{list_name}}!',
    body: `<h2 style="font-size:22px;color:#11140F;margin:0 0 16px;font-weight:700;">Welcome to {{list_name}}!</h2>
<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
  Hi {{first_name}}, thank you for scanning our QR code and connecting with us. We are delighted to have you as part of our community.
</p>
<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
  You will be the first to receive special promotions, secret releases, and priority invitations.
</p>
<div style="text-align:left;margin:24px 0;">
  <a href="{{site_url}}" style="display:inline-block;background:#11140F;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
    Visit Our Website &rarr;
  </a>
</div>`,
  },
  {
    id: 'promotional_sale',
    name: 'Flash Sale Promo',
    subject: 'Exclusive Offer: Save Today at {{list_name}}',
    body: `<div style="background:#2F6B4F;color:#ffffff;padding:24px;border-radius:10px;text-align:center;margin-bottom:20px;">
  <div style="font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">Limited Time Special</div>
  <h2 style="font-size:26px;font-weight:800;margin:8px 0;color:#ffffff;">Special Discount Just For You</h2>
  <div style="font-size:14px;opacity:0.95;">Thank you for being a valued customer!</div>
</div>
<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;">
  Hi {{first_name}}, show this email on your next visit or use the discount code below online:
</p>
<div style="background:#F7F8F5;border:2px dashed #2F6B4F;border-radius:8px;padding:16px;text-align:center;margin:20px 0;">
  <span style="font-size:11px;color:#6B7280;text-transform:uppercase;font-weight:600;letter-spacing:1px;display:block;">Discount Code</span>
  <strong style="font-size:24px;color:#11140F;font-family:monospace;letter-spacing:2px;">VIPGUEST20</strong>
</div>`,
  },
  {
    id: 'event_invite',
    name: 'VIP Event Invite',
    subject: "You're Invited: Special Gathering at {{list_name}}",
    body: `<h2 style="font-size:22px;color:#11140F;margin:0 0 12px;font-weight:700;">You're Invited: Exclusive Gathering</h2>
<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
  Hi {{first_name}}, we're hosting an exclusive event for our loyal community members and would love to see you there.
</p>
<div style="background:#F7F8F5;border-left:4px solid #2F6B4F;padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
  <div style="font-size:14px;font-weight:bold;color:#11140F;margin-bottom:4px;">📅 Date & Time</div>
  <div style="font-size:14px;color:#4B5563;margin-bottom:12px;">This Friday at 7:00 PM</div>
  <div style="font-size:14px;font-weight:bold;color:#11140F;margin-bottom:4px;">📍 Location</div>
  <div style="font-size:14px;color:#4B5563;">Main Venue Hall</div>
</div>`,
  },
  {
    id: 'weekly_digest',
    name: 'Community Digest',
    subject: 'The Latest News & Updates from {{list_name}}',
    body: `<h2 style="font-size:22px;color:#11140F;margin:0 0 16px;font-weight:700;">What's New at {{list_name}}</h2>
<p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
  Hi {{first_name}}, here are this week's highlights and behind-the-scenes updates:
</p>
<div style="margin-bottom:16px;">
  <strong style="color:#11140F;font-size:15px;">✨ 1. New Seasonal Releases</strong>
  <p style="color:#4B5563;font-size:14px;line-height:1.5;margin:4px 0 0;">We've added brand new items curated specifically for this week.</p>
</div>
<div style="margin-bottom:16px;">
  <strong style="color:#11140F;font-size:15px;">🚀 2. Extended Weekend Hours</strong>
  <p style="color:#4B5563;font-size:14px;line-height:1.5;margin:4px 0 0;">We'll be open late until 11:00 PM every Friday and Saturday.</p>
</div>`,
  },
];

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

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  // Edit List Modal
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [editListName, setEditListName] = useState('');
  const [editListDesc, setEditListDesc] = useState('');
  const [updatingList, setUpdatingList] = useState(false);
  const [deletingList, setDeletingList] = useState(false);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  // Edit Contact Modal
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactStatus, setEditContactStatus] = useState('active');
  const [updatingContact, setUpdatingContact] = useState(false);

  // CSV Bulk Import Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  // Broadcast Modal & Live Preview
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);

  // Embed Studio
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [embedStyle, setEmbedStyle] = useState<'inline' | 'floating_pill' | 'card'>('inline');
  const [embedAccent, setEmbedAccent] = useState('#2F6B4F');
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

  // Load contacts
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

  // Open Edit List Modal
  const handleOpenEditList = () => {
    if (!selectedList) return;
    setEditListName(selectedList.name);
    setEditListDesc(selectedList.description || '');
    setShowEditListModal(true);
  };

  // Submit Update List
  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !editListName.trim()) return;

    setUpdatingList(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editListName.trim(), description: editListDesc.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditListModal(false);
        setFeedback({ type: 'success', message: 'Mailing list updated successfully!' });
        await loadLists();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update list' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setUpdatingList(false);
    }
  };

  // Delete List
  const handleDeleteList = async () => {
    if (!selectedList || !selectedListId) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the mailing list "${selectedList.name}" and all of its contacts? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingList(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: `Mailing list "${selectedList.name}" deleted.` });
        const remainingLists = lists.filter((l) => l.id !== selectedListId);
        setLists(remainingLists);
        setSelectedListId(remainingLists.length > 0 ? remainingLists[0].id : null);
        await loadLists();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete list' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setDeletingList(false);
    }
  };

  // Open Edit Contact Modal
  const handleOpenEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditContactEmail(contact.email);
    setEditContactName(contact.firstName || '');
    setEditContactStatus(contact.status);
    setShowEditContactModal(true);
  };

  // Submit Update Contact
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !editingContactId || !editContactEmail.trim()) return;

    setUpdatingContact(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: editingContactId,
          email: editContactEmail.trim(),
          firstName: editContactName.trim(),
          status: editContactStatus,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowEditContactModal(false);
        setFeedback({ type: 'success', message: 'Contact updated successfully!' });
        const cRes = await fetch(`/api/mailing-lists/${selectedListId}/contacts`);
        const cData = await cRes.json();
        setContacts(cData.contacts || []);
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update contact' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setUpdatingContact(false);
    }
  };

  // Handle Single Add Contact
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

  // Handle CSV Bulk Import
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !csvText.trim()) return;

    setImportingCsv(true);
    setFeedback(null);

    try {
      const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
      let successCount = 0;
      let lastError = '';

      for (const line of lines) {
        const parts = line.split(',');
        const email = parts[0]?.trim();
        const firstName = parts[1]?.trim() || '';

        if (email && email.includes('@')) {
          const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, firstName }),
          });
          if (res.ok) {
            successCount++;
          } else {
            const data = await res.json();
            lastError = data.error;
            break;
          }
        }
      }

      setShowCsvModal(false);
      setCsvText('');
      if (successCount > 0) {
        setFeedback({
          type: 'success',
          message: `Imported ${successCount} contacts successfully!${lastError ? ` (${lastError})` : ''}`,
        });
      } else if (lastError) {
        setFeedback({ type: 'error', message: lastError });
      }

      const cRes = await fetch(`/api/mailing-lists/${selectedListId}/contacts`);
      const cData = await cRes.json();
      setContacts(cData.contacts || []);
      await loadLists();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setImportingCsv(false);
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

  // Handle Broadcast Send
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

  // Dynamic Embed Code Snippet Generator
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dynamicqr.co';
  const embedCodeSnippet = selectedListId
    ? embedStyle === 'inline'
      ? `<!-- DynamicQR Mailing List Embed Form -->\n<form action="${origin}/api/mailing-lists/${selectedListId}/subscribe" method="POST" style="display:flex;gap:8px;max-width:400px;font-family:sans-serif;">\n  <input type="email" name="email" placeholder="Enter your email" required style="flex:1;padding:10px 14px;border:1px solid #ccc;border-radius:8px;font-size:14px;" />\n  <button type="submit" style="background:${embedAccent};color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:600;cursor:pointer;">Subscribe</button>\n</form>`
      : embedStyle === 'floating_pill'
      ? `<!-- DynamicQR Floating Subscription Pill -->\n<div style="position:fixed;bottom:20px;right:20px;background:#fff;padding:12px 16px;border-radius:30px;box-shadow:0 8px 30px rgba(0,0,0,0.12);display:flex;align-items:center;gap:10px;font-family:sans-serif;z-index:9999;">\n  <form action="${origin}/api/mailing-lists/${selectedListId}/subscribe" method="POST" style="display:flex;gap:8px;margin:0;">\n    <input type="email" name="email" placeholder="Get newsletter" required style="padding:8px 12px;border:1px solid #ddd;border-radius:20px;font-size:13px;outline:none;" />\n    <button type="submit" style="background:${embedAccent};color:#fff;border:none;padding:8px 14px;border-radius:20px;font-size:13px;font-weight:bold;cursor:pointer;">Join</button>\n  </form>\n</div>`
      : `<!-- DynamicQR Slide-In Card -->\n<div style="max-width:320px;background:#fff;border:1px solid #eaeaea;border-radius:16px;padding:20px;box-shadow:0 10px 25px rgba(0,0,0,0.05);font-family:sans-serif;">\n  <h4 style="margin:0 0 6px;font-size:16px;color:#111;">Join our updates</h4>\n  <p style="margin:0 0 14px;font-size:13px;color:#666;">Subscribe to get early discounts and announcements.</p>\n  <form action="${origin}/api/mailing-lists/${selectedListId}/subscribe" method="POST" style="display:flex;flex-direction:column;gap:10px;">\n    <input type="email" name="email" placeholder="Your email address" required style="padding:10px;border:1px solid #ddd;border-radius:8px;font-size:13px;" />\n    <button type="submit" style="background:${embedAccent};color:#fff;border:none;padding:10px;border-radius:8px;font-weight:bold;cursor:pointer;">Subscribe Now</button>\n  </form>\n</div>`
    : '';

  return (
    <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 sm:p-7 shadow-xs space-y-6">
      
      {/* 1. Header & Live Quota Counters */}
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

        {/* Quota Progress Pills calibrated strictly to 10, 50, 100, 500 limits */}
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
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#11140F]">{selectedList.name}</h4>
                    <button
                      type="button"
                      onClick={handleOpenEditList}
                      className="p-1 rounded-md text-[#11140F]/40 hover:text-[#11140F] hover:bg-white transition-colors cursor-pointer"
                      title="Edit mailing list name & description"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteList}
                      disabled={deletingList}
                      className="p-1 rounded-md text-red-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                      title="Delete this mailing list"
                    >
                      {deletingList ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#11140F]/60 mt-0.5">
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
                    onClick={() => setShowCsvModal(true)}
                    disabled={quotas ? quotas.contactsUsed >= quotas.contactsMax : false}
                    className="px-3.5 py-2 rounded-lg bg-white border border-[#11140F]/15 text-[#11140F] text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#2F6B4F]" />
                    Import CSV
                  </button>

                  <button
                    onClick={() => setShowEmbedModal(true)}
                    className="px-3.5 py-2 rounded-lg bg-white border border-[#11140F]/15 text-[#11140F] text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5 text-blue-600" />
                    Embed Studio
                  </button>

                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#2F6B4F]" />
                    Print QR Sign / Tent
                  </button>

                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    disabled={contacts.filter((c) => c.status === 'active').length === 0}
                    className="px-4 py-2 rounded-lg bg-[#2F6B4F] text-white text-xs font-semibold hover:bg-[#25553E] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Compose Broadcast
                  </button>
                </div>
              </div>

              {/* Physical Print & Retail Setup Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2F6B4F]/10 via-[#2F6B4F]/5 to-transparent border border-[#2F6B4F]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#2F6B4F] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-xs font-bold text-[#11140F] uppercase tracking-wide">
                        Retail Counters, Packaging &amp; Table Tents
                      </h5>
                      <span className="px-2 py-0.5 rounded-full bg-[#2F6B4F]/20 text-[#2F6B4F] text-[10px] font-mono font-bold">
                        300 DPI PRINT READY
                      </span>
                    </div>
                    <p className="text-xs text-[#11140F]/70 max-w-xl leading-relaxed">
                      Print QR codes on retail counters, packaging, or table tents. When customers scan, they enter their email on a branded mobile form with automated double opt-in. Dispatch broadcast campaigns straight from your workspace using native Gmail delivery.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/join/${selectedList.id}`}
                    target="_blank"
                    className="px-3.5 py-2 rounded-xl border border-[#11140F]/15 bg-white text-[#11140F] text-xs font-semibold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Form</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#2F6B4F] text-white text-xs font-semibold hover:bg-[#25553E] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Displays</span>
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
                    No subscribers in this list yet. Share your QR code or use &quot;Add Contact&quot; or &quot;Import CSV&quot; above.
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

                        <div className="flex items-center gap-1.5">
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
                            type="button"
                            onClick={() => handleOpenEditContact(c)}
                            className="text-[#11140F]/40 hover:text-[#11140F] hover:bg-gray-100 rounded-md transition-colors p-1 cursor-pointer"
                            title="Edit contact"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteContact(c.id)}
                            className="text-[#11140F]/40 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors p-1 cursor-pointer"
                            title="Remove contact"
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

      {/* Modal 1B: Edit List */}
      {showEditListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#11140F]/15 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-[#11140F]">Edit Mailing List</h4>
              <button
                type="button"
                onClick={() => setShowEditListModal(false)}
                className="text-xs text-[#11140F]/50 hover:text-[#11140F] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateList} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">List Name *</label>
                <input
                  type="text"
                  value={editListName}
                  onChange={(e) => setEditListName(e.target.value)}
                  placeholder="e.g. VIP Customers, Event Attendees"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Description (optional)</label>
                <input
                  type="text"
                  value={editListDesc}
                  onChange={(e) => setEditListDesc(e.target.value)}
                  placeholder="e.g. In-store flyer scan subscribers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditListModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#11140F]/60 hover:text-[#11140F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingList}
                  className="px-5 py-2 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {updatingList ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
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
            <h4 className="text-base font-bold text-[#11140F]">Add Single Contact</h4>
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

      {/* Modal 2B: Edit Contact */}
      {showEditContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-[#11140F]/15 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-[#11140F]">Edit Contact Details</h4>
              <button
                type="button"
                onClick={() => setShowEditContactModal(false)}
                className="text-xs text-[#11140F]/50 hover:text-[#11140F] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateContact} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Email Address *</label>
                <input
                  type="email"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                  placeholder="customer@example.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">First Name</label>
                <input
                  type="text"
                  value={editContactName}
                  onChange={(e) => setEditContactName(e.target.value)}
                  placeholder="John"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Subscription Status</label>
                <select
                  value={editContactStatus}
                  onChange={(e) => setEditContactStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] bg-white focus:outline-none focus:border-[#2F6B4F]"
                >
                  <option value="active">Active (Receives broadcasts)</option>
                  <option value="unsubscribed">Unsubscribed (Suppressed)</option>
                  <option value="pending">Pending Confirmation</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditContactModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#11140F]/60 hover:text-[#11140F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingContact}
                  className="px-5 py-2 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {updatingContact ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Update Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: CSV Bulk Import */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl border border-[#11140F]/15 space-y-4">
            <div>
              <h4 className="text-base font-bold text-[#11140F] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#2F6B4F]" />
                CSV Bulk Import
              </h4>
              <p className="text-xs text-[#11140F]/60">
                Paste comma-separated email lines below. Duplicates are filtered automatically.
              </p>
            </div>

            <form onSubmit={handleCsvImport} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">
                  CSV Lines (format: <code>email, first_name</code>)
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="alice@example.com, Alice&#10;bob@example.com, Bob&#10;charlie@example.com, Charlie"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs font-mono text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-600 flex items-center justify-between">
                <span>Total contacts capacity on your plan:</span>
                <strong className="font-mono text-gray-900">{quotas?.contactsMax || 10} contacts max</strong>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importingCsv}
                  className="px-5 py-2 rounded-xl bg-[#2F6B4F] text-white text-xs font-semibold hover:bg-[#25553E] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {importingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Broadcast Composer with Prebuilt Templates & Live Preview */}
      {showBroadcastModal && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#11140F]/15 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10">
              <div>
                <h4 className="text-base font-bold text-[#11140F]">
                  Broadcast to {selectedList.name}
                </h4>
                <p className="text-xs text-[#11140F]/60">
                  Delivering to {contacts.filter((c) => c.status === 'active').length} active recipients strictly via personal Gmail Nodemailer.
                </p>
              </div>

              {/* Live Preview Toggle */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  showPreview
                    ? 'bg-[#11140F] text-white'
                    : 'bg-[#F7F8F5] text-[#11140F] border border-[#11140F]/15'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {showPreview ? 'Hide Preview' : 'Live Preview'}
              </button>
            </div>

            {/* Quick Template Picker */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#11140F] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#2F6B4F]" />
                Load Pre-Built Designer Template:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setBroadcastSubject(tmpl.subject.replace('{{list_name}}', selectedList.name));
                      setBroadcastBody(tmpl.body.replace(/{{list_name}}/g, selectedList.name));
                    }}
                    className="p-2.5 rounded-xl border border-[#11140F]/10 bg-[#F7F8F5] hover:border-[#2F6B4F] text-left text-xs font-medium text-[#11140F] transition-all cursor-pointer"
                  >
                    <span className="block font-semibold">{tmpl.name}</span>
                    <span className="text-[10.5px] text-[#11140F]/50">Click to apply</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor vs Preview Split */}
            <div className={`grid gap-6 ${showPreview ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Form Input */}
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Subject Line</label>
                  <input
                    type="text"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder="e.g. Exclusive Friday Announcement"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#11140F]">Email Body (HTML supported)</label>
                    <span className="text-[11px] text-[#11140F]/50 font-mono">
                      Tags: <code>{'{{first_name}}'}</code>, <code>{'{{list_name}}'}</code>
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    placeholder="Hello {{first_name}},\n\nWe are excited to share..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#11140F]/15 text-xs text-[#11140F] font-sans focus:outline-none focus:border-[#2F6B4F]"
                  />
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
                    className="px-5 py-2 rounded-xl bg-[#2F6B4F] text-white text-xs font-semibold hover:bg-[#25553E] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {broadcasting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Broadcast via Gmail'}
                  </button>
                </div>
              </form>

              {/* Live Preview Panel */}
              {showPreview && (
                <div className="rounded-2xl border border-[#11140F]/15 bg-gray-100 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#11140F]/60">
                    <span>Live Simulation</span>
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#11140F]/10">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`p-1 rounded ${previewDevice === 'desktop' ? 'bg-[#11140F] text-white' : 'text-[#11140F]/60'}`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`p-1 rounded ${previewDevice === 'mobile' ? 'bg-[#11140F] text-white' : 'text-[#11140F]/60'}`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className={`mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-4 overflow-hidden text-xs leading-relaxed ${previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'}`}>
                    <div className="font-bold text-sm text-[#11140F] pb-2 border-b border-gray-100">
                      {broadcastSubject ? broadcastSubject.replace('{{first_name}}', 'Alex').replace('{{list_name}}', selectedList.name) : 'Subject preview...'}
                    </div>
                    <div
                      className="py-3 text-gray-800"
                      dangerouslySetInnerHTML={{
                        __html: broadcastBody
                          ? broadcastBody
                              .replace(/{{first_name}}/g, 'Alex')
                              .replace(/{{list_name}}/g, selectedList.name)
                              .replace(/{{site_url}}/g, '#')
                          : '<p class="text-gray-400">Body preview will appear here...</p>',
                      }}
                    />
                    <div className="pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center">
                      {quotas?.hasBrandedFooter && (
                        <div className="pb-1 text-gray-500 font-semibold">
                          Powered by DynamicQR
                        </div>
                      )}
                      Sent to alex@example.com • <span className="underline">Unsubscribe</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Interactive Embed Widget Studio */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#11140F]/15 space-y-6">
            <div>
              <h4 className="text-lg font-bold text-[#11140F] flex items-center gap-2">
                <Code className="w-5 h-5 text-[#2F6B4F]" />
                Embeddable Signup Form Studio
              </h4>
              <p className="text-xs text-[#11140F]/60">
                Choose a widget style to capture subscribers on your website or blog. Subscribers feed straight into {selectedList?.name}.
              </p>
            </div>

            {/* Style Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEmbedStyle('inline')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  embedStyle === 'inline'
                    ? 'border-[#2F6B4F] bg-[#2F6B4F]/5'
                    : 'border-[#11140F]/10 hover:bg-[#F7F8F5]'
                }`}
              >
                <span className="block text-xs font-bold text-[#11140F]">1. Inline Box</span>
                <span className="text-[11px] text-[#11140F]/50">For blog footers & sidebars</span>
              </button>

              <button
                type="button"
                onClick={() => setEmbedStyle('floating_pill')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  embedStyle === 'floating_pill'
                    ? 'border-[#2F6B4F] bg-[#2F6B4F]/5'
                    : 'border-[#11140F]/10 hover:bg-[#F7F8F5]'
                }`}
              >
                <span className="block text-xs font-bold text-[#11140F]">2. Floating Pill</span>
                <span className="text-[11px] text-[#11140F]/50">Fixed bottom-right corner</span>
              </button>

              <button
                type="button"
                onClick={() => setEmbedStyle('card')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  embedStyle === 'card'
                    ? 'border-[#2F6B4F] bg-[#2F6B4F]/5'
                    : 'border-[#11140F]/10 hover:bg-[#F7F8F5]'
                }`}
              >
                <span className="block text-xs font-bold text-[#11140F]">3. Card Box</span>
                <span className="text-[11px] text-[#11140F]/50">With headline & description</span>
              </button>
            </div>

            {/* Accent Color Picker */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[#11140F]">Button Accent:</span>
              <div className="flex items-center gap-2">
                {['#2F6B4F', '#11140F', '#2563EB', '#D97706', '#7C3AED'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEmbedAccent(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      embedAccent === color ? 'scale-125 border-black' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Code Output */}
            <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap select-all max-h-48">
              {embedCodeSnippet}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#2F6B4F] font-medium">
                {copiedEmbed ? '✓ HTML snippet copied to clipboard!' : ''}
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
                  className="px-5 py-2 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Snippet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Template Modal for Mailing List QR Displays */}
      {showPrintModal && selectedList && (
        <PrintTemplateModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          shortCode={selectedList.id.slice(-8)}
          label={selectedList.name}
          url={`${typeof window !== 'undefined' ? window.location.origin : 'https://dynamicqr.co'}/join/${selectedList.id}`}
          userTier={quotas?.tier || 'free'}
          isAdmin={false}
          defaultHeadline={`Join ${selectedList.name}`}
          defaultHeaderTag="SCAN TO SUBSCRIBE"
          defaultSubline="Enter your email for exclusive updates"
          defaultFooterNote="Double opt-in • Zero spam • Unsubscribe anytime"
          defaultTemplate="table-tent"
          featureBannerText="Print this QR code on retail counters, packaging, or table tents. When customers scan, they enter their email on a branded mobile form with automated double opt-in."
        />
      )}

    </div>
  );
}
