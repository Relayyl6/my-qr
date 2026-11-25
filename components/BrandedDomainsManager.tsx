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
import HostingConnectionHub from './HostingConnectionHub';

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
      className="px-5 py-2.5 rounded-2xl bg-[#34D399] hover:bg-[#34D399]/90 active:scale-[0.99] text-[#09110D] text-[13px] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
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
    <div className="rounded-3xl border border-[#11140F]/10 dark:border-white/[0.08] bg-white dark:bg-[#101211] p-5 sm:p-7 shadow-xl space-y-6 text-[#11140F] dark:text-white transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[15px] text-[#11140F] dark:text-white">Custom Branded Domains</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[#11140F]/70 dark:text-[#34D399] font-semibold uppercase tracking-wider">
              Plus &amp; Ultra
            </span>
          </div>
          <p className="text-[12.5px] text-[#11140F]/60 dark:text-white/55 mt-0.5">
            Serve QR codes and shortlinks from your own custom hostname (e.g.{' '}
            <span className="font-mono text-[#2F6B4F] dark:text-[#34D399]">qr.yourcompany.com</span>).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-[12.5px] font-semibold text-[#11140F] dark:text-white hover:text-[#34D399] transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer px-3.5 py-1.5 rounded-full border border-[#11140F]/12 dark:border-white/12 bg-black/[0.02] dark:bg-white/[0.04]"
        >
          <span>{isOpen ? 'Collapse' : `Manage (${domains.length})`}</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6 pt-4 border-t border-[#11140F]/8 dark:border-white/[0.08]">
          {!isEligible ? (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[13px] space-y-1.5">
                <p className="font-semibold text-[#11140F] dark:text-white">Branded domains require a Plus or Ultra plan.</p>
                <p className="text-[#11140F]/70 dark:text-white/65 text-xs">
                  Upgrade your plan to connect custom CNAME hostnames and present your brand on every QR link.
                </p>
                <div className="pt-1">
                  <a
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#34D399] text-[#09110D] text-xs font-bold hover:opacity-90"
                  >
                    <span>Upgrade to Plus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Add Domain Form First (Action-First UX) */}
              <form action={formAction} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-[13px] font-semibold text-[#11140F] dark:text-white">
                    Connect a domain you already own
                  </label>
                  <a
                    href="#workspace?section=namelaunch"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.location.hash = 'workspace?section=namelaunch';
                        window.location.search = '?section=namelaunch';
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#2F6B4F] dark:text-[#34D399] hover:underline"
                  >
                    <span>Need a domain? Register from ₦7,500/yr</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1 w-full flex items-center rounded-2xl border border-[#11140F]/15 dark:border-white/15 bg-[#F7F8F5] dark:bg-black/40 focus-within:border-[#34D399] transition-all overflow-hidden">
                    <span className="px-3.5 py-2.5 text-[13px] text-[#11140F]/50 dark:text-white/50 font-mono select-none bg-black/[0.03] dark:bg-white/[0.04] border-r border-[#11140F]/10 dark:border-white/10 shrink-0 font-medium">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-[#11140F]/50 dark:text-white/45">
                    Examples:
                  </span>
                  {['qr.acme.com', 'go.brand.io', 'link.mycompany.org'].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setDomainInput(example)}
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#11140F]/70 dark:text-white/75 hover:text-[#34D399] transition-colors cursor-pointer"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </form>

              {/* Concise 3-Step DNS Overview Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-black/[0.06] dark:bg-white/10 text-[#2F6B4F] dark:text-[#34D399] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    1
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#11140F] dark:text-white">Enter Subdomain</div>
                    <p className="text-[11px] text-[#11140F]/60 dark:text-white/55 mt-0.5 leading-relaxed">
                      Add a subdomain like <span className="font-mono">qr.yourbrand.com</span> above.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-black/[0.06] dark:bg-white/10 text-[#2F6B4F] dark:text-[#34D399] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    2
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#11140F] dark:text-white">Add DNS Records</div>
                    <p className="text-[11px] text-[#11140F]/60 dark:text-white/55 mt-0.5 leading-relaxed">
                      Paste the generated <span className="font-mono">CNAME</span> and <span className="font-mono">TXT</span> records at your registrar.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-black/[0.06] dark:bg-white/10 text-[#2F6B4F] dark:text-[#34D399] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                    3
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#11140F] dark:text-white">Verify &amp; Route</div>
                    <p className="text-[11px] text-[#11140F]/60 dark:text-white/55 mt-0.5 leading-relaxed">
                      Click <strong>Verify DNS</strong> once propagated to serve QR links from your brand.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feedback Alert Banner */}
              {actionMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-[12.5px] font-medium flex items-center gap-2.5 ${
                    actionMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-[#2F6B4F] dark:text-[#34D399] border border-emerald-500/25'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                  }`}
                >
                  {actionMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>{actionMsg.text}</span>
                </div>
              )}

              {/* Connected Domains List */}
              {domains.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#11140F]/15 dark:border-white/12 p-6 text-center text-[12.5px] text-[#11140F]/60 dark:text-white/55 bg-[#F7F8F5] dark:bg-white/[0.02]">
                  No custom domains connected yet. Enter your subdomain above to generate DNS records.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#11140F]/65 dark:text-white/65">
                      Connected Domains
                    </span>
                    <span className="text-[10.5px] font-mono text-[#11140F]/45 dark:text-white/40">
                      {domains.length} {domains.length === 1 ? 'Domain' : 'Domains'}
                    </span>
                  </div>

                  {domains.map((d) => {
                    const hostName = d.domain.split('.')[0] || 'qr';
                    return (
                      <div
                        key={d.id}
                        className="rounded-2xl border border-[#11140F]/10 dark:border-white/[0.08] bg-[#F7F8F5] dark:bg-white/[0.03] p-4 sm:p-5 space-y-4"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-[14.5px] text-[#11140F] dark:text-white">
                              {d.domain}
                            </span>
                            {d.status === 'verified' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-[#2F6B4F] dark:text-[#34D399] text-[11px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
                                <Clock className="w-3 h-3" />
                                Pending DNS
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
                                  className="px-3.5 py-1.5 rounded-xl bg-[#34D399] hover:bg-[#34D399]/90 text-[#09110D] text-[12px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                  <RefreshCw className={`w-3 h-3 ${verifyingId === d.id ? 'animate-spin' : ''}`} />
                                  {verifyingId === d.id ? 'Checking DNS…' : 'Verify DNS'}
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleForceVerify(d.id)}
                                    disabled={verifyingId === d.id}
                                    title="Admin override verification"
                                    className="px-2.5 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-[11.5px] font-medium text-[#11140F]/70 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Zap className="w-3 h-3 text-[#34D399]" />
                                    Admin Verify
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[11.5px] text-[#2F6B4F] dark:text-[#34D399] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Serving QR codes live
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(d.id, d.domain)}
                              className="p-1.5 rounded-lg text-[#11140F]/40 dark:text-white/40 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

              {/* Point Domain to Vercel, Render, or Other Cloud Hosts */}
              <div className="pt-2">
                <HostingConnectionHub activeDomainName={domains[0]?.domain || 'yemuel.xyz'} />
              </div>
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
