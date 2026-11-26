import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Metadata } from 'next';
import { APP_URL } from '@/lib/config';
import { QRCodeSVG } from 'qrcode.react';
import BioContactForm from './BioContactForm';
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
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { domain: string };
}): Promise<Metadata> {
  const domain = decodeURIComponent(params.domain).toLowerCase();
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
  params: { domain: string };
}) {
  const domain = decodeURIComponent(params.domain).toLowerCase();

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
    <div className="min-h-screen bg-[#0C0F0D] text-white flex flex-col items-center justify-start px-4 py-8 sm:py-14 selection:bg-emerald-500/20 font-sans">
      <main className="w-full max-w-[460px] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* 1. Header & Identity */}
        <header className="text-center space-y-3 pt-2">
          {avatarUrl ? (
            <div className="flex justify-center mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt={businessTitle}
                className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/40 shadow-xl"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black text-2xl shadow-lg border border-white/10">
                {businessTitle.slice(0, 2).toUpperCase()}
              </div>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11.5px] font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Brand Hub • Coming Soon</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            {businessTitle}
          </h1>

          <p className="text-[14px] text-white/70 leading-relaxed max-w-[380px] mx-auto">
            {tagline}
          </p>
        </header>

        {/* 2. Primary 1-Click vCard Action */}
        <div className="pt-1">
          <a
            href={vcardDownloadUrl}
            className="group flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-[#09110D] font-bold text-[15px] shadow-lg shadow-emerald-500/15 transition-all text-center"
          >
            <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Save Contact to Phone (vCard)</span>
          </a>
        </div>

        {/* 3. Communication Channels */}
        <section className="space-y-2.5">
          <a
            href={`mailto:${primaryEmail}`}
            className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-all text-[14px] font-medium"
          >
            <div className="flex items-center gap-3 truncate">
              <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{primaryEmail}</span>
            </div>
            <span className="text-[11.5px] text-emerald-400 font-mono font-semibold">Email</span>
          </a>

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-all text-[14px] font-medium"
            >
              <div className="flex items-center gap-3 truncate">
                <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">WhatsApp Chat</span>
              </div>
              <span className="text-[11.5px] text-emerald-400 font-mono font-semibold">Chat</span>
            </a>
          )}

          {phoneNumber && (
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-all text-[14px] font-medium"
            >
              <div className="flex items-center gap-3 truncate">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{phoneNumber}</span>
              </div>
              <span className="text-[11.5px] text-emerald-400 font-mono font-semibold">Call</span>
            </a>
          )}

          {instagramHandle && (
            <a
              href={`https://instagram.com/${instagramHandle.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 transition-all text-[14px] font-medium"
            >
              <div className="flex items-center gap-3 truncate">
                <Instagram className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="truncate">@{instagramHandle.replace(/^@/, '')}</span>
              </div>
              <span className="text-[11.5px] text-emerald-400 font-mono font-semibold">Follow</span>
            </a>
          )}
        </section>

        {/* 4. Interactive Lead Inquiry Form */}
        <section className="pt-2">
          <BioContactForm domainName={domain} />
        </section>

        {/* 5. Desktop QR Code Scanner */}
        <div className="hidden sm:flex flex-col items-center justify-center p-4 rounded-2xl bg-white/3 border border-white/8 text-center space-y-2">
          <div className="p-2.5 bg-white rounded-xl shadow-md">
            <QRCodeSVG value={publicDomainUrl} size={110} level="M" />
          </div>
          <p className="text-[11.5px] text-white/50">
            Scan with your phone camera to open or save contact instantly
          </p>
        </div>

        {/* 6. Security Footer */}
        <footer className="pt-4 text-center space-y-1.5 text-[11px] text-white/40">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400/80">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Edge SSL & DMARC Verified</span>
          </div>
          <p>Powered by DynamicQR NameLaunch</p>
        </footer>
      </main>
    </div>
  );
}
