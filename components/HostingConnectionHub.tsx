'use client';

import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Server, ShieldCheck, Zap, Globe, Sparkles, ChevronDown } from 'lucide-react';

interface Props {
  activeDomainName?: string;
  onOpenDnsModal?: () => void;
}

type HostingPlatform = 'vercel' | 'render' | 'netlify';

export default function HostingConnectionHub({ activeDomainName, onOpenDnsModal }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [platform, setPlatform] = useState<HostingPlatform>('vercel');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const domain = activeDomainName || 'yemuel.xyz';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className={`rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-[#F7F8F5] dark:bg-white/[0.03] transition-all ${isExpanded ? 'p-5 sm:p-6 space-y-5' : 'p-4 sm:p-5'}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="space-y-1 cursor-pointer select-none flex-1"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] flex items-center justify-center shrink-0">
              <Server className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-[#11140F] dark:text-white flex items-center gap-2">
              <span>Point Domain to Your Website / Portfolio</span>
              <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[#11140F]/60 dark:text-white/60">
                {isExpanded ? 'Collapse' : 'Setup Guide'}
              </span>
            </h4>
          </div>
          <p className="text-[12px] text-[#11140F]/65 dark:text-white/60">
            Easily connect <span className="font-mono font-semibold text-emerald-700 dark:text-[#34D399]">{domain}</span> to Vercel, Render, or other hosting platforms with free automated SSL.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Platform Selector Segmented Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/10 dark:border-white/10 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setPlatform('vercel');
                if (!isExpanded) setIsExpanded(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                platform === 'vercel'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              <span>▲</span>
              <span>Vercel</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlatform('render');
                if (!isExpanded) setIsExpanded(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                platform === 'render'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              <span>⚡</span>
              <span>Render</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPlatform('netlify');
                if (!isExpanded) setIsExpanded(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                platform === 'netlify'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white'
              }`}
            >
              <span>🌐</span>
              <span>Netlify &amp; Others</span>
            </button>
          </div>

          {/* Dropdown Chevron Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/10 dark:border-white/10 text-[#11140F]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shadow-2xs flex items-center justify-center"
            title={isExpanded ? 'Collapse instructions' : 'Expand full instructions'}
            aria-label={isExpanded ? 'Collapse instructions' : 'Expand full instructions'}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>

      {/* Dynamic Platform Walkthrough: Vercel */}
      {platform === 'vercel' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Step 1: Vercel Project Dashboard */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="font-bold text-xs text-[#11140F] dark:text-white">
                  In your Vercel Project Dashboard
                </span>
              </div>
              <ul className="text-xs text-[#11140F]/75 dark:text-white/70 space-y-1.5 leading-relaxed pl-1">
                <li>• Open the project on Vercel.</li>
                <li>• Go to <strong>Settings ➔ Domains</strong>.</li>
                <li>
                  • Enter <code className="font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-emerald-700 dark:text-[#34D399] font-semibold">{domain}</code> (and <code className="font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-emerald-700 dark:text-[#34D399] font-semibold">www.{domain}</code>) and click <strong>Add</strong>.
                </li>
                <li className="pt-1 text-[11px] text-[#11140F]/55 dark:text-white/50">
                  Vercel will display the required DNS records (A &amp; CNAME).
                </li>
              </ul>
            </div>

            {/* Step 2: Add DNS Records in DynamicQR */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="font-bold text-xs text-[#11140F] dark:text-white">
                    In DynamicQR
                  </span>
                </div>
                {onOpenDnsModal && (
                  <button
                    type="button"
                    onClick={onOpenDnsModal}
                    className="text-[11px] font-bold text-emerald-700 dark:text-[#34D399] hover:underline cursor-pointer"
                  >
                    Open DNS Editor &rarr;
                  </button>
                )}
              </div>

              <div className="text-[11px] text-[#11140F]/70 dark:text-white/65 space-y-1">
                <p>1. Open the <strong>&quot;My Domains&quot;</strong> tab on your storefront.</p>
                <p>2. Click <strong>&quot;DNS Records&quot;</strong> on your {domain} card.</p>
                <p>3. Click <strong>&quot;Add Record&quot;</strong> for each:</p>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                {/* A Record */}
                <div className="p-2 rounded-lg bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/5 dark:border-white/5 flex items-center justify-between gap-2 font-mono">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-sans">
                      A Record · Name: @
                    </span>
                    <span className="text-xs text-[#11140F] dark:text-white font-semibold">76.76.21.21</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('76.76.21.21', 'v-a')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 cursor-pointer transition-colors"
                    title="Copy 76.76.21.21"
                  >
                    {copiedKey === 'v-a' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* CNAME Record */}
                <div className="p-2 rounded-lg bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/5 dark:border-white/5 flex items-center justify-between gap-2 font-mono">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block font-sans">
                      CNAME Record · Name: www
                    </span>
                    <span className="text-xs text-[#11140F] dark:text-white font-semibold truncate max-w-[150px] block">
                      cname.vercel-dns.com
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('cname.vercel-dns.com', 'v-c')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 cursor-pointer transition-colors"
                    title="Copy cname.vercel-dns.com"
                  >
                    {copiedKey === 'v-c' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#11140F]/60 dark:text-white/50 pt-0.5">
                4. Click <strong>Save</strong>.
              </div>
            </div>

            {/* Step 3: Live in 60 Seconds */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="font-bold text-xs text-[#11140F] dark:text-white">
                  Live in 60 Seconds
                </span>
              </div>
              <p className="text-xs text-[#11140F]/75 dark:text-white/70 leading-relaxed">
                Vercel will automatically verify the connection, issue an automatic SSL certificate, and visiting{' '}
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-emerald-700 dark:text-[#34D399] font-bold hover:underline inline-flex items-center gap-0.5"
                >
                  https://{domain}
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                will immediately display your website!
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-[#34D399]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Free Automated SSL</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                  Zero setup required. HTTPS certificates renew automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Platform Walkthrough: Render */}
      {platform === 'render' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Step 1: Render Dashboard */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="font-bold text-xs text-[#11140F] dark:text-white">
                  In your Render Web Service
                </span>
              </div>
              <ul className="text-xs text-[#11140F]/75 dark:text-white/70 space-y-1.5 leading-relaxed pl-1">
                <li>• Open your Web Service in the Render Dashboard.</li>
                <li>• Navigate to <strong>Settings ➔ Custom Domains</strong>.</li>
                <li>
                  • Add <code className="font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-emerald-700 dark:text-[#34D399] font-semibold">{domain}</code> and <code className="font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-emerald-700 dark:text-[#34D399] font-semibold">www.{domain}</code>.
                </li>
                <li className="pt-1 text-[11px] text-[#11140F]/55 dark:text-white/50">
                  Render will show DNS target instructions for root and www.
                </li>
              </ul>
            </div>

            {/* Step 2: Add DNS Records in DynamicQR */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="font-bold text-xs text-[#11140F] dark:text-white">
                    In DynamicQR
                  </span>
                </div>
                {onOpenDnsModal && (
                  <button
                    type="button"
                    onClick={onOpenDnsModal}
                    className="text-[11px] font-bold text-emerald-700 dark:text-[#34D399] hover:underline cursor-pointer"
                  >
                    Open DNS Editor &rarr;
                  </button>
                )}
              </div>

              <div className="text-[11px] text-[#11140F]/70 dark:text-white/65 space-y-1">
                <p>1. Open the <strong>&quot;My Domains&quot;</strong> tab on your storefront.</p>
                <p>2. Click <strong>&quot;DNS Records&quot;</strong> on your {domain} card.</p>
                <p>3. Click <strong>&quot;Add Record&quot;</strong> for each:</p>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                {/* A Record */}
                <div className="p-2 rounded-lg bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/5 dark:border-white/5 flex items-center justify-between gap-2 font-mono">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-sans">
                      A Record · Name: @
                    </span>
                    <span className="text-xs text-[#11140F] dark:text-white font-semibold">216.24.57.1</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('216.24.57.1', 'r-a')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 cursor-pointer transition-colors"
                    title="Copy 216.24.57.1"
                  >
                    {copiedKey === 'r-a' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* CNAME Record */}
                <div className="p-2 rounded-lg bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/5 dark:border-white/5 flex items-center justify-between gap-2 font-mono">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block font-sans">
                      CNAME Record · Name: www
                    </span>
                    <span className="text-xs text-[#11140F] dark:text-white font-semibold truncate max-w-[150px] block">
                      &lt;app&gt;.onrender.com
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${domain.split('.')[0]}.onrender.com`, 'r-c')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 cursor-pointer transition-colors"
                    title="Copy render target"
                  >
                    {copiedKey === 'r-c' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#11140F]/60 dark:text-white/50 pt-0.5">
                4. Click <strong>Save</strong>.
              </div>
            </div>

            {/* Step 3: Verified in Render */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="font-bold text-xs text-[#11140F] dark:text-white">
                  Automated TLS &amp; Verification
                </span>
              </div>
              <p className="text-xs text-[#11140F]/75 dark:text-white/70 leading-relaxed">
                Render automatically provisions Let&apos;s Encrypt certificates. Your Node, Python, Django, or Docker backend will respond directly on{' '}
                <span className="font-mono text-emerald-700 dark:text-[#34D399] font-bold">https://{domain}</span>.
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-[#34D399]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Full-Stack Backends &amp; APIs</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                  Works seamlessly with background workers, WebSockets, and health checks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Platform Walkthrough: Netlify & Others */}
      {platform === 'netlify' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Step 1: Netlify Site Settings */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="font-bold text-xs text-[#11140F] dark:text-white">
                  In your Netlify Dashboard
                </span>
              </div>
              <ul className="text-xs text-[#11140F]/75 dark:text-white/70 space-y-1.5 leading-relaxed pl-1">
                <li>• Go to <strong>Site configuration ➔ Domain management</strong>.</li>
                <li>• Click <strong>Add a custom domain</strong>.</li>
                <li>
                  • Add <code className="font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 text-emerald-700 dark:text-[#34D399] font-semibold">{domain}</code>.
                </li>
                <li className="pt-1 text-[11px] text-[#11140F]/55 dark:text-white/50">
                  Netlify will provide IP and CNAME instructions.
                </li>
              </ul>
            </div>

            {/* Step 2: Add DNS Records in DynamicQR */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span className="font-bold text-xs text-[#11140F] dark:text-white">
                    In DynamicQR
                  </span>
                </div>
                {onOpenDnsModal && (
                  <button
                    type="button"
                    onClick={onOpenDnsModal}
                    className="text-[11px] font-bold text-emerald-700 dark:text-[#34D399] hover:underline cursor-pointer"
                  >
                    Open DNS Editor &rarr;
                  </button>
                )}
              </div>

              <div className="text-[11px] text-[#11140F]/70 dark:text-white/65 space-y-1">
                <p>1. Open the <strong>&quot;My Domains&quot;</strong> tab on your storefront.</p>
                <p>2. Click <strong>&quot;DNS Records&quot;</strong> on your {domain} card.</p>
                <p>3. Click <strong>&quot;Add Record&quot;</strong> for each:</p>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                {/* A Record */}
                <div className="p-2 rounded-lg bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/5 dark:border-white/5 flex items-center justify-between gap-2 font-mono">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block font-sans">
                      A Record · Name: @
                    </span>
                    <span className="text-xs text-[#11140F] dark:text-white font-semibold">100.24.208.97</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('100.24.208.97', 'n-a')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 cursor-pointer transition-colors"
                    title="Copy 100.24.208.97"
                  >
                    {copiedKey === 'n-a' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* CNAME Record */}
                <div className="p-2 rounded-lg bg-[#F7F8F5] dark:bg-white/[0.03] border border-[#11140F]/5 dark:border-white/5 flex items-center justify-between gap-2 font-mono">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block font-sans">
                      CNAME Record · Name: www
                    </span>
                    <span className="text-xs text-[#11140F] dark:text-white font-semibold truncate max-w-[150px] block">
                      &lt;site&gt;.netlify.app
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`${domain.split('.')[0]}.netlify.app`, 'n-c')}
                    className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 cursor-pointer transition-colors"
                    title="Copy netlify target"
                  >
                    {copiedKey === 'n-c' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#11140F]/60 dark:text-white/50 pt-0.5">
                4. Click <strong>Save</strong>.
              </div>
            </div>

            {/* Step 3: Custom VPS & Railway */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#121518] border border-[#11140F]/8 dark:border-white/8 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-[#34D399] text-xs font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="font-bold text-xs text-[#11140F] dark:text-white">
                  Railway, AWS &amp; Custom VPS
                </span>
              </div>
              <p className="text-xs text-[#11140F]/75 dark:text-white/70 leading-relaxed">
                Hosting on a DigitalOcean droplet, AWS EC2, Hetzner, or Railway? Simply enter your server&apos;s public IPv4 address into the <code className="font-mono font-bold text-emerald-700 dark:text-[#34D399]">A Record</code>.
              </p>
              <div className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-[#34D399]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cloudflare DDoS &amp; Edge Routing</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                  Free globally distributed DNS with low-latency edge resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Comparison Summary Table & Pro Tip */}
      <div className="pt-2 border-t border-[#11140F]/8 dark:border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#11140F]/60 dark:text-white/50">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399] shrink-0" />
          <span>
            <strong>Pro Tip:</strong> When using Vercel or Render, leave the proxy toggle <strong>Off (DNS Only)</strong> so your host can verify the SSL certificate instantly.
          </span>
        </div>
        <div className="font-mono text-[11px] text-emerald-700 dark:text-[#34D399] font-bold shrink-0">
          Propagation Time: ~60 Seconds
        </div>
      </div>
        </>
      )}
    </div>
  );
}
