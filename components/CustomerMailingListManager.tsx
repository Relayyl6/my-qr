'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  Download,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  MousePointerClick,
  List as ListIcon,
  Minus,
  History,
  X,
  XCircle,
  Clock,
  CheckSquare,
  Square,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import PrintTemplateModal from './PrintTemplateModal';
import ConfirmModal from './ConfirmModal';
import ImageUploadField from './ImageUploadField';
import { APP_URL } from '@/lib/config';

interface MailingList {
  id: string;
  name: string;
  description: string | null;
  badgeText?: string | null;
  headline?: string | null;
  ctaText?: string | null;
  successMessage?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
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
  source?: string;
  createdAt: string;
}

interface CampaignRecipient {
  email: string;
  status: string;
  error?: string;
  sentAt?: string;
}

interface CampaignItem {
  id: string;
  subject: string;
  bodyHtml: string;
  status: string;
  sentAt: string | null;
  sentCount: number;
  recipientCount: number;
  recipients?: CampaignRecipient[];
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

// Prebuilt Templates
const TEMPLATES = [
  {
    id: 'modern_welcome',
    name: 'Modern Welcome',
    subject: 'Welcome to {{list_name}}!',
    body: `<h2 style="font-size:20px;color:#11140F;margin:0 0 14px;font-weight:700;">Welcome to {{list_name}}!</h2>
<p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
  Hi {{first_name}}, thank you for scanning our QR code and connecting with us. We are delighted to have you as part of our community.
</p>
<div style="background:#F7F8F5;border-left:4px solid #2F6B4F;padding:14px 18px;border-radius:0 6px 6px 0;margin:18px 0;">
  <p style="color:#11140F;font-weight:600;font-size:13.5px;margin:0 0 4px;">Exclusive Updates Ahead</p>
  <p style="color:#4B5563;font-size:13px;margin:0;line-height:1.5;">You'll receive early access to promotions, seasonal menus, and VIP community events.</p>
</div>
<div style="text-align:center;margin:22px 0;">
  <a href="#" style="background:#11140F;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:13px;font-weight:600;display:inline-block;">Visit Our Store</a>
</div>`,
  },
  {
    id: 'promotional_sale',
    name: 'Flash Sale Promo',
    subject: 'Special Offer: Save Today at {{list_name}}',
    body: `<div style="background:#2F6B4F;color:#ffffff;padding:20px;border-radius:8px;text-align:center;margin-bottom:18px;">
  <div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;opacity:0.9;">Limited Time Special</div>
  <h2 style="font-size:22px;font-weight:800;margin:6px 0;color:#ffffff;">Special Discount Just For You</h2>
  <div style="font-size:13px;opacity:0.95;">Thank you for being a valued customer!</div>
</div>
<p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
  Hi {{first_name}}, show this email on your next visit or use the discount code below:
</p>
<div style="background:#F7F8F5;border:2px dashed #2F6B4F;border-radius:6px;padding:14px;text-align:center;margin:18px 0;">
  <span style="font-size:11px;color:#6B7280;text-transform:uppercase;font-weight:600;letter-spacing:1px;display:block;">Discount Code</span>
  <strong style="font-size:22px;color:#11140F;font-family:monospace;letter-spacing:2px;">VIPGUEST20</strong>
</div>`,
  },
  {
    id: 'event_invite',
    name: 'VIP Event Invite',
    subject: "You're Invited: Special Gathering at {{list_name}}",
    body: `<h2 style="font-size:20px;color:#11140F;margin:0 0 12px;font-weight:700;">You're Invited: Exclusive Gathering</h2>
<p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
  Hi {{first_name}}, we are hosting an exclusive gathering for our community members and would love to see you there.
</p>
<div style="background:#F7F8F5;border-left:4px solid #2F6B4F;padding:14px 18px;border-radius:0 6px 6px 0;margin:18px 0;">
  <div style="font-size:13px;font-weight:bold;color:#11140F;margin-bottom:4px;">Date & Time</div>
  <div style="font-size:13px;color:#4B5563;margin-bottom:10px;">This Friday at 7:00 PM</div>
  <div style="font-size:13px;font-weight:bold;color:#11140F;margin-bottom:4px;">Location</div>
  <div style="font-size:13px;color:#4B5563;">Main Venue Hall</div>
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

  // Sub-tabs: 'contacts' | 'history'
  const [listSubTab, setListSubTab] = useState<'contacts' | 'history'>('contacts');

  // Contact search & filtering
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState<'all' | 'active' | 'unsubscribed' | 'pending'>('all');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);

  // Broadcast campaign history
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [inspectingCampaign, setInspectingCampaign] = useState<CampaignItem | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newListBadge, setNewListBadge] = useState('VIP Subscriber Form');
  const [newListHeadline, setNewListHeadline] = useState('');
  const [newListCta, setNewListCta] = useState('Subscribe to Updates');
  const [newListSuccessMsg, setNewListSuccessMsg] = useState('');
  const [newListLogo, setNewListLogo] = useState('');
  const [newListBanner, setNewListBanner] = useState('');
  const [creatingList, setCreatingList] = useState(false);

  const [showEditListModal, setShowEditListModal] = useState(false);
  const [editListName, setEditListName] = useState('');
  const [editListDesc, setEditListDesc] = useState('');
  const [editListBadge, setEditListBadge] = useState('');
  const [editListHeadline, setEditListHeadline] = useState('');
  const [editListCta, setEditListCta] = useState('');
  const [editListSuccessMsg, setEditListSuccessMsg] = useState('');
  const [editListLogo, setEditListLogo] = useState('');
  const [editListBanner, setEditListBanner] = useState('');
  const [updatingList, setUpdatingList] = useState(false);
  const [deletingList, setDeletingList] = useState(false);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactEmail, setEditContactEmail] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactStatus, setEditContactStatus] = useState('active');
  const [updatingContact, setUpdatingContact] = useState(false);

  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  // Centered Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void | Promise<void>;
  } | null>(null);

  // Broadcast Modal & Live Preview
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);

  // Embed Studio
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [embedStyle, setEmbedStyle] = useState<'inline' | 'floating_pill' | 'minimal'>('inline');
  const [embedAccent, setEmbedAccent] = useState('#2F6B4F');
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // Print Template Modal
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Textarea ref for rich text toolbar insertion
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : APP_URL;

  // 1. Initial Load of Lists & Quotas
  const loadLists = async () => {
    try {
      const res = await fetch('/api/mailing-lists');
      const data = await res.json();
      if (res.ok) {
        setLists(data.lists || []);
        setQuotas(data.quotas || null);
        if (data.lists && data.lists.length > 0 && !selectedListId) {
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

  // 2. Load Contacts and Campaigns when selectedListId changes
  const loadContacts = async () => {
    if (!selectedListId) return;
    try {
      setLoadingContacts(true);
      const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts`);
      const data = await res.json();
      if (res.ok) {
        setContacts(data.contacts || []);
        setSelectedContactIds([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadCampaigns = async () => {
    if (!selectedListId) return;
    try {
      setLoadingCampaigns(true);
      const res = await fetch(`/api/mailing-lists/${selectedListId}/campaigns`);
      const data = await res.json();
      if (res.ok) {
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (!selectedListId) {
      setContacts([]);
      setCampaigns([]);
      return;
    }
    loadContacts();
    loadCampaigns();
  }, [selectedListId]);

  // Insert Rich Text Snippet at Cursor Position
  const insertSnippet = (before: string, after: string = '', defaultText: string = '') => {
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

  // Create List
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setCreatingList(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/mailing-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDesc.trim(),
          badgeText: newListBadge.trim(),
          headline: newListHeadline.trim(),
          ctaText: newListCta.trim(),
          successMessage: newListSuccessMsg.trim(),
          logoUrl: newListLogo.trim(),
          bannerUrl: newListBanner.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        setNewListName('');
        setNewListDesc('');
        setNewListBadge('VIP Subscriber Form');
        setNewListHeadline('');
        setNewListCta('Subscribe to Updates');
        setNewListSuccessMsg('');
        setNewListLogo('');
        setNewListBanner('');
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

  // Edit List
  const handleOpenEditList = () => {
    if (!selectedList) return;
    setEditListName(selectedList.name);
    setEditListDesc(selectedList.description || '');
    setEditListBadge(selectedList.badgeText || 'VIP Subscriber Form');
    setEditListHeadline(selectedList.headline || '');
    setEditListCta(selectedList.ctaText || 'Subscribe to Updates');
    setEditListSuccessMsg(selectedList.successMessage || '');
    setEditListLogo(selectedList.logoUrl || '');
    setEditListBanner(selectedList.bannerUrl || '');
    setShowEditListModal(true);
  };

  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !editListName.trim()) return;

    setUpdatingList(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editListName.trim(),
          description: editListDesc.trim(),
          badgeText: editListBadge.trim(),
          headline: editListHeadline.trim(),
          ctaText: editListCta.trim(),
          successMessage: editListSuccessMsg.trim(),
          logoUrl: editListLogo.trim(),
          bannerUrl: editListBanner.trim(),
        }),
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
  const handleDeleteList = () => {
    if (!selectedList || !selectedListId) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete List "${selectedList.name}"?`,
      description: 'This will permanently delete this mailing list and all associated contacts. This action cannot be undone.',
      confirmLabel: 'Delete List',
      onConfirm: async () => {
        setConfirmModal(null);
        await executeDeleteList();
      },
    });
  };

  const executeDeleteList = async () => {
    if (!selectedList || !selectedListId) return;

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

  // Contact Single Edit
  const handleOpenEditContact = (contact: Contact) => {
    setEditingContactId(contact.id);
    setEditContactEmail(contact.email);
    setEditContactName(contact.firstName || '');
    setEditContactStatus(contact.status);
    setShowEditContactModal(true);
  };

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
        await loadContacts();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to update contact' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setUpdatingContact(false);
    }
  };

  // Single Add Contact
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !newContactEmail.trim()) return;

    setAddingContact(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newContactEmail.trim(), firstName: newContactName.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAddContactModal(false);
        setNewContactEmail('');
        setNewContactName('');
        setFeedback({ type: 'success', message: 'Contact added to list!' });
        await loadContacts();
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

  // CSV Bulk Import
  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !csvText.trim()) return;

    setImportingCsv(true);
    setFeedback(null);

    try {
      const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
      const parsedContacts: { email: string; firstName?: string }[] = [];
      for (const line of lines) {
        const parts = line.split(',');
        const email = parts[0]?.trim();
        const firstName = parts[1]?.trim() || '';
        if (email && email.includes('@')) {
          parsedContacts.push({ email, firstName: firstName || undefined });
        }
      }

      if (parsedContacts.length === 0) {
        setFeedback({ type: 'error', message: 'No valid email rows found in CSV text.' });
        setImportingCsv(false);
        return;
      }

      const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: parsedContacts }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCsvModal(false);
        setCsvText('');
        setFeedback({
          type: 'success',
          message: `Imported ${data.importedCount} contacts successfully!`,
        });
        await loadContacts();
        await loadLists();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Import failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setImportingCsv(false);
    }
  };

  // Handle CSV file upload
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setCsvText(text);
    };
    reader.readAsText(file);
  };

  // Export Contacts to CSV
  const handleExportCsv = () => {
    if (!selectedList || filteredContacts.length === 0) return;
    const headers = ['Email', 'First Name', 'Status', 'Date Added'];
    const rows = filteredContacts.map((c) => [
      `"${c.email}"`,
      `"${c.firstName || ''}"`,
      `"${c.status}"`,
      `"${new Date(c.createdAt).toLocaleDateString()}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers_${selectedList.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Single Delete Contact
  const handleDeleteContact = (contactId: string, email?: string) => {
    if (!selectedListId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Remove Subscriber?',
      description: email ? `Remove "${email}" from this mailing list?` : 'Remove this subscriber from the mailing list?',
      confirmLabel: 'Remove Subscriber',
      onConfirm: async () => {
        setConfirmModal(null);
        await executeDeleteContact(contactId);
      },
    });
  };

  const executeDeleteContact = async (contactId: string) => {
    if (!selectedListId) return;
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts?contactId=${contactId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
        setSelectedContactIds((prev) => prev.filter((id) => id !== contactId));
        await loadLists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Delete Selected Contacts
  const handleBulkDelete = () => {
    if (!selectedListId || selectedContactIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete ${selectedContactIds.length} Subscribers?`,
      description: `These ${selectedContactIds.length} contacts will be permanently removed from this mailing list. This action cannot be undone.`,
      confirmLabel: `Delete ${selectedContactIds.length} Subscribers`,
      onConfirm: async () => {
        setConfirmModal(null);
        await executeBulkDelete();
      },
    });
  };

  const executeBulkDelete = async () => {
    if (!selectedListId || selectedContactIds.length === 0) return;

    setDeletingBulk(true);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}/contacts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: selectedContactIds }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: `Deleted ${data.count || selectedContactIds.length} contacts.` });
        setSelectedContactIds([]);
        await loadContacts();
        await loadLists();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to delete contacts' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setDeletingBulk(false);
    }
  };

  // Select all / Deselect all
  const handleToggleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c) => c.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Send Broadcast Campaign
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !broadcastSubject.trim() || !broadcastBody.trim()) return;

    setBroadcasting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/mailing-lists/${selectedListId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: broadcastSubject.trim(), bodyHtml: broadcastBody.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowBroadcastModal(false);
        setBroadcastSubject('');
        setBroadcastBody('');
        setFeedback({
          type: 'success',
          message: `Broadcast delivered to ${data.sentCount} recipients via Gmail!`,
        });
        await loadLists();
        await loadCampaigns();
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

  // Filtered contacts list
  const filteredContacts = contacts.filter((c) => {
    const matchesFilter = contactStatusFilter === 'all' || c.status === contactStatusFilter;
    const query = contactSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      c.email.toLowerCase().includes(query) ||
      (c.firstName && c.firstName.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  // Embed Snippet Generator
  const embedCodeSnippet =
    embedStyle === 'inline'
      ? `<!-- DynamicQR Inline Subscriber Box -->\n<div style="max-width:400px;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:20px;font-family:sans-serif;">\n  <h4 style="margin:0 0 8px;font-size:16px;color:#11140F;font-weight:700;">Join ${selectedList?.name || 'Our Community'}</h4>\n  <p style="margin:0 0 14px;font-size:12px;color:#6b7280;">${selectedList?.description || 'Get exclusive updates straight to your inbox.'}</p>\n  <form action="${origin}/api/mailing-lists/${selectedListId}/subscribe" method="POST" style="display:flex;flex-direction:column;gap:8px;">\n    <input type="text" name="firstName" placeholder="First Name (optional)" style="padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;outline:none;" />\n    <input type="email" name="email" placeholder="Enter your email" required style="padding:10px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;outline:none;" />\n    <button type="submit" style="background:${embedAccent};color:#ffffff;border:none;padding:10px 14px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;">Subscribe</button>\n  </form>\n</div>`
      : embedStyle === 'floating_pill'
      ? `<!-- DynamicQR Floating Pill -->\n<div style="position:fixed;bottom:20px;right:20px;background:#ffffff;padding:10px 14px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);display:flex;align-items:center;gap:8px;font-family:sans-serif;z-index:9999;">\n  <form action="${origin}/api/mailing-lists/${selectedListId}/subscribe" method="POST" style="display:flex;gap:6px;margin:0;">\n    <input type="email" name="email" placeholder="Enter email" required style="padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:12px;outline:none;" />\n    <button type="submit" style="background:${embedAccent};color:#ffffff;border:none;padding:8px 12px;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;">Join</button>\n  </form>\n</div>`
      : `<!-- DynamicQR Minimal Link -->\n<a href="${origin}/join/${selectedListId}" target="_blank" style="display:inline-block;background:${embedAccent};color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-size:13px;font-weight:600;font-family:sans-serif;">Subscribe to ${selectedList?.name || 'Updates'} &rarr;</a>`;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quotas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0E1017] p-5 rounded-lg border border-[#11140F]/10 dark:border-white/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#2F6B4F] dark:text-emerald-400" />
            <h3 className="text-base font-bold text-[#11140F] dark:text-white">
              Customer Mailing Lists & Campaigns
            </h3>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded-md bg-[#11140F]/5 dark:bg-white/10 text-[#11140F]/70 dark:text-white/70 font-semibold">
              {quotas?.tier || userTier.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-[#11140F]/60 dark:text-white/60 mt-0.5">
            Collect subscriber contacts via your printed QR codes and dispatch email broadcasts using dedicated Gmail delivery.
          </p>
        </div>

        {/* Quota Progress Pills */}
        {quotas && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-md bg-[#F7F8F5] dark:bg-white/[0.04] border border-[#11140F]/10 dark:border-white/10 text-xs flex items-center gap-1.5 font-mono">
              <span className="text-[#11140F]/50 dark:text-white/50">Lists:</span>
              <strong className="text-[#11140F] dark:text-white">{quotas.listsUsed} / {quotas.listsMax}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-[#F7F8F5] dark:bg-white/[0.04] border border-[#11140F]/10 dark:border-white/10 text-xs flex items-center gap-1.5 font-mono">
              <span className="text-[#11140F]/50 dark:text-white/50">Subscribers:</span>
              <strong className="text-[#11140F] dark:text-white">{quotas.contactsUsed} / {quotas.contactsMax}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-[#F7F8F5] dark:bg-white/[0.04] border border-[#11140F]/10 dark:border-white/10 text-xs flex items-center gap-1.5 font-mono">
              <span className="text-[#11140F]/50 dark:text-white/50">Broadcasts:</span>
              <strong className="text-[#11140F] dark:text-white">{quotas.campaignsUsedThisMonth} / {quotas.campaignsMaxPerMonth} mo</strong>
            </div>
          </div>
        )}
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-md border text-xs flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
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
            className="text-xs opacity-60 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-[#11140F]/50 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#2F6B4F]" />
          <span>Loading customer lists...</span>
        </div>
      ) : lists.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#0E1017] rounded-lg border border-[#11140F]/10 dark:border-white/10 space-y-3">
          <Mail className="w-8 h-8 text-[#2F6B4F] dark:text-emerald-400 mx-auto opacity-70" />
          <h4 className="text-sm font-bold text-[#11140F] dark:text-white">No Customer Mailing Lists Yet</h4>
          <p className="text-xs text-[#11140F]/60 dark:text-white/60 max-w-sm mx-auto">
            Create your first mailing list to collect customer emails via QR signs, retail counter tents, and online widgets.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-md bg-[#11140F] dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-[#2A2E25] dark:hover:bg-emerald-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First List</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* List Selector Navigation Bar */}
          <div className="flex items-center justify-between border-b border-[#11140F]/10 dark:border-white/10 pb-3 gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              {lists.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelectedListId(l.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedListId === l.id
                      ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] shadow-xs'
                      : 'bg-white dark:bg-[#0E1017] border border-[#11140F]/10 dark:border-white/10 text-[#11140F]/70 dark:text-white/70 hover:bg-[#F7F8F5] dark:hover:bg-white/5'
                  }`}
                >
                  <span>{l.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                      selectedListId === l.id ? 'bg-white/20 text-white dark:bg-[#11140F]/15 dark:text-[#11140F]' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60'
                    }`}
                  >
                    {l._count.contacts}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={quotas ? quotas.listsUsed >= quotas.listsMax : false}
                className="px-3 py-1.5 rounded-md bg-white dark:bg-[#0E1017] border border-[#11140F]/15 dark:border-white/15 text-[#11140F] dark:text-white text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New List</span>
              </button>
            </div>
          </div>

          {/* Active List Panel */}
          {selectedList && (
            <div className="space-y-4 pt-1">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8F5] dark:bg-[#0E1017] p-4 rounded-lg border border-[#11140F]/8 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#11140F] dark:text-white">{selectedList.name}</h4>
                    <button
                      type="button"
                      onClick={handleOpenEditList}
                      className="p-1 rounded-md text-[#11140F]/40 dark:text-white/40 hover:text-[#11140F] dark:hover:text-white hover:bg-white dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit mailing list"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteList}
                      disabled={deletingList}
                      className="p-1 rounded-md text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer disabled:opacity-40"
                      title="Delete this mailing list"
                    >
                      {deletingList ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#11140F]/60 dark:text-white/60 mt-0.5">
                    {selectedList.description || 'Customer subscriber list.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    disabled={quotas ? quotas.contactsUsed >= quotas.contactsMax : false}
                    className="px-3 py-1.5 rounded-md bg-white dark:bg-[#14161F] border border-[#11140F]/15 dark:border-white/15 text-[#11140F] dark:text-white text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subscriber</span>
                  </button>

                  <button
                    onClick={() => setShowCsvModal(true)}
                    disabled={quotas ? quotas.contactsUsed >= quotas.contactsMax : false}
                    className="px-3 py-1.5 rounded-md bg-white dark:bg-[#14161F] border border-[#11140F]/15 dark:border-white/15 text-[#11140F] dark:text-white text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#2F6B4F] dark:text-emerald-400" />
                    <span>Import CSV</span>
                  </button>

                  <button
                    onClick={handleExportCsv}
                    disabled={filteredContacts.length === 0}
                    className="px-3 py-1.5 rounded-md bg-white dark:bg-[#14161F] border border-[#11140F]/15 dark:border-white/15 text-[#11140F] dark:text-white text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={() => setShowEmbedModal(true)}
                    className="px-3 py-1.5 rounded-md bg-white dark:bg-[#14161F] border border-[#11140F]/15 dark:border-white/15 text-[#11140F] dark:text-white text-xs font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Embed Form</span>
                  </button>

                  <button
                    onClick={() => setShowPrintModal(true)}
                    className="px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#2F6B4F] dark:text-emerald-400" />
                    <span>Print QR Displays</span>
                  </button>

                  <button
                    onClick={() => setShowBroadcastModal(true)}
                    disabled={contacts.filter((c) => c.status === 'active').length === 0}
                    className="px-3.5 py-1.5 rounded-md bg-[#2F6B4F] dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-[#25553E] dark:hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Compose Broadcast</span>
                  </button>
                </div>
              </div>

              {/* Physical Print & Retail Setup Banner */}
              <div className="p-4 rounded-lg bg-[#2F6B4F]/10 dark:bg-emerald-950/20 border border-[#2F6B4F]/20 dark:border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-[#2F6B4F] dark:text-emerald-400" />
                    <h5 className="text-xs font-bold text-[#11140F] dark:text-emerald-300 uppercase tracking-wide">
                      Counter Cards, Packaging & Table Tents
                    </h5>
                  </div>
                  <p className="text-xs text-[#11140F]/70 dark:text-white/70 leading-relaxed">
                    Print QR codes for your venue or packages. Customers scan and join immediately. Broadcast updates to them via Gmail.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/join/${selectedList.id}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-md border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/10 text-[#11140F] dark:text-white text-xs font-medium hover:bg-gray-50 dark:hover:bg-white/15 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test Form</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(true)}
                    className="px-3.5 py-1.5 rounded-md bg-[#2F6B4F] dark:bg-emerald-600 text-white text-xs font-medium hover:bg-[#25553E] dark:hover:bg-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Studio</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tab Navigation: Subscribers vs Broadcast History */}
              <div className="flex items-center justify-between border-b border-[#11140F]/10 dark:border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setListSubTab('contacts')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      listSubTab === 'contacts'
                        ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] shadow-xs'
                        : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Subscribers ({contacts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setListSubTab('history')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      listSubTab === 'history'
                        ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] shadow-xs'
                        : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Broadcast History ({campaigns.length})</span>
                  </button>
                </div>

                {listSubTab === 'contacts' && selectedContactIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={deletingBulk}
                    className="px-3 py-1 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {deletingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    <span>Delete ({selectedContactIds.length}) Selected</span>
                  </button>
                )}
              </div>

              {/* SUB-TAB 1: SUBSCRIBERS */}
              {listSubTab === 'contacts' && (
                <div className="rounded-lg border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0E1017] overflow-hidden shadow-xs space-y-0">
                  {/* Search and Filters */}
                  <div className="p-3 bg-[#F7F8F5] dark:bg-white/[0.03] border-b border-[#11140F]/8 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#11140F]/40 dark:text-white/40" />
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        placeholder="Search subscriber email or name..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-md border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#14161F] text-xs text-[#11140F] dark:text-white focus:outline-none focus:border-[#2F6B4F] dark:focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-1 w-full sm:w-auto">
                      {(['all', 'active', 'unsubscribed', 'pending'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setContactStatusFilter(st)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                            contactStatusFilter === st
                              ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F]'
                              : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white hover:bg-white dark:hover:bg-white/10'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {loadingContacts ? (
                    <div className="p-8 text-center text-xs text-[#11140F]/50 dark:text-white/50">
                      Loading contacts...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#11140F]/50 dark:text-white/50">
                      {contacts.length === 0
                        ? 'No subscribers in this list yet. Share your QR code or use "Add Subscriber" above.'
                        : 'No subscribers match your search filter.'}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#11140F]/8 dark:border-white/10 bg-white dark:bg-[#0E1017] text-[11px] uppercase font-semibold text-[#11140F]/50 dark:text-white/50 tracking-wider">
                            <th className="py-2.5 px-3 w-8">
                              <button
                                type="button"
                                onClick={handleToggleSelectAll}
                                className="text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white cursor-pointer"
                              >
                                {selectedContactIds.length === filteredContacts.length && filteredContacts.length > 0 ? (
                                  <CheckSquare className="w-4 h-4 text-[#2F6B4F] dark:text-emerald-400" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </th>
                            <th className="py-2.5 px-3">Subscriber</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Date Added</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#11140F]/5 dark:divide-white/5">
                          {filteredContacts.map((c) => {
                            const isSelected = selectedContactIds.includes(c.id);
                            return (
                              <tr key={c.id} className="hover:bg-[#F7F8F5]/60 dark:hover:bg-white/[0.03] transition-colors">
                                <td className="py-2.5 px-3">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSelectOne(c.id)}
                                    className="cursor-pointer"
                                  >
                                    {isSelected ? (
                                      <CheckSquare className="w-4 h-4 text-[#2F6B4F] dark:text-emerald-400" />
                                    ) : (
                                      <Square className="w-4 h-4 text-[#11140F]/30 dark:text-white/30" />
                                    )}
                                  </button>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-medium text-[#11140F] dark:text-white">{c.email}</div>
                                  {c.firstName && (
                                    <div className="text-[11px] text-[#11140F]/50 dark:text-white/50">{c.firstName}</div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  {c.status === 'active' && (
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Active
                                    </span>
                                  )}
                                  {c.status === 'unsubscribed' && (
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                                      <XCircle className="w-3 h-3" />
                                      Unsubscribed
                                    </span>
                                  )}
                                  {c.status === 'pending' && (
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30">
                                      <Clock className="w-3 h-3" />
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[11px] text-[#11140F]/50 dark:text-white/50 font-mono">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditContact(c)}
                                      className="p-1 rounded-md text-[#11140F]/50 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                      title="Edit contact"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteContact(c.id, c.email)}
                                      className="p-1 rounded-md text-red-500 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                      title="Remove contact"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: BROADCAST HISTORY */}
              {listSubTab === 'history' && (
                <div className="rounded-lg border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0E1017] overflow-hidden shadow-xs">
                  <div className="p-3 bg-[#F7F8F5] dark:bg-white/[0.03] border-b border-[#11140F]/8 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#11140F] dark:text-white">
                      Recorded Email Broadcasts ({campaigns.length})
                    </span>
                    <button
                      type="button"
                      onClick={loadCampaigns}
                      className="text-[11px] text-[#2F6B4F] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Refresh Logs
                    </button>
                  </div>

                  {loadingCampaigns ? (
                    <div className="p-8 text-center text-xs text-[#11140F]/50 dark:text-white/50">
                      Loading broadcast logs...
                    </div>
                  ) : campaigns.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#11140F]/50 dark:text-white/50 space-y-1">
                      <p className="font-semibold text-[#11140F] dark:text-white">No broadcasts dispatched yet.</p>
                      <p>Send your first broadcast using &quot;Compose Broadcast&quot; above to see delivery telemetry.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#11140F]/8 dark:border-white/10 bg-white dark:bg-[#0E1017] text-[11px] uppercase font-semibold text-[#11140F]/50 dark:text-white/50 tracking-wider">
                            <th className="py-2.5 px-4">Subject</th>
                            <th className="py-2.5 px-4">Delivery Status</th>
                            <th className="py-2.5 px-4">Delivered</th>
                            <th className="py-2.5 px-4">Sent Date</th>
                            <th className="py-2.5 px-4 text-right">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#11140F]/5 dark:divide-white/5">
                          {campaigns.map((camp) => (
                            <tr key={camp.id} className="hover:bg-[#F7F8F5]/60 dark:hover:bg-white/[0.03] transition-colors">
                              <td className="py-3 px-4 font-medium text-[#11140F] dark:text-white max-w-xs truncate">
                                {camp.subject}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Sent
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-[#11140F] dark:text-white">
                                {camp.sentCount} / {camp.recipientCount || camp.sentCount} recipients
                              </td>
                              <td className="py-3 px-4 text-[11px] text-[#11140F]/50 dark:text-white/50">
                                {camp.sentAt ? new Date(camp.sentAt).toLocaleString() : '—'}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setInspectingCampaign(camp)}
                                  className="px-2.5 py-1 rounded-md border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#14161F] text-[11px] font-medium text-[#11140F] dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                  View Log
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Campaign Inspection Detail */}
      {inspectingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-lg p-6 shadow-xl border border-[#11140F]/15 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10">
              <div>
                <h4 className="font-bold text-sm text-[#11140F]">{inspectingCampaign.subject}</h4>
                <p className="text-xs text-[#11140F]/60 mt-0.5">
                  Dispatched on {inspectingCampaign.sentAt ? new Date(inspectingCampaign.sentAt).toLocaleString() : '—'} • {inspectingCampaign.sentCount} delivered
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingCampaign(null)}
                className="text-[#11140F]/40 hover:text-[#11140F] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipients Delivery Log Table */}
            <div>
              <h5 className="text-xs font-semibold text-[#11140F] mb-2">Recipient Delivery Status:</h5>
              {inspectingCampaign.recipients && inspectingCampaign.recipients.length > 0 ? (
                <div className="rounded-md border border-[#11140F]/10 max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#11140F]/8 text-[10.5px] uppercase text-[#11140F]/50">
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#11140F]/5">
                      {inspectingCampaign.recipients.map((rec, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-2 px-3 font-mono text-[11px]">{rec.email}</td>
                          <td className="py-2 px-3">
                            {rec.status === 'sent' ? (
                              <span className="text-emerald-700 font-semibold text-[10.5px]">Delivered</span>
                            ) : (
                              <span className="text-red-600 font-semibold text-[10.5px]">{rec.error || 'Failed'}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[10.5px] text-[#11140F]/40 font-mono">
                            {rec.sentAt ? new Date(rec.sentAt).toLocaleTimeString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-[#11140F]/50 italic">Delivered to active subscriber list.</p>
              )}
            </div>

            {/* Email Body Preview */}
            <div className="pt-2">
              <h5 className="text-xs font-semibold text-[#11140F] mb-2">Dispatched Message Content:</h5>
              <div
                className="p-4 rounded-md border border-[#11140F]/10 bg-gray-50 text-xs leading-relaxed max-h-56 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: inspectingCampaign.bodyHtml }}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectingCampaign(null)}
                className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Create List */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-lg p-5 shadow-xl border border-[#11140F]/15 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#11140F]/10">
              <h4 className="text-sm font-bold text-[#11140F]">Create Mailing List</h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#11140F]/40 hover:text-[#11140F] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#11140F] mb-1">List Name *</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. VIP Customers, Weekend Brunch Club"
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11140F] mb-1">
                    Form Badge Tag
                    <span className="text-[10px] text-[#11140F]/50 font-normal ml-1">(custom tag)</span>
                  </label>
                  <input
                    type="text"
                    value={newListBadge}
                    onChange={(e) => setNewListBadge(e.target.value)}
                    placeholder="e.g. VIP Subscriber Form, Scan to Join"
                    className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#11140F] mb-1">
                    Button CTA Text
                    <span className="text-[10px] text-[#11140F]/50 font-normal ml-1">(submit label)</span>
                  </label>
                  <input
                    type="text"
                    value={newListCta}
                    onChange={(e) => setNewListCta(e.target.value)}
                    placeholder="e.g. Subscribe to Updates, Claim Perk"
                    className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11140F] mb-1">
                  Public Headline
                  <span className="text-[10px] text-[#11140F]/50 font-normal ml-1">(optional, defaults to List Name)</span>
                </label>
                <input
                  type="text"
                  value={newListHeadline}
                  onChange={(e) => setNewListHeadline(e.target.value)}
                  placeholder="e.g. Join The VIP Tasting Club & Get 15% Off"
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11140F] mb-1">Description / Subtitle</label>
                <textarea
                  rows={2}
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="e.g. Scan to receive secret menus, weekly promotions, and member-only event invitations."
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11140F] mb-1">
                  Custom Success Note
                  <span className="text-[10px] text-[#11140F]/50 font-normal ml-1">(shown right after subscribing)</span>
                </label>
                <input
                  type="text"
                  value={newListSuccessMsg}
                  onChange={(e) => setNewListSuccessMsg(e.target.value)}
                  placeholder="e.g. You're on the list! Show this screen to your server for 10% off today."
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              {/* Brand Logo & Hero Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <ImageUploadField
                  value={newListLogo}
                  onChange={setNewListLogo}
                  label="Brand / Venue Logo"
                  variant="logo"
                />
                <ImageUploadField
                  value={newListBanner}
                  onChange={setNewListBanner}
                  label="Hero Cover Banner"
                  variant="banner"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingList}
                  className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {creatingList && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create List</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit List */}
      {showEditListModal && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-lg p-5 shadow-xl border border-[#11140F]/15 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#11140F]/10">
              <h4 className="text-sm font-bold text-[#11140F]">Edit Mailing List Settings</h4>
              <button
                type="button"
                onClick={() => setShowEditListModal(false)}
                className="text-[#11140F]/40 hover:text-[#11140F] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateList} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#11140F] mb-1">List Name *</label>
                <input
                  type="text"
                  value={editListName}
                  onChange={(e) => setEditListName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#11140F] mb-1">
                    Form Badge Tag
                    <span className="text-[10px] text-[#11140F]/50 font-normal ml-1">(custom tag)</span>
                  </label>
                  <input
                    type="text"
                    value={editListBadge}
                    onChange={(e) => setEditListBadge(e.target.value)}
                    placeholder="e.g. VIP Subscriber Form, Scan to Join"
                    className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#11140F] mb-1">
                    Button CTA Text
                    <span className="text-[10px] text-[#11140F]/50 font-normal ml-1">(submit label)</span>
                  </label>
                  <input
                    type="text"
                    value={editListCta}
                    onChange={(e) => setEditListCta(e.target.value)}
                    placeholder="e.g. Subscribe to Updates, Claim Perk"
                    className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11140F] mb-1">
                  Public Headline
                  <span className="text-[10px] text-[#11140F]/50 font-normal ml-1">(optional, defaults to List Name)</span>
                </label>
                <input
                  type="text"
                  value={editListHeadline}
                  onChange={(e) => setEditListHeadline(e.target.value)}
                  placeholder="e.g. Join Our VIP Tasting Club"
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11140F] mb-1">Description / Subtitle</label>
                <textarea
                  rows={2}
                  value={editListDesc}
                  onChange={(e) => setEditListDesc(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#11140F] mb-1">
                  Custom Success Note
                  <span className="text-[10px] text-[#11140F]/50 font-normal ml-1">(shown right after subscribing)</span>
                </label>
                <input
                  type="text"
                  value={editListSuccessMsg}
                  onChange={(e) => setEditListSuccessMsg(e.target.value)}
                  placeholder="e.g. You're on the list! Show this screen to your server for 10% off today."
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              {/* Brand Logo & Hero Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <ImageUploadField
                  value={editListLogo}
                  onChange={setEditListLogo}
                  label="Brand / Venue Logo"
                  variant="logo"
                />
                <ImageUploadField
                  value={editListBanner}
                  onChange={setEditListBanner}
                  label="Hero Cover Banner"
                  variant="banner"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowEditListModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingList}
                  className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {updatingList && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Subscriber */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-lg p-5 shadow-xl border border-[#11140F]/15 space-y-4">
            <h4 className="text-sm font-bold text-[#11140F]">Add Subscriber to {selectedList?.name}</h4>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  placeholder="subscriber@example.com"
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">First Name (optional)</label>
                <input
                  type="text"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowAddContactModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingContact}
                  className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addingContact && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add Subscriber</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Subscriber */}
      {showEditContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-lg p-5 shadow-xl border border-[#11140F]/15 space-y-4">
            <h4 className="text-sm font-bold text-[#11140F]">Edit Subscriber</h4>
            <form onSubmit={handleUpdateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Email Address *</label>
                <input
                  type="email"
                  value={editContactEmail}
                  onChange={(e) => setEditContactEmail(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">First Name</label>
                <input
                  type="text"
                  value={editContactName}
                  onChange={(e) => setEditContactName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Status</label>
                <select
                  value={editContactStatus}
                  onChange={(e) => setEditContactStatus(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] bg-white focus:outline-none focus:border-[#2F6B4F]"
                >
                  <option value="active">Active (Receives broadcasts)</option>
                  <option value="unsubscribed">Unsubscribed (Suppressed)</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowEditContactModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingContact}
                  className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updatingContact && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: CSV Bulk Import */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-lg p-5 shadow-xl border border-[#11140F]/15 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#11140F]/10">
              <h4 className="text-sm font-bold text-[#11140F] flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#2F6B4F]" />
                CSV Bulk Import
              </h4>
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="text-[#11140F]/40 hover:text-[#11140F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#11140F]/60">
              Upload a .csv file or paste lines below in format: <code>email, first_name</code>.
            </p>

            <form onSubmit={handleCsvImport} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Upload CSV File</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCsvFileUpload}
                  className="w-full text-xs text-[#11140F]/70 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#11140F]/10 file:text-[#11140F] hover:file:bg-[#11140F]/20 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">
                  Or Paste CSV Content
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="alice@example.com, Alice&#10;bob@example.com, Bob&#10;charlie@example.com, Charlie"
                  required
                  className="w-full px-3 py-2 rounded-md border border-[#11140F]/15 text-xs font-mono text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importingCsv}
                  className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-medium hover:bg-[#2A2E25] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {importingCsv && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Import Subscribers</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Broadcast Composer with Rich Text Toolbar & Live Preview */}
      {showBroadcastModal && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white rounded-lg p-5 shadow-xl border border-[#11140F]/15 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10">
              <div>
                <h4 className="text-sm font-bold text-[#11140F]">
                  Broadcast to {selectedList.name}
                </h4>
                <p className="text-xs text-[#11140F]/60">
                  Delivering to {contacts.filter((c) => c.status === 'active').length} active recipients via personal Gmail.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="px-2.5 py-1 rounded-md border border-[#11140F]/15 text-xs font-medium text-[#11140F] hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="text-[#11140F]/40 hover:text-[#11140F] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Template Picker */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#11140F]/60 uppercase tracking-wider block">
                Load Ready Template:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setBroadcastSubject(tmpl.subject.replace('{{list_name}}', selectedList.name));
                      setBroadcastBody(tmpl.body.replace(/{{list_name}}/g, selectedList.name));
                    }}
                    className="p-2 rounded-md border border-[#11140F]/10 bg-[#F7F8F5] hover:border-[#2F6B4F] text-left text-xs font-medium text-[#11140F] transition-all cursor-pointer"
                  >
                    <span className="block font-semibold">{tmpl.name}</span>
                    <span className="text-[10px] text-[#11140F]/50">Click to apply</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#11140F] mb-1">Subject Line *</label>
                <input
                  type="text"
                  value={broadcastSubject}
                  onChange={(e) => setBroadcastSubject(e.target.value)}
                  placeholder="e.g. Exclusive Friday Announcement"
                  required
                  className="w-full px-3 py-1.5 rounded-md border border-[#11140F]/15 text-xs text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              {/* Rich Text Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-[#11140F]">Email Body (HTML &amp; Rich Text) *</label>
                  <div className="flex items-center gap-1 text-[11px] text-[#11140F]/50">
                    <span>Tags:</span>
                    <button
                      type="button"
                      onClick={() => insertSnippet('{{first_name}}')}
                      className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-[#11140F] font-mono text-[10px]"
                    >
                      +First Name
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSnippet('{{list_name}}')}
                      className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-[#11140F] font-mono text-[10px]"
                    >
                      +List Name
                    </button>
                  </div>
                </div>

                {/* Toolbar Controls */}
                <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#F7F8F5] border border-b-0 border-[#11140F]/15 rounded-t-md text-xs">
                  <button
                    type="button"
                    onClick={() => insertSnippet('<strong>', '</strong>', 'bold text')}
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<em>', '</em>', 'italic text')}
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors"
                    title="Italic"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('<u>', '</u>', 'underlined text')}
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors"
                    title="Underline"
                  >
                    <UnderlineIcon className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-px h-4 bg-[#11140F]/10 mx-0.5" />

                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        '<h2 style="font-size:18px;font-weight:700;color:#11140F;margin:16px 0 8px;">',
                        '</h2>',
                        'Section Heading'
                      )
                    }
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors font-bold text-[11px]"
                    title="Heading 2"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        '<h3 style="font-size:15px;font-weight:600;color:#11140F;margin:12px 0 6px;">',
                        '</h3>',
                        'Subheading'
                      )
                    }
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors font-bold text-[11px]"
                    title="Heading 3"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                  </button>

                  <span className="w-px h-4 bg-[#11140F]/10 mx-0.5" />

                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter link URL:', 'https://');
                      if (url) {
                        const text = prompt('Enter link text:', 'Click here') || 'Click here';
                        insertSnippet(
                          `<a href="${url}" style="color:#2F6B4F;text-decoration:underline;">${text}</a>`
                        );
                      }
                    }}
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors"
                    title="Insert Link"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter image URL:', 'https://');
                      if (url) {
                        const alt = prompt('Enter image description/alt text:', 'Image') || '';
                        insertSnippet(
                          `<img src="${url}" alt="${alt}" style="max-width:100%;height:auto;border-radius:6px;margin:14px 0;" />`
                        );
                      }
                    }}
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors"
                    title="Insert Image"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const text = prompt('Enter button label:', 'Claim Offer') || 'Click here';
                      const url = prompt('Enter button link:', 'https://') || '#';
                      insertSnippet(
                        `<div style="text-align:center;margin:20px 0;"><a href="${url}" style="background:#11140F;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:13px;font-weight:600;display:inline-block;">${text}</a></div>`
                      );
                    }}
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors flex items-center gap-1 text-[11px]"
                    title="Insert CTA Button"
                  >
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>Button</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet(
                        '<ul style="margin:12px 0;padding-left:20px;color:#374151;">\n  <li>First point</li>\n  <li>Second point</li>\n</ul>\n'
                      )
                    }
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors"
                    title="Bullet List"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      insertSnippet('\n<hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;" />\n')
                    }
                    className="p-1 rounded hover:bg-white text-[#11140F] transition-colors"
                    title="Divider"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  rows={8}
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="Hello {{first_name}},\n\nWrite your announcement or promo here..."
                  required
                  className="w-full px-3 py-2 rounded-b-md border border-[#11140F]/15 text-xs font-mono text-[#11140F] focus:outline-none focus:border-[#2F6B4F]"
                />
              </div>

              {/* Branding notification */}
              <div className="p-2.5 rounded-md bg-gray-50 border border-gray-200 text-[11px] text-gray-600">
                Email footer includes <strong>Powered by Dynamic QR</strong> (clickable to main site) and your business unsubscribe link.
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-[#11140F]/60 hover:text-[#11140F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="px-4 py-1.5 rounded-md bg-[#2F6B4F] text-white text-xs font-medium hover:bg-[#25553E] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {broadcasting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>{broadcasting ? 'Sending...' : 'Send Broadcast via Gmail'}</span>
                </button>
              </div>
            </form>

            {/* Live Preview Panel */}
            {showPreview && (
              <div className="rounded-lg border border-[#11140F]/15 bg-gray-100 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#11140F]/60">
                  <span className="font-semibold text-[#11140F]">Live Email Preview:</span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-[#11140F]/10">
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

                <div className={`mx-auto bg-white rounded-md border border-gray-200 shadow-xs p-4 overflow-hidden text-xs leading-relaxed ${previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'}`}>
                  <div className="font-bold text-sm text-[#11140F] pb-2 border-b border-gray-100">
                    {broadcastSubject ? broadcastSubject.replace('{{first_name}}', 'Alex').replace('{{list_name}}', selectedList.name) : 'Subject line preview...'}
                  </div>
                  <div
                    className="py-3 text-gray-800"
                    dangerouslySetInnerHTML={{
                      __html: broadcastBody
                        ? broadcastBody
                            .replace(/{{first_name}}/g, 'Alex')
                            .replace(/{{list_name}}/g, selectedList.name)
                            .replace(/{{site_url}}/g, '#')
                        : '<p class="text-gray-400 italic">Body preview will appear here...</p>',
                    }}
                  />
                  <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 text-center font-medium">
                    <div>
                      <span>Powered by </span>
                      <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="font-bold underline text-gray-800">
                        Dynamic QR
                      </a>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      You are receiving this update from {selectedList.name}. • <span className="underline">Unsubscribe</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Interactive Embed Widget Studio */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-lg p-5 shadow-xl border border-[#11140F]/15 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#11140F]/10">
              <h4 className="text-sm font-bold text-[#11140F] flex items-center gap-1.5">
                <Code className="w-4 h-4 text-[#2F6B4F]" />
                Embeddable Subscriber Form
              </h4>
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="text-[#11140F]/40 hover:text-[#11140F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#11140F]/60">
              Paste this HTML snippet on your website to capture subscribers directly into {selectedList?.name}.
            </p>

            {/* Style Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEmbedStyle('inline')}
                className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                  embedStyle === 'inline'
                    ? 'border-[#2F6B4F] bg-[#2F6B4F]/5'
                    : 'border-[#11140F]/10 hover:bg-[#F7F8F5]'
                }`}
              >
                <span className="block text-xs font-bold text-[#11140F]">1. Inline Box</span>
                <span className="text-[10px] text-[#11140F]/50">Blog footers &amp; sidebars</span>
              </button>

              <button
                type="button"
                onClick={() => setEmbedStyle('floating_pill')}
                className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                  embedStyle === 'floating_pill'
                    ? 'border-[#2F6B4F] bg-[#2F6B4F]/5'
                    : 'border-[#11140F]/10 hover:bg-[#F7F8F5]'
                }`}
              >
                <span className="block text-xs font-bold text-[#11140F]">2. Floating Pill</span>
                <span className="text-[10px] text-[#11140F]/50">Fixed corner popup</span>
              </button>

              <button
                type="button"
                onClick={() => setEmbedStyle('minimal')}
                className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                  embedStyle === 'minimal'
                    ? 'border-[#2F6B4F] bg-[#2F6B4F]/5'
                    : 'border-[#11140F]/10 hover:bg-[#F7F8F5]'
                }`}
              >
                <span className="block text-xs font-bold text-[#11140F]">3. Minimal Button</span>
                <span className="text-[10px] text-[#11140F]/50">Direct link to hosted form</span>
              </button>
            </div>

            {/* Code Snippet Box */}
            <div className="relative">
              <textarea
                readOnly
                rows={6}
                value={embedCodeSnippet}
                className="w-full px-3 py-2 rounded-md bg-[#11140F] text-emerald-400 font-mono text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(embedCodeSnippet);
                  setCopiedEmbed(true);
                  setTimeout(() => setCopiedEmbed(false), 2000);
                }}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedEmbed ? 'Copied!' : 'Copy Snippet'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#11140F]/10">
              <button
                type="button"
                onClick={() => setShowEmbedModal(false)}
                className="px-4 py-1.5 rounded-md bg-[#11140F] text-white text-xs font-medium hover:bg-[#2A2E25]"
              >
                Done
              </button>
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
          url={`${APP_URL}/join/${selectedList.id}`}
          userTier={quotas?.tier || 'free'}
          isAdmin={false}
          defaultHeadline={selectedList.headline || `Join ${selectedList.name}`}
          defaultHeaderTag={selectedList.badgeText ? selectedList.badgeText.toUpperCase() : 'SCAN TO SUBSCRIBE'}
          defaultSubline={selectedList.description || 'Enter your email for exclusive updates'}
          defaultFooterNote="Instant confirmation • Zero spam • Unsubscribe anytime"
          defaultTemplate="table-tent"
          featureBannerText="Print this QR code on retail counters, packaging, or table tents. When customers scan, they enter their email on a branded mobile form with automated double opt-in."
        />
      )}

      {/* Centered Mobile-Responsive Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          description={confirmModal.description}
          confirmLabel={confirmModal.confirmLabel}
          cancelLabel="Cancel"
          isDestructive={true}
          loading={deletingList || deletingBulk}
        />
      )}
    </div>
  );
}
