'use client';

import { useState } from 'react';
import AuthModal from './AuthModal';

export default function WorkspaceLocked() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  const openAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <>
      <div className="w-full rounded-2xl border border-[#11140F]/15 bg-[#EEF0EA] p-8 sm:p-14 text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#11140F]/5 text-2xl">
          🔒
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-2xl font-medium tracking-tight text-[#11140F]">
            Sign in to access your workspace
          </h3>
          <p className="text-sm text-[#11140F]/60 leading-relaxed">
            Create an account to generate your own dynamic QR codes, track scan analytics in real time, and update destinations on the fly.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => openAuth('signup')}
            className="rounded-full bg-[#11140F] text-[#EEF0EA] px-6 py-3 text-sm font-medium hover:bg-[#2A2E25] transition-colors"
          >
            Create free account
          </button>
          <button
            onClick={() => openAuth('login')}
            className="rounded-full border border-[#11140F]/15 bg-white px-6 py-3 text-sm font-medium text-[#11140F] hover:bg-white/80 transition-colors"
          >
            Log in to existing account
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
}
