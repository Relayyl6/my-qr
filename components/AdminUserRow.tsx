'use client';

import { useState } from 'react';
import {
  adminUpdateUserTier,
  adminResetAiCredit,
  adminSetUserAiLimit,
  adminInspectUserLinks,
} from '@/app/admin/actions';
import {
  Shield,
  RefreshCw,
  CheckCircle,
  Eye,
  DollarSign,
  X,
  ExternalLink,
  QrCode,
  Layers,
} from 'lucide-react';

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  tier: string;
  createdAt: Date;
  stripeCustomerId: string | null;
  _count: {
    links: number;
  };
}

export default function AdminUserRow({ user, isSelf }: { user: UserRecord; isSelf: boolean }) {
  const [currentTier, setCurrentTier] = useState(user.tier);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectingLinks, setInspectingLinks] = useState<any[] | null>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const handleTierChange = async (newTier: string) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await adminUpdateUserTier(user.id, newTier);
      setCurrentTier(newTier);
      setStatusMsg(`Set to ${newTier.toUpperCase()}`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg('Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCredit = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await adminResetAiCredit(user.id);
      setStatusMsg('Credit reset to $0');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg('Failed to reset');
    } finally {
      setLoading(false);
    }
  };

  const handleSetAiLimit = async (limit: number) => {
    setLoading(true);
    setStatusMsg(null);
    try {
      await adminSetUserAiLimit(user.id, limit);
      setStatusMsg(`AI budget: $${limit}`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      setStatusMsg('Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInspect = async () => {
    setInspectModalOpen(true);
    if (!inspectingLinks) {
      setLoadingInspect(true);
      try {
        const links = await adminInspectUserLinks(user.id);
        setInspectingLinks(links);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingInspect(false);
      }
    }
  };

  return (
    <>
      <tr className="border-b border-[#11140F]/5 hover:bg-[#F7F8F5]/50 transition-colors text-[13px]">
        <td className="py-3.5 px-4">
          <div className="font-medium text-[#11140F] flex items-center gap-1.5">
            {user.email}
            {isSelf && (
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10.5px] font-mono font-semibold">
                YOU (SUPER ADMIN)
              </span>
            )}
          </div>
          {user.name && <div className="text-[12px] text-[#11140F]/50">{user.name}</div>}
        </td>

        <td className="py-3.5 px-4 font-mono text-[12px] text-[#11140F]/70">
          {new Date(user.createdAt).toLocaleDateString()}
        </td>

        <td className="py-3.5 px-4">
          <select
            value={currentTier}
            disabled={loading || isSelf}
            onChange={(e) => handleTierChange(e.target.value)}
            className={`rounded-lg border px-2.5 py-1 text-[12px] font-semibold outline-none transition-all cursor-pointer ${
              currentTier === 'ultra'
                ? 'bg-purple-50 border-purple-200 text-purple-800'
                : currentTier === 'plus'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : currentTier === 'pro'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : currentTier === 'enterprise'
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                : 'bg-gray-50 border-gray-200 text-gray-700'
            }`}
          >
            <option value="free">FREE (5 links)</option>
            <option value="pro">PRO ($5/mo)</option>
            <option value="plus">PLUS ($12/mo)</option>
            <option value="ultra">ULTRA ($29/mo)</option>
            <option value="enterprise">ENTERPRISE (Sovereign Unlimited)</option>
          </select>
        </td>

        <td className="py-3.5 px-4">
          <button
            type="button"
            onClick={handleOpenInspect}
            className="font-mono font-semibold text-[#11140F] hover:text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
            title="Inspect links owned by this customer"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
            <span>{user._count.links} links</span>
          </button>
        </td>

        <td className="py-3.5 px-4 font-mono text-[11px] text-[#11140F]/50">
          {user.stripeCustomerId ? (
            <span className="text-emerald-700 font-medium">✓ Subscribed</span>
          ) : (
            <span>Manual / Admin</span>
          )}
        </td>

        <td className="py-3.5 px-4 text-right">
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            {statusMsg && (
              <span className="text-[11px] text-emerald-700 font-medium animate-pulse mr-1">
                {statusMsg}
              </span>
            )}

            <button
              onClick={handleOpenInspect}
              className="rounded-lg border border-[#11140F]/15 px-2 py-1 text-[11px] font-medium text-[#11140F]/70 hover:text-[#11140F] hover:bg-white transition-all flex items-center gap-1 cursor-pointer"
              title="Inspect customer's QR link fleet"
            >
              <Eye className="w-3 h-3 text-blue-600" />
              Inspect
            </button>

            <button
              onClick={handleResetCredit}
              disabled={loading}
              title="Reset monthly AI compute usage to zero"
              className="rounded-lg border border-[#11140F]/15 px-2 py-1 text-[11px] font-medium text-[#11140F]/70 hover:text-[#11140F] hover:bg-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Reset AI
            </button>

            <button
              onClick={() => handleSetAiLimit(50)}
              disabled={loading}
              title="Grant $50 monthly AI budget"
              className="rounded-lg border border-purple-200 bg-purple-50 px-2 py-1 text-[11px] font-medium text-purple-800 hover:bg-purple-100 transition-all flex items-center gap-0.5 cursor-pointer"
            >
              <DollarSign className="w-3 h-3" />
              $50 Budget
            </button>
          </div>
        </td>
      </tr>

      {/* Inspect Customer Links Modal */}
      {inspectModalOpen && (
        <tr>
          <td colSpan={6} className="p-0">
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-[#11140F]/15 flex flex-col p-5 space-y-4">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#11140F]">
                        Sovereign Link Inspector: <span className="font-mono text-emerald-700">{user.email}</span>
                      </h3>
                      <p className="text-[12px] text-[#11140F]/50">
                        {user._count.links} QR destinations deployed in this account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectModalOpen(false)}
                    className="p-1 rounded-lg text-[#11140F]/40 hover:text-[#11140F] hover:bg-[#11140F]/5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 space-y-2">
                  {loadingInspect && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[#11140F]/50">
                      <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                      <p className="text-[13px]">Querying customer links from database…</p>
                    </div>
                  )}

                  {!loadingInspect && inspectingLinks && inspectingLinks.length === 0 && (
                    <div className="py-10 text-center text-[#11140F]/40 text-[13px]">
                      This customer has not created any dynamic QR links yet.
                    </div>
                  )}

                  {!loadingInspect &&
                    inspectingLinks &&
                    inspectingLinks.map((link) => (
                      <div
                        key={link.id}
                        className="rounded-xl border border-[#11140F]/10 bg-[#11140F]/[0.02] p-3 flex items-center justify-between gap-3 text-[12.5px]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-emerald-800">
                              /id/{link.shortCode}
                            </span>
                            {link.label && (
                              <span className="text-[#11140F]/70 truncate">
                                ({link.label})
                              </span>
                            )}
                            {link.isArchived && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px]">
                                Archived
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-[#11140F]/50 truncate block mt-0.5">
                            → {link.destinationUrl}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-semibold text-[#11140F] block">
                            {link.scanCount} scans
                          </span>
                          <span className="text-[10.5px] text-[#11140F]/40 font-mono">
                            {link.lastScannedAt
                              ? `Last: ${new Date(link.lastScannedAt).toLocaleDateString()}`
                              : 'No scans yet'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="shrink-0 flex justify-end pt-2 border-t border-[#11140F]/10">
                  <button
                    onClick={() => setInspectModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#11140F] text-white text-[12px] font-medium hover:bg-[#2A2E25]"
                  >
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
