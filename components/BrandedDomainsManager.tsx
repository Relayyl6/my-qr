'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { addCustomDomain, verifyCustomDomain, deleteCustomDomain, DomainActionState } from '@/lib/domains/actions';
import { Globe, Plus, CheckCircle2, Clock, Trash2, RefreshCw, AlertCircle, Sparkles, ChevronRight, Copy, Check } from 'lucide-react';

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
      className="px-4 py-2.5 rounded-xl bg-[#11140F] text-white text-[13px] font-medium hover:bg-[#2A2E25] transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
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
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [state, formAction] = useFormState(addCustomDomain, {});

  const isEligible = isAdmin || ['plus', 'ultra'].includes(userTier.toLowerCase());

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
        setActionMsg(res.message || 'Domain verified successfully!');
      } else {
        setActionMsg(res.message || 'Verification could not be confirmed.');
      }
    } catch (err: any) {
      setActionMsg('Verification failed: ' + err.message);
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
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#11140F]/5 text-[#11140F]/70 uppercase tracking-wider">
                Plus & Ultra
              </span>
            </div>
            <p className="text-[13px] text-[#11140F]/60">
              Serve QR codes from your own branded domain (e.g. <span className="font-mono text-[#2F6B4F]">qr.yourcompany.com</span>).
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
                  Upgrade your subscription to connect custom CNAME domains and present your brand on all physical materials.
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
              {/* Add Domain Form */}
              <form action={formAction} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#11140F]/40 font-mono">
                      https://
                    </span>
                    <input
                      type="text"
                      name="domain"
                      required
                      placeholder="qr.yourbrand.com"
                      className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-[#11140F]/15 text-[13.5px] outline-none focus:border-[#11140F] transition-colors"
                    />
                  </div>
                  <SubmitDomainBtn />
                </div>
                {state.message && (
                  <p className={`text-[12px] font-medium ${state.success ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {state.message}
                  </p>
                )}
                {actionMsg && (
                  <p className="text-[12px] font-medium text-emerald-700">{actionMsg}</p>
                )}
              </form>

              {/* Connected Domains List */}
              {domains.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#11140F]/15 p-6 text-center text-[13px] text-[#11140F]/50">
                  No custom domains connected yet. Add your subdomain above to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {domains.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-2xl border border-[#11140F]/10 bg-[#EEF0EA]/40 p-4 sm:p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-semibold text-[14px] text-[#11140F]">{d.domain}</span>
                          {d.status === 'verified' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active & Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-medium">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending DNS
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleVerify(d.id)}
                            disabled={verifyingId === d.id}
                            className="px-3 py-1.5 rounded-lg border border-[#11140F]/15 bg-white text-[12px] font-medium text-[#11140F] hover:bg-white/80 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${verifyingId === d.id ? 'animate-spin' : ''}`} />
                            {verifyingId === d.id ? 'Checking…' : 'Verify DNS'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(d.id)}
                            className="p-1.5 rounded-lg text-[#11140F]/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete domain"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* DNS Instructions Block */}
                      {d.status !== 'verified' && (
                        <div className="rounded-xl bg-white border border-[#11140F]/10 p-3.5 space-y-3 text-[12px]">
                          <div className="font-medium text-[#11140F]/70">Required DNS Records in your domain registrar:</div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-[11px]">
                            {/* CNAME */}
                            <div className="p-2.5 rounded-lg bg-[#EEF0EA]/70 border border-[#11140F]/10 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-[#2F6B4F]">CNAME:</span> {d.domain} &rarr; {d.cnameTarget}
                              </div>
                              <button
                                onClick={() => handleCopy(d.cnameTarget, `cname-${d.id}`)}
                                className="p-1 hover:text-[#11140F] text-[#11140F]/50"
                              >
                                {copiedId === `cname-${d.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {/* TXT */}
                            <div className="p-2.5 rounded-lg bg-[#EEF0EA]/70 border border-[#11140F]/10 flex items-center justify-between">
                              <div className="truncate mr-2">
                                <span className="font-bold text-[#2F6B4F]">TXT:</span> _dynamicqr.{d.domain.split('.')[0]} &rarr; {d.verificationTxt}
                              </div>
                              <button
                                onClick={() => handleCopy(d.verificationTxt, `txt-${d.id}`)}
                                className="p-1 hover:text-[#11140F] text-[#11140F]/50 shrink-0"
                              >
                                {copiedId === `txt-${d.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
