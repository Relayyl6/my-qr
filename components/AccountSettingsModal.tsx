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
  Layout,
  QrCode,
  Volume2,
  Bell,
  Sparkles,
  ArrowUpRight,
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
  const displayName = user.name || user.email.split('@')[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#101211] rounded-3xl border border-[#11140F]/12 dark:border-white/[0.08] shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden text-[#11140F] dark:text-white">
        {/* Compact Ambient Mesh Banner Header */}
        <div className="relative h-20 shrink-0 overflow-hidden bg-[#0A0E0C]">
          <div className="w-full h-full bg-gradient-to-br from-emerald-950/75 via-[#101914] to-[#0A0E0C] relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/25 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 pointer-events-none" />

          {/* Top Frosted Controls */}
          <div className="absolute top-3 inset-x-3.5 flex items-center justify-between z-20">
            <div className="px-2.5 py-1 rounded-full bg-black/45 border border-white/15 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#34D399]" />
              <span>Account</span>
            </div>

            <div className="flex items-center gap-2">
              {prefSavedMsg && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-md text-[#34D399] text-[11px] font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-7 h-7 rounded-full bg-black/45 hover:bg-black/70 text-white/90 hover:text-white border border-white/15 backdrop-blur-md flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact Overlapping Avatar + Identity Strip */}
        <div className="px-5 shrink-0 text-center -mt-8 relative z-20 space-y-2 pb-3 border-b border-[#11140F]/8 dark:border-white/[0.08]">
          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-[#34D399] ring-4 ring-white dark:ring-[#101211] bg-[#121614] flex items-center justify-center shadow-lg">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white">{initials}</span>
            )}
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-base font-extrabold tracking-tight text-[#11140F] dark:text-white">
                {displayName}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#34D399]/15 text-[#2F6B4F] dark:text-[#34D399] text-[10px] font-bold uppercase tracking-wider">
                {(user.tier || 'free').toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-[#11140F]/55 dark:text-white/50 font-mono truncate">
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/pricing"
              className="flex-1 py-2 px-4 rounded-xl bg-[#34D399] hover:bg-[#34D399]/90 text-[#09110D] font-bold text-xs transition-all shadow-sm inline-flex items-center justify-center gap-1.5"
            >
              <span>Manage Plan &amp; Upgrades</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Compact Navigation Pill Strip */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#F4F5F1] dark:bg-white/[0.04] border border-[#11140F]/8 dark:border-white/[0.08]">
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
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActive
                      ? tab.id === 'privacy'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                        : 'bg-white dark:bg-white/10 text-[#11140F] dark:text-white shadow-xs'
                      : 'text-[#11140F]/55 dark:text-white/55 hover:text-[#11140F] dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive && tab.id !== 'privacy' ? 'text-[#2F6B4F] dark:text-[#34D399]' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body — flex-1 min-h-0 guarantees top content is never clipped */}
        <div className="px-5 py-4 flex-1 min-h-0 overflow-y-auto space-y-3">
          {/* TAB 1: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-3 text-[13px]">
              {/* Section Eyebrow */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#11140F]/50 dark:text-white/50 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#34D399]" />
                  Appearance &amp; Workspace
                </span>
              </div>

              {/* Theme Segmented Selector Card */}
              <div className="p-3 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] space-y-2.5">
                <div className="text-xs font-semibold text-[#11140F] dark:text-white px-0.5">
                  Theme
                </div>
                <div className="grid grid-cols-3 gap-1.5">
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
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-[#171B19] border-[#34D399] text-[#11140F] dark:text-[#34D399] shadow-xs'
                            : 'bg-transparent border-[#11140F]/8 dark:border-white/[0.06] text-[#11140F]/60 dark:text-white/55 hover:text-[#11140F] dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Home View Card */}
              <div className="p-3 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-black/[0.05] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                    <Layout className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#11140F] dark:text-white truncate">Default View</div>
                    <div className="text-[11px] text-[#11140F]/50 dark:text-white/50 truncate">Opening screen</div>
                  </div>
                </div>
                <div className="flex rounded-xl border border-[#11140F]/10 dark:border-white/10 p-0.5 bg-white dark:bg-black/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdatePref({ defaultLanding: 'workspace' })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      preferences.defaultLanding === 'workspace'
                        ? 'bg-[#34D399] text-[#09110D]'
                        : 'text-[#11140F]/55 dark:text-white/55'
                    }`}
                  >
                    Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePref({ defaultLanding: 'overview' })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      preferences.defaultLanding === 'overview'
                        ? 'bg-[#34D399] text-[#09110D]'
                        : 'text-[#11140F]/55 dark:text-white/55'
                    }`}
                  >
                    Tour
                  </button>
                </div>
              </div>

              {/* Interface Density Card */}
              <div className="p-3 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-black/[0.05] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#11140F] dark:text-white truncate">Layout Density</div>
                    <div className="text-[11px] text-[#11140F]/50 dark:text-white/50 truncate">Table &amp; card spacing</div>
                  </div>
                </div>
                <div className="flex rounded-xl border border-[#11140F]/10 dark:border-white/10 p-0.5 bg-white dark:bg-black/30 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdatePref({ analyticsDensity: 'comfortable' })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      preferences.analyticsDensity === 'comfortable'
                        ? 'bg-[#34D399] text-[#09110D]'
                        : 'text-[#11140F]/55 dark:text-white/55'
                    }`}
                  >
                    Comfort
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePref({ analyticsDensity: 'compact' })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      preferences.analyticsDensity === 'compact'
                        ? 'bg-[#34D399] text-[#09110D]'
                        : 'text-[#11140F]/55 dark:text-white/55'
                    }`}
                  >
                    Compact
                  </button>
                </div>
              </div>

              {/* QR Precision Card */}
              <div className="p-3 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-black/[0.05] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#11140F] dark:text-white truncate">QR Precision</div>
                    <div className="text-[11px] text-[#11140F]/50 dark:text-white/50 truncate">Print error recovery</div>
                  </div>
                </div>
                <select
                  value={preferences.qrPrecision}
                  onChange={(e) => handleUpdatePref({ qrPrecision: e.target.value as any })}
                  className="px-2.5 py-1.5 rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#171B19] text-[11.5px] font-semibold text-[#11140F] dark:text-white outline-hidden cursor-pointer shrink-0"
                >
                  <option value="H">High (30%)</option>
                  <option value="Q">Quartile (25%)</option>
                  <option value="M">Medium (15%)</option>
                </select>
              </div>

              {/* Audio & Digest Card */}
              <div className="p-3 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-black/[0.05] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#11140F] dark:text-white truncate">Sound Effects</div>
                      <div className="text-[11px] text-[#11140F]/50 dark:text-white/50 truncate">Copy &amp; generate clicks</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.soundEffects}
                      onChange={(e) => handleUpdatePref({ soundEffects: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-black/15 dark:bg-white/15 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#34D399]" />
                  </label>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-[#11140F]/6 dark:border-white/[0.06]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-black/[0.05] dark:bg-white/10 flex items-center justify-center text-[#2F6B4F] dark:text-[#34D399] shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#11140F] dark:text-white truncate">Weekly Digest</div>
                      <div className="text-[11px] text-[#11140F]/50 dark:text-white/50 truncate">Scan performance report</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={preferences.emailDigests}
                      onChange={(e) => handleUpdatePref({ emailDigests: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-black/15 dark:bg-white/15 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#34D399]" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4 text-[13px]">
              <div className="p-4 rounded-2xl bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#11140F] dark:text-white">Profile Photo</span>
                  {avatarMsg && (
                    <span className="text-[11px] text-[#34D399] font-semibold">
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
                  helpText="Displayed on your workspace avatar and navigation bar."
                />
              </div>
            </div>
          )}

          {/* TAB 3: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {successMsg ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="w-9 h-9 text-[#34D399] mx-auto" />
                  <h4 className="font-semibold text-[15px]">Completed</h4>
                  <p className="text-[13px] text-[#11140F]/60 dark:text-white/60">{successMsg}</p>
                </div>
              ) : (
                <>
                  {user.isDeactivated && (
                    <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-2.5">
                      <div className="flex items-center gap-2 font-semibold text-[13px] text-[#34D399]">
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Account Deactivated</span>
                      </div>
                      <p className="text-[12px] text-[#11140F]/75 dark:text-white/75">
                        Your links are paused. Reactivate to restore access right away.
                      </p>
                      <button
                        type="button"
                        onClick={handleReactivate}
                        disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-[#34D399] text-[#09110D] text-xs font-bold hover:opacity-90 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        <span>{loading ? 'Reactivating…' : 'Reactivate Account'}</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F4F5F1] dark:bg-white/[0.04] rounded-2xl border border-[#11140F]/8 dark:border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => {
                        setActionType('deactivate');
                        setConfirmText('');
                        setError(null);
                      }}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        actionType === 'deactivate'
                          ? 'bg-white dark:bg-[#171B19] text-amber-500 shadow-xs'
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
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        actionType === 'delete'
                          ? 'bg-white dark:bg-[#171B19] text-rose-500 shadow-xs'
                          : 'text-[#11140F]/60 dark:text-white/60'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>

                  {actionType === 'deactivate' ? (
                    <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] space-y-3 text-xs">
                      <p className="text-[#11140F]/80 dark:text-white/80 leading-relaxed">
                        Pauses your QR links and signs you out. You can sign back in to restore later.
                      </p>
                      <div className="space-y-1.5">
                        <label className="block font-medium">
                          Type <span className="font-mono font-bold text-amber-400">DEACTIVATE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="DEACTIVATE"
                          className="w-full px-3 py-2 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-xs font-mono bg-white dark:bg-black/30 text-[#11140F] dark:text-white outline-hidden focus:border-amber-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-rose-500/25 bg-rose-500/[0.06] space-y-3 text-xs">
                      <div className="flex items-center gap-2 font-semibold text-rose-500">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>This cannot be undone</span>
                      </div>
                      <p className="text-[#11140F]/80 dark:text-white/80 leading-relaxed">
                        Permanently removes your account, QR links, scan logs, domains, and workspace data.
                      </p>
                      <div className="space-y-1.5">
                        <label className="block font-medium">
                          Type <span className="font-mono font-bold text-rose-400">DELETE</span> to confirm
                        </label>
                        <input
                          type="text"
                          value={confirmText}
                          onChange={(e) => setConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="w-full px-3 py-2 rounded-xl border border-[#11140F]/15 dark:border-white/15 text-xs font-mono bg-white dark:bg-black/30 text-[#11140F] dark:text-white outline-hidden focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}

                  {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2.5 rounded-xl border border-[#11140F]/12 dark:border-white/12 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    {actionType === 'deactivate' ? (
                      <button
                        type="button"
                        onClick={handleDeactivate}
                        disabled={confirmText.trim().toUpperCase() !== 'DEACTIVATE' || loading}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                      >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{loading ? 'Deactivating…' : 'Deactivate Account'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={confirmText.trim().toUpperCase() !== 'DELETE' || loading}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                      >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
