'use client';

import { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface CustomerJoinViewProps {
  listId: string;
  listName: string;
  listDescription: string | null;
  doubleOptIn: boolean;
  showBranding?: boolean;
}

export default function CustomerJoinView({
  listId,
  listName,
  listDescription,
  doubleOptIn,
  showBranding = true,
}: CustomerJoinViewProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/mailing-lists/${listId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.error || 'Failed to join mailing list. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080907] text-[#EEF0EA] flex flex-col justify-between p-4 sm:p-6 md:p-8 font-sans selection:bg-[#34D399] selection:text-black">
      {/* Background radial ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-gradient-to-tr from-emerald-600/15 via-teal-500/10 to-transparent blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        {/* Card Box */}
        <div className="rounded-3xl border border-white/10 bg-[#0E110C]/90 backdrop-blur-xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] space-y-6">
          
          {submitted ? (
            /* Success State */
            <div className="text-center space-y-4 py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-[#34D399] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#34D399] font-bold">
                  {doubleOptIn ? 'CONFIRMATION DISPATCHED' : 'SUBSCRIPTION ACTIVE'}
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  You&apos;re on the list!
                </h2>
                <p className="text-[13.5px] text-white/60 leading-relaxed">
                  Thank you for joining <strong className="text-white">{listName}</strong>.
                  {doubleOptIn
                    ? ' Please check your inbox to confirm your subscription.'
                    : ' You will receive our latest promotions and updates directly.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs font-mono text-white/50 text-center">
                Subscribed as: <span className="text-white font-medium">{email}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                  setFirstName('');
                }}
                className="text-xs text-[#34D399] hover:underline font-mono pt-2 cursor-pointer"
              >
                ← Subscribe another email
              </button>
            </div>
          ) : (
            /* Subscription Form */
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#34D399] font-mono text-[11px] font-semibold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5" />
                  VIP Subscriber Form
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                  {listName}
                </h1>
                <p className="text-[13.5px] text-white/60 leading-relaxed">
                  {listDescription ||
                    'Scan our table or counter card to join our VIP customer list for exclusive updates and promotions.'}
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-white/70 block">
                    First Name <span className="text-white/40 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Sarah"
                    maxLength={50}
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-[#34D399] focus:bg-white/[0.09] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-white/70 block">
                    Email Address <span className="text-[#34D399]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sarah@example.com"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-sm outline-none focus:border-[#34D399] focus:bg-white/[0.09] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-xl bg-white text-[#11140F] hover:bg-[#EEF0EA] font-semibold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-white/10 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#11140F]" />
                      <span>Joining list...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-[#11140F]" />
                      <span>Join VIP Mailing List</span>
                    </>
                  )}
                </button>
              </form>

              {/* Trust Badge */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/40">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Zero Spam Guarantee
                </span>
                <span>Unsubscribe Anytime</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      {showBranding && (
        <div className="relative z-10 text-center text-[11px] font-mono text-white/30 pb-4">
          <Link href="/" className="hover:text-white transition-colors">
            Powered by DynamicQR
          </Link>
        </div>
      )}
    </main>
  );
}
