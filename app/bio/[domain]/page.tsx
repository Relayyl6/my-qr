import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { APP_URL } from '@/lib/config';
import { QRCodeSVG } from 'qrcode.react';
import BioContactForm from './BioContactForm';
import BioQuickActions from './BioQuickActions';
import {
  Globe,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Download,
  ShieldCheck,
  Sparkles,
  QrCode,
  CheckCircle2,
  Lock,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain: rawDomain } = await params;
  const domain = decodeURIComponent(rawDomain).toLowerCase();
  const order = await prisma.domainOrder.findFirst({
    where: { domainName: domain },
  });

  const title = order?.domainName ? `${order.domainName} — Official Launch Hub` : `${domain} — DynamicQR`;
  const desc = `Official bio and contact portal for ${domain}. Save contact details or get in touch.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `https://${domain}`,
    },
  };
}

export default async function DomainBioPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: rawDomain } = await params;
  const domain = decodeURIComponent(rawDomain).toLowerCase();

  const order = await prisma.domainOrder.findFirst({
    where: { domainName: domain },
  });

  // If order has an active URL redirect, perform the HTTP redirect
  if (order?.urlRedirectUrl) {
    const redirectType = order.urlRedirectType === '302' ? 302 : 301;
    redirect(order.urlRedirectUrl);
  }

  const bioConfig = (order?.bioConfig as any) || {};
  const businessTitle = bioConfig.title || order?.domainName || domain;
  const tagline =
    bioConfig.bio ||
    'Our official website is currently in development. You can save our digital contact card or reach out directly below.';
  const primaryEmail = order ? `${order.desiredAlias}@${order.domainName}` : `hello@${domain}`;
  const whatsappNumber = bioConfig.whatsapp || null;
  const phoneNumber = bioConfig.phone || null;
  const instagramHandle = bioConfig.instagram || null;
  const avatarUrl = bioConfig.avatarUrl || null;

  const vcardDownloadUrl = `/api/domains/vcard?domain=${encodeURIComponent(domain)}${order ? `&orderId=${order.id}` : ''}`;
  const publicDomainUrl = `https://${domain}`;

  return (
    <div className="min-h-screen bg-[#0C0F0D] text-white flex flex-col items-center justify-center px-4 py-8 sm:py-14 selection:bg-emerald-500/20 font-sans">
      <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
        
        {/* Top Floating Badge Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-white/10 text-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Brand Hub • Coming Soon</span>
          </div>
          <div className="flex items-center gap-3 text-white/50 text-[11.5px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Edge SSL Verified</span>
            </span>
            <span>•</span>
            <span>{domain}</span>
          </div>
        </div>

        {/* Dual-Column Responsive Grid (Full Operability on Desktop + Mobile) */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Brand Identity & Quick Contact Channels (5 Cols) */}
          <section className="lg:col-span-5 space-y-6 bg-white/[0.02] border border-white/8 rounded-3xl p-6 sm:p-7 shadow-2xl">
            {/* Header & Logo */}
            <div className="space-y-4">
              {avatarUrl ? (
                <div className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt={businessTitle}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-xl"
                  />
                </div>
              ) : (
                <div className="mb-2">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black text-2xl shadow-lg border border-white/10">
                    {businessTitle.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              )}

              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                  {businessTitle}
                </h1>
                <p className="text-[13.5px] text-white/70 leading-relaxed mt-2">
                  {tagline}
                </p>
              </div>
            </div>

            {/* Quick Actions Component (Save vCard, Copy Details, Share) */}
            <BioQuickActions
              domain={domain}
              businessTitle={businessTitle}
              primaryEmail={primaryEmail}
              phoneNumber={phoneNumber}
              whatsappNumber={whatsappNumber}
              vcardDownloadUrl={vcardDownloadUrl}
            />

            {/* Direct Communication Channels */}
            <div className="space-y-2 pt-1 border-t border-white/8">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider block">
                Direct Channels
              </span>

              <a
                href={`mailto:${primaryEmail}`}
                className="flex items-center justify-between p-3 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[13px] font-medium group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{primaryEmail}</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono font-semibold">Email</span>
              </a>

              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[13px] font-medium group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">WhatsApp Chat</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">Chat</span>
                </a>
              )}

              {phoneNumber && (
                <a
                  href={`tel:${phoneNumber}`}
                  className="flex items-center justify-between p-3 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[13px] font-medium group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">{phoneNumber}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">Call</span>
                </a>
              )}

              {instagramHandle && (
                <a
                  href={`https://instagram.com/${instagramHandle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[13px] font-medium group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Instagram className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="truncate">@{instagramHandle.replace(/^@/, '')}</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">Follow</span>
                </a>
              )}
            </div>

            {/* Desktop Scanner Card */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center gap-4">
              <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                <QRCodeSVG value={publicDomainUrl} size={84} level="M" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Scan to Mobile</span>
                </p>
                <p className="text-[11.5px] text-white/55 leading-relaxed">
                  Scan with your phone camera to instantly load this brand card onto mobile.
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Interactive Lead Inquiry Suite & Status Portal (7 Cols) */}
          <section className="lg:col-span-7 space-y-6">
            {/* Lead Inquiry & Direct Message Form */}
            <BioContactForm domainName={domain} />

            {/* Platform Trust & Response Policy Card */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/8 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white/90">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Communication Policy</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Priority Inbox
                </span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Messages sent through this portal are routed directly to the verified email address of <span className="font-semibold text-white">{businessTitle}</span> with deliverability protection and spam shield active.
              </p>
              <div className="pt-2 border-t border-white/8 flex items-center justify-between text-[11px] text-white/40">
                <span>DNS &amp; Root Zone: Cloudflare</span>
                <span>Powered by DynamicQR NameLaunch</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
