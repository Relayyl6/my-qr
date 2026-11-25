'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, getUserProfileAvatar } from '@/app/auth-actions';
import AuthModal from './AuthModal';
import Link from 'next/link';
import { LayoutGrid, Sparkles, CreditCard, Shield, Settings, ChevronDown, LogOut, Search } from 'lucide-react';
import AccountSettingsModal from './AccountSettingsModal';
import SearchCommandModal from './SearchCommandModal';
import { getOptimizedStorageUrl } from '@/lib/media';

interface Props {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
    avatarUrl?: string | null;
  } | null;
  isAdmin?: boolean;
  activeTab?: 'workspace' | 'overview';
  onTabChange?: (tab: 'workspace' | 'overview') => void;
  announcementBanner?: string | null;
}

function QrMark({ className = 'w-5 h-5', fill = '#11140F' }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="1" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="4" width="3" height="3" fill={fill} />
      <rect x="14" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="17" y="4" width="3" height="3" fill={fill} />
      <rect x="1" y="14" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="17" width="3" height="3" fill={fill} />
      <rect x="15" y="15" width="3" height="3" fill={fill} />
      <rect x="20" y="15" width="3" height="3" fill={fill} />
      <rect x="15" y="20" width="3" height="3" fill={fill} />
      <rect x="20" y="20" width="3" height="3" fill={fill} />
    </svg>
  );
}

