'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Globe,
  UserPlus,
  Share2,
  MapPin,
  ExternalLink,
  MessageCircle,
  MessageSquare,
  QrCode,
  X,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_URL } from '@/lib/config';

export interface VCardProps {
  slug: string;
  fullName: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  bio: string;
  address?: string;
  whatsapp?: string;
  telegram?: string;
  theme?: string;
  accentColor?: string;
  showBranding: boolean;
  socials: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    github?: string;
    youtube?: string;
  };
}

export default function VCardInteractiveView({
  slug,
  fullName,
  title,
  company,
  phone,
  email,
  website,
  bio,
  address,
  whatsapp,
  telegram,
  theme = 'minimal_dark',
  accentColor,
  showBranding,
  socials,
}: VCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  // Exchange contact state
  const [exchangeName, setExchangeName] = useState('');
  const [exchangeEmail, setExchangeEmail] = useState('');
  const [exchangePhone, setExchangePhone] = useState('');
  const [exchanging, setExchanging] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'QR';

  const cardUrl = typeof window !== 'undefined' ? window.location.href : `${APP_URL}/c/${slug}`;

  // Theme styling definitions
  const themeStyles: Record<string, { bg: string; cardBg: string; text: string; subtext: string; border: string; accent: string }> = {
    minimal_dark: {
      bg: 'bg-[#090A09]',
      cardBg: 'bg-[#121411]',
      text: 'text-white',
      subtext: 'text-white/60',
      border: 'border-white/10',
      accent: accentColor || '#34D399',
    },
    executive_white: {
      bg: 'bg-[#EEF0EA]',
      cardBg: 'bg-white',
      text: 'text-[#11140F]',
      subtext: 'text-[#11140F]/60',
      border: 'border-[#11140F]/10',
      accent: accentColor || '#11140F',
    },
    emerald_luxe: {
      bg: 'bg-[#0F1C15]',
      cardBg: 'bg-[#16291F]',
      text: 'text-white',
      subtext: 'text-[#96A689]',
      border: 'border-[#2F6B4F]/30',
      accent: accentColor || '#34D399',
    },
    sunset_glow: {
      bg: 'bg-[#1A1215]',
      cardBg: 'bg-gradient-to-b from-[#2D1B22] to-[#1E1418]',
      text: 'text-white',
      subtext: 'text-[#E5A8B8]',
      border: 'border-[#E5A8B8]/20',
      accent: accentColor || '#F43F5E',
    },
    oceanic_blue: {
      bg: 'bg-[#0A121E]',
      cardBg: 'bg-[#0F1C2E]',
      text: 'text-white',
      subtext: 'text-[#93C5FD]',
      border: 'border-[#3B82F6]/25',
      accent: accentColor || '#38BDF8',
    },
    monochrome_slate: {
      bg: 'bg-[#18181B]',
      cardBg: 'bg-[#27272A]',
      text: 'text-white',
      subtext: 'text-[#A1A1AA]',
      border: 'border-white/10',
      accent: accentColor || '#F4F4F5',
    },
  };

  const activeTheme = themeStyles[theme] || themeStyles.minimal_dark;

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeEmail) return;

    setExchanging(true);
    try {
      const res = await fetch(`/api/vcard/${slug}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exchangeName,
          email: exchangeEmail,
          phone: exchangePhone,
        }),
      });
      if (res.ok) {
        setExchangeSuccess(true);
        setTimeout(() => {
          setShowExchangeModal(false);
          setExchangeSuccess(false);
        }, 2200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExchanging(false);
    }
  };

  return (
    <div className={`min-h-screen ${activeTheme.bg} flex flex-col justify-between items-center p-4 sm:p-6 selection:bg-[#2F6B4F] selection:text-white transition-colors`}>
      <div className="w-full max-w-md my-auto space-y-5">
        
        {/* Main Card */}
        <div className={`${activeTheme.cardBg} rounded-lg border ${activeTheme.border} p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden backdrop-blur-md`}>
          
          {/* Top Actions: QR Share & Exchange */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowQrModal(true)}
              className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Share QR</span>
            </button>

            <button
              onClick={() => setShowExchangeModal(true)}
              className="px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Exchange Info</span>
            </button>
          </div>

          {/* Profile Details */}
          <div className="text-center space-y-3 pt-1">
            <div
              style={{ borderColor: activeTheme.accent }}
              className="w-24 h-24 mx-auto rounded-full bg-black/40 text-white flex items-center justify-center text-3xl font-extrabold tracking-wider shadow-lg border-2"
            >
              {initials}
            </div>

            <div>
              <h1 className={`text-2xl font-black ${activeTheme.text} tracking-tight`}>
                {fullName}
              </h1>
              {title && (
                <p style={{ color: activeTheme.accent }} className="text-sm font-semibold mt-0.5">
                  {title}
                </p>
              )}
              {company && (
                <p className={`text-xs font-bold uppercase tracking-wider ${activeTheme.subtext} mt-0.5`}>
                  {company}
                </p>
              )}
            </div>

            {bio && (
              <p className={`text-xs sm:text-[13px] ${activeTheme.subtext} leading-relaxed max-w-xs mx-auto pt-1`}>
                {bio}
              </p>
            )}
          </div>

          {/* Primary Action Button: Save Contact */}
          <div className="pt-1">
            <a
              href={`/api/vcard/${slug}/download`}
              style={{ backgroundColor: activeTheme.accent, color: theme === 'executive_white' ? '#fff' : '#000' }}
              className="w-full py-3 px-6 rounded-md font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Save Contact to Phone</span>
            </a>
          </div>

          {/* Extended Action Grid: Call, SMS, WhatsApp, Email, Telegram, Maps */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="p-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5">Call</span>
              </a>
            )}

            {phone && (
              <a
                href={`sms:${phone}`}
                className="p-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5">SMS</span>
              </a>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-[#25D366]/20 mx-auto flex items-center justify-center text-[#25D366] group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5">WhatsApp</span>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="p-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5">Email</span>
              </a>
            )}

            {address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5">Directions</span>
              </a>
            )}

            {website && (
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5">Website</span>
              </a>
            )}
          </div>

          {/* Social Links Bar */}
          {Object.values(socials).some(Boolean) && (
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
              {socials.linkedin && (
                <a
                  href={socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <span className="font-bold text-xs">in</span>
                </a>
              )}
              {socials.twitter && (
                <a
                  href={socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <span className="font-bold text-xs">𝕏</span>
                </a>
              )}
              {socials.instagram && (
                <a
                  href={socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <span className="font-bold text-xs">ig</span>
                </a>
              )}
              {socials.github && (
                <a
                  href={socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <span className="font-bold text-xs">gh</span>
                </a>
              )}
            </div>
          )}

        </div>

        {/* Powered by DynamicQR Footer Badge */}
        {showBranding && (
          <div className="text-center pt-1">
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 border border-white/10 text-[11px] text-white/60 hover:text-white transition-colors"
            >
              <span>Powered by</span>
              <strong className="text-white underline">Dynamic QR</strong>
            </a>
          </div>
        )}

      </div>

      {/* Modal 1: Fullscreen QR Share */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white rounded-lg p-6 shadow-2xl text-center space-y-4 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-gray-900">{fullName}</h3>
              <p className="text-xs text-gray-500">Scan to save contact directly to phone</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-md inline-block border border-gray-100 shadow-inner">
              <QRCodeSVG value={cardUrl} size={220} level="M" />
            </div>

            <p className="text-[11px] text-gray-400 font-mono">{cardUrl}</p>
          </div>
        </div>
      )}

      {/* Modal 2: Exchange Contact Lead Capture Form */}
      {showExchangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#121411] text-white border border-white/15 rounded-lg p-6 sm:p-7 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowExchangeModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#34D399]" />
                Exchange Contact Info
              </h3>
              <p className="text-xs text-white/60">
                Send your details to {fullName}. You will be connected instantly!
              </p>
            </div>

            {exchangeSuccess ? (
              <div className="p-4 rounded-md bg-[#2F6B4F]/20 border border-[#34D399]/30 text-[#34D399] text-center text-sm font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Contact info sent successfully!
              </div>
            ) : (
              <form onSubmit={handleExchangeSubmit} className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Your Full Name</label>
                  <input
                    type="text"
                    value={exchangeName}
                    onChange={(e) => setExchangeName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Your Email Address</label>
                  <input
                    type="email"
                    value={exchangeEmail}
                    onChange={(e) => setExchangeEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/80">Phone Number (optional)</label>
                  <input
                    type="tel"
                    value={exchangePhone}
                    onChange={(e) => setExchangePhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#34D399]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowExchangeModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exchanging}
                    className="px-5 py-2.5 rounded-xl bg-[#34D399] text-[#11140F] text-xs font-bold hover:bg-[#34D399]/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {exchanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send My Info'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
