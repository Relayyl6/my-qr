'use client';

import { useState } from 'react';
import { signOut } from '@/app/auth-actions';
import AuthModal from './AuthModal';

import Link from 'next/link';

interface Props {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
  } | null;
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

export default function HeaderNav({ user }: Props) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#11140F]/10 bg-[#EEF0EA]/95 backdrop-blur-md">
        <nav className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <QrMark className="w-5 h-5" />
            <span className="font-medium tracking-tight font-display text-[17px]">
              DynamicQR
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8 text-[14px] text-[#11140F]/70">
            <a href="/#how-it-works" className="hover:text-[#11140F] transition-colors">How it works</a>
            <a href="/#features" className="hover:text-[#11140F] transition-colors">Features</a>
            <a href="/#workspace" className="hover:text-[#11140F] transition-colors">Workspace</a>
            <Link href="/pricing" className="hover:text-[#11140F] font-medium transition-colors text-[#2F6B4F]">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/pricing"
                  className="rounded-full bg-[#2F6B4F]/10 text-[#2F6B4F] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-[#2F6B4F]/20 transition-colors"
                  title="Click to manage subscription or upgrade"
                >
                  {user.tier || 'pro'}
                </Link>
                <span className="hidden sm:inline-block text-[13px] text-[#11140F]/70 font-medium">
                  {user.name || user.email.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="rounded-full border border-[#11140F]/15 bg-white px-3.5 py-1.5 text-[12px] sm:text-[13px] font-medium text-[#11140F]/80 hover:bg-white/80 transition-colors"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('login')}
                  className="rounded-full bg-[#11140F] text-[#EEF0EA] px-4 sm:px-5 py-2 sm:py-2.5 text-[12px] sm:text-[14px] font-medium hover:bg-[#2A2E25] transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  className="hidden sm:inline-block rounded-full border border-[#11140F]/15 bg-white px-4 py-2 text-[13px] font-medium text-[#11140F] hover:bg-white/80 transition-colors"
                >
                  Sign up
                </button>
              </div>
            )}
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