export default function HeaderNav({
  user,
  isAdmin = false,
  activeTab = 'workspace',
  onTabChange,
  announcementBanner,
}: Props) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut for Search Spotlight (⌘K / Ctrl+K)
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = (displayName[0] || 'U').toUpperCase();
  const userTier = (user?.tier || 'free').toUpperCase();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl || null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(user.avatarUrl);
      setAvatarError(false);
    } else {
      try {
        const cached = typeof window !== 'undefined' ? localStorage.getItem('dynamicqr_user_avatar') : null;
        if (cached) {
          setAvatarUrl(cached);
          setAvatarError(false);
        }
      } catch (e) {}
    }

    if (user?.id) {
      getUserProfileAvatar()
        .then((serverUrl) => {
          if (serverUrl) {
            setAvatarUrl(serverUrl);
            setAvatarError(false);
            try {
              localStorage.setItem('dynamicqr_user_avatar', serverUrl);
            } catch (e) {}
          }
        })
        .catch(() => {});
    }

    const handleAvatarChange = (e: any) => {
      if (e.detail?.avatarUrl !== undefined) {
        setAvatarUrl(e.detail.avatarUrl || null);
        setAvatarError(false);
      }
    };
    window.addEventListener('dynamicqr-avatar-change', handleAvatarChange);
    return () => window.removeEventListener('dynamicqr-avatar-change', handleAvatarChange);
  }, [user?.id, user?.avatarUrl]);

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const handleTabClick = (tab: 'workspace' | 'overview') => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = `/#${tab}`;
      return;
    }
    if (onTabChange) {
      onTabChange(tab);
      window.history.replaceState(null, '', `#${tab}`);
    } else {
      window.location.hash = tab;
    }
  };

  const isDark = activeTab === 'overview';

  return (
    <>
      <header
        className={`w-full transition-colors duration-200 backdrop-blur-md ${
          isDark
            ? 'bg-[#11140F]/95 border-b border-white/10 text-white shadow-md'
            : 'bg-[#EEF0EA]/95 dark:bg-[#0D0F0C]/95 border-b border-[#11140F]/10 dark:border-white/10 text-[#11140F] dark:text-white shadow-2xs'
        }`}
      >
        {/* System Broadcast Announcement */}
        {announcementBanner && (
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-[#11140F] text-white px-4 py-1.5 text-[12px] font-medium text-center flex items-center justify-center gap-2 shadow-xs shrink-0">
            <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9.5px] font-mono uppercase tracking-wider font-bold">
              SYSTEM BROADCAST
            </span>
            <span className="truncate">{announcementBanner}</span>
          </div>
        )}

        <nav className="max-w-[1240px] mx-auto px-3 sm:px-6 md:px-8">
          {/* Main Top Navigation Row */}
          <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
            {/* Left: DynamicQR Brand Logo & Pricing Link */}
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <a
                href="#top"
                onClick={(e) => {
                  if (onTabChange) {
                    e.preventDefault();
                    handleTabClick('overview');
                  }
                }}
                className="flex items-center gap-1.5 sm:gap-2.5 group cursor-pointer"
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
                    isDark
                      ? 'bg-white/10 text-white group-hover:bg-white/20'
                      : 'bg-[#11140F] dark:bg-white/10 text-white group-hover:bg-[#2A2E25] dark:group-hover:bg-white/20'
                  }`}
                >
                  <QrMark className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" fill="#FFFFFF" />
                </div>
                <span
                  className={`font-bold tracking-tight text-[14.5px] sm:text-[18px] transition-colors ${
                    isDark ? 'text-white' : 'text-[#11140F] dark:text-white'
                  }`}
                >
                  DynamicQR
                </span>
              </a>

              {/* Pricing moved beside DynamicQR */}
              <Link
                href="/pricing"
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-[12.5px] sm:text-[13px] font-medium transition-all ${
                  isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-[#11140F]/70 dark:text-white/70 hover:text-[#11140F] dark:hover:text-white hover:bg-[#11140F]/5 dark:hover:bg-white/10'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 opacity-70 shrink-0" />
                <span>Pricing</span>
              </Link>
            </div>

            {/* Center: Overhauled Segmented View Tabs (Workspace vs Tour) - Directly in Main Bar on Mobile & Desktop */}
            <div
              className={`flex items-center p-0.5 sm:p-1 rounded-2xl border transition-colors shrink-0 ${
                isDark
                  ? 'bg-white/[0.08] border-white/15 shadow-2xs'
                  : 'bg-white/90 dark:bg-white/[0.08] border-[#11140F]/10 dark:border-white/10 shadow-2xs'
              }`}
            >
              <button
                type="button"
                onClick={() => handleTabClick('workspace')}
                className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-[13px] font-semibold flex items-center gap-1 sm:gap-2 transition-all cursor-pointer ${
                  activeTab === 'workspace'
                    ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] shadow-xs'
                    : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-[#11140F]/65 dark:text-white/70 hover:text-[#11140F] dark:hover:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10'
                }`}
                title="Switch to Workspace"
              >
                <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden xs:inline">Workspace</span>
                <span className="xs:hidden">App</span>
                {user && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      activeTab === 'workspace' ? 'bg-emerald-400' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('overview')}
                className={`px-2 sm:px-4 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-[13px] font-semibold flex items-center gap-1 sm:gap-2 transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? isDark
                      ? 'bg-white text-[#11140F] shadow-xs font-bold'
                      : 'bg-[#11140F] text-white shadow-xs'
                    : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-[#11140F]/65 dark:text-white/70 hover:text-[#11140F] dark:hover:text-white hover:bg-[#EEF0EA] dark:hover:bg-white/10'
                }`}
                title="Switch to Product Tour"
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="hidden sm:inline">Product Tour</span>
                <span className="sm:hidden">Tour</span>
              </button>
            </div>

            {/* Right: Quick Search & Consolidated User Profile Dropdown */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Quick Search Spotlight Button beside profile pill */}
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className={`flex items-center justify-center w-9 h-9 lg:w-auto lg:h-9 lg:px-3 rounded-full border transition-all cursor-pointer shadow-xs group shrink-0 ${
                  isDark
                    ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/15 text-white'
                    : 'bg-white/90 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.14] border-[#11140F]/12 dark:border-white/15 text-[#11140F] dark:text-white'
                }`}
                title="Quick Search & Command Palette (⌘K / Ctrl+K)"
              >
                <Search className="w-[18px] h-[18px] text-emerald-400 group-hover:scale-110 transition-transform shrink-0 stroke-[2.25]" />
                <span className="hidden lg:inline text-[12.5px] font-medium text-white/75 dark:text-white/75 group-hover:text-white ml-2">
                  Search...
                </span>
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-medium border bg-white/10 border-white/15 text-white/60 ml-2">
                  <span>⌘</span>K
                </kbd>
              </button>
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  {/* Single Clean Profile Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 w-9 h-9 sm:w-auto sm:h-9 p-0 sm:pl-1 sm:pr-3 rounded-full border transition-all cursor-pointer shadow-xs group shrink-0 ${
                      isDark
                        ? 'bg-white/[0.08] hover:bg-white/[0.14] border-white/15 text-white'
                        : 'bg-white/90 dark:bg-white/[0.08] hover:bg-white dark:hover:bg-white/[0.14] border-[#11140F]/12 dark:border-white/15 text-[#11140F] dark:text-white'
                    }`}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    title={displayName}
                  >
                    {/* User Avatar Circle with Image or Initial Fallback */}
                    <div className="w-7 h-7 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0">
                      {avatarUrl && !avatarError ? (
                        <img
                          src={getOptimizedStorageUrl(avatarUrl)}
                          alt={displayName}
                          loading="eager"
                          decoding="async"
                          onError={() => setAvatarError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>

                    {/* Display Name - hidden on mobile so it never overflows */}
                    <span className="hidden sm:inline text-[12.5px] sm:text-[13px] font-semibold tracking-tight max-w-[110px] sm:max-w-[140px] truncate">
                      {displayName}
                    </span>

                    {/* Subtle Dropdown Chevron - hidden on mobile */}
                    <ChevronDown
                      className={`hidden sm:inline w-3.5 h-3.5 transition-transform duration-200 ${
                        userMenuOpen
                          ? 'rotate-180 text-emerald-400'
                          : isDark
                          ? 'text-white/50 group-hover:text-white'
                          : 'text-[#11140F]/50 dark:text-white/50 group-hover:text-[#11140F] dark:group-hover:text-white'
                      }`}
                    />
                  </button>

                  {/* Signature Obsidian & Mint Profile Dropdown */}
                  {userMenuOpen && (
                    <div
                      className={`absolute right-0 top-full mt-2 w-64 rounded-3xl border shadow-2xl p-2 z-50 backdrop-blur-xl ${
                        isDark
                          ? 'bg-[#101211]/95 border-white/[0.08] text-white shadow-black/70'
                          : 'bg-white/95 dark:bg-[#101211]/95 border-[#11140F]/12 dark:border-white/[0.08] text-[#11140F] dark:text-white'
                      }`}
                    >
                      {/* Compact Cover + Identity */}
                      <div className="relative rounded-2xl overflow-hidden mb-1.5 bg-[#0A0E0C] border border-white/[0.08] p-3">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/70 via-[#101914] to-[#0A0E0C] pointer-events-none" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
                        <div className="relative z-10 flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#34D399] bg-[#121614] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                            {avatarUrl && !avatarError ? (
                              <img
                                src={getOptimizedStorageUrl(avatarUrl)}
                                alt={displayName}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{userInitial}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[13px] font-bold text-white truncate">{displayName}</span>
                              <span className="text-[9.5px] font-mono font-bold uppercase text-[#34D399] shrink-0">
                                {isAdmin ? 'Admin' : userTier}
                              </span>
                            </div>
                            <p className="text-[11px] text-white/55 truncate font-mono">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Cards */}
                      <div className="space-y-1">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className={`w-full flex items-center gap-2.5 p-2 rounded-2xl border transition-all ${
                              isDark
                                ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] text-white'
                                : 'bg-[#F7F8F5] dark:bg-white/[0.03] hover:bg-[#EEF0EA] dark:hover:bg-white/[0.07] border-[#11140F]/6 dark:border-white/[0.06]'
                            }`}
                          >
                            <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                              <Shield className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[12.5px] font-semibold">Admin Console</span>
                          </Link>
                        )}

                        <Link
                          href="/pricing"
                          onClick={() => setUserMenuOpen(false)}
                          className={`w-full flex items-center justify-between p-2 rounded-2xl border transition-all ${
                            isDark
                              ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] text-white'
                              : 'bg-[#F7F8F5] dark:bg-white/[0.03] hover:bg-[#EEF0EA] dark:hover:bg-white/[0.07] border-[#11140F]/6 dark:border-white/[0.06]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-xl bg-[#34D399]/15 flex items-center justify-center text-[#34D399] shrink-0">
                              <CreditCard className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[12.5px] font-semibold">Plan &amp; Billing</span>
                          </span>
                          <span className="text-[10px] font-mono uppercase text-[#34D399] font-semibold">
                            {userTier}
                          </span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            setAccountModalOpen(true);
                          }}
                          className={`w-full flex items-center gap-2.5 p-2 rounded-2xl border transition-all cursor-pointer text-left ${
                            isDark
                              ? 'bg-white/[0.03] hover:bg-white/[0.07] border-white/[0.06] text-white'
                              : 'bg-[#F7F8F5] dark:bg-white/[0.03] hover:bg-[#EEF0EA] dark:hover:bg-white/[0.07] border-[#11140F]/6 dark:border-white/[0.06]'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-xl bg-[#34D399]/15 flex items-center justify-center text-[#34D399] shrink-0">
                            <Settings className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[12.5px] font-semibold">Settings</span>
                        </button>
                      </div>

                      <div className={`h-px my-1.5 ${isDark ? 'bg-white/10' : 'bg-[#11140F]/8 dark:bg-white/10'}`} />

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl text-[12px] font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Log out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAuth('login')}
                    className={`rounded-full px-3.5 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium transition-colors shadow-2xs cursor-pointer ${
                      isDark
                        ? 'bg-white text-[#11140F] hover:bg-white/90 font-semibold'
                        : 'bg-[#11140F] dark:bg-white text-[#EEF0EA] dark:text-[#11140F] hover:bg-[#2A2E25] dark:hover:bg-white/90 font-semibold'
                    }`}
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => openAuth('signup')}
                    className={`hidden xs:inline-block rounded-full px-3.5 py-1.5 text-[12px] sm:text-[13px] font-medium transition-colors shadow-2xs cursor-pointer ${
                      isDark
                        ? 'border border-white/20 bg-white/10 text-white hover:bg-white/20'
                        : 'border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/10 text-[#11140F] dark:text-white hover:bg-white/80 dark:hover:bg-white/20'
                    }`}
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>

        </nav>
      </header>

      {/* Global Spotlight Search & Command Modal */}
      <SearchCommandModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectTab={handleTabClick}
        onOpenAccountSettings={() => setAccountModalOpen(true)}
        user={user}
        isAdmin={isAdmin}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />

      {accountModalOpen && user && (
        <AccountSettingsModal
          user={user}
          onClose={() => setAccountModalOpen(false)}
        />
      )}
    </>
  );
}
