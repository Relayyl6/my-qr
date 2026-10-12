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
} from 'lucide-react';

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
      className="px-4 py-2.5 rounded-xl bg-[#11140F] text-white text-[13px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      {pending ? 'Connecting…' : 'Add Domain'}
    </button>
  );
}

export default function BrandedDomainsManager({ initialDomains, userTier, isAdmin }: Props) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [state, formAction] = useFormState(addCustomDomain, {});

  const isEligible = isAdmin || ['plus', 'ultra'].includes(userTier.toLowerCase());

  // Keep domains list in sync when a new domain is added via server action
  useEffect(() => {
    if (state.success && state.domain) {
      setDomains((prev) => {
        if (prev.some((d) => d.id === state.domain.id)) return prev;
        return [state.domain, ...prev];
      });
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this domain?')) return;
    try {
      const res = await deleteCustomDomain(id);
      if (res.success) {
        setDomains((prev) => prev.filter((d) => d.id !== id));
        setActionMsg({ text: 'Domain removed.', type: 'success' });
      }
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div className="rounded-2xl border border-[#11140F]/10 bg-white p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2F6B4F]/10 text-[#2F6B4F] flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[16px] text-[#11140F]">Custom Branded Domains</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#11140F]/5 text-[#11140F]/70 uppercase tracking-wider font-semibold">
                Plus & Ultra
              </span>
            </div>
            <p className="text-[13px] text-[#11140F]/60">
              Serve QR codes from your own branded domain (e.g.{' '}
              <span className="font-mono text-[#2F6B4F] font-semibold">qr.yourcompany.com</span>).
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[13px] font-medium text-[#11140F] hover:text-[#2F6B4F] transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          {isOpen ? 'Collapse' : `Manage (${domains.length})`}
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6 pt-2 border-t border-[#11140F]/10">
          {!isEligible ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[13px] text-amber-900 space-y-1">
                <p className="font-medium">Branded domains are locked to Plus and Ultra plans.</p>
                <p className="text-amber-800/80">
                  Upgrade your subscription to connect custom CNAME domains and present your brand on all physical prints.
                </p>
                <div className="pt-2">
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11140F] text-white text-[12px] font-medium hover:bg-[#2A2E25]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#96A689]" />
                    Upgrade to Plus &rarr;
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* How Custom Branded Domains Work in 3 Steps */}
              <div className="rounded-2xl bg-[#F7F8F5] border border-[#11140F]/10 p-5 space-y-3.5 text-[12.5px] text-[#11140F]/85">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[14px] text-[#11140F] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#2F6B4F]" />
                    How Custom Branded Domains Work in 3 Steps
                  </div>
                  <span className="text-[11px] font-mono text-[#2F6B4F] bg-[#2F6B4F]/10 px-2.5 py-0.5 rounded-full font-bold">
                    Setup Guide
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#11140F]/8 space-y-1.5 shadow-2xs">
                    <div className="font-bold text-[#2F6B4F] flex items-center gap-1.5 text-[13px]">
                      <span className="w-5 h-5 rounded-full bg-[#2F6B4F] text-white flex items-center justify-center text-[11px] font-bold">1</span>
                      Enter Subdomain
                    </div>
                    <p className="text-[12px] text-[#11140F]/70 leading-relaxed">
                      In the input box below, type your desired subdomain (e.g. <code className="font-mono text-[#11140F] font-semibold">qr.yourcompany.com</code> or <code className="font-mono text-[#11140F] font-semibold">go.yourbrand.com</code>) and click <strong>"+ Add Domain"</strong>.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#11140F]/8 space-y-2 shadow-2xs">
                    <div className="font-bold text-[#2F6B4F] flex items-center gap-1.5 text-[13px]">
                      <span className="w-5 h-5 rounded-full bg-[#2F6B4F] text-white flex items-center justify-center text-[11px] font-bold">2</span>
                      Add 2 DNS Records
                    </div>
                    <div className="text-[11.5px] text-[#11140F]/75 space-y-1.5 leading-snug">
                      <p>In your registrar (Namecheap, GoDaddy, Cloudflare, etc.):</p>
                      <div className="p-2 rounded-lg bg-[#F7F8F5] border border-[#11140F]/8 font-mono text-[11px] space-y-1">
                        <div><strong>• CNAME:</strong> Host <code className="text-[#2F6B4F]">qr</code> &rarr; <code className="text-[#11140F]">cname.vercel-dns.com</code></div>
                        <div><strong>• TXT:</strong> Host <code className="text-[#2F6B4F]">_dynamicqr.qr</code> &rarr; copy TXT value</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#11140F]/8 space-y-1.5 shadow-2xs">
                    <div className="font-bold text-[#2F6B4F] flex items-center gap-1.5 text-[13px]">
                      <span className="w-5 h-5 rounded-full bg-[#2F6B4F] text-white flex items-center justify-center text-[11px] font-bold">3</span>
                      Verify DNS & Print
                    </div>
                    <p className="text-[12px] text-[#11140F]/70 leading-relaxed">
                      Click <strong>"Verify DNS"</strong> (or <strong>"Instant Verify (Test Mode)"</strong>). The badge changes to <span className="text-emerald-700 font-bold">Active & Verified</span>, and all your QR links and print posters will serve directly from your custom domain!
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Domain Form */}
              <form action={formAction} className="space-y-3">
                <label className="block text-[12.5px] font-medium text-[#11140F]/70">
                  Connect a new branded subdomain:
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#11140F]/40 font-mono select-none">
                      https://
                    </span>
                    <input
                      type="text"
                      name="domain"
                      required
                      placeholder="qr.yourbrand.com"
                      className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-[#11140F]/15 text-[13.5px] font-mono outline-none focus:border-[#11140F] transition-colors bg-white"
                    />
                  </div>
                  <SubmitDomainBtn />
                </div>
              </form>

              {/* Feedback Alert Banner */}
              {actionMsg && (
                <div
                  className={`p-3 rounded-xl text-[12px] font-medium flex items-center gap-2 ${
                    actionMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {actionMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{actionMsg.text}</span>
                </div>
              )}

              {/* Connected Domains List */}
              {domains.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#11140F]/15 p-6 text-center text-[13px] text-[#11140F]/50">
                  No custom domains connected yet. Enter your subdomain above (e.g. <code>qr.yourbrand.com</code>) to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-[13px] font-semibold text-[#11140F]/75 uppercase tracking-wider">
                    Your Connected Domains ({domains.length})
                  </h4>

                  {domains.map((d) => {
                    const hostName = d.domain.split('.')[0] || 'qr';
                    return (
                      <div
                        key={d.id}
                        className="rounded-2xl border border-[#11140F]/10 bg-[#EEF0EA]/40 p-4 sm:p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-[14.5px] text-[#11140F]">
                              {d.domain}
                            </span>
                            {d.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Active & Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-medium">
                                <Clock className="w-3 h-3 text-amber-600" />
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
                                  className="px-3 py-1.5 rounded-lg border border-[#11140F]/15 bg-white text-[12px] font-medium text-[#11140F] hover:bg-white/80 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
                                >
                                  <RefreshCw className={`w-3 h-3 ${verifyingId === d.id ? 'animate-spin' : ''}`} />
                                  {verifyingId === d.id ? 'Checking DNS…' : 'Verify DNS'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleForceVerify(d.id)}
                                  disabled={verifyingId === d.id}
                                  title="Instantly mark as active for test campaigns"
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11.5px] font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Zap className="w-3 h-3 text-emerald-600" />
                                  Instant Verify (Test Mode)
                                </button>
                              </>
                            ) : (
                              <span className="text-[11.5px] text-emerald-700 font-medium">
                                ✓ Serving QR codes live
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(d.id)}
                              className="p-1.5 rounded-lg text-[#11140F]/40 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete domain"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* DNS Instructions Block */}
                        {d.status !== 'verified' && (
                          <div className="rounded-xl bg-white border border-[#11140F]/10 p-4 space-y-3 text-[12px]">
                            <div className="font-semibold text-[#11140F]/80 flex items-center justify-between">
                              <span>Add these 2 records in your Domain DNS Manager:</span>
                              <span className="text-[11px] text-[#11140F]/50 font-normal">Click icon to copy</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11.5px]">
                              {/* CNAME */}
                              <div className="p-3 rounded-lg bg-[#EEF0EA]/70 border border-[#11140F]/10 flex items-center justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="text-[10px] text-[#11140F]/50 uppercase font-sans font-semibold">
                                    Record 1 · Primary CNAME
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-[#2F6B4F]">Type:</span> CNAME
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-[#2F6B4F]">Host:</span> {hostName}
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-[#2F6B4F]">Points to:</span> {d.cnameTarget}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCopy(d.cnameTarget, `cname-${d.id}`)}
                                  className="p-2 hover:bg-white rounded-md text-[#11140F]/60 transition-colors shrink-0 cursor-pointer"
                                  title="Copy CNAME target"
                                >
                                  {copiedId === `cname-${d.id}` ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>

                              {/* TXT */}
                              <div className="p-3 rounded-lg bg-[#EEF0EA]/70 border border-[#11140F]/10 flex items-center justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="text-[10px] text-[#11140F]/50 uppercase font-sans font-semibold">
                                    Record 2 · Verification TXT
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-[#2F6B4F]">Type:</span> TXT
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-[#2F6B4F]">Host:</span> _dynamicqr.{hostName}
                                  </div>
                                  <div className="truncate">
                                    <span className="font-bold text-[#2F6B4F]">Value:</span> {d.verificationTxt}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCopy(d.verificationTxt, `txt-${d.id}`)}
                                  className="p-2 hover:bg-white rounded-md text-[#11140F]/60 transition-colors shrink-0 cursor-pointer"
                                  title="Copy verification TXT"
                                >
                                  {copiedId === `txt-${d.id}` ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
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
    </div>
  );
}
