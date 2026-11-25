'use client';

import React from 'react';
import { CheckCircle2, XCircle, Globe, ShieldCheck, Zap, Sparkles } from 'lucide-react';

interface Row {
  feature: string;
  description: string;
  legacyRegistrar: string;
  legacyStatus: 'check_warn' | 'paid' | 'check' | 'cross';
  dynamicQr: string;
  dynamicStatus: 'check';
}

const COMPARISON_ROWS: Row[] = [
  {
    feature: 'Automated Edge DNS Management',
    description: 'Cloudflare globally distributed anycast nameservers with sub-second propagation.',
    legacyRegistrar: '✅ (Clunky UI / Slow DNS)',
    legacyStatus: 'check_warn',
    dynamicQr: '✅ (1-Click Vercel / Render Presets)',
    dynamicStatus: 'check',
  },
  {
    feature: 'Automated SSL (HTTPS)',
    description: 'SSL/TLS certificates required for browser security and search engine ranking.',
    legacyRegistrar: '💰 $12–$70/yr (Paid Add-On)',
    legacyStatus: 'paid',
    dynamicQr: '✅ 100% Free Edge SSL Forever',
    dynamicStatus: 'check',
  },
  {
    feature: 'WHOIS Privacy (Identity Guard)',
    description: 'Hides your personal phone number, home address, and email from ICANN registries.',
    legacyRegistrar: '💰 Often Paid or Tiered',
    legacyStatus: 'paid',
    dynamicQr: '✅ Free & Masked by Default',
    dynamicStatus: 'check',
  },
  {
    feature: 'Domain URL Redirect (301/302)',
    description: 'Forward your domain to an existing website, portfolio, or Instagram profile.',
    legacyRegistrar: '✅ Basic Redirect',
    legacyStatus: 'check',
    dynamicQr: '✅ Built-in (301, 302 & Cloaked)',
    dynamicStatus: 'check',
  },
  {
    feature: 'Domain Lock & EPP Transfer Out',
    description: 'Theft protection with standard EPP codes to transfer your domain anytime.',
    legacyRegistrar: '✅ Yes (Manual Support)',
    legacyStatus: 'check',
    dynamicQr: '✅ Built-in 1-Click ICANN Standard',
    dynamicStatus: 'check',
  },
  {
    feature: 'Custom & Multi-Email Routing',
    description: 'Custom business email forwarding directly to your Gmail inbox.',
    legacyRegistrar: '💰 Paid Upsell ($1.50–$6/mo)',
    legacyStatus: 'paid',
    dynamicQr: '✅ Built-in + Free Custom Naming',
    dynamicStatus: 'check',
  },
  {
    feature: 'Dynamic QR Short Link Hub',
    description: 'Turn your custom domain into a branded physical QR and vanity routing engine.',
    legacyRegistrar: '❌ Not Offered',
    legacyStatus: 'cross',
    dynamicQr: '✅ Built-in Native Ecosystem',
    dynamicStatus: 'check',
  },
];

export default function DomainFeatureComparisonMatrix() {
  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 md:px-8 max-w-[1200px] mx-auto border-t border-white/10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#34D399] text-[11px] font-mono tracking-wider uppercase font-semibold">
          <Globe className="w-3.5 h-3.5" />
          Industry Domain Features Comparison
        </div>
        <h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Why buy domains on DynamicQR instead of legacy registrars?
        </h2>
        <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
          Legacy registrars charge extra fees for SSL certificates, upsell WHOIS privacy, and hide DNS behind clunky 2005-era control panels. Here is how NameLaunch compares:
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden shadow-2xl">
        {/* Table Head */}
        <div className="grid grid-cols-12 bg-white/[0.05] p-4 sm:p-5 border-b border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-white">
          <div className="col-span-5 sm:col-span-4 text-white/70">
            Feature
          </div>
          <div className="col-span-3 sm:col-span-4 text-amber-400">
            Namecheap / GoDaddy / Google
          </div>
          <div className="col-span-4 text-[#34D399] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
            <span>DynamicQR NameLaunch</span>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5 text-xs">
          {COMPARISON_ROWS.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 p-4 sm:p-5 items-center hover:bg-white/[0.02] transition-colors gap-2"
            >
              {/* Feature column */}
              <div className="col-span-5 sm:col-span-4 space-y-0.5">
                <div className="font-bold text-white text-[13px]">
                  {row.feature}
                </div>
                <p className="text-[11px] text-white/50 hidden sm:block">
                  {row.description}
                </p>
              </div>

              {/* Legacy column */}
              <div className="col-span-3 sm:col-span-4 text-[12px] font-medium text-white/60 flex items-center gap-1.5">
                {row.legacyStatus === 'cross' ? (
                  <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{row.legacyRegistrar}</span>
                  </span>
                ) : row.legacyStatus === 'paid' ? (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                    <span>{row.legacyRegistrar}</span>
                  </span>
                ) : (
                  <span>{row.legacyRegistrar}</span>
                )}
              </div>

              {/* DynamicQR column */}
              <div className="col-span-4 text-[12px] font-bold text-[#34D399] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#34D399] shrink-0" />
                <span className="bg-emerald-500/15 px-2.5 py-1 rounded-md border border-emerald-500/25 text-[#34D399]">
                  {row.dynamicQr}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="p-4 sm:p-5 bg-white/[0.03] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#34D399] shrink-0" />
            <span>
              All registered domains include automated Cloudflare Edge DNS, free Edge SSL certificates, and zero renewal trap markups.
            </span>
          </div>
          <a
            href="#workspace?section=namelaunch"
            className="font-bold text-[#34D399] hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Search Available Domains &rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
