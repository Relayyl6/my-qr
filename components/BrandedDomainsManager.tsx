'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  addCustomDomain,
  verifyCustomDomain,
  forceVerifyCustomDomain,
  deleteCustomDomain,
} from '@/lib/domains/actions';
import {
  Globe,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Copy,
  Check,
  Zap,
  Info,
  ArrowRight,
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface Domain {
  id: string;
  domain: string;
  status: string;
  cnameTarget: string;
  verificationTxt: string;
  createdAt: Date | string;
}

interface Props {
  initialDomains: Domain[];
  userTier: string;
  isAdmin: boolean;
}

function SubmitDomainBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-[13px] font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
    >
      <Plus className="w-4 h-4" />
      {pending ? 'Connecting…' : 'Add Domain'}
    </button>
  );
}

export default function BrandedDomainsManager({ initialDomains, userTier, isAdmin }: Props) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [isOpen, setIsOpen] = useState(initialDomains.length === 0);
  const [domainInput, setDomainInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<{ id: string; domain: string } | null>(null);
  const [deletingDomain, setDeletingDomain] = useState(false);

  const [state, formAction] = useFormState(addCustomDomain, {});

  const isEligible = isAdmin || ['plus', 'ultra'].includes(userTier.toLowerCase());

  // Keep domains list in sync when a new domain is added via server action
  useEffect(() => {
    if (state.success && state.domain) {
      setDomains((prev) => {
        if (prev.some((d) => d.id === state.domain.id)) return prev;
        return [state.domain, ...prev];
      });
      setDomainInput('');
      setActionMsg({
        text: state.message || `Domain ${state.domain.domain} connected! Configure DNS records below.`,
        type: 'success',
      });
    } else if (state.message) {
      setActionMsg({ text: state.message, type: 'error' });
    }
  }, [state]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVerify = async (id: string) => {
    setVerifyingId(id);
    setActionMsg(null);
    try {
      const res = await verifyCustomDomain(id);
      if (res.success) {
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: 'verified' } : d))
        );
        setActionMsg({ text: res.message || 'Domain verified successfully!', type: 'success' });
      } else {
        setActionMsg({ text: res.message || 'DNS verification still propagating. Check back shortly.', type: 'error' });
      }
    } catch (err: any) {
      setActionMsg({ text: 'Verification failed: ' + err.message, type: 'error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleForceVerify = async (id: string) => {
    setVerifyingId(id);
    setActionMsg(null);
    try {
      const res = await forceVerifyCustomDomain(id);
      if (res.success) {
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? { ...d, status: 'verified' } : d))
        );
        setActionMsg({ text: res.message || 'Domain verified and active!', type: 'success' });
      } else {
        setActionMsg({ text: res.message || 'Quick verification failed.', type: 'error' });
      }
    } catch (err: any) {
      setActionMsg({ text: 'Quick verification failed: ' + err.message, type: 'error' });
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = (id: string, domainName?: string) => {
    const d = domains.find((item) => item.id === id);
    setDomainToDelete({ id, domain: domainName || d?.domain || 'this domain' });
  };

  const executeDeleteDomain = async () => {
    if (!domainToDelete) return;
    setDeletingDomain(true);
    try {
      const res = await deleteCustomDomain(domainToDelete.id);
      if (res.success) {
        setDomains((prev) => prev.filter((d) => d.id !== domainToDelete.id));
        setActionMsg({ text: 'Domain removed.', type: 'success' });
        setDomainToDelete(null);
      } else {
        setActionMsg({ text: res.message || 'Delete failed', type: 'error' });
      }
    } catch (err: any) {
      setActionMsg({ text: 'Delete failed: ' + err.message, type: 'error' });
    } finally {
      setDeletingDomain(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#11140F] p-5 sm:p-7 shadow-xs space-y-6 text-[#11140F] dark:text-white transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[15px] text-[#11140F] dark:text-white">Custom Branded Domains</h3>
            <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-[#11140F]/5 dark:bg-white/10 text-[#11140F]/65 dark:text-white/65 font-medium">
              Plus &amp; Ultra
            </span>
          </div>
          <p className="text-[12.5px] text-[#11140F]/60 dark:text-white/60 mt-0.5">
            Serve QR codes and shortlinks from your own custom domain (e.g.{' '}
            <span className="font-mono text-emerald-700 dark:text-emerald-400">qr.yourcompany.com</span>).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[12.5px] font-medium text-[#11140F] dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer px-3 py-1.5 rounded-lg border border-[#11140F]/10 dark:border-white/10 hover:bg-[#11140F]/5 dark:hover:bg-white/5"
        >
          {isOpen ? 'Collapse' : `Manage (${domains.length})`}
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6 pt-2 border-t border-[#11140F]/10 dark:border-white/10">
          {!isEligible ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[13px] text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-medium">Branded domains are locked to Plus and Ultra plans.</p>
                <p className="text-amber-800/80 dark:text-amber-300/80">
                  Upgrade your subscription to connect custom CNAME domains and present your brand on all physical prints.
                </p>
                <div className="pt-2">
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-[12px] font-medium hover:bg-[#2A2E25]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Upgrade to Plus &rarr;
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* How Custom Branded Domains Work in 3 Steps */}
              <div className="rounded-2xl bg-[#F7F8F5] dark:bg-[#151912] border border-[#11140F]/10 dark:border-white/10 p-5 sm:p-6 space-y-4 text-[12.5px] text-[#11140F]/85 dark:text-white/85">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-[#11140F]/10 dark:border-white/10">
                  <div>
                    <div className="font-semibold text-[14px] text-[#11140F] dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Connect a domain you already own:
                    </div>
                    <p className="text-[12px] text-[#11140F]/65 dark:text-white/65 mt-0.5">
                      <strong>Optional:</strong> By default, all QR codes work instantly with <code className="font-mono text-emerald-600 dark:text-emerald-400">my-qr-sandy.vercel.app</code>. Connect a custom domain only if you want your own company brand on the link.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold self-start sm:self-auto shrink-0">
                    Setup Guide
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  {/* Step 1 */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C2218] border border-slate-200 dark:border-white/10 space-y-2 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 text-[13px]">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                        Step 1: Pick the address you want
                      </div>
                      <p className="text-[12px] text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                        In the input box under <strong>Branded Domains</strong>, type the web address you want for your QR codes (e.g. <code className="font-mono text-emerald-900 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 border border-slate-300 dark:border-white/10">qr.yourcompany.com</code> or <code className="font-mono text-emerald-900 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/10 border border-slate-300 dark:border-white/10">links.yourcompany.com</code>).
                      </p>
                    </div>
                    <div className="pt-2 text-[12px] font-bold text-emerald-800 dark:text-emerald-400">
                      &bull; Click <strong>"Add Domain"</strong>.
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C2218] border border-slate-200 dark:border-white/10 space-y-2.5 shadow-2xs">
                    <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 text-[13px]">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                      Step 2: Copy the 2 lines to where you bought your website
                    </div>
                    <div className="text-[12px] text-slate-800 dark:text-slate-200 space-y-2 leading-snug">
                      <p className="text-[11.5px] font-medium text-slate-800 dark:text-slate-200">DynamicQR will immediately give you two lines of text:</p>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-black/50 border border-slate-200 dark:border-white/10 font-mono text-[11px] space-y-1.5 text-slate-900 dark:text-white shadow-2xs">
                        <div>
                          <strong className="text-emerald-800 dark:text-emerald-400 font-bold">Line 1 (CNAME):</strong> tells the internet to send people to DynamicQR.
                        </div>
                        <div>
                          <strong className="text-emerald-800 dark:text-emerald-400 font-bold">Line 2 (TXT):</strong> proves that you own this website.
                        </div>
                      </div>
                      <p className="text-[11.5px] leading-relaxed font-normal text-slate-800 dark:text-slate-200">
                        Log into your domain registrar, open your <strong>DNS Settings</strong>, and paste those 2 records.
                      </p>

                      {/* Buy Domain Directly on DynamicQR Option */}
                      <div className="pt-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 space-y-1.5 text-left">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Don't own a domain yet?</span>
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                          Register a branded domain directly on DynamicQR (from ₦7,500/yr with custom business email &amp; automatic DNS).
                        </p>
                        <a
                          href="#workspace?section=namelaunch"
                          onClick={(e) => {
                            if (typeof window !== 'undefined') {
                              window.location.hash = 'workspace?section=namelaunch';
                              window.location.search = '?section=namelaunch';
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                        >
                          <span>Register domain on DynamicQR</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1C2218] border border-slate-200 dark:border-white/10 space-y-2 shadow-2xs flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 text-[13px]">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">3</span>
                        Step 3: Click "Instant Verify (Test Mode)"
                      </div>
                      <p className="text-[12px] text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                        Click the green <strong>"Instant Verify (Test Mode)"</strong> button in DynamicQR. The badge turns to <span className="text-emerald-800 dark:text-emerald-400 font-bold">Active & Verified</span>.
                      </p>
                    </div>
                    <div className="pt-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[11.5px] text-emerald-900 dark:text-emerald-300 leading-snug font-medium">
                      <strong>Done!</strong> Whenever you create a new QR code in your workspace, select your domain from the dropdown and your QR codes will be generated under your brand.
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Domain Form */}
              <form action={formAction} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-[13px] font-semibold text-[#11140F] dark:text-white flex items-center gap-1.5">
                    <span>Connect your branded subdomain</span>
                  </label>
                  <span className="text-[11.5px] text-[#11140F]/60 dark:text-white/60">
                    Use any domain or subdomain you own
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1 w-full flex items-center rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#151912] focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all shadow-2xs overflow-hidden">
                    <span className="px-3.5 py-2.5 text-[13px] text-[#11140F]/50 dark:text-white/50 font-mono select-none bg-[#11140F]/[0.03] dark:bg-white/[0.05] border-r border-[#11140F]/10 dark:border-white/10 shrink-0 font-medium">
                      https://
                    </span>
                    <input
                      type="text"
                      name="domain"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      required
                      placeholder="qr.yourbrand.com"
                      className="w-full px-3.5 py-2.5 text-[13.5px] font-mono outline-none bg-transparent text-[#11140F] dark:text-white placeholder:text-[#11140F]/35 dark:placeholder:text-white/35"
                    />
                  </div>
                  <SubmitDomainBtn />
                </div>

                {/* Quick Example Suggestions */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="text-[11px] text-[#11140F]/50 dark:text-white/50 font-medium">
                    Try example:
                  </span>
                  {['qr.acme.com', 'go.brand.io', 'link.mycompany.org'].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setDomainInput(example)}
                      className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#11140F]/5 dark:bg-white/10 text-[#11140F]/70 dark:text-white/70 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </form>

              {/* Feedback Alert Banner */}
              {actionMsg && (
                <div
                  className={`p-3.5 rounded-xl text-[12.5px] font-medium flex items-center gap-2.5 ${
                    actionMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                  }`}
                >
                  {actionMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                  <span>{actionMsg.text}</span>
                </div>
              )}

              {/* Connected Domains List */}
              {domains.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#11140F]/15 dark:border-white/15 p-6 text-center text-[13px] text-[#11140F]/60 dark:text-white/60 bg-[#11140F]/[0.01] dark:bg-white/[0.01]">
                  No custom domains connected yet. Enter your subdomain above (e.g. <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">qr.yourbrand.com</code>) to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-[13px] font-semibold text-[#11140F]/75 dark:text-white/75 uppercase tracking-wider">
                    Your Connected Domains ({domains.length})
                  </h4>

                  {domains.map((d) => {
                    const hostName = d.domain.split('.')[0] || 'qr';
                    return (
                      <div
                        key={d.id}
                        className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-[#EEF0EA]/40 dark:bg-white/[0.03] p-4 sm:p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-[14.5px] text-[#11140F] dark:text-white">
                              {d.domain}
                            </span>
                            {d.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 text-[11px] font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                Active & Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[11px] font-medium">
                                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                Pending DNS Setup
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {d.status !== 'verified' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleVerify(d.id)}
                                  disabled={verifyingId === d.id}
                                  className="px-3 py-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#11140F] text-[12px] font-medium text-[#11140F] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                                >
                                  <RefreshCw className={`w-3 h-3 ${verifyingId === d.id ? 'animate-spin' : ''}`} />
                                  {verifyingId === d.id ? 'Checking DNS…' : 'Verify DNS'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleForceVerify(d.id)}
                                  disabled={verifyingId === d.id}
                                  title="Instantly mark as active for test campaigns"
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-[11.5px] font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Instant Verify (Test Mode)
                                </button>
                              </>
                            ) : (
                              <span className="text-[11.5px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Serving QR codes live
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(d.id, d.domain)}
                              className="p-1.5 rounded-lg text-[#11140F]/40 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                              title="Delete domain"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* DNS Instructions Block */}
                        {d.status !== 'verified' && (
                          <div className="rounded-xl bg-white dark:bg-[#151912] border border-[#11140F]/10 dark:border-white/10 p-4 space-y-3 text-[12px]">
                            <div className="font-semibold text-[#11140F]/80 dark:text-white/80 flex items-center justify-between">
                              <span>Add these 2 records in your Domain DNS Manager:</span>
                              <span className="text-[11px] text-[#11140F]/50 dark:text-white/50 font-normal">Click icon to copy</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11.5px]">
                              {/* CNAME */}
                              <div className="p-3 rounded-lg bg-[#EEF0EA]/70 dark:bg-white/[0.04] border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="text-[10px] text-[#11140F]/50 dark:text-white/50 uppercase font-sans font-semibold">
                                    Record 1 · Primary CNAME
                                  </div>
                                  <div className="truncate text-[#11140F] dark:text-white">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Type:</span> CNAME
                                  </div>
                                  <div className="truncate text-[#11140F] dark:text-white">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Host:</span> {hostName}
                                  </div>
                                  <div className="truncate text-[#11140F] dark:text-white">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Points to:</span> {d.cnameTarget}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(d.cnameTarget, `cname-${d.id}`)}
                                  className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-md text-[#11140F]/60 dark:text-white/70 transition-colors shrink-0 cursor-pointer"
                                  title="Copy CNAME target"
                                >
                                  {copiedId === `cname-${d.id}` ? (
                                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>

                              {/* TXT */}
                              <div className="p-3 rounded-lg bg-[#EEF0EA]/70 dark:bg-white/[0.04] border border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="text-[10px] text-[#11140F]/50 dark:text-white/50 uppercase font-sans font-semibold">
                                    Record 2 · Verification TXT
                                  </div>
                                  <div className="truncate text-[#11140F] dark:text-white">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Type:</span> TXT
                                  </div>
                                  <div className="truncate text-[#11140F] dark:text-white">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Host:</span> _dynamicqr.{hostName}
                                  </div>
                                  <div className="truncate text-[#11140F] dark:text-white">
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Value:</span> {d.verificationTxt}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(d.verificationTxt, `txt-${d.id}`)}
                                  className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-md text-[#11140F]/60 dark:text-white/70 transition-colors shrink-0 cursor-pointer"
                                  title="Copy verification TXT"
                                >
                                  {copiedId === `txt-${d.id}` ? (
                                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!domainToDelete}
        onClose={() => setDomainToDelete(null)}
        onConfirm={executeDeleteDomain}
        title="Remove Branded Domain"
        description={domainToDelete ? `Are you sure you want to remove domain "${domainToDelete.domain}"? Dynamic QR codes using this domain may stop resolving until reconfigured.` : ''}
        confirmLabel="Remove Domain"
        isDestructive={true}
        loading={deletingDomain}
      />
    </div>
  );
}
