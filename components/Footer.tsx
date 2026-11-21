'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

export function QrMark({ className = 'w-5 h-5', fill = 'currentColor' }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="1" y="1" width="9" height="9" rx="2" stroke={fill} strokeWidth="2" />
      <rect x="4" y="4" width="3" height="3" fill={fill} />
      <rect x="14" y="1" width="9" height="9" rx="2" stroke={fill} strokeWidth="2" />
      <rect x="17" y="4" width="3" height="3" fill={fill} />
      <rect x="1" y="14" width="9" height="9" rx="2" stroke={fill} strokeWidth="2" />
      <rect x="4" y="17" width="3" height="3" fill={fill} />
      <rect x="15" y="15" width="3" height="3" fill={fill} />
      <rect x="20" y="15" width="3" height="3" fill={fill} />
      <rect x="15" y="20" width="3" height="3" fill={fill} />
      <rect x="20" y="20" width="3" height="3" fill={fill} />
    </svg>
  );
}

// Minimalist Monochrome Social Icons matching Dreamflow aesthetic
function LinkedInIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YouTubeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function XTwitterIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface FooterProps {
  theme?: 'dark' | 'light';
  className?: string;
}

export default function Footer({ theme = 'dark', className = '' }: FooterProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage(data.message || 'Check your inbox for confirmation!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <footer
      id="footer"
      className={`w-full bg-[#080907] text-[#EEF0EA] border-t border-white/10 relative overflow-hidden select-none min-h-[calc(100dvh-4.25rem)] md:h-[calc(100dvh-4.25rem)] md:max-h-[calc(100dvh-4.25rem)] flex flex-col justify-between scroll-mt-20 ${className}`}
    >
      {/* 1. TOP SECTION: 5-Column Navigation & Newsletter Signup */}
      <div className="max-w-[1280px] w-full mx-auto px-6 sm:px-8 pt-4 sm:pt-6 md:pt-7 pb-2 relative z-10 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Column 1: Brand & Bio (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <QrMark className="w-5 h-5 text-white group-hover:text-[#34D399] transition-colors" fill="currentColor" />
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                DynamicQR
              </span>
            </Link>

            <p className="text-[13px] text-[#E5E7EB]/80 max-w-xs leading-relaxed">
              DynamicQR keeps every printed link alive, so you never have to reprint marketing materials from scratch.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1 text-[#E5E7EB]">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:border-white/35 hover:bg-white/[0.12] transition-all"
              >
                <LinkedInIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:border-white/35 hover:bg-white/[0.12] transition-all"
              >
                <InstagramIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:border-white/35 hover:bg-white/[0.12] transition-all"
              >
                <YouTubeIcon className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/15 flex items-center justify-center text-white/80 hover:text-white hover:border-white/35 hover:bg-white/[0.12] transition-all"
              >
                <XTwitterIcon className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 2: Product (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-[13.5px] font-semibold text-white tracking-wide">Product</h4>
            <ul className="space-y-2.5 text-[13px] text-[#E5E7EB]/75">
              <li>
                <Link href="/product-tour" className="hover:text-white transition-colors">
                  Preview
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#workspace" className="hover:text-white transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/pricing#matrix" className="hover:text-white transition-colors">
                  Micro-SaaS Suite
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-[13.5px] font-semibold text-white tracking-wide">Resources</h4>
            <ul className="space-y-2.5 text-[13px] text-[#E5E7EB]/75">
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/#workspace" className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/product-tour" className="hover:text-white transition-colors">
                  Video Guides
                </Link>
              </li>
              <li>
                <Link href="/pricing#matrix" className="hover:text-white transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-[13.5px] font-semibold text-white tracking-wide">Company</h4>
            <ul className="space-y-2.5 text-[13px] text-[#E5E7EB]/75">
              <li>
                <a href="mailto:hello@dynamicqr.co" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Newsletter Form (2 cols) */}
          <div className="lg:col-span-2 space-y-3.5">
            <h4 className="text-[13.5px] font-semibold text-white tracking-wide">
              Subscribe to our newsletter
            </h4>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative flex items-center bg-white/[0.08] border border-white/20 rounded-xl p-1 focus-within:border-white/40 focus-within:bg-white/[0.12] transition-all shadow-[inset_0_1px_2px_rgba(255,255,255,0.06)]">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@gmail.com"
                  required
                  disabled={status === 'loading'}
                  className="bg-transparent text-[13px] text-white placeholder-white/40 px-3 py-1.5 outline-none w-full min-w-0"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  aria-label="Subscribe to newsletter"
                  className="h-8 w-8 rounded-lg bg-gradient-to-b from-white/30 to-white/15 border border-white/30 flex items-center justify-center text-white hover:border-white/50 hover:bg-white/25 shadow-xs transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : status === 'success' ? (
                    <Check className="w-3.5 h-3.5 text-[#34D399]" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {message ? (
                <p
                  className={`text-[11.5px] leading-tight ${
                    status === 'success' ? 'text-[#34D399]' : 'text-red-400'
                  }`}
                >
                  {message}
                </p>
              ) : (
                <p className="text-[11.5px] text-[#E5E7EB]/60">
                  Unsubscribe anytime
                </p>
              )}
            </form>
          </div>

        </div>
      </div>

      {/* 2. MIDDLE SECTION: Michelangelo Hands Widened Apart & Centered Tagline */}
      <div className="relative w-full flex-1 min-h-[130px] max-h-[220px] md:max-h-[250px] flex items-center justify-center overflow-hidden border-t border-white/[0.06] my-auto">
        
        {/* Left Hand: Reaching in from Left edge */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none select-none z-10 h-[75%] md:h-[84%] max-h-[240px] w-auto flex items-center -translate-x-[18%] sm:-translate-x-[10%] md:-translate-x-[4%]">
          <img
            src="/images/creation-hand-left.png"
            alt="Creation Left Hand"
            className="h-full w-auto object-contain filter invert brightness-125 contrast-110 opacity-90 sm:opacity-95"
          />
        </div>

        {/* Center Tagline: Spaced cleanly in the wide gap between fingertips */}
        <div className="relative z-20 text-center px-4 max-w-[290px] sm:max-w-xs md:max-w-sm space-y-1.5 bg-[#080907]/80 sm:bg-[#080907]/45 md:bg-transparent backdrop-blur-[3px] md:backdrop-blur-none py-2 px-3 rounded-2xl border border-white/10 md:border-transparent">
          <div className="text-[11px] font-mono text-white/60 tracking-wider">
            © {new Date().getFullYear()}
          </div>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-white font-sans">
            DynamicQR
          </div>
          <p className="text-[12px] sm:text-[12.5px] text-[#E5E7EB]/80 leading-relaxed">
            One code, printed once. Routed as long as it needs to be.
          </p>
        </div>

        {/* Right Hand: Reaching in from Right edge */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none z-10 h-[75%] md:h-[84%] max-h-[240px] w-auto flex items-center translate-x-[18%] sm:translate-x-[10%] md:translate-x-[4%]">
          <img
            src="/images/creation-hand-right.png"
            alt="Creation Right Hand"
            className="h-full w-auto object-contain filter invert brightness-125 contrast-110 opacity-90 sm:opacity-95"
          />
        </div>
      </div>

      {/* 3. BOTTOM WATERMARK: Large faint typography across the base */}
      <div className="w-full overflow-hidden text-center select-none pointer-events-none pb-2 pt-0 relative z-0 shrink-0 -mt-4 sm:-mt-6 md:-mt-8">
        <span className="text-[12vw] sm:text-[11vw] font-bold tracking-tighter text-white/[0.04] leading-none block font-sans whitespace-nowrap">
          DynamicQR
        </span>
      </div>
    </footer>
  );
}
