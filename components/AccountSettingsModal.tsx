'use client';

import { useState, useEffect } from 'react';
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
  Sun,
  Moon,
  Laptop,
  Sliders,
  Check,
  Bell,
  Volume2,
  Layout,
  QrCode,
  Gauge,
} from 'lucide-react';
import {
  ThemeMode,
  UserExperienceSettings,
  getStoredPreferences,
  saveStoredPreferences,
  applyTheme,
} from '@/lib/theme';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy'>('preferences');
  const [actionType, setActionType] = useState<'deactivate' | 'delete'>('deactivate');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [prefSavedMsg, setPrefSavedMsg] = useState(false);

  // User experience preferences
  const [preferences, setPreferences] = useState<UserExperienceSettings>(() => getStoredPreferences());

  useEffect(() => {
    setPreferences(getStoredPreferences());
  }, []);

  const handleThemeChange = (newTheme: ThemeMode) => {
    const updated = saveStoredPreferences({ theme: newTheme });
    setPreferences(updated);
    showSavedToast();
  };

  const handleUpdatePref = (partial: Partial<UserExperienceSettings>) => {
    const updated = saveStoredPreferences(partial);
    setPreferences(updated);
    showSavedToast();
  };

  const showSavedToast = () => {
    setPrefSavedMsg(true);
    setTimeout(() => setPrefSavedMsg(false), 2000);
  };

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
      className="fixed inset-0 z-50 bg-[#11140F]/65 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 transition-colors"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#141712] rounded-2xl border border-[#11140F]/15 dark:border-white/10 shadow-2xl max-w-lg w-full overflow-hidden text-[#11140F] dark:text-[#EEF0EA] transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#11140F]/10 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] leading-tight">Account & Experience Settings</h3>
              <p className="text-[12px] text-[#11140F]/50 dark:text-white/50">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[#11140F]/40 dark:text-white/40 hover:text-[#11140F] dark:hover:text-white hover:bg-[#11140F]/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-[#181C15] px-6 pt-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`pb-2.5 px-3 text-[12.5px] font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'preferences'
                ? 'border-[#11140F] dark:border-emerald-400 text-[#11140F] dark:text-white font-semibold'
                : 'border-transparent text-[#11140F]/50 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Preferences & Theme
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 text-[12.5px] font-medium border-b-2 transition-all shrink-0 ${
              activeTab === 'profile'
                ? 'border-[#11140F] dark:border-emerald-400 text-[#11140F] dark:text-white font-semibold'
                : 'border-transparent text-[#11140F]/50 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white'
            }`}
          >
            Account Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 text-[12.5px] font-medium border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'privacy'
                ? 'border-rose-600 text-rose-600 font-semibold'
                : 'border-transparent text-[#11140F]/50 dark:text-white/50 hover:text-rose-600'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Privacy & Erasure
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: PREFERENCES & THEME */}
          {activeTab === 'preferences' && (
            <div className="space-y-5 text-[13px]">
              {/* Theme Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold tracking-wide uppercase text-[#11140F]/70 dark:text-white/70">
                    Interface Theme
                  </label>
                  {prefSavedMsg && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
                      <Check className="w-3 h-3" /> Saved
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Light */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      preferences.theme === 'light'
                        ? 'border-[#11140F] bg-white shadow-xs dark:border-white ring-1 ring-[#11140F]'
                        : 'border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-[#1A1E17] hover:border-[#11140F]/30 dark:hover:border-white/30 text-[#11140F]/70 dark:text-white/70'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[12px] font-semibold text-[#11140F] dark:text-white">Light</div>
                      <div className="text-[10px] text-[#11140F]/50 dark:text-white/50">Clean Ivory</div>
                    </div>
                  </button>

                  {/* Dark */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      preferences.theme === 'dark'
                        ? 'border-emerald-500 bg-[#161B14] shadow-xs ring-1 ring-emerald-500 text-white'
                        : 'border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-[#1A1E17] hover:border-[#11140F]/30 dark:hover:border-white/30 text-[#11140F]/70 dark:text-white/70'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#2F6B4F]/30 text-[#34D399] flex items-center justify-center border border-[#34D399]/30">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[12px] font-semibold text-[#11140F] dark:text-white">Dark</div>
                      <div className="text-[10px] text-[#11140F]/50 dark:text-white/50">Deep Obsidian</div>
                    </div>
                  </button>

                  {/* System */}
                  <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                      preferences.theme === 'system'
                        ? 'border-[#11140F] dark:border-emerald-400 bg-white dark:bg-[#161B14] shadow-xs ring-1 ring-[#11140F] dark:ring-emerald-400'
                        : 'border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-[#1A1E17] hover:border-[#11140F]/30 dark:hover:border-white/30 text-[#11140F]/70 dark:text-white/70'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[12px] font-semibold text-[#11140F] dark:text-white">System</div>
                      <div className="text-[10px] text-[#11140F]/50 dark:text-white/50">Auto Sync</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Startup & Workspace Preferences */}
              <div className="p-3.5 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-[#1A1E17] space-y-3.5">
                <div className="text-xs font-bold uppercase tracking-wide text-[#11140F]/70 dark:text-white/70 flex items-center gap-1.5">
                  <Layout className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Workspace & Navigation
                </div>

                {/* Default Landing Tab */}
                <div className="flex items-center justify-between text-[12.5px]">
                  <div>
                    <div className="font-medium text-[#11140F] dark:text-white">Default Home Tab</div>
                    <div className="text-[11px] text-[#11140F]/50 dark:text-white/50">View loaded upon opening the platform</div>
                  </div>
                  <div className="flex rounded-lg border border-[#11140F]/10 dark:border-white/15 p-0.5 bg-white dark:bg-[#11140F]">
                    <button
                      type="button"
                      onClick={() => handleUpdatePref({ defaultLanding: 'workspace' })}
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all ${
                        preferences.defaultLanding === 'workspace'
                          ? 'bg-[#11140F] text-white dark:bg-emerald-600'
                          : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
                      }`}
                    >
                      Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdatePref({ defaultLanding: 'overview' })}
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all ${
                        preferences.defaultLanding === 'overview'
                          ? 'bg-[#11140F] text-white dark:bg-emerald-600'
                          : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
                      }`}
                    >
                      Tour
                    </button>
                  </div>
                </div>

                {/* Analytics Density */}
                <div className="flex items-center justify-between text-[12.5px] pt-2 border-t border-[#11140F]/5 dark:border-white/5">
                  <div>
                    <div className="font-medium text-[#11140F] dark:text-white">Analytics Density</div>
                    <div className="text-[11px] text-[#11140F]/50 dark:text-white/50">Layout spacing for link analytics</div>
                  </div>
                  <div className="flex rounded-lg border border-[#11140F]/10 dark:border-white/15 p-0.5 bg-white dark:bg-[#11140F]">
                    <button
                      type="button"
                      onClick={() => handleUpdatePref({ analyticsDensity: 'comfortable' })}
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all ${
                        preferences.analyticsDensity === 'comfortable'
                          ? 'bg-[#11140F] text-white dark:bg-emerald-600'
                          : 'text-[#11140F]/60 dark:text-white/60'
                      }`}
                    >
                      Comfortable
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdatePref({ analyticsDensity: 'compact' })}
                      className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-all ${
                        preferences.analyticsDensity === 'compact'
                          ? 'bg-[#11140F] text-white dark:bg-emerald-600'
                          : 'text-[#11140F]/60 dark:text-white/60'
                      }`}
                    >
                      Compact
                    </button>
                  </div>
                </div>

                {/* QR Error Correction Level */}
                <div className="flex items-center justify-between text-[12.5px] pt-2 border-t border-[#11140F]/5 dark:border-white/5">
                  <div>
                    <div className="font-medium text-[#11140F] dark:text-white flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Default QR Error Correction
                    </div>
                    <div className="text-[11px] text-[#11140F]/50 dark:text-white/50">Print resilience against surface wear</div>
                  </div>
                  <select
                    value={preferences.qrPrecision}
                    onChange={(e) => handleUpdatePref({ qrPrecision: e.target.value as any })}
                    className="px-2 py-1 rounded-lg border border-[#11140F]/15 dark:border-white/20 bg-white dark:bg-[#11140F] text-[11.5px] font-medium text-[#11140F] dark:text-white outline-hidden cursor-pointer"
                  >
                    <option value="H">High (H - 30% recovery)</option>
                    <option value="Q">Quartile (Q - 25% recovery)</option>
                    <option value="M">Medium (M - 15% recovery)</option>
                  </select>
                </div>
              </div>

              {/* Toggles: Sounds & Notifications */}
              <div className="p-3.5 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-[#1A1E17] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wide text-[#11140F]/70 dark:text-white/70 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Experience & Alerts
                </div>

                {/* Sound Effects */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#11140F]/50 dark:text-white/50" />
                    <div>
                      <div className="text-[12.5px] font-medium text-[#11140F] dark:text-white">Audio Feedback</div>
                      <div className="text-[11px] text-[#11140F]/50 dark:text-white/50">Subtle click upon generating codes or copying links</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.soundEffects}
                      onChange={(e) => handleUpdatePref({ soundEffects: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-white/20 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>

                {/* Email Digests */}
                <div className="flex items-center justify-between pt-2 border-t border-[#11140F]/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#11140F]/50 dark:text-white/50" />
                    <div>
                      <div className="text-[12.5px] font-medium text-[#11140F] dark:text-white">Weekly Analytics Digest</div>
                      <div className="text-[11px] text-[#11140F]/50 dark:text-white/50">Summary of total scans, top referrers & link performance</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.emailDigests}
                      onChange={(e) => handleUpdatePref({ emailDigests: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 dark:bg-white/20 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT OVERVIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-[13px]">
              <div className="p-4 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-[#1A1E17] space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#11140F]/50 dark:text-white/50">Email Address:</span>
                  <span className="font-mono font-medium text-[#11140F] dark:text-white">{user.email}</span>
                </div>
                {user.name && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#11140F]/50 dark:text-white/50">Account Name:</span>
                    <span className="font-medium text-[#11140F] dark:text-white">{user.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-[#11140F]/50 dark:text-white/50">Current Plan:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#11140F] dark:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider">
                    {user.tier || 'free'}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 text-[12px] flex items-center justify-between">
                <span>Looking to upgrade limits or unlock custom domains?</span>
                <a
                  href="/pricing"
                  className="font-semibold text-emerald-700 dark:text-emerald-400 underline underline-offset-2 hover:opacity-80 shrink-0 ml-2"
                >
                  View Plans &rarr;
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY & ERASURE */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {successMsg ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-semibold text-[16px]">Action Completed</h4>
                  <p className="text-[13px] text-[#11140F]/60 dark:text-white/60">{successMsg}</p>
                </div>
              ) : (
                <>
                  {user.isDeactivated && (
                    <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 space-y-2.5">
                      <div className="flex items-center gap-2 font-semibold text-[13px]">
                        <RotateCcw className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                        <span>Account is Currently Deactivated</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
                        Your account was previously deactivated and your QR links are archived.
                        Reactivate now to immediately restore all your active QR redirects.
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
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F8F5] dark:bg-[#181C15] rounded-xl border border-[#11140F]/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('deactivate');
                        setConfirmText('');
                        setError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        actionType === 'deactivate'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-semibold border border-amber-300 dark:border-amber-700 shadow-xs'
                          : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
                      }`}
                    >
                      <PowerOff className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                      Deactivate Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('delete');
                        setConfirmText('');
                        setError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        actionType === 'delete'
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 font-semibold border border-rose-300 dark:border-rose-700 shadow-xs'
                          : 'text-[#11140F]/60 dark:text-white/60 hover:text-rose-700 dark:hover:text-rose-400'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                      Delete & Wipe All
                    </button>
                  </div>

                  {/* Deactivate Account info */}
                  {actionType === 'deactivate' && (
                    <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-[13px] text-amber-900 dark:text-amber-300">
                        <PowerOff className="w-4 h-4 shrink-0" />
                        <span>Deactivate Account (Soft Anonymization)</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                        Deactivating removes your personal login credentials and decouples your account:
                      </p>
                      <ul className="list-disc pl-5 text-[11.5px] text-amber-900/80 dark:text-amber-200/80 space-y-0.5">
                        <li>Your QR links are archived and detached</li>
                        <li>Personal email, password hash, and profile data are erased</li>
                        <li>Anonymous historical scan counts are preserved for platform health</li>
                      </ul>
                      <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                        <label className="block text-[12px] font-medium text-amber-950 dark:text-amber-200">
                          Type <strong className="text-amber-800 dark:text-amber-300 font-mono">DEACTIVATE</strong> to confirm:
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="Type DEACTIVATE"
                          className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 text-[13px] font-mono bg-white dark:bg-[#11140F] text-[#11140F] dark:text-white focus:outline-hidden focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                        />
                      </div>
                    </div>
                  )}

                  {/* Delete & Wipe Everything info */}
                  {actionType === 'delete' && (
                    <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200 space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-[13px] text-rose-800 dark:text-rose-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Permanent Account & Data Erasure</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-rose-900/80 dark:text-rose-200/80">
                        Irreversible erasure destroys <strong>ALL</strong> associated records:
                      </p>
                      <ul className="list-disc pl-5 text-[11.5px] text-rose-900/80 dark:text-rose-200/80 space-y-0.5">
                        <li>All QR codes, scan logs, rules, and micro-app items wiped permanently</li>
                        <li>All user credentials and profile records purged</li>
                      </ul>
                      <div className="space-y-2 pt-2 border-t border-rose-200 dark:border-rose-800">
                        <label className="block text-[12px] font-medium text-rose-950 dark:text-rose-200">
                          Type <strong className="text-rose-600 dark:text-rose-400 font-mono">DELETE</strong> to confirm:
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="Type DELETE"
                          className="w-full px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-700 text-[13px] font-mono bg-white dark:bg-[#11140F] text-[#11140F] dark:text-white focus:outline-hidden focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-[12px] text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-[12.5px] font-medium text-[#11140F] dark:text-white hover:bg-[#F7F8F5] dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    {actionType === 'deactivate' ? (
                      <button
                        type="button"
                        onClick={handleDeactivate}
                        disabled={confirmText.trim().toUpperCase() !== 'DEACTIVATE' || loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[12.5px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
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
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[12.5px] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs cursor-pointer"
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
