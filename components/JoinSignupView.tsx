'use client';

import { useState, useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, signIn } from '@/app/auth-actions';
import { Check, ArrowRight, Shield, Sparkles, QrCode, CreditCard, ChevronRight } from 'lucide-react';

function SubmitButton({ isLogin }: { isLogin: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-white/90 text-black font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
    >
      {pending ? (
        <span>{isLogin ? 'Signing in...' : 'Creating your account...'}</span>
      ) : (
        <>
          <span>{isLogin ? 'Sign In to Workspace' : 'Claim Free Account'}</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  );
}

export default function JoinSignupView() {
  const router = useRouter();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [signupState, signupAction] = useFormState(signUp, {});
  const [loginState, loginAction] = useFormState(signIn, {});

  useEffect(() => {
    if (signupState.success || loginState.success) {
      router.push('/?section=vcard#workspace');
      router.refresh();
    }
  }, [signupState.success, loginState.success, router]);

  const activeState = mode === 'signup' ? signupState : loginState;

  return (
    <div className="min-h-screen bg-[#090A09] text-white flex flex-col justify-between selection:bg-[#2F6B4F] selection:text-white">
      {/* Top Simple Nav */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-sm shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            DynamicQR
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/product-tour"
            className="text-xs text-white/60 hover:text-white transition-colors hidden sm:inline-block"
          >
            Product Tour
          </Link>
          <button
            type="button"
            onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all cursor-pointer"
          >
            {mode === 'signup' ? 'Sign In' : 'Create Account'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md space-y-6">
          {/* Card */}
          <div className="bg-[#121411] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden backdrop-blur-md">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#34D399] text-[11px] font-mono font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Instant Dynamic vCard & QR Ecosystem</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
                {mode === 'signup' ? 'Get Started Free' : 'Welcome Back'}
              </h1>
              <p className="text-xs sm:text-sm text-white/60 max-w-sm mx-auto">
                {mode === 'signup'
                  ? 'Join DynamicQR in 10 seconds. Create your permanent digital business card and start routing dynamic QR codes.'
                  : 'Access your dynamic links, vCards, scan diagnostics, and subscriber lists.'}
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  mode === 'signup'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Sign Up Free
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2 px-3 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                  mode === 'login'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Log In
              </button>
            </div>

            {/* Form */}
            <form action={mode === 'signup' ? signupAction : loginAction} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/80">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-white/30 text-xs focus:outline-hidden focus:border-[#34D399] transition-colors"
                  />
                  {signupState.errors?.name && (
                    <p className="text-[11px] text-red-400">{signupState.errors.name[0]}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/80">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-white/30 text-xs focus:outline-hidden focus:border-[#34D399] transition-colors"
                />
                {activeState.errors?.email && (
                  <p className="text-[11px] text-red-400">{activeState.errors.email[0]}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white/80">Password</label>
                  {mode === 'signup' && (
                    <span className="text-[10px] text-white/40">Minimum 6 characters</span>
                  )}
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white placeholder-white/30 text-xs focus:outline-hidden focus:border-[#34D399] transition-colors"
                />
                {activeState.errors?.password && (
                  <p className="text-[11px] text-red-400">{activeState.errors.password[0]}</p>
                )}
              </div>

              {activeState.message && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {activeState.message}
                </div>
              )}

              <div className="pt-2">
                <SubmitButton isLogin={mode === 'login'} />
              </div>
            </form>

            {/* Feature Bullets */}
            {mode === 'signup' && (
              <div className="pt-4 border-t border-white/5 space-y-2 text-[11px] text-white/50">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span>Instant 1-tap phone contact saving vCard 3.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span>5 permanent dynamic QR routes with live redirects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#34D399] shrink-0" />
                  <span>Zero credit card required &bull; Free forever</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-white/40 border-t border-white/5">
        <p>&copy; {new Date().getFullYear()} DynamicQR. Intelligent Dynamic QR Routing & Micro-SaaS Ecosystem.</p>
      </footer>
    </div>
  );
}
