'use client';

import { useState } from 'react';
import { deactivateSelfAccount, reactivateSelfAccount, deleteSelfAccount } from '@/app/auth-actions';
import {
  User,
  Shield,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
  PowerOff,
  RotateCcw,
} from 'lucide-react';

interface Props {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
    isDeactivated?: boolean;
  };
  onClose: () => void;
}

export default function AccountSettingsModal({ user, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');
  const [actionType, setActionType] = useState<'deactivate' | 'delete'>('deactivate');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDeactivate = async () => {
    if (confirmText.trim().toUpperCase() !== 'DEACTIVATE') {
      setError('Please type DEACTIVATE to confirm.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await deactivateSelfAccount(confirmText);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccessMsg('Account deactivated. Links decoupled & archived; platform metrics preserved. Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reactivateSelfAccount();
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccessMsg('Account successfully reactivated! Restoring all your QR links...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Please type DELETE to confirm.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await deleteSelfAccount(confirmText);
      if (res.error) {
        setError(res.error);
        setLoading(false);
      } else {
        setSuccessMsg('Account and all associated links, scans, and data permanently wiped. Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#11140F]/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-[#11140F]/15 shadow-2xl max-w-lg w-full overflow-hidden text-[#11140F]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#11140F]/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#11140F] text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px]">Account & Privacy Settings</h3>
              <p className="text-[12px] text-[#11140F]/50">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-[#11140F]/40 hover:text-[#11140F] hover:bg-[#11140F]/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-[#11140F]/10 bg-[#F7F8F5] px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-[12.5px] font-medium border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-[#11140F] text-[#11140F] font-semibold'
                : 'border-transparent text-[#11140F]/50 hover:text-[#11140F]'
            }`}
          >
            Account Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 text-[12.5px] font-medium border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-[#11140F]/50 hover:text-rose-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Privacy, Deactivation & Erasure
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4 text-[13px]">
              <div className="p-3.5 rounded-xl border border-[#11140F]/10 bg-[#F7F8F5] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#11140F]/50">Email Address:</span>
                  <span className="font-mono font-medium">{user.email}</span>
                </div>
                {user.name && (
                  <div className="flex justify-between">
                    <span className="text-[#11140F]/50">Name:</span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#11140F]/50">Current Plan:</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#11140F] text-white text-[11px] font-bold uppercase tracking-wider">
                    {user.tier || 'free'}
                  </span>
                </div>
              </div>

              <div className="text-[12px] text-[#11140F]/60">
                To upgrade, downgrade, or view feature matrices, visit the{' '}
                <a href="/pricing" className="text-emerald-700 font-semibold underline">
                  Pricing page
                </a>
                .
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {successMsg ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-semibold text-[16px]">Action Completed</h4>
                  <p className="text-[13px] text-[#11140F]/60">{successMsg}</p>
                </div>
              ) : (
                <>
                  {user.isDeactivated && (
                    <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-950 space-y-2.5">
                      <div className="flex items-center gap-2 text-emerald-900 font-semibold text-[13px]">
                        <RotateCcw className="w-4 h-4 shrink-0 text-emerald-700" />
                        <span>Account is Currently Deactivated</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-emerald-900/80">
                        Your account was previously deactivated and your QR links are currently archived and paused.
                        Click below to immediately reactivate your account and restore all your QR links.
                      </p>
                      <button
                        type="button"
                        onClick={handleReactivate}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 text-white text-[12.5px] font-medium hover:bg-emerald-800 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Reactivating...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reactivate Account Now</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Selector between Deactivate and Delete */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F8F5] rounded-xl border border-[#11140F]/10">
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('deactivate');
                        setConfirmText('');
                        setError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                        actionType === 'deactivate'
                          ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-300 shadow-xs'
                          : 'text-[#11140F]/60 hover:text-[#11140F]'
                      }`}
                    >
                      <PowerOff className="w-3.5 h-3.5 text-amber-700" />
                      Deactivate Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('delete');
                        setConfirmText('');
                        setError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 ${
                        actionType === 'delete'
                          ? 'bg-rose-100 text-rose-900 font-semibold border border-rose-300 shadow-xs'
                          : 'text-[#11140F]/60 hover:text-rose-700'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      Delete & Wipe All
                    </button>
                  </div>

                  {/* Deactivate Account info */}
                  {actionType === 'deactivate' && (
                    <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-950 space-y-2">
                      <div className="flex items-center gap-2 text-amber-900 font-semibold text-[13px]">
                        <PowerOff className="w-4 h-4 shrink-0 text-amber-700" />
                        <span>Deactivate Account (Soft Anonymization)</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-amber-900/80">
                        Deactivating removes your personal login credentials and decouples your account:
                      </p>
                      <ul className="list-disc pl-5 text-[11.5px] text-amber-900/80 space-y-0.5">
                        <li>Your QR links are archived and detached (<code>userId</code> set to null)</li>
                        <li>Your personal email, password hash, and profile data are erased</li>
                        <li>Anonymous historical scan counts are preserved for platform health telemetry</li>
                        <li>Any active subscription is immediately cancelled</li>
                      </ul>
                      <div className="space-y-2 pt-2 border-t border-amber-200">
                        <label className="block text-[12px] font-medium text-amber-950">
                          Type <strong className="text-amber-800 font-mono">DEACTIVATE</strong> to confirm:
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="Type DEACTIVATE"
                          className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-[13px] font-mono bg-white focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Delete & Wipe Everything info */}
                  {actionType === 'delete' && (
                    <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-950 space-y-2">
                      <div className="flex items-center gap-2 text-rose-800 font-semibold text-[13px]">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>Permanent Account & Data Erasure (Wipe Everything)</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-rose-900/80">
                        Wiping your account is irreversible and destroys <strong>EVERY SINGLE THING</strong>:
                      </p>
                      <ul className="list-disc pl-5 text-[11.5px] text-rose-900/80 space-y-0.5">
                        <li><strong>All QR Codes:</strong> Permanently deleted from the database</li>
                        <li><strong>All Scan Events:</strong> Completely wiped (zero history retained)</li>
                        <li><strong>All Routing Rules & Landing Pages:</strong> Permanently erased</li>
                        <li><strong>All Custom Domains & AI Records:</strong> Permanently erased</li>
                        <li><strong>User Profile & Login:</strong> Permanently erased</li>
                      </ul>
                      <div className="space-y-2 pt-2 border-t border-rose-200">
                        <label className="block text-[12px] font-medium text-rose-950">
                          Type <strong className="text-rose-600 font-mono">DELETE</strong> to confirm:
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="Type DELETE"
                          className="w-full px-3.5 py-2 rounded-xl border border-rose-300 text-[13px] font-mono bg-white focus:outline-hidden focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-[12px] text-rose-600 font-medium">{error}</p>}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl border border-[#11140F]/15 text-[12.5px] font-medium text-[#11140F] hover:bg-[#F7F8F5] transition-colors"
                    >
                      Cancel
                    </button>
                    {actionType === 'deactivate' ? (
                      <button
                        type="button"
                        onClick={handleDeactivate}
                        disabled={confirmText.trim().toUpperCase() !== 'DEACTIVATE' || loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-[12.5px] font-medium hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Deactivating...</span>
                          </>
                        ) : (
                          <>
                            <PowerOff className="w-3.5 h-3.5" />
                            <span>Deactivate Account</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={confirmText.trim().toUpperCase() !== 'DELETE' || loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-[12.5px] font-medium hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Wiping Everything...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Permanently Delete & Wipe All</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
