'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Share2,
  Mail,
  Server,
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  updateDomainFleetSettings,
  setDomainWebForwarding,
  addDomainEmailAlias,
  removeDomainEmailAlias,
  requestDomainEppCode,
  updateDomainCustomNameservers,
} from '@/app/domains-actions';

interface DomainOrderData {
  id: string;
  domainName: string;
  desiredAlias: string;
  userEmail: string;
  status: string;
  whoisPrivacy?: boolean;
  transferLocked?: boolean;
  autoRenew?: boolean;
  eppCode?: string | null;
  customNameservers?: string[];
  urlRedirectUrl?: string | null;
  urlRedirectType?: string | null;
  emailAliases?: any;
  nameservers?: string[];
}

export default function DomainFleetOperabilities({
  order,
  onOrderUpdated,
}: {
  order: DomainOrderData;
  onOrderUpdated: (updated: DomainOrderData) => void;
}) {
  const [activeTab, setActiveTab] = useState<'security' | 'redirect' | 'emails' | 'nameservers'>('security');
  const [saving, setSaving] = useState(false);
  const [copiedEpp, setCopiedEpp] = useState(false);
  const [eppCode, setEppCode] = useState<string | null>(order.eppCode || null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security Toggles
  const [whoisPrivacy, setWhoisPrivacy] = useState(order.whoisPrivacy !== false);
  const [transferLocked, setTransferLocked] = useState(order.transferLocked !== false);
  const [autoRenew, setAutoRenew] = useState(order.autoRenew !== false);

  // Web Forwarding State
  const [redirectUrl, setRedirectUrl] = useState(order.urlRedirectUrl || '');
  const [redirectType, setRedirectType] = useState<'301' | '302' | 'cloaked'>(
    (order.urlRedirectType as any) || '301'
  );

  // Email Aliases State
  const [newAlias, setNewAlias] = useState('');
  const [newForwardEmail, setNewForwardEmail] = useState(order.userEmail || '');
  const [aliases, setAliases] = useState<Array<{ alias: string; forwardTo: string; enabled: boolean }>>(
    Array.isArray(order.emailAliases) ? order.emailAliases : []
  );

  // Nameservers State
  const [nsMode, setNsMode] = useState<'cloudflare' | 'custom'>(
    order.customNameservers && order.customNameservers.length > 0 ? 'custom' : 'cloudflare'
  );
  const [customNs1, setCustomNs1] = useState(order.customNameservers?.[0] || '');
  const [customNs2, setCustomNs2] = useState(order.customNameservers?.[1] || '');

  // 1. Save Security Settings (WhoisGuard, Transfer Lock, AutoRenew)
  const handleSaveSecurity = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const res = await updateDomainFleetSettings(order.id, {
        whoisPrivacy,
        transferLocked,
        autoRenew,
      });
      if (res.success && res.order) {
        onOrderUpdated(res.order as any);
        setAlert({ type: 'success', text: 'Domain security & privacy settings updated.' });
      } else {
        setAlert({ type: 'error', text: res.message || 'Failed to update settings.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: e.message || 'Error updating settings.' });
    } finally {
      setSaving(false);
    }
  };

  // 2. Request EPP Authorization Code
  const handleGetEpp = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const res = await requestDomainEppCode(order.id);
      if (res.success && res.eppCode) {
        setEppCode(res.eppCode);
        setAlert({ type: 'success', text: 'EPP Authorization code generated.' });
      } else {
        setAlert({ type: 'error', text: res.message || 'Failed to generate EPP code.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: e.message || 'Error generating EPP code.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyEpp = () => {
    if (!eppCode) return;
    navigator.clipboard.writeText(eppCode);
    setCopiedEpp(true);
    setTimeout(() => setCopiedEpp(false), 2000);
  };

  // 3. Save Web Forwarding
  const handleSaveForwarding = async () => {
    setSaving(true);
    setAlert(null);
    try {
      const res = await setDomainWebForwarding(order.id, redirectUrl, redirectType);
      if (res.success && res.order) {
        onOrderUpdated(res.order as any);
        setAlert({ type: 'success', text: res.message });
      } else {
        setAlert({ type: 'error', text: res.message || 'Failed to save web forwarding.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: e.message || 'Error saving web forwarding.' });
    } finally {
      setSaving(false);
    }
  };

  // 4. Add Email Alias
  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlias.trim() || !newForwardEmail.trim()) return;
    setSaving(true);
    setAlert(null);
    try {
      const res = await addDomainEmailAlias(order.id, newAlias, newForwardEmail);
      if (res.success && res.order) {
        onOrderUpdated(res.order as any);
        setAliases(Array.isArray(res.order.emailAliases) ? (res.order.emailAliases as any) : []);
        setNewAlias('');
        setAlert({ type: 'success', text: res.message });
      } else {
        setAlert({ type: 'error', text: res.message || 'Failed to add alias.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: e.message || 'Error adding alias.' });
    } finally {
      setSaving(false);
    }
  };

  // 5. Delete Email Alias
  const handleDeleteAlias = async (aliasName: string) => {
    setSaving(true);
    setAlert(null);
    try {
      const res = await removeDomainEmailAlias(order.id, aliasName);
      if (res.success && res.order) {
        onOrderUpdated(res.order as any);
        setAliases(Array.isArray(res.order.emailAliases) ? (res.order.emailAliases as any) : []);
        setAlert({ type: 'success', text: `Alias ${aliasName} removed.` });
      } else {
        setAlert({ type: 'error', text: res.message || 'Failed to remove alias.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: e.message || 'Error removing alias.' });
    } finally {
      setSaving(false);
    }
  };

  // 6. Save Nameservers
  const handleSaveNameservers = async () => {
    setSaving(true);
    setAlert(null);
    const nsList = nsMode === 'custom' ? [customNs1, customNs2].filter(Boolean) : [];
    try {
      const res = await updateDomainCustomNameservers(order.id, nsList);
      if (res.success && res.order) {
        onOrderUpdated(res.order as any);
        setAlert({ type: 'success', text: res.message });
      } else {
        setAlert({ type: 'error', text: res.message || 'Failed to save nameservers.' });
      }
    } catch (e: any) {
      setAlert({ type: 'error', text: e.message || 'Error saving nameservers.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 pt-4 border-t border-[#11140F]/10 dark:border-white/10 space-y-4 text-xs">
      {/* Sub-tabs header */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#11140F]/5 dark:border-white/5">
        {[
          { id: 'security', label: 'WHOIS & Transfer Lock', icon: ShieldCheck },
          { id: 'redirect', label: 'Web / URL Forwarding', icon: Share2 },
          { id: 'emails', label: 'Email Aliases & Catch-All', icon: Mail },
          { id: 'nameservers', label: 'Custom Nameservers', icon: Server },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setAlert(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-semibold shadow-2xs'
                  : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {alert && (
        <div
          className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            alert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20'
              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/20'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          )}
          <span>{alert.text}</span>
        </div>
      )}

      {/* TAB 1: SECURITY, WHOIS PRIVACY & EPP CODE */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* WhoisGuard Toggle */}
            <div className="p-3.5 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5]/60 dark:bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  WHOIS Privacy Guard
                </span>
                <input
                  type="checkbox"
                  checked={whoisPrivacy}
                  onChange={(e) => setWhoisPrivacy(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-[#11140F]/60 dark:text-white/60">
                {whoisPrivacy
                  ? 'Active: Registrant name, address, and phone are masked.'
                  : 'Disabled: Contact details visible in public WHOIS.'}
              </p>
            </div>

            {/* Transfer Lock Toggle */}
            <div className="p-3.5 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5]/60 dark:bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  {transferLocked ? (
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  Domain Transfer Lock
                </span>
                <input
                  type="checkbox"
                  checked={transferLocked}
                  onChange={(e) => setTransferLocked(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-[#11140F]/60 dark:text-white/60">
                {transferLocked
                  ? 'Locked: Prevents unauthorized transfer away from your registrar.'
                  : 'Unlocked: Domain can be transferred to another registrar.'}
              </p>
            </div>

            {/* Auto-Renew Toggle */}
            <div className="p-3.5 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5]/60 dark:bg-white/[0.02] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Auto-Renew Protection</span>
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-[#11140F]/60 dark:text-white/60">
                {autoRenew
                  ? 'Enabled: Domain will automatically renew before expiration.'
                  : 'Disabled: Domain will expire at end of term.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSecurity}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 self-start"
            >
              <span>{saving ? 'Saving...' : 'Save Security Toggles'}</span>
            </button>

            {/* EPP Code Card */}
            <div className="flex items-center gap-2">
              {eppCode ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F7F8F5] dark:bg-white/5 border border-[#11140F]/10 dark:border-white/10 font-mono text-[11px]">
                  <span>EPP Code: <strong>{eppCode}</strong></span>
                  <button
                    type="button"
                    onClick={handleCopyEpp}
                    className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    title="Copy code"
                  >
                    {copiedEpp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleGetEpp}
                  className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-[#11140F]/80 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Get Transfer EPP Code</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEB & URL FORWARDING */}
      {activeTab === 'redirect' && (
        <div className="space-y-4">
          <p className="text-[11.5px] text-[#11140F]/70 dark:text-white/70 leading-relaxed">
            Forward visitors typing <strong>{order.domainName}</strong> or <strong>www.{order.domainName}</strong> directly to any external website, portfolio, WhatsApp chat, Instagram profile, or Shopify storefront.
          </p>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-bold text-[#11140F] dark:text-white block">
                Destination Redirect URL
              </label>
              <div className="flex items-center rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#151912] overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                <span className="px-3 py-2 text-xs text-[#11140F]/40 dark:text-white/40 font-mono bg-[#11140F]/[0.02] dark:bg-white/[0.04] border-r border-[#11140F]/10 dark:border-white/10 select-none">
                  https://
                </span>
                <input
                  type="url"
                  placeholder="instagram.com/mybrand or myshopify.com"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-transparent outline-none font-mono text-[#11140F] dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold text-[#11140F]/70 dark:text-white/70">Redirect Type:</span>
              {[
                { type: '301', label: '301 Permanent (SEO Best Practice)' },
                { type: '302', label: '302 Temporary' },
                { type: 'cloaked', label: 'Cloaked / Masked (Keeps URL in bar)' },
              ].map((m) => (
                <label key={m.type} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`redirectType_${order.id}`}
                    value={m.type}
                    checked={redirectType === m.type}
                    onChange={() => setRedirectType(m.type as any)}
                    className="accent-emerald-600"
                  />
                  <span>{m.label}</span>
                </label>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSaveForwarding}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>{saving ? 'Saving...' : 'Save Web Forwarding'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: MULTI-ALIAS EMAIL ROUTING */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          <p className="text-[11.5px] text-[#11140F]/70 dark:text-white/70 leading-relaxed">
            Create unlimited custom business email aliases on <strong>@{order.domainName}</strong> forwarding into your personal Gmail or work inbox.
          </p>

          {/* Existing Aliases List */}
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-[#F7F8F5]/80 dark:bg-white/[0.03] border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono font-bold">{order.desiredAlias}@{order.domainName}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  Primary Handle
                </span>
              </div>
              <span className="font-mono text-[#11140F]/60 dark:text-white/60">&rarr; {order.userEmail}</span>
            </div>

            {aliases.map((a) => (
              <div
                key={a.alias}
                className="p-3 rounded-xl bg-white dark:bg-[#151912] border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#11140F]/50 dark:text-white/50" />
                  <span className="font-mono font-semibold">{a.alias}@{order.domainName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[#11140F]/60 dark:text-white/60">&rarr; {a.forwardTo}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteAlias(a.alias)}
                    className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                    title="Remove alias"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Alias Form */}
          <form onSubmit={handleAddAlias} className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center rounded-xl border border-[#11140F]/15 dark:border-white/15 overflow-hidden bg-white dark:bg-[#151912] flex-1">
              <input
                type="text"
                placeholder="support, sales, billing"
                value={newAlias}
                onChange={(e) => setNewAlias(e.target.value)}
                required
                className="w-32 px-3 py-2 bg-transparent outline-none font-mono text-xs"
              />
              <span className="px-2.5 py-2 bg-black/5 dark:bg-white/5 text-[#11140F]/60 dark:text-white/60 font-mono border-l border-[#11140F]/10 dark:border-white/10 select-none">
                @{order.domainName}
              </span>
              <input
                type="email"
                placeholder="forward-to@gmail.com"
                value={newForwardEmail}
                onChange={(e) => setNewForwardEmail(e.target.value)}
                required
                className="flex-1 px-3 py-2 bg-transparent outline-none font-mono text-xs border-l border-[#11140F]/10 dark:border-white/10"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-bold text-xs hover:bg-[#2A2E25] dark:hover:bg-white/90 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Alias</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: CUSTOM NAMESERVERS */}
      {activeTab === 'nameservers' && (
        <div className="space-y-4">
          <p className="text-[11.5px] text-[#11140F]/70 dark:text-white/70 leading-relaxed">
            By default, your domain runs on <strong>Cloudflare Ultra-Fast Managed DNS</strong> with automated SSL and instant routing. If you host on AWS Route53, cPanel, or another external provider, you can delegate nameservers here.
          </p>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="radio"
                name={`nsMode_${order.id}`}
                checked={nsMode === 'cloudflare'}
                onChange={() => setNsMode('cloudflare')}
                className="accent-emerald-600"
              />
              <span>Cloudflare Managed DNS (Recommended · Automated SSL, Email Forwarding &amp; DDoS Protection)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="radio"
                name={`nsMode_${order.id}`}
                checked={nsMode === 'custom'}
                onChange={() => setNsMode('custom')}
                className="accent-emerald-600"
              />
              <span>Custom External Nameservers (AWS, cPanel, DigitalOcean, Google Cloud)</span>
            </label>
          </div>

          {nsMode === 'custom' && (
            <div className="space-y-2 pl-5 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#11140F]/60 dark:text-white/60">Nameserver 1:</span>
                <input
                  type="text"
                  placeholder="ns1.externalhost.com"
                  value={customNs1}
                  onChange={(e) => setCustomNs1(e.target.value)}
                  className="w-full max-w-md px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#151912] font-mono text-xs outline-none"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#11140F]/60 dark:text-white/60">Nameserver 2:</span>
                <input
                  type="text"
                  placeholder="ns2.externalhost.com"
                  value={customNs2}
                  onChange={(e) => setCustomNs2(e.target.value)}
                  className="w-full max-w-md px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#151912] font-mono text-xs outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveNameservers}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            <span>{saving ? 'Saving...' : 'Update Nameservers'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
