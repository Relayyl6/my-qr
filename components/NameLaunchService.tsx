'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Shield,
  Mail,
  Zap,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import { DomainSearchResult, BUDGET_TLDS } from '@/lib/domains/namelaunch';
import {
  getUserDomainOrders,
  confirmOrderPayment,
  linkDomainToQrWorkspace,
} from '@/app/domains-actions';
import DnsManagerModal from './DnsManagerModal';

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

export default function NameLaunchService({ user, isAdmin = false }: Props) {
  const [activeTab, setActiveTab] = useState<'search' | 'domains'>('search');

  // Search state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<DomainSearchResult[]>([]);

  // Checkout modal / drawer state
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
  const [actionAlert, setActionAlert] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load orders on mount
  useEffect(() => {
    loadOrders();
    checkUrlReference();
  }, []);

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const data = await getUserDomainOrders();
      setOrders(data || []);
      if (data && data.length > 0 && activeTab === 'search' && !query) {
        // Keep search active by default unless redirected with ref
      }
    } catch (err) {
      console.error('Failed to load domain orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }

  // Handle Paystack redirect callback: /?section=namelaunch&ref=DOM_...
  async function checkUrlReference() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (ref && ref.startsWith('DOM_')) {
      setActiveTab('domains');
      setActionAlert({
        text: 'Payment received! Activating your domain and custom email routing…',
        type: 'success',
      });

      try {
        const res = await confirmOrderPayment(ref);
        if (res.success) {
          setActionAlert({
            text: `Domain ${res.order?.domainName} is now ACTIVE! Cloudflare DNS and email routing configured.`,
            type: 'success',
          });
          loadOrders();
        } else {
          setActionAlert({
            text: res.message || 'Payment confirmed, provisioning in queue.',
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
      setCheckoutError('Please enter your destination email (e.g. your Gmail).');
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
      if (!res.ok) throw new Error(data.error || 'Unable to start payment');

      // Redirect customer to Paystack hosted checkout or simulation
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
    <div className="space-y-6 text-[#11140F] dark:text-white">
      {/* Service Header Banner */}
      <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-[#11140F] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight">NameLaunch Domains &amp; Business Email</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 uppercase tracking-wider">
                  Paystack (₦)
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/20 uppercase tracking-wider">
                  Cloudflare DNS
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-[#11140F]/60 dark:text-white/60 mt-1">
                Alternative to Namecheap &amp; GoDaddy in Naira. Zero dollar card required. Get your domain, instant Cloudflare DNS, and a custom <code className="text-emerald-600 dark:text-emerald-400 font-mono">you@yourbrand.com</code> email forwarding to your Gmail.
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F7F8F5] dark:bg-white/[0.05] border border-[#11140F]/10 dark:border-white/10 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-white dark:bg-[#1C2218] text-[#11140F] dark:text-white shadow-2xs'
                  : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              Search &amp; Buy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('domains')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'domains'
                  ? 'bg-white dark:bg-[#1C2218] text-[#11140F] dark:text-white shadow-2xs'
                  : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              <span>My Domains</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold">
                {orders.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Alert Notification */}
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

      {/* VIEW A: DOMAIN SEARCH & STOREFRONT */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Card */}
          <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-6 sm:p-8 shadow-xs text-center space-y-4">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/20">
              Domain Registration + Free Cloudflare DNS + Custom Gmail Forwarding
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Claim your custom domain &amp; business email in Naira.
            </h3>
            <p className="text-xs sm:text-sm text-[#11140F]/65 dark:text-white/65 max-w-xl mx-auto">
              Find an available name, pick your custom email address (like <code className="text-emerald-600 dark:text-emerald-400 font-mono">hello@yourbrand.com</code>), and pay in Naira via Paystack.
            </p>

            {/* Search Input Form */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2">
              <div className="flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#151912] focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 shadow-xs transition-all">
                <div className="flex items-center gap-2 flex-1 px-3">
                  <Search className="w-4 h-4 text-[#11140F]/40 dark:text-white/40 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type your brand or project name (e.g. yemuel, devstudio, acme.xyz)"
                    className="w-full py-2.5 text-sm bg-transparent outline-none text-[#11140F] dark:text-white placeholder:text-[#11140F]/40 dark:placeholder:text-white/40 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold text-xs sm:text-sm transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{searching ? 'Checking TLDs…' : 'Search Domain'}</span>
                </button>
              </div>
            </form>

            {searchError && (
              <p className="text-xs text-red-600 dark:text-red-400 pt-1">{searchError}</p>
            )}

            {/* Quick Suggestions */}
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1 text-xs text-[#11140F]/50 dark:text-white/50">
              <span>Popular searches:</span>
              {['yemuel', 'mybrand', 'shopnigeria', 'qrstudio'].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    setQuery(sug);
                  }}
                  className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Search Results Grid */}
          {results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#11140F]/60 dark:text-white/60">
                  Available Domain Extensions
                </h4>
                <span className="text-[11px] text-[#11140F]/50 dark:text-white/50">
                  All prices include 1-yr registration + custom email forwarding + Cloudflare DNS
                </span>
              </div>

              <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] overflow-hidden shadow-xs divide-y divide-[#11140F]/10 dark:divide-white/10">
                {results.map((item) => {
                  const isSelected = selectedDomain?.domain === item.domain;
                  const isBudget = BUDGET_TLDS.has(item.tld);

                  return (
                    <div
                      key={item.domain}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
                          : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-base sm:text-lg">
                            {item.domain}
                          </span>
                          {item.available ? (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                              Available
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-black/5 dark:bg-white/10 text-[#11140F]/50 dark:text-white/50">
                              Registered
                            </span>
                          )}
                          {item.available && isBudget && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                              Best Value Deal
                            </span>
                          )}
                        </div>
                        {item.available && (
                          <p className="text-xs text-[#11140F]/60 dark:text-white/60">
                            Includes <span className="font-mono text-emerald-600 dark:text-emerald-400">hello@{item.domain}</span> + Free Cloudflare DNS &amp; SSL
                          </p>
                        )}
                      </div>

                      {item.available && item.pricing ? (
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-left sm:text-right">
                            <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                              {formatNaira(item.pricing.totalNgn)}
                              <span className="text-xs font-normal text-[#11140F]/50 dark:text-white/50"> /yr</span>
                            </div>
                            <div className="text-[10px] text-[#11140F]/40 dark:text-white/40">
                              Wholesale: ${item.pricing.wholesaleUsd.toFixed(2)} USD
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDomain(item);
                              setCheckoutError(null);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F]'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                            }`}
                          >
                            {isSelected ? 'Configuring…' : 'Configure & Buy'}
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
            </div>
          )}

          {/* Checkout & Custom Email Bundle Drawer */}
          {selectedDomain && selectedDomain.pricing && (
            <div className="rounded-2xl border-2 border-emerald-500 bg-white dark:bg-[#11140F] p-6 sm:p-8 shadow-xl space-y-6 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-start justify-between gap-4 border-b border-[#11140F]/10 dark:border-white/10 pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400">
                    Step 2 · Configure Domain &amp; Custom Business Email
                  </span>
                  <h3 className="text-xl font-bold font-mono mt-1">
                    {selectedDomain.domain}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDomain(null)}
                  className="text-xs text-[#11140F]/50 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleCheckout} className="space-y-6">
                {/* 1. Custom Email Alias Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#11140F]/70 dark:text-white/70">
                    1. Choose your business email handle
                  </label>
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {PRESET_ALIASES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEmailAlias(preset)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer ${
                          emailAlias === preset
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-black/5 dark:bg-white/5 text-[#11140F]/70 dark:text-white/70 border-transparent hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        {preset}@
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center rounded-xl border border-[#11140F]/15 dark:border-white/15 overflow-hidden bg-white dark:bg-[#151912] focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 shadow-2xs">
                    <input
                      type="text"
                      value={emailAlias}
                      onChange={(e) => setEmailAlias(e.target.value)}
                      placeholder="hello"
                      required
                      className="w-36 sm:w-44 px-3.5 py-2.5 text-xs font-mono bg-transparent outline-none text-[#11140F] dark:text-white"
                    />
                    <span className="bg-[#11140F]/[0.03] dark:bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-[#11140F]/60 dark:text-white/60 border-l border-[#11140F]/10 dark:border-white/10 flex-1 truncate">
                      @{selectedDomain.domain}
                    </span>
                  </div>
                </div>

                {/* 2. Destination Gmail Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#11140F]/70 dark:text-white/70">
                    2. Where should we forward incoming emails?
                  </label>
                  <input
                    type="email"
                    value={forwardingEmail}
                    onChange={(e) => setForwardingEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    required
                    className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 px-3.5 py-2.5 text-xs bg-white dark:bg-[#151912] text-[#11140F] dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono shadow-2xs"
                  />
                  <p className="text-[11.5px] text-[#11140F]/50 dark:text-white/50">
                    Any customer email sent to <strong className="font-mono text-emerald-700 dark:text-emerald-400">{emailAlias || 'hello'}@{selectedDomain.domain}</strong> lands immediately in this Gmail inbox.
                  </p>
                </div>

                {/* 3. Transparent Naira Price Breakdown */}
                <div className="rounded-xl p-4 bg-[#F7F8F5] dark:bg-[#151912] border border-[#11140F]/10 dark:border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-[#11140F]/70 dark:text-white/70">
                    <span>1-Year Domain Registration ({selectedDomain.domain})</span>
                    <span className="font-mono">{formatNaira(selectedDomain.pricing.wholesaleNgn)}</span>
                  </div>
                  <div className="flex justify-between text-[#11140F]/70 dark:text-white/70">
                    <span>Custom Email Forwarding + Cloudflare DNS &amp; Free SSL Setup</span>
                    <span className="font-mono">{formatNaira(selectedDomain.pricing.platformFeeNgn)}</span>
                  </div>
                  <div className="border-t border-[#11140F]/10 dark:border-white/10 pt-2 flex justify-between font-bold text-sm">
                    <span>Total Due Today</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">
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
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>
                    {checkingOut
                      ? 'Redirecting to Paystack…'
                      : `Pay ${formatNaira(selectedDomain.pricing.totalNgn)} with Paystack`}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* VIEW B: MY REGISTERED DOMAINS & DNS MANAGEMENT */}
      {activeTab === 'domains' && (
        <div className="space-y-6">
          {loadingOrders ? (
            <div className="p-12 text-center text-xs text-[#11140F]/50 dark:text-white/50">
              Loading your domains…
            </div>
          ) : orders.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-[#11140F]/15 dark:border-white/15 text-center space-y-3 bg-white dark:bg-[#11140F]">
              <Globe className="w-8 h-8 text-emerald-600 mx-auto opacity-70" />
              <h4 className="text-sm font-bold">No active domains yet</h4>
              <p className="text-xs text-[#11140F]/60 dark:text-white/60 max-w-sm mx-auto">
                Search for your brand domain above and complete checkout in Naira to get your domain and business email routing.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                Search Available Domains &rarr;
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-base sm:text-lg">
                            {ord.domainName}
                          </span>
                          {ord.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active &amp; Verified
                            </span>
                          ) : ord.status === 'PAID_AWAITING_FUNDS' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Paid · Awaiting Provisioning
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[11px] font-medium">
                              <Clock className="w-3 h-3 text-blue-600" />
                              {ord.status}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#11140F]/60 dark:text-white/60 flex-wrap">
                          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                            <Mail className="w-3 h-3" />
                            {ord.desiredAlias}@{ord.domainName}
                          </span>
                          <span>&rarr; forwards to:</span>
                          <span className="font-mono text-[#11140F]/80 dark:text-white/80">{ord.userEmail}</span>
                          <span className="text-[#11140F]/30 dark:text-white/30">•</span>
                          <span className="font-mono">{formatNaira(ord.totalPaidNgn)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedDnsOrder(ord)}
                          className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#1A1F16] text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Manage DNS</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLinkToWorkspace(ord)}
                          disabled={linkingOrderId === ord.id}
                          className="px-3 py-1.5 rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-xs font-semibold hover:bg-[#2A2E25] dark:hover:bg-white/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-700" />
                          <span>
                            {linkingOrderId === ord.id ? 'Linking…' : 'Use in QR Workspace'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Active Nameservers Snippet */}
                    {ord.nameservers && ord.nameservers.length > 0 && (
                      <div className="pt-2 border-t border-[#11140F]/5 dark:border-white/5 flex items-center justify-between text-[11px] text-[#11140F]/50 dark:text-white/50 font-mono">
                        <span>Nameservers: {ord.nameservers.join(', ')}</span>
                        <span>Ref: {ord.paystackRef}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 4-Step Gmail "Send Mail As" Walkthrough Card */}
              <div className="rounded-2xl bg-[#F7F8F5] dark:bg-[#151912] border border-[#11140F]/10 dark:border-white/10 p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="font-bold text-sm">
                    How to Send Emails from Your Custom Address in Gmail (4 Steps)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs leading-relaxed text-[#11140F]/75 dark:text-white/75">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C2218] border border-[#11140F]/10 dark:border-white/10 space-y-1">
                    <span className="font-bold text-emerald-600 font-mono">Step 1: App Password</span>
                    <p>Go to your Google Account security settings ➔ enable 2-Step Verification ➔ generate an <strong>App Password</strong>.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C2218] border border-[#11140F]/10 dark:border-white/10 space-y-1">
                    <span className="font-bold text-emerald-600 font-mono">Step 2: Add Address</span>
                    <p>Open Gmail ➔ Settings ➔ <strong>Accounts and Import</strong> ➔ click <strong>"Add another email address"</strong>.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C2218] border border-[#11140F]/10 dark:border-white/10 space-y-1">
                    <span className="font-bold text-emerald-600 font-mono">Step 3: SMTP Settings</span>
                    <p>Enter your custom address. Set SMTP to <code className="font-mono">smtp.gmail.com</code> (Port 587, TLS), paste your Gmail + App Password.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#1C2218] border border-[#11140F]/10 dark:border-white/10 space-y-1">
                    <span className="font-bold text-emerald-600 font-mono">Step 4: Confirm Link</span>
                    <p>Click the verification link sent directly to your inbox. You can now compose and reply from your custom domain!</p>
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
