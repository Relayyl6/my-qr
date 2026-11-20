'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mail,
  Contact,
  Link2,
  Utensils,
  Wifi,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Lock,
  ChevronRight,
  Eye,
  Smartphone,
  AlertCircle,
  RefreshCw,
  QrCode,
  Globe,
  Share2,
} from 'lucide-react';
import CustomerMailingListManager from '@/components/CustomerMailingListManager';
import { PlanTier, PLANS } from '@/lib/plans';

interface MicroSaasHubProps {
  userTier: string;
  isAdmin?: boolean;
}

interface MicroItem {
  id: string;
  type: string;
  slug: string;
  title: string;
  spec: any;
  scansCount: number;
  active: boolean;
  createdAt: string;
}

export default function MicroSaasHub({ userTier, isAdmin = false }: MicroSaasHubProps) {
  const [activeTab, setActiveTab] = useState<'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi'>('mailing');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Data states
  const [vcards, setVcards] = useState<MicroItem[]>([]);
  const [shorteners, setShorteners] = useState<MicroItem[]>([]);
  const [menus, setMenus] = useState<MicroItem[]>([]);
  const [wifis, setWifis] = useState<MicroItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Creation modal / drawer states
  const [showVCardModal, setShowVCardModal] = useState(false);
  const [showShortenerModal, setShowShortenerModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);

  // Form states
  const [vcardForm, setVcardForm] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    bio: '',
    slug: '',
  });

  const [shortenerForm, setShortenerForm] = useState({
    title: '',
    destinationUrl: '',
    slug: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    iosUrl: '',
    androidUrl: '',
  });

  const [menuForm, setMenuForm] = useState({
    title: '',
    currency: '$',
    slug: '',
  });

  const [wifiForm, setWifiForm] = useState({
    ssid: '',
    password: '',
    authType: 'WPA',
    location: '',
    welcomeMessage: '',
    slug: '',
  });

  const normalizedTier = (userTier || 'free').toLowerCase() as PlanTier;
  const entitlements = PLANS[normalizedTier] || PLANS.free;

  // Fetch items based on active tab
  const fetchItems = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'vcard') {
        const res = await fetch('/api/vcard');
        const data = await res.json();
        if (data.vcards) setVcards(data.vcards);
      } else if (activeTab === 'shortener') {
        const res = await fetch('/api/shortener');
        const data = await res.json();
        if (data.shorteners) setShorteners(data.shorteners);
      } else if (activeTab === 'menu') {
        const res = await fetch('/api/menu');
        const data = await res.json();
        if (data.menus) setMenus(data.menus);
      } else if (activeTab === 'wifi') {
        const res = await fetch('/api/wifi');
        const data = await res.json();
        if (data.wifis) setWifis(data.wifis);
      }
    } catch (err: any) {
      console.error('Failed to load items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'mailing') {
      fetchItems();
    }
  }, [activeTab]);

  const handleCopyLink = (url: string, id: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this micro-app? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/microsaas/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');
      setSuccessMsg('Item deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Handlers
  const handleCreateVCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/vcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vcardForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create digital vCard');
      setShowVCardModal(false);
      setVcardForm({ firstName: '', lastName: '', title: '', company: '', phone: '', email: '', website: '', bio: '', slug: '' });
      setSuccessMsg('Digital vCard created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateShortener = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/shortener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shortenerForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create short link');
      setShowShortenerModal(false);
      setShortenerForm({ title: '', destinationUrl: '', slug: '', utmSource: '', utmMedium: '', utmCampaign: '', iosUrl: '', androidUrl: '' });
      setSuccessMsg('Short link generated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menuForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create digital menu');
      setShowMenuModal(false);
      setMenuForm({ title: '', currency: '$', slug: '' });
      setSuccessMsg('Contactless restaurant menu created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWifi = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/wifi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wifiForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Wi-Fi network QR');
      setShowWifiModal(false);
      setWifiForm({ ssid: '', password: '', authType: 'WPA', location: '', welcomeMessage: '', slug: '' });
      setSuccessMsg('Wi-Fi access card created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchItems();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-[#11140F]/10 bg-white p-4 sm:p-7 shadow-xs space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#11140F]/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#2F6B4F]" />
            <h2 className="text-lg sm:text-xl font-bold text-[#11140F] tracking-tight">
              Micro-SaaS Ecosystem
            </h2>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F]">
              5 Standalone Apps
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-[#11140F]/60 mt-1">
            Turnkey micro-tools powered by DynamicQR routing, QR code engine, and lead capture.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('mailing')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'mailing'
                ? 'bg-[#11140F] text-white shadow-sm'
                : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#EEF0EA]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Mailing Lists</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vcard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'vcard'
                ? 'bg-[#11140F] text-white shadow-sm'
                : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#EEF0EA]'
            }`}
          >
            <Contact className="w-3.5 h-3.5" />
            <span>Digital vCard</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2F6B4F]/15 text-[#2F6B4F] font-mono">
              {entitlements.microsaas.vcard}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shortener')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'shortener'
                ? 'bg-[#11140F] text-white shadow-sm'
                : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#EEF0EA]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Link Shortener</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2F6B4F]/15 text-[#2F6B4F] font-mono">
              {entitlements.microsaas.shortener}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-[#11140F] text-white shadow-sm'
                : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#EEF0EA]'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Restaurant Menu</span>
            {entitlements.microsaas.menu === 0 ? (
              <Lock className="w-3 h-3 text-amber-600" />
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2F6B4F]/15 text-[#2F6B4F] font-mono">
                {entitlements.microsaas.menu}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wifi')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'wifi'
                ? 'bg-[#11140F] text-white shadow-sm'
                : 'bg-[#F7F8F5] text-[#11140F]/70 hover:bg-[#EEF0EA]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Dynamic Wi-Fi</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2F6B4F]/15 text-[#2F6B4F] font-mono">
              {entitlements.microsaas.wifi}
            </span>
          </button>
        </div>
      </div>

      {/* Global Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB 1: MAILING LISTS */}
      {activeTab === 'mailing' && (
        <div>
          <CustomerMailingListManager userTier={userTier} isAdmin={isAdmin} />
        </div>
      )}

      {/* TAB 2: DIGITAL VCARD */}
      {activeTab === 'vcard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-[#11140F]/5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#11140F]">Digital Business Cards (vCard 3.0)</h3>
                <span className="text-xs font-mono font-medium text-[#11140F]/60">
                  ({vcards.length} / {entitlements.microsaas.vcard} used)
                </span>
              </div>
              <p className="text-xs text-[#11140F]/60 mt-0.5">
                Modern scannable networking card. Supports one-tap RFC 6350 phone contact save and contact exchange leads.
              </p>
            </div>
            {vcards.length < entitlements.microsaas.vcard ? (
              <button
                type="button"
                onClick={() => setShowVCardModal(true)}
                className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create vCard</span>
              </button>
            ) : (
              <Link
                href="/pricing"
                className="py-2 px-4 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Upgrade for More Cards</span>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#11140F]/50 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2F6B4F]" />
              <span>Loading digital business cards...</span>
            </div>
          ) : vcards.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[#11140F]/10 rounded-2xl p-6 space-y-3">
              <Contact className="w-8 h-8 mx-auto text-[#11140F]/30" />
              <div className="text-sm font-semibold text-[#11140F]">No Digital vCards Created Yet</div>
              <p className="text-xs text-[#11140F]/60 max-w-sm mx-auto">
                Create your first digital business card. Share your contact info, social profiles, and allow people to exchange contacts with you.
              </p>
              <button
                type="button"
                onClick={() => setShowVCardModal(true)}
                className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First vCard</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vcards.map((card) => {
                const spec = card.spec || {};
                return (
                  <div
                    key={card.id}
                    className="p-5 rounded-2xl border border-[#11140F]/10 bg-white hover:border-[#11140F]/20 transition-all space-y-4 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-[#11140F]">{card.title}</h4>
                          <p className="text-xs text-[#2F6B4F] font-medium">{spec.title || 'Professional'} {spec.company ? `• ${spec.company}` : ''}</p>
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {card.scansCount} scans
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-[#11140F]/70">
                        {spec.email && <div className="truncate">📧 {spec.email}</div>}
                        {spec.phone && <div className="truncate">📞 {spec.phone}</div>}
                        <div className="truncate text-[#11140F]/50 font-mono text-[11px]">
                          URL: /c/{card.slug}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#11140F]/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/c/${card.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#11140F] text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Open Live Card"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(`/c/${card.slug}`, card.id)}
                          className="p-2 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#11140F] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedId === card.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === card.id ? 'Copied' : 'Share'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(card.id)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LINK SHORTENER */}
      {activeTab === 'shortener' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-[#11140F]/5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#11140F]">Branded Link Shortener (307 Engine)</h3>
                <span className="text-xs font-mono font-medium text-[#11140F]/60">
                  ({shorteners.length} / {entitlements.microsaas.shortener} used)
                </span>
              </div>
              <p className="text-xs text-[#11140F]/60 mt-0.5">
                Bitly-style high-speed redirects. Supports UTM campaign auto-tagging and device OS routing (iOS vs Android).
              </p>
            </div>
            {shorteners.length < entitlements.microsaas.shortener ? (
              <button
                type="button"
                onClick={() => setShowShortenerModal(true)}
                className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Short Link</span>
              </button>
            ) : (
              <Link
                href="/pricing"
                className="py-2 px-4 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Upgrade for More Links</span>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#11140F]/50 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2F6B4F]" />
              <span>Loading short links...</span>
            </div>
          ) : shorteners.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[#11140F]/10 rounded-2xl p-6 space-y-3">
              <Link2 className="w-8 h-8 mx-auto text-[#11140F]/30" />
              <div className="text-sm font-semibold text-[#11140F]">No Short Links Created Yet</div>
              <p className="text-xs text-[#11140F]/60 max-w-sm mx-auto">
                Shorten long URLs with custom vanity slugs, UTM analytics tags, and smart device OS routing.
              </p>
              <button
                type="button"
                onClick={() => setShowShortenerModal(true)}
                className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Short Link</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#11140F]/10 text-[#11140F]/50 uppercase tracking-wider font-mono">
                    <th className="pb-3 font-semibold">Title / Short Link</th>
                    <th className="pb-3 font-semibold">Destination URL</th>
                    <th className="pb-3 font-semibold">Features</th>
                    <th className="pb-3 font-semibold text-right">Clicks</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#11140F]/5">
                  {shorteners.map((link) => {
                    const spec = link.spec || {};
                    return (
                      <tr key={link.id} className="hover:bg-[#F7F8F5]/60 transition-colors">
                        <td className="py-3.5 font-medium text-[#11140F]">
                          <div className="font-bold">{link.title}</div>
                          <div className="font-mono text-[11px] text-[#2F6B4F]">/s/{link.slug}</div>
                        </td>
                        <td className="py-3.5 max-w-xs truncate text-[#11140F]/70">
                          {spec.destinationUrl}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5">
                            {spec.utmCampaign && (
                              <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                                UTM
                              </span>
                            )}
                            {(spec.iosUrl || spec.androidUrl) && (
                              <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono flex items-center gap-0.5">
                                <Smartphone className="w-2.5 h-2.5" /> OS Route
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-[#11140F]">
                          {link.scansCount}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(`/s/${link.slug}`, link.id)}
                              className="p-1.5 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#11140F] transition-colors cursor-pointer"
                              title="Copy Short URL"
                            >
                              {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <Link
                              href={`/s/${link.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#11140F] transition-colors"
                              title="Test Redirect"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(link.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Link"
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

      {/* TAB 4: RESTAURANT MENU */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-[#11140F]/5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#11140F]">Contactless Restaurant Menus</h3>
                {entitlements.microsaas.menu > 0 ? (
                  <span className="text-xs font-mono font-medium text-[#11140F]/60">
                    ({menus.length} / {entitlements.microsaas.menu} used)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Pro & Above
                  </span>
                )}
              </div>
              <p className="text-xs text-[#11140F]/60 mt-0.5">
                Digital menus for table QR codes. Instant price updates, live 86&apos;d sold-out toggles, and dietary tags.
              </p>
            </div>

            {entitlements.microsaas.menu > 0 ? (
              menus.length < entitlements.microsaas.menu ? (
                <button
                  type="button"
                  onClick={() => setShowMenuModal(true)}
                  className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Menu</span>
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="py-2 px-4 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Upgrade for More Menus</span>
                </Link>
              )
            ) : (
              <Link
                href="/pricing"
                className="py-2 px-4 rounded-xl bg-[#2F6B4F] text-white text-xs font-semibold hover:bg-[#24523C] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to Pro to Unlock</span>
              </Link>
            )}
          </div>

          {entitlements.microsaas.menu === 0 ? (
            <div className="py-10 text-center border border-amber-200 bg-amber-50/50 rounded-2xl p-6 space-y-4">
              <Utensils className="w-10 h-10 mx-auto text-amber-600/70" />
              <div>
                <h4 className="text-base font-bold text-[#11140F]">Restaurant Menu Builder is a Pro Feature</h4>
                <p className="text-xs text-[#11140F]/70 max-w-md mx-auto mt-1">
                  Restaurants, cafes, and bars print dynamic table QR codes that let diners browse categorized menus, search dishes, and filter by gluten-free, vegan, or spicy options.
                </p>
              </div>
              <Link
                href="/pricing"
                className="py-2.5 px-5 rounded-xl bg-[#11140F] text-white text-xs font-bold hover:bg-[#2A2E25] inline-flex items-center gap-2 shadow-sm transition-all"
              >
                <span>View Pro Plan Upgrade Options</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : loading ? (
            <div className="py-12 text-center text-xs text-[#11140F]/50 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2F6B4F]" />
              <span>Loading digital menus...</span>
            </div>
          ) : menus.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[#11140F]/10 rounded-2xl p-6 space-y-3">
              <Utensils className="w-8 h-8 mx-auto text-[#11140F]/30" />
              <div className="text-sm font-semibold text-[#11140F]">No Digital Menus Created Yet</div>
              <p className="text-xs text-[#11140F]/60 max-w-sm mx-auto">
                Create a contactless menu. Organize dishes by sections (Starters, Mains, Drinks) with real-time sold-out toggles.
              </p>
              <button
                type="button"
                onClick={() => setShowMenuModal(true)}
                className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Menu</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menus.map((menu) => {
                const spec = menu.spec || {};
                const sectionsCount = Array.isArray(spec.sections) ? spec.sections.length : 0;
                return (
                  <div
                    key={menu.id}
                    className="p-5 rounded-2xl border border-[#11140F]/10 bg-white hover:border-[#11140F]/20 transition-all space-y-4 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-[#11140F]">{menu.title}</h4>
                          <p className="text-xs text-[#2F6B4F] font-medium">{sectionsCount} Menu Categories • Currency: {spec.currency || '$'}</p>
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {menu.scansCount} table scans
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-[#11140F]/70">
                        <div className="truncate text-[#11140F]/50 font-mono text-[11px]">
                          URL: /m/{menu.slug}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#11140F]/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/m/${menu.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#11140F] text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Open Live Menu"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(`/m/${menu.slug}`, menu.id)}
                          className="p-2 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#11140F] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedId === menu.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === menu.id ? 'Copied' : 'Share'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(menu.id)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Menu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: DYNAMIC WI-FI */}
      {activeTab === 'wifi' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F7F8F5] p-4 rounded-xl border border-[#11140F]/5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#11140F]">Dynamic Guest Wi-Fi Sharing</h3>
                <span className="text-xs font-mono font-medium text-[#11140F]/60">
                  ({wifis.length} / {entitlements.microsaas.wifi} used)
                </span>
              </div>
              <p className="text-xs text-[#11140F]/60 mt-0.5">
                Camera auto-connect QR codes for cafes, hotels, and offices. Update network passwords without reprinting physical flyers.
              </p>
            </div>
            {wifis.length < entitlements.microsaas.wifi ? (
              <button
                type="button"
                onClick={() => setShowWifiModal(true)}
                className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Wi-Fi QR</span>
              </button>
            ) : (
              <Link
                href="/pricing"
                className="py-2 px-4 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Upgrade for More Networks</span>
              </Link>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#11140F]/50 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#2F6B4F]" />
              <span>Loading Wi-Fi cards...</span>
            </div>
          ) : wifis.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-[#11140F]/10 rounded-2xl p-6 space-y-3">
              <Wifi className="w-8 h-8 mx-auto text-[#11140F]/30" />
              <div className="text-sm font-semibold text-[#11140F]">No Wi-Fi Cards Created Yet</div>
              <p className="text-xs text-[#11140F]/60 max-w-sm mx-auto">
                Generate an instant-join QR code for guests and customers. Phones connect directly with one tap from the Camera app.
              </p>
              <button
                type="button"
                onClick={() => setShowWifiModal(true)}
                className="py-2 px-4 rounded-xl bg-[#11140F] text-white text-xs font-semibold hover:bg-[#2A2E25] inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Wi-Fi QR</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wifis.map((wifi) => {
                const spec = wifi.spec || {};
                return (
                  <div
                    key={wifi.id}
                    className="p-5 rounded-2xl border border-[#11140F]/10 bg-white hover:border-[#11140F]/20 transition-all space-y-4 shadow-xs flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Wifi className="w-4 h-4 text-[#2F6B4F]" />
                            <h4 className="text-sm font-bold text-[#11140F]">{spec.ssid || wifi.title}</h4>
                          </div>
                          {spec.location && (
                            <p className="text-xs text-[#11140F]/60 mt-0.5">📍 {spec.location}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {spec.authType || 'WPA'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#F7F8F5] border border-[#11140F]/5 text-xs space-y-1">
                        <div className="text-[11px] text-[#11140F]/60">Password:</div>
                        <div className="font-mono font-bold text-[#11140F] select-all">
                          {spec.password ? '••••••••••••' : '(No Password / Open)'}
                        </div>
                      </div>

                      <div className="text-xs text-[#11140F]/50 font-mono">
                        URL: /w/{wifi.slug}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#11140F]/5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/w/${wifi.slug}`}
                          target="_blank"
                          className="p-2 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#11140F] text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Open Wi-Fi Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(`/w/${wifi.slug}`, wifi.id)}
                          className="p-2 rounded-lg bg-[#F7F8F5] hover:bg-[#EEF0EA] text-[#11140F] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedId === wifi.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === wifi.id ? 'Copied' : 'Share'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(wifi.id)}
                        disabled={actionLoading}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Network"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VCARD CREATION MODAL */}
      {showVCardModal && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#11140F]/10 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#11140F]/10 pb-4">
              <div className="flex items-center gap-2">
                <Contact className="w-5 h-5 text-[#2F6B4F]" />
                <h3 className="text-base font-bold text-[#11140F]">Create Digital Business Card (vCard)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVCardModal(false)}
                className="text-[#11140F]/50 hover:text-[#11140F] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVCard} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">First Name *</label>
                  <input
                    type="text"
                    required
                    value={vcardForm.firstName}
                    onChange={(e) => setVcardForm({ ...vcardForm, firstName: e.target.value })}
                    placeholder="e.g. Sarah"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Last Name</label>
                  <input
                    type="text"
                    value={vcardForm.lastName}
                    onChange={(e) => setVcardForm({ ...vcardForm, lastName: e.target.value })}
                    placeholder="e.g. Jenkins"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Job Title</label>
                  <input
                    type="text"
                    value={vcardForm.title}
                    onChange={(e) => setVcardForm({ ...vcardForm, title: e.target.value })}
                    placeholder="e.g. Creative Director"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Company</label>
                  <input
                    type="text"
                    value={vcardForm.company}
                    onChange={(e) => setVcardForm({ ...vcardForm, company: e.target.value })}
                    placeholder="e.g. Studio Acme"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Email *</label>
                  <input
                    type="email"
                    required
                    value={vcardForm.email}
                    onChange={(e) => setVcardForm({ ...vcardForm, email: e.target.value })}
                    placeholder="e.g. sarah@acme.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Phone Number</label>
                  <input
                    type="tel"
                    value={vcardForm.phone}
                    onChange={(e) => setVcardForm({ ...vcardForm, phone: e.target.value })}
                    placeholder="e.g. +1 555-0192"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Website or Portfolio</label>
                <input
                  type="url"
                  value={vcardForm.website}
                  onChange={(e) => setVcardForm({ ...vcardForm, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Bio / Pitch</label>
                <textarea
                  rows={2}
                  value={vcardForm.bio}
                  onChange={(e) => setVcardForm({ ...vcardForm, bio: e.target.value })}
                  placeholder="Short introduction about yourself or your services..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F] resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Custom Slug (Optional)</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono text-[#11140F]/50">/c/</span>
                  <input
                    type="text"
                    value={vcardForm.slug}
                    onChange={(e) => setVcardForm({ ...vcardForm, slug: e.target.value })}
                    placeholder="sarah-jenkins"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowVCardModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#11140F]/70 hover:text-[#11140F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#11140F] text-white text-xs font-bold hover:bg-[#2A2E25] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Digital vCard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHORTENER CREATION MODAL */}
      {showShortenerModal && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#11140F]/10 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#11140F]/10 pb-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#2F6B4F]" />
                <h3 className="text-base font-bold text-[#11140F]">Create Branded Short Link</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortenerModal(false)}
                className="text-[#11140F]/50 hover:text-[#11140F] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShortener} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Destination URL *</label>
                <input
                  type="url"
                  required
                  value={shortenerForm.destinationUrl}
                  onChange={(e) => setShortenerForm({ ...shortenerForm, destinationUrl: e.target.value })}
                  placeholder="https://yourwebsite.com/long-page-url-to-shorten"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Title / Memo</label>
                  <input
                    type="text"
                    value={shortenerForm.title}
                    onChange={(e) => setShortenerForm({ ...shortenerForm, title: e.target.value })}
                    placeholder="e.g. Black Friday Promo Link"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Custom Slug</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-[#11140F]/50">/s/</span>
                    <input
                      type="text"
                      value={shortenerForm.slug}
                      onChange={(e) => setShortenerForm({ ...shortenerForm, slug: e.target.value })}
                      placeholder="blackfriday26"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                    />
                  </div>
                </div>
              </div>

              {/* UTM Builder */}
              <div className="p-3 bg-[#F7F8F5] rounded-xl border border-[#11140F]/5 space-y-2.5">
                <span className="text-[11px] font-bold text-[#11140F] uppercase tracking-wider block">
                  UTM Analytics Parameters (Optional)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={shortenerForm.utmSource}
                    onChange={(e) => setShortenerForm({ ...shortenerForm, utmSource: e.target.value })}
                    placeholder="utm_source"
                    className="px-2.5 py-1.5 text-[11px] rounded-lg border border-[#11140F]/15 bg-white"
                  />
                  <input
                    type="text"
                    value={shortenerForm.utmMedium}
                    onChange={(e) => setShortenerForm({ ...shortenerForm, utmMedium: e.target.value })}
                    placeholder="utm_medium"
                    className="px-2.5 py-1.5 text-[11px] rounded-lg border border-[#11140F]/15 bg-white"
                  />
                  <input
                    type="text"
                    value={shortenerForm.utmCampaign}
                    onChange={(e) => setShortenerForm({ ...shortenerForm, utmCampaign: e.target.value })}
                    placeholder="utm_campaign"
                    className="px-2.5 py-1.5 text-[11px] rounded-lg border border-[#11140F]/15 bg-white"
                  />
                </div>
              </div>

              {/* Mobile OS Routing */}
              <div className="p-3 bg-[#F7F8F5] rounded-xl border border-[#11140F]/5 space-y-2.5">
                <span className="text-[11px] font-bold text-[#11140F] uppercase tracking-wider block">
                  Device OS Conditional Routing (Optional)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="url"
                    value={shortenerForm.iosUrl}
                    onChange={(e) => setShortenerForm({ ...shortenerForm, iosUrl: e.target.value })}
                    placeholder="Apple App Store URL (iOS)"
                    className="px-2.5 py-1.5 text-[11px] rounded-lg border border-[#11140F]/15 bg-white"
                  />
                  <input
                    type="url"
                    value={shortenerForm.androidUrl}
                    onChange={(e) => setShortenerForm({ ...shortenerForm, androidUrl: e.target.value })}
                    placeholder="Google Play URL (Android)"
                    className="px-2.5 py-1.5 text-[11px] rounded-lg border border-[#11140F]/15 bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowShortenerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#11140F]/70 hover:text-[#11140F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#11140F] text-white text-xs font-bold hover:bg-[#2A2E25] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Short Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MENU CREATION MODAL */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#11140F]/10 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#11140F]/10 pb-4">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#2F6B4F]" />
                <h3 className="text-base font-bold text-[#11140F]">Create Digital Restaurant Menu</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMenuModal(false)}
                className="text-[#11140F]/50 hover:text-[#11140F] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMenu} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Restaurant / Menu Name *</label>
                <input
                  type="text"
                  required
                  value={menuForm.title}
                  onChange={(e) => setMenuForm({ ...menuForm, title: e.target.value })}
                  placeholder="e.g. Bistro Lumina - Evening Dinner"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Currency Symbol</label>
                  <select
                    value={menuForm.currency}
                    onChange={(e) => setMenuForm({ ...menuForm, currency: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F] bg-white"
                  >
                    <option value="$">$ (USD)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="¥">¥ (JPY)</option>
                    <option value="₦">₦ (NGN)</option>
                    <option value="C$">C$ (CAD)</option>
                    <option value="A$">A$ (AUD)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Custom Slug</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-[#11140F]/50">/m/</span>
                    <input
                      type="text"
                      value={menuForm.slug}
                      onChange={(e) => setMenuForm({ ...menuForm, slug: e.target.value })}
                      placeholder="bistro-lumina"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#11140F]/60 bg-[#F7F8F5] p-3 rounded-xl border border-[#11140F]/5">
                ✨ Includes pre-configured sample sections (Starters, Mains, Drinks) with vegetarian, gluten-free, and spicy badges. You can immediately preview or customize the live menu.
              </p>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowMenuModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#11140F]/70 hover:text-[#11140F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#11140F] text-white text-xs font-bold hover:bg-[#2A2E25] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Digital Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WIFI CREATION MODAL */}
      {showWifiModal && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#11140F]/10 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#11140F]/10 pb-4">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-[#2F6B4F]" />
                <h3 className="text-base font-bold text-[#11140F]">Create Dynamic Wi-Fi QR Card</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWifiModal(false)}
                className="text-[#11140F]/50 hover:text-[#11140F] text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWifi} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Wi-Fi Network SSID *</label>
                <input
                  type="text"
                  required
                  value={wifiForm.ssid}
                  onChange={(e) => setWifiForm({ ...wifiForm, ssid: e.target.value })}
                  placeholder="e.g. Acme_Guest_WiFi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Network Password</label>
                  <input
                    type="text"
                    value={wifiForm.password}
                    onChange={(e) => setWifiForm({ ...wifiForm, password: e.target.value })}
                    placeholder="Leave empty for open"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#11140F]">Security Encryption</label>
                  <select
                    value={wifiForm.authType}
                    onChange={(e) => setWifiForm({ ...wifiForm, authType: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F] bg-white"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Location / Area (Optional)</label>
                <input
                  type="text"
                  value={wifiForm.location}
                  onChange={(e) => setWifiForm({ ...wifiForm, location: e.target.value })}
                  placeholder="e.g. Ground Floor Lounge & Cafe"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#11140F]">Custom Slug (Optional)</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-[#11140F]/50">/w/</span>
                  <input
                    type="text"
                    value={wifiForm.slug}
                    onChange={(e) => setWifiForm({ ...wifiForm, slug: e.target.value })}
                    placeholder="guest-lounge"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#11140F]/15 focus:outline-hidden focus:border-[#2F6B4F]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#11140F]/10">
                <button
                  type="button"
                  onClick={() => setShowWifiModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#11140F]/70 hover:text-[#11140F] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#11140F] text-white text-xs font-bold hover:bg-[#2A2E25] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Wi-Fi QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
