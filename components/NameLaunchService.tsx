'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  CreditCard,
  Trash2,
  ArrowRight,
  Zap,
  EyeOff,
} from 'lucide-react';
import { DomainSearchResult } from '@/lib/domains/constants';
import {
  getUserDomainOrders,
  confirmOrderPayment,
  linkDomainToQrWorkspace,
  cancelPendingDomainOrder,
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

interface FeaturedTld {
  tld: string;
  tagline: string;
  priceNgn: number;
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Featured live TLD prices
  const [featuredTlds, setFeaturedTlds] = useState<FeaturedTld[]>([
    { tld: 'xyz', tagline: 'Modern & startups', priceNgn: 5600 },
    { tld: 'com', tagline: 'Global standard', priceNgn: 17500 },
    { tld: 'com.ng', tagline: 'Nigerian brands', priceNgn: 9500 },
    { tld: 'ng', tagline: 'Direct local identity', priceNgn: 18500 },
    { tld: 'org', tagline: 'Communities & NGOs', priceNgn: 16500 },
    { tld: 'io', tagline: 'Tech & SaaS', priceNgn: 58000 },
  ]);

  // Checkout drawer state
  const [selectedDomain, setSelectedDomain] = useState<DomainSearchResult | null>(null);
  const [emailAlias, setEmailAlias] = useState('hello');
  const [forwardingEmail, setForwardingEmail] = useState(user?.email || '');
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Orders list state
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [resumingOrderId, setResumingOrderId] = useState<string | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [selectedDnsOrder, setSelectedDnsOrder] = useState<any | null>(null);
  const [linkingOrderId, setLinkingOrderId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadOrders();
    checkUrlReference();
    fetch('/api/domains/pricing')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.tlds) && d.tlds.length > 0) {
          setFeaturedTlds(d.tlds);
        }
      })
      .catch(() => {});
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

  // Separate paid/owned domains from unpaid pending checkouts
  const pendingOrders = orders.filter((o) => o.status === 'PENDING_PAYMENT');
  const ownedDomains = orders.filter((o) => o.status !== 'PENDING_PAYMENT');

  // Handle checkout redirect callback: /?section=namelaunch&ref=DOM_...
  async function checkUrlReference() {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (ref && ref.startsWith('DOM_')) {
      setActiveTab('domains');
      setActionAlert({
        text: 'Verifying payment and activating your domain…',
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
            text: res.message || 'Payment not completed yet.',
            type: 'error',
          });
          loadOrders();
        }
      } catch (err: any) {
        setActionAlert({ text: err.message || 'Verification error', type: 'error' });
      }
    }
  }

  async function runDomainSearch(searchText: string) {
    const trimmed = searchText.trim();
    if (!trimmed) return;

    setQuery(trimmed);
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await runDomainSearch(query);
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
          expectedPriceNgn: selectedDomain.pricing.totalNgn,
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

  async function handleResumePendingPayment(orderId: string) {
    setResumingOrderId(orderId);
    setActionAlert(null);
    try {
      const res = await fetch('/api/domains/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to resume checkout');
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      setActionAlert({ text: err.message || 'Could not start payment', type: 'error' });
      setResumingOrderId(null);
    }
  }

  async function handleCancelPendingOrder(orderId: string) {
    setCancelingOrderId(orderId);
    setActionAlert(null);
    try {
      const res = await cancelPendingDomainOrder(orderId);
      if (res.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setActionAlert({ text: res.message, type: 'success' });
      } else {
        setActionAlert({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setActionAlert({ text: err.message || 'Could not cancel order', type: 'error' });
    } finally {
      setCancelingOrderId(null);
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
      {/* Alert Notification */}
      {actionAlert && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-medium flex items-center justify-between gap-2.5 ${
            actionAlert.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#34D399] border border-emerald-500/25'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{actionAlert.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="text-[11px] underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Unpaid Order Reminder Banner (when on Search tab) */}
      {activeTab === 'search' && pendingOrders.length > 0 && (
        <div className="px-4 py-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[#11140F]/85 dark:text-white/90">
              You have <strong>{pendingOrders.length}</strong> domain {pendingOrders.length === 1 ? 'order' : 'orders'} awaiting payment (
              <span className="font-mono text-amber-600 dark:text-amber-300">{pendingOrders.map((p) => p.domainName).join(', ')}</span>).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('domains')}
            className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Complete Payment</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Signature Storefront Card Container */}
      <div className="rounded-3xl border border-[#11140F]/10 dark:border-white/[0.08] bg-white dark:bg-[#101211] shadow-2xl overflow-hidden">
        {/* Top Ambient Cover Banner (Signature Obsidian + Emerald Mesh + Grid) */}
        <div className="relative px-5 sm:px-8 pt-5 pb-7 bg-[#0A0E0C] text-white overflow-hidden border-b border-white/[0.07]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/75 via-[#101914] to-[#0A0E0C]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E0C]/80 via-transparent to-black/30 pointer-events-none" />

          <div className="relative z-10 space-y-5">
            {/* Top Frosted Pill Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-black/45 border border-white/15 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setActiveTab('search')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'search'
                      ? 'bg-[#34D399] text-[#09110D] shadow-sm'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  Search Domains
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('domains')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'domains'
                      ? 'bg-[#34D399] text-[#09110D] shadow-sm'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <span>My Domains</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeTab === 'domains' ? 'bg-black/15 text-[#09110D]' : 'bg-white/10 text-white/80'
                  }`}>
                    {ownedDomains.length}
                  </span>
                  {pendingOrders.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title={`${pendingOrders.length} awaiting payment`} />
                  )}
                </button>
              </div>

              <span className="px-3 py-1 rounded-full bg-black/45 border border-white/15 backdrop-blur-md text-[11px] font-medium text-white/80 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                <span>SSL &amp; Email Included</span>
              </span>
            </div>

            {/* Hero Copy + Search Input when on Search Tab */}
            {activeTab === 'search' && (
              <div className="max-w-2xl space-y-4 pt-1">
                <div>
                  <p className="text-xs font-semibold text-[#34D399] tracking-wide uppercase">
                    Domains &amp; Business Email
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-0.5">
                    Claim your brand address.
                  </h2>
                  <p className="text-xs sm:text-[13px] text-white/65 mt-1 leading-relaxed max-w-xl">
                    Register a domain in local currency, route custom <span className="font-mono text-[#34D399]">you@yourbrand.com</span> emails, and link directly to your QR campaigns.
                  </p>
                </div>

                <form onSubmit={handleSearch}>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex items-center gap-2.5 flex-1 px-4 rounded-2xl bg-black/50 border border-white/15 focus-within:border-[#34D399] backdrop-blur-md transition-all">
                      <Search className="w-4 h-4 text-[#34D399] shrink-0" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search domain name (e.g. mybrand, studio.xyz)"
                        className="w-full py-3 text-sm bg-transparent outline-none text-white placeholder:text-white/40 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={searching}
                      className="px-6 py-3 rounded-2xl bg-[#34D399] hover:bg-[#34D399]/90 active:scale-[0.99] text-[#09110D] font-bold text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 shrink-0 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>{searching ? 'Searching…' : 'Search Availability'}</span>
                    </button>
                  </div>
                </form>

                {searchError && (
                  <p className="text-xs text-rose-400">{searchError}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap text-xs text-white/50">
                  <span>Try:</span>
                  {['mybrand', 'studio', 'ventures', 'digital'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => runDomainSearch(sug)}
                      className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/10 text-white/80 hover:text-[#34D399] transition-all cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lower Content Canvas */}
        <div className="p-5 sm:p-7 space-y-6">
          {/* VIEW A: DOMAIN SEARCH & STOREFRONT */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Empty-Search Showcase: Live TLD Pricing Grid + Included Capabilities */}
              {results.length === 0 && !searching && (
                <div className="space-y-6">
                  {/* Featured Extensions Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#11140F]/70 dark:text-white/70">
                        <Globe className="w-3.5 h-3.5 text-[#34D399]" />
                        Featured Extensions
                      </span>
                      <span className="text-[10.5px] font-mono text-[#11140F]/45 dark:text-white/40">
                        {featuredTlds.length} Extensions
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                      {featuredTlds.map((item) => (
                        <button
                          key={item.tld}
                          type="button"
                          onClick={() => {
                            const base = query.trim().split('.')[0] || 'mybrand';
                            runDomainSearch(`${base}.${item.tld}`);
                          }}
                          className="group p-3.5 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] hover:bg-[#EEF0EA] dark:hover:bg-white/[0.07] border border-[#11140F]/8 dark:border-white/[0.08] hover:border-[#34D399]/50 transition-all text-left cursor-pointer shadow-xs flex flex-col justify-between gap-2.5"
                        >
                          <div>
                            <div className="font-mono font-bold text-base text-[#11140F] dark:text-white group-hover:text-[#34D399] transition-colors">
                              .{item.tld}
                            </div>
                            <div className="text-[11px] text-[#11140F]/55 dark:text-white/50 mt-0.5">
                              {item.tagline}
                            </div>
                          </div>
                          <div className="font-mono text-xs font-bold text-[#2F6B4F] dark:text-[#34D399] pt-1.5 border-t border-[#11140F]/6 dark:border-white/[0.06]">
                            {formatNaira(item.priceNgn)}
                            <span className="text-[10px] font-normal text-[#11140F]/45 dark:text-white/45">/yr</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Included Features Section (Signature Glass Cards with Squircle Icons) */}
                  <div className="space-y-3 pt-2 border-t border-[#11140F]/8 dark:border-white/10">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#11140F]/70 dark:text-white/70">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
                        Included With Every Domain
                      </span>
                      <span className="text-[10.5px] font-mono text-[#11140F]/45 dark:text-white/40">
                        4 Features
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08]">
                        <div className="w-9 h-9 rounded-xl bg-black/[0.06] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#11140F] dark:text-white">Custom Brand Email</p>
                          <p className="text-[11px] text-[#11140F]/55 dark:text-white/50 mt-0.5 leading-relaxed">
                            Route hello@yourbrand.com into your personal inbox with custom aliases.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08]">
                        <div className="w-9 h-9 rounded-xl bg-black/[0.06] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#11140F] dark:text-white">One-Click QR Linking</p>
                          <p className="text-[11px] text-[#11140F]/55 dark:text-white/50 mt-0.5 leading-relaxed">
                            Activate your domain for shortlinks and QR codes with automatic SSL.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08]">
                        <div className="w-9 h-9 rounded-xl bg-black/[0.06] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#11140F] dark:text-white">Full DNS Management</p>
                          <p className="text-[11px] text-[#11140F]/55 dark:text-white/50 mt-0.5 leading-relaxed">
                            Edit A, CNAME, MX, and TXT records, web forwarding, or custom nameservers.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08]">
                        <div className="w-9 h-9 rounded-xl bg-black/[0.06] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                          <EyeOff className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#11140F] dark:text-white">WHOIS Privacy &amp; Lock</p>
                          <p className="text-[11px] text-[#11140F]/55 dark:text-white/50 mt-0.5 leading-relaxed">
                            Keep registrant information masked with automatic transfer lock protection.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  className="w-full py-3.5 rounded-2xl bg-[#34D399] hover:bg-[#34D399]/90 active:scale-[0.99] text-[#09110D] font-bold text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
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

          {/* VIEW B: MY REGISTERED DOMAINS & PENDING CHECKOUTS */}
          {activeTab === 'domains' && (
            <div className="space-y-6">
              {loadingOrders ? (
                <div className="p-12 text-center text-xs text-[#11140F]/50 dark:text-white/50">
                  Loading domains…
                </div>
              ) : (
                <>
                  {/* 1. UNPAID / AWAITING PAYMENT SECTION */}
                  {pendingOrders.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          Awaiting Payment
                        </span>
                        <span className="text-[10.5px] font-mono text-[#11140F]/45 dark:text-white/40">
                          {pendingOrders.length} Pending
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        {pendingOrders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-4 sm:p-5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-mono font-bold text-base text-[#11140F] dark:text-white">
                                  {ord.domainName}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10.5px] font-semibold">
                                  <Clock className="w-3 h-3" />
                                  Payment Required
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#11140F]/60 dark:text-white/55 flex-wrap">
                                <span className="font-mono">
                                  {ord.desiredAlias}@{ord.domainName} &rarr; {ord.userEmail}
                                </span>
                                <span className="opacity-40">•</span>
                                <span className="font-mono font-bold text-[#11140F] dark:text-white">
                                  {formatNaira(ord.totalPaidNgn)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCancelPendingOrder(ord.id)}
                                disabled={cancelingOrderId === ord.id || resumingOrderId === ord.id}
                                className="px-3.5 py-2 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-xs font-medium text-[#11140F]/70 dark:text-white/70 hover:text-rose-500 hover:border-rose-500/30 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>{cancelingOrderId === ord.id ? 'Removing…' : 'Cancel'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResumePendingPayment(ord.id)}
                                disabled={resumingOrderId === ord.id || cancelingOrderId === ord.id}
                                className="px-4 py-2 rounded-xl bg-[#34D399] hover:bg-[#34D399]/90 text-[#09110D] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>
                                  {resumingOrderId === ord.id
                                    ? 'Opening Checkout…'
                                    : `Complete Payment · ${formatNaira(ord.totalPaidNgn)}`}
                                </span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. ACTIVE / PAID OWNED DOMAINS */}
                  {ownedDomains.length === 0 ? (
                    <div className="p-10 rounded-2xl border border-dashed border-[#11140F]/15 dark:border-white/12 text-center space-y-3 bg-[#F7F8F5] dark:bg-white/[0.02]">
                      <div className="w-11 h-11 rounded-2xl bg-black/[0.05] dark:bg-white/10 text-[#2F6B4F] dark:text-[#34D399] flex items-center justify-center mx-auto">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold">No active domains yet</h4>
                      <p className="text-xs text-[#11140F]/60 dark:text-white/55 max-w-sm mx-auto leading-relaxed">
                        {pendingOrders.length > 0
                          ? 'Complete payment on your pending order above to activate your domain and unlock DNS & email routing.'
                          : 'Search for an available domain name to register your brand address and email forwarding.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('search')}
                        className="px-5 py-2.5 rounded-2xl bg-[#34D399] hover:bg-[#34D399]/90 text-[#09110D] text-xs font-bold shadow-sm cursor-pointer"
                      >
                        Search Domains
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        {ownedDomains.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-5 rounded-2xl border border-[#11140F]/10 dark:border-white/[0.08] bg-[#F7F8F5] dark:bg-white/[0.03] space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <span className="font-mono font-bold text-base sm:text-lg">
                                    {ord.domainName}
                                  </span>
                                  {ord.status === 'ACTIVE' ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2F6B4F] dark:text-[#34D399]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                                      Active
                                    </span>
                                  ) : ord.status === 'PAID_AWAITING_FUNDS' ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      Provisioning in Progress
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-500">
                                      <Clock className="w-3 h-3" />
                                      {ord.status}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-[#11140F]/60 dark:text-white/60 flex-wrap">
                                  <span className="flex items-center gap-1 font-mono text-[#11140F] dark:text-white">
                                    <Mail className="w-3 h-3 text-[#34D399]" />
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
                                  className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-[#34D399]" />
                                  <span>DNS Records</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderId(expandedOrderId === ord.id ? null : ord.id)}
                                  className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
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
                                  className="px-3.5 py-1.5 rounded-xl bg-[#34D399] hover:bg-[#34D399]/90 text-[#09110D] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                      <div className="rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/10 dark:border-white/[0.08] p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-[#34D399]" />
                          <h4 className="font-bold text-xs uppercase tracking-wider text-[#11140F]/75 dark:text-white/75">
                            Send Emails From Your Custom Domain in Gmail
                          </h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs leading-relaxed text-[#11140F]/75 dark:text-white/75">
                          <div className="p-3.5 rounded-xl bg-white dark:bg-[#151814] border border-[#11140F]/8 dark:border-white/8 space-y-1">
                            <span className="font-bold text-[#2F6B4F] dark:text-[#34D399]">1. App Password</span>
                            <p>Enable 2-Step Verification in your Google Account and generate an App Password.</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white dark:bg-[#151814] border border-[#11140F]/8 dark:border-white/8 space-y-1">
                            <span className="font-bold text-[#2F6B4F] dark:text-[#34D399]">2. Accounts &amp; Import</span>
                            <p>In Gmail Settings, go to Accounts and Import and click Add another email address.</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white dark:bg-[#151814] border border-[#11140F]/8 dark:border-white/8 space-y-1">
                            <span className="font-bold text-[#2F6B4F] dark:text-[#34D399]">3. SMTP Setup</span>
                            <p>Use <code className="font-mono">smtp.gmail.com</code> (Port 587, TLS) with your Gmail and App Password.</p>
                          </div>
                          <div className="p-3.5 rounded-xl bg-white dark:bg-[#151814] border border-[#11140F]/8 dark:border-white/8 space-y-1">
                            <span className="font-bold text-[#2F6B4F] dark:text-[#34D399]">4. Verify</span>
                            <p>Click the confirmation link sent to your inbox to reply from your custom address.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

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
