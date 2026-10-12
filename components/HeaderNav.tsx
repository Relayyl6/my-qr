'use client';

import { useState } from 'react';
import { signOut } from '@/app/auth-actions';
import AuthModal from './AuthModal';
import Link from 'next/link';
import { LayoutGrid, Sparkles, CreditCard, Shield } from 'lucide-react';

interface Props {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
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

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const handleTabClick = (tab: 'workspace' | 'overview') => {
    if (onTabChange) {
      onTabChange(tab);
      window.history.replaceState(null, '', `#${tab}`);
    } else {
      window.location.hash = tab;
    }
  };

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-50 w-full border-b border-[#11140F]/10 bg-[#EEF0EA]/95 backdrop-blur-md shadow-2xs">
        {/* System Broadcast Announcement */}
        {announcementBanner && (
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-[#11140F] text-white px-4 py-1.5 text-[12px] font-medium text-center flex items-center justify-center gap-2 shadow-xs shrink-0">
            <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9.5px] font-mono uppercase tracking-wider font-bold">
              SYSTEM BROADCAST
            </span>
            <span className="truncate">{announcementBanner}</span>
          </div>
        )}

        <nav className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8">
          {/* Main Top Navigation Row */}
          <div className="h-16 flex items-center justify-between gap-3 sm:gap-6">
            {/* Left: DynamicQR Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#top"
                onClick={(e) => {
                  if (onTabChange) {
                    e.preventDefault();
                    handleTabClick('overview');
                  }
                }}
                className="flex items-center gap-2.5 group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-[#11140F] flex items-center justify-center text-white shadow-xs group-hover:bg-[#2A2E25] transition-colors">
                  <QrMark className="w-4.5 h-4.5" fill="#FFFFFF" />
                </div>
                <span className="font-bold tracking-tight text-[16.5px] sm:text-[18px] text-[#11140F]">
                  DynamicQR
                </span>
              </a>
            </div>

            {/* Center: Unified Segmented View Tabs (Desktop & Tablet) */}
            <div className="hidden sm:flex items-center p-1 bg-white/90 rounded-2xl border border-[#11140F]/10 shadow-2xs">
              <button
                type="button"
                onClick={() => handleTabClick('workspace')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'workspace'
                    ? 'bg-[#11140F] text-white shadow-xs'
                    : 'text-[#11140F]/65 hover:text-[#11140F] hover:bg-[#EEF0EA]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Workspace</span>
                {user && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      activeTab === 'workspace' ? 'bg-emerald-400' : 'bg-emerald-600'
                    }`}
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('overview')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#11140F] text-white shadow-xs'
                    : 'text-[#11140F]/65 hover:text-[#11140F] hover:bg-[#EEF0EA]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Product Tour</span>
              </button>

              <Link
                href="/pricing"
                className="px-3 sm:px-3.5 py-1.5 rounded-xl text-[12.5px] sm:text-[13px] font-semibold text-[#2F6B4F] hover:bg-[#2F6B4F]/10 transition-colors flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>Pricing</span>
              </Link>
            </div>

            {/* Right: User State, Tier Pill, Admin Console & Auth Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-2xs border border-amber-400/30"
                  title="Sovereign Admin Console"
                >
                  <Shield className="w-3 h-3 text-amber-400" />
                  <span>Admin</span>
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/pricing"
                    className="rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider hover:bg-[#2F6B4F]/20 transition-colors border border-[#2F6B4F]/20"
                    title="Click to view plan limits or upgrade"
                  >
                    {user.tier || 'free'}
                  </Link>
                  <span className="hidden lg:inline-block text-[12.5px] text-[#11140F]/70 font-medium max-w-[130px] truncate">
                    {user.name || user.email.split('@')[0]}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="rounded-full border border-[#11140F]/15 bg-white px-3 sm:px-3.5 py-1.5 text-[12px] sm:text-[13px] font-medium text-[#11140F]/80 hover:bg-white/80 transition-colors shadow-2xs cursor-pointer"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAuth('login')}
                    className="rounded-full bg-[#11140F] text-[#EEF0EA] px-3.5 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[13px] font-medium hover:bg-[#2A2E25] transition-colors shadow-2xs cursor-pointer"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => openAuth('signup')}
                    className="hidden xs:inline-block rounded-full border border-[#11140F]/15 bg-white px-3.5 py-1.5 text-[12px] sm:text-[13px] font-medium text-[#11140F] hover:bg-white/80 transition-colors shadow-2xs cursor-pointer"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Bottom Tab Bar (< sm screens) */}
          <div className="sm:hidden pb-2.5 pt-0.5">
            <div className="grid grid-cols-3 p-1 bg-white/95 rounded-2xl border border-[#11140F]/10 shadow-xs gap-1">
              <button
                type="button"
                onClick={() => handleTabClick('workspace')}
                className={`py-1.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'workspace'
                    ? 'bg-[#11140F] text-white shadow-xs'
                    : 'text-[#11140F]/65 hover:text-[#11140F]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span>Workspace</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabClick('overview')}
                className={`py-1.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-[#11140F] text-white shadow-xs'
                    : 'text-[#11140F]/65 hover:text-[#11140F]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Tour</span>
              </button>

              <Link
                href="/pricing"
                className="py-1.5 rounded-xl text-[12px] font-semibold text-[#2F6B4F] flex items-center justify-center gap-1.5 hover:bg-[#2F6B4F]/10 transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>Pricing</span>
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
}
