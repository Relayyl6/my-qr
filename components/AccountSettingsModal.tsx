'use client';

import { useState, useEffect } from 'react';
import {
  deactivateSelfAccount,
  reactivateSelfAccount,
  deleteSelfAccount,
  updateUserProfileAvatar,
  getUserProfileAvatar,
} from '@/app/auth-actions';
import ImageUploadField from './ImageUploadField';
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
} from 'lucide-react';
import {
  ThemeMode,
  UserExperienceSettings,
  getStoredPreferences,
  saveStoredPreferences,
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
  const [activeTab, setActiveTab] = useState<'preferences' | 'profile' | 'privacy'>('preferences');
  const [actionType, setActionType] = useState<'deactivate' | 'delete'>('deactivate');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [prefSavedMsg, setPrefSavedMsg] = useState(false);

  const [preferences, setPreferences] = useState<UserExperienceSettings>(() => getStoredPreferences());
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [avatarMsg, setAvatarMsg] = useState<string | null>(null);

  useEffect(() => {
    setPreferences(getStoredPreferences());
    const cached = typeof window !== 'undefined' ? localStorage.getItem('dynamicqr_user_avatar') : null;
    if (cached) setAvatarUrl(cached);

    getUserProfileAvatar().then((url) => {
      if (url) {
        setAvatarUrl(url);
        if (typeof window !== 'undefined') localStorage.setItem('dynamicqr_user_avatar', url);
      }
    });
  }, []);

  const handleAvatarChange = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    setAvatarMsg(null);
    try {
      await updateUserProfileAvatar(newUrl);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dynamicqr_user_avatar', newUrl);
        window.dispatchEvent(new CustomEvent('dynamicqr-avatar-change', { detail: { avatarUrl: newUrl } }));
      }
      setAvatarMsg('Saved');
      setTimeout(() => setAvatarMsg(null), 2500);
    } catch {
      setAvatarMsg('Failed to save');
    }
  };

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
    setTimeout(() => setPrefSavedMsg(false), 1800);
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
        setSuccessMsg('Your account has been deactivated. Redirecting…');
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
        setSuccessMsg('Account reactivated. Restoring your workspace…');
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
        setSuccessMsg('Your account and data have been permanently removed. Redirecting…');
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#111312] rounded-2xl border border-[#11140F]/12 dark:border-white/12 shadow-2xl max-w-lg w-full overflow-hidden text-[#11140F] dark:text-[#EEF0EA]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#11140F]/8 dark:border-white/8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#11140F] dark:bg-white/15 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[14.5px] leading-tight text-[#11140F] dark:text-white truncate">
                {user.name || 'Account Settings'}
              </h3>
              <p className="text-[12px] text-[#11140F]/55 dark:text-white/55 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {prefSavedMsg && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="p-1.5 rounded-lg text-[#11140F]/45 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Balanced Tab Bar */}
        <div className="flex gap-1 border-b border-[#11140F]/8 dark:border-white/8 px-6 pt-2">
          {[
            { id: 'preferences', label: 'Preferences', icon: Sliders },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'privacy', label: 'Privacy', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 px-3 text-[12.5px] font-medium border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? tab.id === 'privacy'
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400 font-semibold'
                      : 'border-[#11140F] dark:border-white text-[#11140F] dark:text-white font-semibold'
                    : 'border-transparent text-[#11140F]/50 dark:text-white/50 hover:text-[#11140F] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-80" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {/* TAB 1: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="divide-y divide-[#11140F]/8 dark:divide-white/8 text-[13px]">
              {/* Appearance Row */}
              <div className="pb-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[#11140F] dark:text-white">Appearance</div>
                    <div className="text-[11.5px] text-[#11140F]/50 dark:text-white/50">
                      Choose how DynamicQR looks on your device
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F4F5F1] dark:bg-white/[0.04] border border-[#11140F]/8 dark:border-white/8">
                  {(
                    [
                      { id: 'light', label: 'Light', icon: Sun },
                      { id: 'dark', label: 'Dark', icon: Moon },
                      { id: 'system', label: 'System', icon: Laptop },
                    ] as const
                  ).map((mode) => {
                    const Icon = mode.icon;
                    const active = preferences.theme === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleThemeChange(mode.id)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-[#1E221E] text-[#11140F] dark:text-white shadow-xs font-semibold'
                            : 'text-[#11140F]/60 dark:text-white/55 hover:text-[#11140F] dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 opacity-80" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Home Tab */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-[#11140F] dark:text-white">Default Home View</div>
                  <div className="text-[11.5px] text-[#11140F]/50 dark:text-white/50">
                    Starting screen when opening the app
                  </div>
                </div>
                <div className="flex rounded-lg border border-[#11140F]/10 dark:border-white/10 p-0.5 bg-[#F4F5F1] dark:bg-white/[0.04] shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdatePref({ defaultLanding: 'workspace' })}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer ${
                      preferences.defaultLanding === 'workspace'
                        ? 'bg-white dark:bg-[#1E221E] text-[#11140F] dark:text-white shadow-2xs font-semibold'
                        : 'text-[#11140F]/55 dark:text-white/55'
                    }`}
                  >
                    Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePref({ defaultLanding: 'overview' })}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer ${
                      preferences.defaultLanding === 'overview'
                        ? 'bg-white dark:bg-[#1E221E] text-[#11140F] dark:text-white shadow-2xs font-semibold'
                        : 'text-[#11140F]/55 dark:text-white/55'
                    }`}
                  >
                    Tour
                  </button>
                </div>
              </div>

              {/* Analytics Density */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-[#11140F] dark:text-white">Interface Density</div>
                  <div className="text-[11.5px] text-[#11140F]/50 dark:text-white/50">
                    Spacing for tables and cards
                  </div>
                </div>
                <div className="flex rounded-lg border border-[#11140F]/10 dark:border-white/10 p-0.5 bg-[#F4F5F1] dark:bg-white/[0.04] shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdatePref({ analyticsDensity: 'comfortable' })}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer ${
                      preferences.analyticsDensity === 'comfortable'
                        ? 'bg-white dark:bg-[#1E221E] text-[#11140F] dark:text-white shadow-2xs font-semibold'
                        : 'text-[#11140F]/55 dark:text-white/55'
                    }`}
                  >
                    Comfortable
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePref({ analyticsDensity: 'compact' })}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors cursor-pointer ${
                      preferences.analyticsDensity === 'compact'
                        ? 'bg-white dark:bg-[#1E221E] text-[#11140F] dark:text-white shadow-2xs font-semibold'
                        : 'text-[#11140F]/55 dark:text-white/55'
                    }`}
                  >
                    Compact
                  </button>
                </div>
              </div>

              {/* QR Error Correction */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-[#11140F] dark:text-white">Default QR Precision</div>
                  <div className="text-[11.5px] text-[#11140F]/50 dark:text-white/50">
                    Error correction resilience for printed codes
                  </div>
                </div>
                <select
                  value={preferences.qrPrecision}
                  onChange={(e) => handleUpdatePref({ qrPrecision: e.target.value as any })}
                  className="px-2.5 py-1.5 rounded-lg border border-[#11140F]/12 dark:border-white/12 bg-white dark:bg-[#1A1C1B] text-[12px] font-medium text-[#11140F] dark:text-white outline-hidden cursor-pointer shrink-0"
                >
                  <option value="H">High (30%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="M">Medium (15%)</option>
                </select>
              </div>

              {/* Audio Feedback */}
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-[#11140F] dark:text-white">Sound Effects</div>
                  <div className="text-[11.5px] text-[#11140F]/50 dark:text-white/50">
                    Subtle audio feedback when copying links or generating codes
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.soundEffects}
                    onChange={(e) => handleUpdatePref({ soundEffects: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-black/15 dark:bg-white/15 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>

              {/* Weekly Digest */}
              <div className="pt-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-[#11140F] dark:text-white">Weekly Analytics Digest</div>
                  <div className="text-[11.5px] text-[#11140F]/50 dark:text-white/50">
                    Email summary of scan traffic and top links
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={preferences.emailDigests}
                    onChange={(e) => handleUpdatePref({ emailDigests: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-black/15 dark:bg-white/15 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5 text-[13px]">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#11140F] dark:text-white">Profile Photo</span>
                  {avatarMsg && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {avatarMsg}
                    </span>
                  )}
                </div>
                <ImageUploadField
                  label="Avatar"
                  aspectRatio="avatar"
                  value={avatarUrl}
                  onChange={handleAvatarChange}
                  recommendedDimensions="500x500 JPG or PNG"
                  helpText="Shown in your workspace and navigation header."
                />
              </div>

              <div className="divide-y divide-[#11140F]/8 dark:divide-white/8 border-t border-[#11140F]/8 dark:border-white/8 pt-1">
                {user.name && (
                  <div className="py-3 flex justify-between items-center">
                    <span className="text-[#11140F]/55 dark:text-white/55">Name</span>
                    <span className="font-medium text-[#11140F] dark:text-white">{user.name}</span>
                  </div>
                )}
                <div className="py-3 flex justify-between items-center">
                  <span className="text-[#11140F]/55 dark:text-white/55">Email</span>
                  <span className="font-mono text-xs text-[#11140F] dark:text-white">{user.email}</span>
                </div>
                <div className="py-3 flex justify-between items-center">
                  <span className="text-[#11140F]/55 dark:text-white/55">Subscription Plan</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#11140F] dark:text-white">
                      {user.tier || 'free'}
                    </span>
                    <a
                      href="/pricing"
                      className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      Manage plan &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {successMsg ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600 mx-auto" />
                  <h4 className="font-semibold text-[15px]">Done</h4>
                  <p className="text-[13px] text-[#11140F]/60 dark:text-white/60">{successMsg}</p>
                </div>
              ) : (
                <>
                  {user.isDeactivated && (
                    <div className="p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 space-y-2.5">
                      <div className="flex items-center gap-2 font-semibold text-[13px] text-emerald-700 dark:text-emerald-400">
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Account Deactivated</span>
                      </div>
                      <p className="text-[12px] text-[#11140F]/75 dark:text-white/75">
                        Your links are currently paused. Reactivate to restore access immediately.
                      </p>
                      <button
                        type="button"
                        onClick={handleReactivate}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-40 cursor-pointer"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        <span>{loading ? 'Reactivating…' : 'Reactivate Account'}</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F4F5F1] dark:bg-white/[0.04] rounded-xl border border-[#11140F]/8 dark:border-white/8">
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('deactivate');
                        setConfirmText('');
                        setError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        actionType === 'deactivate'
                          ? 'bg-white dark:bg-[#1E221E] text-amber-700 dark:text-amber-400 font-semibold shadow-2xs'
                          : 'text-[#11140F]/60 dark:text-white/60'
                      }`}
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Deactivate</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('delete');
                        setConfirmText('');
                        setError(null);
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        actionType === 'delete'
                          ? 'bg-white dark:bg-[#1E221E] text-rose-600 dark:text-rose-400 font-semibold shadow-2xs'
                          : 'text-[#11140F]/60 dark:text-white/60'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </button>
                  </div>

                  {actionType === 'deactivate' ? (
                    <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] space-y-3 text-xs">
                      <p className="text-[#11140F]/80 dark:text-white/80 leading-relaxed">
                        Deactivating pauses your QR links and removes your login session. You can contact support or sign back in to restore later.
                      </p>
                      <div className="space-y-1.5">
                        <label className="block font-medium text-[#11140F] dark:text-white">
                          Type <span className="font-mono font-bold">DEACTIVATE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="DEACTIVATE"
                          className="w-full px-3 py-2 rounded-lg border border-[#11140F]/15 dark:border-white/15 text-xs font-mono bg-white dark:bg-[#161817] text-[#11140F] dark:text-white outline-hidden focus:border-amber-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-rose-500/25 bg-rose-500/[0.06] space-y-3 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>This action cannot be undone</span>
                      </div>
                      <p className="text-[#11140F]/80 dark:text-white/80 leading-relaxed">
                        Permanently deletes your account, all QR codes, scan analytics, custom domains, and workspace apps.
                      </p>
                      <div className="space-y-1.5">
                        <label className="block font-medium text-[#11140F] dark:text-white">
                          Type <span className="font-mono font-bold">DELETE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="w-full px-3 py-2 rounded-lg border border-[#11140F]/15 dark:border-white/15 text-xs font-mono bg-white dark:bg-[#161817] text-[#11140F] dark:text-white outline-hidden focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg border border-[#11140F]/12 dark:border-white/12 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    {actionType === 'deactivate' ? (
                      <button
                        type="button"
                        onClick={handleDeactivate}
                        disabled={confirmText.trim().toUpperCase() !== 'DEACTIVATE' || loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>{loading ? 'Deactivating…' : 'Deactivate Account'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={confirmText.trim().toUpperCase() !== 'DELETE' || loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        <span>{loading ? 'Deleting…' : 'Delete Account'}</span>
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
