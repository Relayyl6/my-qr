'use client';

import { useState } from 'react';
import { deleteSelfAccount } from '@/app/auth-actions';
import {
  User,
  Shield,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
  };
  onClose: () => void;
}

export default function AccountSettingsModal({ user, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
        setSuccess(true);
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
            Privacy & Data Erasure
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
              {success ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-semibold text-[16px]">Account Permanently Deleted</h4>
                  <p className="text-[13px] text-[#11140F]/60">
                    All personal data and credentials have been erased. Redirecting...
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-950 space-y-2">
                    <div className="flex items-center gap-2 text-rose-800 font-semibold text-[13px]">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Permanent Account & Data Erasure</span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-rose-900/80">
                      Pursuant to GDPR Article 17 and CCPA Right to Erasure, deleting your account will permanently wipe:
                    </p>
                    <ul className="list-disc pl-5 text-[11.5px] text-rose-900/80 space-y-0.5">
                      <li>Your email, password hash, and profile data</li>
                      <li>All custom domains and SSL target bindings</li>
                      <li>Custom QR artworks, prompts, and mobile landing pages</li>
                      <li>Active conditional redirect rules</li>
                    </ul>
                    <p className="text-[11px] text-rose-900/60 pt-1 border-t border-rose-200/60">
                      * Aggregated, non-personal platform metrics (such as past redirect counts) are decoupled and anonymized so that historical edge health benchmarks remain accurate.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="block text-[12.5px] font-medium text-[#11140F]">
                      To confirm permanent deletion, type <strong className="text-rose-600 font-mono">DELETE</strong> below:
                    </label>
                    <input
                      type="text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#11140F]/20 text-[13px] font-mono focus:outline-hidden focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                    />
                  </div>

                  {error && (
                    <p className="text-[12px] text-rose-600 font-medium">{error}</p>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl border border-[#11140F]/15 text-[12.5px] font-medium text-[#11140F] hover:bg-[#F7F8F5] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={confirmText.trim().toUpperCase() !== 'DELETE' || loading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-[12.5px] font-medium hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Erasing Data...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Permanently Delete Account</span>
                        </>
                      )}
                    </button>
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
