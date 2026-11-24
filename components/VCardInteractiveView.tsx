'use client';

import { useState, useEffect } from 'react';
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
import { getOptimizedStorageUrl } from '@/lib/media';

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
  avatarUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
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
  avatarUrl,
  logoUrl,
  bannerUrl,
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
  const [avatarError, setAvatarError] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(getOptimizedStorageUrl(avatarUrl) || avatarUrl || '');
  const [logoSrc, setLogoSrc] = useState(getOptimizedStorageUrl(logoUrl) || logoUrl || '');
  const [bannerSrc, setBannerSrc] = useState(getOptimizedStorageUrl(bannerUrl) || bannerUrl || '');

  useEffect(() => {
    setAvatarSrc(getOptimizedStorageUrl(avatarUrl) || avatarUrl || '');
    setAvatarError(false);
  }, [avatarUrl]);

  useEffect(() => {
    setBannerSrc(getOptimizedStorageUrl(bannerUrl) || bannerUrl || '');
  }, [bannerUrl]);

  useEffect(() => {
    setLogoSrc(getOptimizedStorageUrl(logoUrl) || logoUrl || '');
  }, [logoUrl]);

  const handleAvatarError = () => {
    if (avatarSrc !== avatarUrl && avatarUrl) {
      setAvatarSrc(avatarUrl);
    } else {
      setAvatarError(true);
    }
  };

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
        <div className={`${activeTheme.cardBg} rounded-2xl border ${activeTheme.border} p-6 sm:p-8 shadow-xl space-y-6 relative overflow-hidden backdrop-blur-md`}>
          {/* Header Cover Banner - Background for top buttons with overlapping avatar */}
          <div className="-mx-6 -mt-6 sm:-mx-8 sm:-mt-8 relative h-44 sm:h-48 overflow-hidden rounded-t-2xl bg-[#090A09]">
            {bannerUrl ? (
              <img
                src={bannerSrc || bannerUrl}
                alt="Cover Banner"
                loading="eager"
                decoding="async"
                onError={() => {
                  if (bannerSrc !== bannerUrl && bannerUrl) setBannerSrc(bannerUrl);
                }}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-950/70 via-[#101914] to-[#0A0E0C] relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:16px_16px]" />
              </div>
            )}
            {/* Subtle gradient vignette to blend into card */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35 pointer-events-none" />

            {/* Top Action Buttons: Floating directly over the banner */}
            <div className="absolute top-4 inset-x-4 sm:inset-x-6 flex items-center justify-between z-20">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white/95 hover:text-white border border-white/20 transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer backdrop-blur-md shadow-lg"
              >
                <QrCode className="w-4 h-4" />
                <span>Share QR</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExchangeModal(true)}
                className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white font-medium text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Exchange Info</span>
              </button>
            </div>
          </div>

          {/* Profile Details: Avatar overlapping banner bottom edge */}
          <div className="text-center space-y-3 -mt-16 sm:-mt-18 relative z-20">
            <div
              style={{ borderColor: activeTheme.accent }}
              className={`w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-full overflow-hidden shadow-2xl border-3 ${activeTheme.cardBg === 'bg-white' ? 'ring-white' : 'ring-black/80'} ring-4 shrink-0 relative bg-black flex items-center justify-center`}
            >
              {/* Fallback initials */}
              <span className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white select-none">
                {initials}
              </span>

              {/* Profile Image: crisp render over initials */}
              {avatarUrl && !avatarError && (
                <img
                  src={avatarSrc || avatarUrl}
                  alt={fullName}
                  loading="eager"
                  decoding="async"
                  onError={handleAvatarError}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                />
              )}
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
                <div className="inline-flex items-center justify-center gap-2 mt-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 shadow-xs max-w-full">
                  {logoUrl && (
                    <img
                      src={logoSrc}
                      alt={company}
                      loading="lazy"
                      decoding="async"
                      onError={() => {
                        if (logoSrc !== logoUrl && logoUrl) setLogoSrc(logoUrl);
                      }}
                      className="w-5 h-5 rounded object-contain shrink-0 bg-white/10 p-0.5"
                    />
                  )}
                  <p className={`text-xs font-bold uppercase tracking-wider truncate ${activeTheme.subtext}`}>
                    {company}
                  </p>
                </div>
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
