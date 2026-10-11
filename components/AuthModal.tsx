'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { signIn, signUp } from '@/app/auth-actions';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

function SubmitBtn({ isLogin }: { isLogin: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-[#11140F] px-4 py-3 text-[14px] font-medium text-white transition-colors hover:bg-[#2A2E25] disabled:opacity-50"
    >
      {pending ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
    </button>
  );
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'login' }: Props) {
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab);
  const [loginState, loginAction] = useFormState(signIn, {});
  const [signupState, signupAction] = useFormState(signUp, {});

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    if (loginState.success || signupState.success) {
      onClose();
    }
  }, [loginState.success, signupState.success, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeState = tab === 'login' ? loginState : signupState;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#11140F]/15 bg-[#EEF0EA] p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-[#11140F]/5 p-1">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === 'login' ? 'bg-white text-[#11140F] shadow-sm' : 'text-[#11140F]/60 hover:text-[#11140F]'
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === 'signup' ? 'bg-white text-[#11140F] shadow-sm' : 'text-[#11140F]/60 hover:text-[#11140F]'
            }`}
          >
            Create account
          </button>
        </div>

        <div>
          <h3 className="text-xl font-medium tracking-tight text-[#11140F]">
            {tab === 'login' ? 'Welcome back' : 'Start your DynamicQR workspace'}
          </h3>
          <p className="text-xs text-[#11140F]/55 mt-1">
            {tab === 'login'
              ? 'Sign in to access your personal QR codes.'
              : 'Create a private account to manage your dynamic links.'}
          </p>
        </div>

        {activeState.message && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium">
            {activeState.message}
          </div>
        )}

        <form action={tab === 'login' ? loginAction : signupAction} className="space-y-3.5">
          {tab === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#11140F]/70 mb-1">Name</label>
              <input
                type="text"
                name="name"
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-[#11140F]/15 bg-white px-3.5 py-2.5 text-sm text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#11140F]/70 mb-1">Email address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="alex@example.com"
              className="w-full rounded-xl border border-[#11140F]/15 bg-white px-3.5 py-2.5 text-sm text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F]"
            />
            {signupState.errors?.email && (
              <p className="mt-1 text-xs text-red-600">{signupState.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#11140F]/70 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#11140F]/15 bg-white px-3.5 py-2.5 text-sm text-[#11140F] placeholder:text-[#11140F]/30 outline-none focus:border-[#11140F]"
            />
            {signupState.errors?.password && (
              <p className="mt-1 text-xs text-red-600">{signupState.errors.password[0]}</p>
            )}
          </div>

          <div className="pt-1">
            <SubmitBtn isLogin={tab === 'login'} />
          </div>
        </form>

        <button
          onClick={onClose}
          className="w-full text-center text-xs text-[#11140F]/45 hover:text-[#11140F] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
