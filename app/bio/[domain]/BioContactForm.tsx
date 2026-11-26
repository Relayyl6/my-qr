'use client';

import React, { useState } from 'react';
import { submitDomainContactInquiry } from '@/app/domains-actions';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';

export default function BioContactForm({ domainName }: { domainName: string }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please provide your name and email.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await submitDomainContactInquiry(domainName, name, email, phone, message);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message || 'Submission failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 animate-in fade-in duration-200">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-[14px] text-emerald-300">Message Delivered!</h4>
        <p className="text-[12.5px] text-emerald-200/80 leading-relaxed">
          Thanks for reaching out to {domainName}. We have received your note and will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white/4 border border-white/8 space-y-3">
      <div className="space-y-0.5">
        <h3 className="font-bold text-[13.5px] text-white/90">Send an Inquiry or Message</h3>
        <p className="text-[12px] text-white/50">
          Leave your details and the owner will respond directly to your inbox.
        </p>
      </div>

      {error && (
        <p className="text-[12px] text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-800/40">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5 text-[13px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name *"
            required
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-emerald-500"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your Email *"
            required
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-emerald-500"
          />
        </div>

        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone / WhatsApp (optional)"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-emerald-500"
        />

        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-emerald-500 resize-none"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span>{submitting ? 'Sending...' : 'Send Message'}</span>
        </button>
      </form>
    </div>
  );
}
