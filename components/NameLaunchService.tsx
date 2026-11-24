'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  Clock,
  Mail,
  AlertCircle,
  Sliders,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import { DomainSearchResult } from '@/lib/domains/constants';
import {
  getUserDomainOrders,
  confirmOrderPayment,
  linkDomainToQrWorkspace,
} from '@/app/domains-actions';
import DnsManagerModal from './DnsManagerModal';
import DomainFleetOperabilities from './DomainFleetOperabilities';

interface Props {
  user: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  isAdmin?: boolean;
}

const PRESET_ALIASES = ['hello', 'founder', 'info', 'support', 'contact'];

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function NameLaunchService({ user }: Props) {
  const [activeTab, setActiveTab] = useState<'search' | 'domains'>('search');

  // Search state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<DomainSearchResult[]>([]);

  // Checkout drawer state
  const [selectedDomain, setSelectedDomain] = useState<DomainSearchResult | null>(null);
  const [emailAlias, setEmailAlias] = useState('hello');
  const [forwardingEmail, setForwardingEmail] = useState(user?.email || '');
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Orders list state
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedDnsOrder, setSelectedDnsOrder] = useState<any | null>(null);
  const [linkingOrderId, setLinkingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadOrders();
    checkUrlReference();
  }, []);

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const data = await getUserDomainOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load domain orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }

  // Handle checkout redirect callback: /?section=namelaunch&ref=DOM_...
  async function checkUrlReference() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (ref && ref.startsWith('DOM_')) {
      setActiveTab('domains');
      setActionAlert({
        text: 'Payment confirmed. Activating your domain and business email routing…',
        type: 'success',
      });

      try {
        const res = await confirmOrderPayment(ref);
        if (res.success) {
          setActionAlert({
            text: `${res.order?.domainName} is now active. Managed DNS and email routing are ready.`,
            type: 'success',
          });
          loadOrders();
        } else {
          setActionAlert({
            text: res.message || 'Payment confirmed, provisioning is in progress.',
            type: 'success',
          });
          loadOrders();
        }
      } catch (err: any) {
        setActionAlert({ text: err.message || 'Verification error', type: 'error' });
      }
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearching(true);
    setSearchError(null);
    setSelectedDomain(null);

    try {
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setResults(data.results || []);
    } catch (err: any) {
      setSearchError(err.message || 'Could not search domains');
    } finally {
      setSearching(false);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDomain || !selectedDomain.pricing) return;

    const cleanAlias = emailAlias.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const cleanTargetEmail = forwardingEmail.trim().toLowerCase();

    if (!cleanAlias) {
      setCheckoutError('Please enter a valid email prefix (e.g. hello).');
      return;
    }
    if (!cleanTargetEmail.includes('@')) {
      setCheckoutError('Please enter a valid forwarding email address.');
      return;
    }

    setCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/domains/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domainName: selectedDomain.domain,
          desiredAlias: cleanAlias,
          userEmail: cleanTargetEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to start checkout');

      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed');
      setCheckingOut(false);
    }
  }

  async function handleLinkToWorkspace(order: any) {
    setLinkingOrderId(order.id);
    try {
      const res = await linkDomainToQrWorkspace(order.id);
      if (res.success) {
        setActionAlert({ text: res.message, type: 'success' });
      } else {
        setActionAlert({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setActionAlert({ text: err.message || 'Failed to link domain', type: 'error' });
    } finally {
      setLinkingOrderId(null);
    }
  }

  return (
    <div className="space-y-5 text-[#11140F] dark:text-white">
      {/* Clean Sub-Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-xl bg-white dark:bg-[#11140F] border border-[#11140F]/10 dark:border-white/10 self-start">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-semibold'
                : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
            }`}
          >
            Search Domains
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('domains')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'domains'
                ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-semibold'
                : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
            }`}
          >
            <span>My Domains</span>
            <span className="text-[10px] font-mono opacity-75">
              {orders.length}
            </span>
          </button>
        </div>

        <p className="text-xs text-[#11140F]/55 dark:text-white/50">
          Every registration includes 1-year ownership, SSL security, and custom email forwarding.
        </p>
      </div>

      {/* Alert Notification */}
      {actionAlert && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2.5 ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
              : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionAlert.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW A: DOMAIN SEARCH & CHECKOUT */}
      {activeTab === 'search' && (
        <div className="space-y-5">
          {/* Clean Search Input Panel */}
          <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-5 sm:p-7 space-y-4">
            <div className="max-w-2xl">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[#11140F] dark:text-white">
                Find your brand domain
              </h2>
              <p className="text-xs sm:text-[13px] text-[#11140F]/60 dark:text-white/60 mt-1">
                Pay in local currency with instant setup for your website, QR links, and custom business inbox.
              </p>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2.5 flex-1 px-3.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-white/[0.03] focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-500 transition-all">
                  <Search className="w-4 h-4 text-[#11140F]/40 dark:text-white/40 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter a name or domain (e.g. yourbrand or acme.com)"
                    className="w-full py-2.5 text-sm bg-transparent outline-none text-[#11140F] dark:text-white placeholder:text-[#11140F]/40 dark:placeholder:text-white/35 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-colors disabled:opacity-50 shrink-0 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{searching ? 'Searching…' : 'Search'}</span>
                </button>
              </div>
            </form>

            {searchError && (
              <p className="text-xs text-red-600 dark:text-red-400">{searchError}</p>
            )}

            {/* Quick Suggestions */}
            <div className="flex items-center gap-2 flex-wrap text-xs text-[#11140F]/45 dark:text-white/45">
              <span>Try:</span>
              {['mybrand', 'studio', 'shop', 'ventures'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setQuery(sug)}
                  className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[#11140F]/5 dark:bg-white/[0.06] hover:text-[#11140F] dark:hover:text-white transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Table */}
          {results.length > 0 && (
            <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] overflow-hidden divide-y divide-[#11140F]/8 dark:divide-white/8">
              <div className="px-5 py-3 bg-[#F7F8F5] dark:bg-white/[0.02] flex items-center justify-between text-[11px] font-medium text-[#11140F]/55 dark:text-white/50">
                <span className="uppercase tracking-wider">Domain Availability</span>
                <span>1-year registration • Email &amp; SSL included</span>
              </div>

              {results.map((item) => {
                const isSelected = selectedDomain?.domain === item.domain;

                return (
                  <div
                    key={item.domain}
                    className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/[0.06]'
                        : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-semibold text-base text-[#11140F] dark:text-white">
                          {item.domain}
                        </span>
                        {item.available ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Available
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#11140F]/45 dark:text-white/40">
                            Unavailable
                          </span>
                        )}
                      </div>
                      {item.available && (
                        <p className="text-xs text-[#11140F]/55 dark:text-white/50">
                          Includes <span className="font-mono">hello@{item.domain}</span> &amp; automated SSL
                        </p>
                      )}
                    </div>

                    {item.available && item.pricing ? (
                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="font-mono font-semibold text-base text-[#11140F] dark:text-white">
                          {formatNaira(item.pricing.totalNgn)}
                          <span className="text-xs font-normal text-[#11140F]/50 dark:text-white/45">/yr</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDomain(item);
                            setCheckoutError(null);
                          }}
                          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F]'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-[#11140F]/40 dark:text-white/40 font-mono">
                        Taken
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Checkout & Business Email Configuration Panel */}
          {selectedDomain && selectedDomain.pricing && (
            <div className="rounded-2xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#11140F] p-5 sm:p-7 space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#11140F]/10 dark:border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    Configure Domain &amp; Email
                  </span>
                  <h3 className="text-lg font-bold font-mono mt-0.5">
                    {selectedDomain.domain}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDomain(null)}
                  className="text-xs text-[#11140F]/50 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white cursor-pointer px-2.5 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCheckout} className="space-y-5">
                {/* 1. Custom Email Handle */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#11140F]/80 dark:text-white/80">
                    Business Email Address
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_ALIASES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEmailAlias(preset)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors cursor-pointer ${
                          emailAlias === preset
                            ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] border-transparent font-semibold'
                            : 'bg-transparent text-[#11140F]/65 dark:text-white/65 border-[#11140F]/12 dark:border-white/12 hover:border-[#11140F]/30 dark:hover:border-white/30'
                        }`}
                      >
                        {preset}@
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center rounded-xl border border-[#11140F]/15 dark:border-white/15 overflow-hidden bg-[#F7F8F5] dark:bg-white/[0.03] focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-500">
                    <input
                      type="text"
                      value={emailAlias}
                      onChange={(e) => setEmailAlias(e.target.value)}
                      placeholder="hello"
                      required
                      className="w-36 sm:w-44 px-3.5 py-2.5 text-xs font-mono bg-transparent outline-none text-[#11140F] dark:text-white"
                    />
                    <span className="bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-2.5 text-xs font-mono text-[#11140F]/60 dark:text-white/60 border-l border-[#11140F]/10 dark:border-white/10 flex-1 truncate">
                      @{selectedDomain.domain}
                    </span>
                  </div>
                </div>

                {/* 2. Destination Forwarding Address */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#11140F]/80 dark:text-white/80">
                    Forward Incoming Mail To
                  </label>
                  <input
                    type="email"
                    value={forwardingEmail}
                    onChange={(e) => setForwardingEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    required
                    className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 px-3.5 py-2.5 text-xs bg-[#F7F8F5] dark:bg-white/[0.03] text-[#11140F] dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                  <p className="text-[11.5px] text-[#11140F]/50 dark:text-white/50">
                    Messages sent to <span className="font-mono text-[#11140F] dark:text-white">{emailAlias || 'hello'}@{selectedDomain.domain}</span> will route directly to this inbox.
                  </p>
                </div>

                {/* 3. Clean Order Summary (No wholesale/internal fee exposure) */}
                <div className="rounded-xl p-4 bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-[#11140F]/70 dark:text-white/70">
                    <span>1-Year Domain Registration ({selectedDomain.domain})</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">Included</span>
                  </div>
                  <div className="flex justify-between text-[#11140F]/70 dark:text-white/70">
                    <span>Custom Email Routing ({emailAlias || 'hello'}@{selectedDomain.domain})</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">Included</span>
                  </div>
                  <div className="flex justify-between text-[#11140F]/70 dark:text-white/70">
                    <span>Managed DNS, Edge SSL &amp; WHOIS Privacy</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">Included</span>
                  </div>
                  <div className="border-t border-[#11140F]/10 dark:border-white/10 pt-2.5 flex justify-between font-bold text-sm">
                    <span>Total Due Today</span>
                    <span className="font-mono">
                      {formatNaira(selectedDomain.pricing.totalNgn)}
                    </span>
                  </div>
                </div>

                {checkoutError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/30 text-xs text-red-700 dark:text-red-300">
                    {checkoutError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={checkingOut}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {checkingOut
                      ? 'Preparing Secure Checkout…'
                      : `Complete Purchase · ${formatNaira(selectedDomain.pricing.totalNgn)}`}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* VIEW B: MY REGISTERED DOMAINS & MANAGEMENT */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="p-12 text-center text-xs text-[#11140F]/50 dark:text-white/50">
              Loading domains…
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-[#11140F]/15 dark:border-white/15 text-center space-y-3 bg-white dark:bg-[#11140F]">
              <Globe className="w-7 h-7 text-[#11140F]/40 dark:text-white/40 mx-auto" />
              <h4 className="text-sm font-semibold">No domains registered yet</h4>
              <p className="text-xs text-[#11140F]/60 dark:text-white/60 max-w-sm mx-auto">
                Search for an available domain name to set up your custom brand address and email forwarding.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className="px-4 py-2 rounded-lg bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-xs font-semibold hover:opacity-90 cursor-pointer"
              >
                Search Domains
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-semibold text-base sm:text-lg">
                            {ord.domainName}
                          </span>
                          {ord.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : ord.status === 'PAID_AWAITING_FUNDS' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                              <Clock className="w-3 h-3" />
                              Provisioning Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              <Clock className="w-3 h-3" />
                              {ord.status}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#11140F]/60 dark:text-white/60 flex-wrap">
                          <span className="flex items-center gap-1 font-mono text-[#11140F] dark:text-white">
                            <Mail className="w-3 h-3 opacity-70" />
                            {ord.desiredAlias}@{ord.domainName}
                          </span>
                          <span>&rarr;</span>
                          <span className="font-mono">{ord.userEmail}</span>
                          <span className="opacity-40">•</span>
                          <span className="font-mono">{formatNaira(ord.totalPaidNgn)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDnsOrder(ord)}
                          className="px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5 opacity-70" />
                          <span>DNS Records</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 opacity-70" />
                          <span>Domain Settings</span>
                          {expandedOrderId === ord.id ? (
                            <ChevronUp className="w-3 h-3 opacity-60" />
                          ) : (
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLinkToWorkspace(ord)}
                          disabled={linkingOrderId === ord.id}
                          className="px-3 py-1.5 rounded-lg bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {linkingOrderId === ord.id ? 'Linking…' : 'Use for QR Links'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {ord.nameservers && ord.nameservers.length > 0 && (
                      <div className="pt-2.5 border-t border-[#11140F]/8 dark:border-white/8 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#11140F]/45 dark:text-white/45 font-mono">
                        <span>Nameservers: {ord.nameservers.join(', ')}</span>
                        <span>Order ID: {ord.id.slice(-8).toUpperCase()}</span>
                      </div>
                    )}

                    {expandedOrderId === ord.id && (
                      <DomainFleetOperabilities
                        order={ord}
                        onOrderUpdated={(updated) =>
                          setOrders((prev) => prev.map((o) => (o.id === ord.id ? updated : o)))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Gmail Send Mail As Guide */}
              <div className="rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/10 dark:border-white/10 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 opacity-70" />
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-[#11140F]/70 dark:text-white/70">
                    Send Emails From Your Custom Domain in Gmail
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs leading-relaxed text-[#11140F]/75 dark:text-white/75">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#151814] border border-[#11140F]/8 dark:border-white/8 space-y-1">
                    <span className="font-semibold text-[#11140F] dark:text-white">1. App Password</span>
                    <p>Enable 2-Step Verification in your Google Account and generate an App Password.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#151814] border border-[#11140F]/8 dark:border-white/8 space-y-1">
                    <span className="font-semibold text-[#11140F] dark:text-white">2. Accounts &amp; Import</span>
                    <p>In Gmail Settings, go to Accounts and Import and click Add another email address.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#151814] border border-[#11140F]/8 dark:border-white/8 space-y-1">
                    <span className="font-semibold text-[#11140F] dark:text-white">3. SMTP Setup</span>
                    <p>Use <code className="font-mono">smtp.gmail.com</code> (Port 587, TLS) with your Gmail and App Password.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#151814] border border-[#11140F]/8 dark:border-white/8 space-y-1">
                    <span className="font-semibold text-[#11140F] dark:text-white">4. Verify</span>
                    <p>Click the confirmation link sent to your inbox to reply from your custom address.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DNS Management Modal */}
      {selectedDnsOrder && (
        <DnsManagerModal
          orderId={selectedDnsOrder.id}
          domainName={selectedDnsOrder.domainName}
          onClose={() => setSelectedDnsOrder(null)}
        />
      )}
    </div>
  );
}
