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
  Instagram,
  Send,
  Link2,
  Settings,
  Plus,
  Trash2,
  Edit2,
  ArrowRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_URL } from '@/lib/config';
import { getOptimizedStorageUrl } from '@/lib/media';

export interface CustomLink {
  id?: string;
  title: string;
  url: string;
  subtitle?: string;
}

export interface VCardProps {
  itemId?: string;
  isOwner?: boolean;
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
  customLinks?: CustomLink[];
  rawSpec?: any;
}

function formatInstagramUrl(val: string) {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://instagram.com/${trimmed.replace(/^@/, '')}`;
}

function formatWhatsAppUrl(val: string) {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const digits = trimmed.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}`;
}

function formatTelegramUrl(val: string) {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://t.me/${trimmed.replace(/^@/, '')}`;
}

export default function VCardInteractiveView({
  itemId,
  isOwner = false,
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
  customLinks = [],
  rawSpec,
}: VCardProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'actions' | 'linktree' | 'profile'>('actions');

  // Active Dynamic Card States
  const [activePhone, setActivePhone] = useState(phone || '');
  const [activeEmail, setActiveEmail] = useState(email || '');
  const [activeWebsite, setActiveWebsite] = useState(website || '');
  const [activeBio, setActiveBio] = useState(bio || '');
  const [activeTitle, setActiveTitle] = useState(title || '');
  const [activeCompany, setActiveCompany] = useState(company || '');
  const [activeWhatsapp, setActiveWhatsapp] = useState(whatsapp || '');
  const [activeTelegram, setActiveTelegram] = useState(telegram || '');
  const [activeAddress, setActiveAddress] = useState(address || '');
  const [activeInstagram, setActiveInstagram] = useState(socials?.instagram || '');
  const [activeLinkedin, setActiveLinkedin] = useState(socials?.linkedin || '');
  const [activeTwitter, setActiveTwitter] = useState(socials?.twitter || '');
  const [activeGithub, setActiveGithub] = useState(socials?.github || '');
  const [activeYoutube, setActiveYoutube] = useState(socials?.youtube || '');
  const [activeCustomLinks, setActiveCustomLinks] = useState<CustomLink[]>(customLinks || []);

  // Settings Edit State
  const [editForm, setEditForm] = useState({
    title: title || '',
    company: company || '',
    bio: bio || '',
    phone: phone || '',
    email: email || '',
    website: website || '',
    whatsapp: whatsapp || '',
    telegram: telegram || '',
    address: address || '',
    instagram: socials?.instagram || '',
    linkedin: socials?.linkedin || '',
    twitter: socials?.twitter || '',
    github: socials?.github || '',
    youtube: socials?.youtube || '',
    customLinks: customLinks || [] as CustomLink[],
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Sync props to state if props update
  useEffect(() => {
    setActivePhone(phone || '');
    setActiveEmail(email || '');
    setActiveWebsite(website || '');
    setActiveBio(bio || '');
    setActiveTitle(title || '');
    setActiveCompany(company || '');
    setActiveWhatsapp(whatsapp || '');
    setActiveTelegram(telegram || '');
    setActiveAddress(address || '');
    setActiveInstagram(socials?.instagram || '');
    setActiveLinkedin(socials?.linkedin || '');
    setActiveTwitter(socials?.twitter || '');
    setActiveGithub(socials?.github || '');
    setActiveYoutube(socials?.youtube || '');
    setActiveCustomLinks(customLinks || []);
  }, [phone, email, website, bio, title, company, whatsapp, telegram, address, socials, customLinks]);

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

  const handleOpenSettings = () => {
    setEditForm({
      title: activeTitle,
      company: activeCompany,
      bio: activeBio,
      phone: activePhone,
      email: activeEmail,
      website: activeWebsite,
      whatsapp: activeWhatsapp,
      telegram: activeTelegram,
      address: activeAddress,
      instagram: activeInstagram,
      linkedin: activeLinkedin,
      twitter: activeTwitter,
      github: activeGithub,
      youtube: activeYoutube,
      customLinks: [...activeCustomLinks],
    });
    setSettingsError(null);
    setSettingsSuccess(false);
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) {
      setSettingsError('Card ID is missing');
      return;
    }
    setSavingSettings(true);
    setSettingsError(null);
    try {
      const cleanCustomLinks = editForm.customLinks.filter((l) => l.title.trim() && l.url.trim());
      const updatedSpec = {
        ...(rawSpec || {}),
        title: editForm.title,
        company: editForm.company,
        bio: editForm.bio,
        phone: editForm.phone,
        email: editForm.email,
        website: editForm.website,
        whatsapp: editForm.whatsapp,
        telegram: editForm.telegram,
        address: editForm.address,
        instagram: editForm.instagram,
        linkedin: editForm.linkedin,
        twitter: editForm.twitter,
        github: editForm.github,
        youtube: editForm.youtube,
        customLinks: cleanCustomLinks,
      };

      const res = await fetch(`/api/microsaas/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spec: updatedSpec,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save card settings');
      }

      setActiveTitle(editForm.title);
      setActiveCompany(editForm.company);
      setActiveBio(editForm.bio);
      setActivePhone(editForm.phone);
      setActiveEmail(editForm.email);
      setActiveWebsite(editForm.website);
      setActiveWhatsapp(editForm.whatsapp);
      setActiveTelegram(editForm.telegram);
      setActiveAddress(editForm.address);
      setActiveInstagram(editForm.instagram);
      setActiveLinkedin(editForm.linkedin);
      setActiveTwitter(editForm.twitter);
      setActiveGithub(editForm.github);
      setActiveYoutube(editForm.youtube);
      setActiveCustomLinks(cleanCustomLinks);

      setSettingsSuccess(true);
      setTimeout(() => {
        setShowSettingsModal(false);
        setSettingsSuccess(false);
      }, 1000);
    } catch (err: any) {
      setSettingsError(err.message || 'Error updating card settings');
    } finally {
      setSavingSettings(false);
    }
  };

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

              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="px-2.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white font-medium text-xs border border-white/20 hover:border-emerald-400/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md"
                    title="Customize Quick Actions & Mini Linktree"
                  >
                    <Settings className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Settings</span>
                  </button>
                )}

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
          </div>

          {/* Profile Details: Avatar overlapping banner bottom edge */}
          <div className="text-center space-y-3 !-mt-14 sm:!-mt-16 relative z-20">
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
              {activeTitle && (
                <p style={{ color: activeTheme.accent }} className="text-sm font-semibold mt-0.5">
                  {activeTitle}
                </p>
              )}
              {activeCompany && (
                <div className="inline-flex items-center justify-center gap-2 mt-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 shadow-xs max-w-full">
                  {logoUrl && (
                    <img
                      src={logoSrc}
                      alt={activeCompany}
                      loading="lazy"
                      decoding="async"
                      onError={() => {
                        if (logoSrc !== logoUrl && logoUrl) setLogoSrc(logoUrl);
                      }}
                      className="w-5 h-5 rounded object-contain shrink-0 bg-white/10 p-0.5"
                    />
                  )}
                  <p className={`text-xs font-bold uppercase tracking-wider truncate ${activeTheme.subtext}`}>
                    {activeCompany}
                  </p>
                </div>
              )}
            </div>

            {activeBio && (
              <p className={`text-xs sm:text-[13px] ${activeTheme.subtext} leading-relaxed max-w-xs mx-auto pt-1`}>
                {activeBio}
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

          {/* Extended Action Grid: Call, WhatsApp, Instagram, SMS, Email, Telegram, Website, Directions */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
            {activePhone && (
              <a
                href={`tel:${activePhone}`}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5 truncate">Call</span>
              </a>
            )}

            {activeWhatsapp && (
              <a
                href={formatWhatsAppUrl(activeWhatsapp)}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#25D366]/20 mx-auto flex items-center justify-center text-[#25D366] group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5 truncate">WhatsApp</span>
              </a>
            )}

            {activeInstagram && (
              <a
                href={formatInstagramUrl(activeInstagram)}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 text-[#E1306C] mx-auto flex items-center justify-center group-hover:scale-105 transition-transform border border-[#E1306C]/20">
                  <Instagram className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5 truncate">Instagram</span>
              </a>
            )}

            {activePhone && (
              <a
                href={`sms:${activePhone}`}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5 truncate">SMS</span>
              </a>
            )}

            {activeEmail && (
              <a
                href={`mailto:${activeEmail}`}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5 truncate">Email</span>
              </a>
            )}

            {activeTelegram && (
              <a
                href={formatTelegramUrl(activeTelegram)}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0088cc]/20 mx-auto flex items-center justify-center text-[#29B6F6] group-hover:scale-105 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5 truncate">Telegram</span>
              </a>
            )}

            {activeWebsite && (
              <a
                href={activeWebsite.startsWith('http') ? activeWebsite : `https://${activeWebsite}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5 truncate">Website</span>
              </a>
            )}

            {activeAddress && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(activeAddress)}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-center transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 mx-auto flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-white/80 block mt-1.5 truncate">Directions</span>
              </a>
            )}
          </div>

          {/* Mini Linktree: Custom Featured Links */}
          {activeCustomLinks && activeCustomLinks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 text-white/70">
                  <Sparkles className="w-3 h-3 text-[#34D399]" />
                  Featured Links
                </span>
                <span className="text-[10px] font-mono text-white/40">
                  {activeCustomLinks.length} {activeCustomLinks.length === 1 ? 'Link' : 'Links'}
                </span>
              </div>
              <div className="space-y-2">
                {activeCustomLinks.map((link, idx) => (
                  <a
                    key={link.id || idx}
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#34D399]/40 transition-all text-left shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#34D399] group-hover:scale-105 transition-transform shrink-0">
                        <Link2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate group-hover:text-[#34D399] transition-colors">
                          {link.title}
                        </p>
                        {link.subtitle ? (
                          <p className="text-[10px] text-white/50 truncate">
                            {link.subtitle}
                          </p>
                        ) : (
                          <p className="text-[10px] text-white/40 truncate font-mono">
                            {link.url.replace(/^https?:\/\//, '')}
                          </p>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover:text-white transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Owner Quick Settings Action Bar */}
          {isOwner && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleOpenSettings}
                className="w-full py-2 px-3 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-white/70 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-white/60" />
                <span>Card Settings & Links</span>
              </button>
            </div>
          )}

          {/* Social Links Bar */}
          {(activeLinkedin || activeTwitter || activeGithub || activeYoutube) && (
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
              {activeLinkedin && (
                <a
                  href={activeLinkedin.startsWith('http') ? activeLinkedin : `https://linkedin.com/in/${activeLinkedin.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <span className="font-bold text-xs">in</span>
                </a>
              )}
              {activeTwitter && (
                <a
                  href={activeTwitter.startsWith('http') ? activeTwitter : `https://x.com/${activeTwitter.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <span className="font-bold text-xs">𝕏</span>
                </a>
              )}
              {activeGithub && (
                <a
                  href={activeGithub.startsWith('http') ? activeGithub : `https://github.com/${activeGithub.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <span className="font-bold text-xs">gh</span>
                </a>
              )}
              {activeYoutube && (
                <a
                  href={activeYoutube.startsWith('http') ? activeYoutube : `https://youtube.com/${activeYoutube.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white transition-colors"
                >
                  <span className="font-bold text-xs text-red-400">▶</span>
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

      {/* Modal 3: Card Settings & Mini Linktree (Owner only) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#111310] text-white border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-semibold text-white">Card Settings</h3>
                <p className="text-[11px] text-white/50">Manage contact actions, featured links, and profile details</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs - Sleek, Uncluttered Segmented Control */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setSettingsTab('actions')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer text-center truncate ${
                  settingsTab === 'actions'
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Actions
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('linktree')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer text-center truncate ${
                  settingsTab === 'linktree'
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Links {editForm.customLinks.length > 0 && `(${editForm.customLinks.length})`}
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('profile')}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer text-center truncate ${
                  settingsTab === 'profile'
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Profile
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* TAB 1: ACTIONS */}
              {settingsTab === 'actions' && (
                <div className="space-y-3">
                  {/* WhatsApp */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-white/70 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>WhatsApp Number or Link</span>
                      </label>
                      {editForm.phone && editForm.whatsapp !== editForm.phone && (
                        <button
                          type="button"
                          onClick={() => setEditForm({ ...editForm, whatsapp: editForm.phone })}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                        >
                          Use phone number
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editForm.whatsapp}
                      onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })}
                      placeholder="+234 906 498 2841 or wa.me/..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                    />
                  </div>

                  {/* Instagram & Telegram */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70 flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-[#E1306C]" />
                        <span>Instagram Handle or URL</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.instagram}
                        onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                        placeholder="@username or url"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#29B6F6]" />
                        <span>Telegram Username or Link</span>
                      </label>
                      <input
                        type="text"
                        value={editForm.telegram}
                        onChange={(e) => setEditForm({ ...editForm, telegram: e.target.value })}
                        placeholder="@handle or t.me/..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Phone (Call / SMS)</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+234..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Email Address</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="you@example.com"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Website & Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Website or Portfolio</label>
                      <input
                        type="text"
                        value={editForm.website}
                        onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Office Address / Location</label>
                      <input
                        type="text"
                        value={editForm.address}
                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        placeholder="e.g. Lagos, Nigeria"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MINI LINKTREE */}
              {settingsTab === 'linktree' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">Featured Links</span>
                      <p className="text-[10px] text-white/50">Custom buttons displayed on your contact card</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditForm({
                          ...editForm,
                          customLinks: [
                            ...editForm.customLinks,
                            { id: Date.now().toString(), title: '', url: '' },
                          ],
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add link</span>
                    </button>
                  </div>

                  {editForm.customLinks.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl space-y-1.5">
                      <Link2 className="w-5 h-5 mx-auto text-white/30" />
                      <p className="text-xs text-white/50">No custom links added yet</p>
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            customLinks: [
                              ...editForm.customLinks,
                              { id: Date.now().toString(), title: 'My Portfolio', url: 'https://' },
                            ],
                          })
                        }
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                      >
                        + Add your first link
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                      {editForm.customLinks.map((link, idx) => (
                        <div
                          key={link.id || idx}
                          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5 relative group"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-white/40 font-mono">Link {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...editForm.customLinks];
                                next.splice(idx, 1);
                                setEditForm({ ...editForm, customLinks: next });
                              }}
                              className="text-white/30 hover:text-red-400 p-0.5 rounded transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={link.title}
                              onChange={(e) => {
                                const next = [...editForm.customLinks];
                                next[idx] = { ...next[idx], title: e.target.value };
                                setEditForm({ ...editForm, customLinks: next });
                              }}
                              placeholder="Title (e.g. Schedule Call)"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30"
                            />
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) => {
                                const next = [...editForm.customLinks];
                                next[idx] = { ...next[idx], url: e.target.value };
                                setEditForm({ ...editForm, customLinks: next });
                              }}
                              placeholder="https://..."
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PROFILE & SOCIAL */}
              {settingsTab === 'profile' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Job Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="e.g. Developer"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Company</label>
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                        placeholder="e.g. DynamicQR"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-white/70">Bio / Summary</label>
                    <textarea
                      rows={3}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Brief pitch about what you build..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">LinkedIn</label>
                      <input
                        type="text"
                        value={editForm.linkedin}
                        onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                        placeholder="linkedin.com/in/..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Twitter / X</label>
                      <input
                        type="text"
                        value={editForm.twitter}
                        onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })}
                        placeholder="@handle"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">GitHub</label>
                      <input
                        type="text"
                        value={editForm.github}
                        onChange={(e) => setEditForm({ ...editForm, github: e.target.value })}
                        placeholder="username"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">YouTube</label>
                      <input
                        type="text"
                        value={editForm.youtube}
                        onChange={(e) => setEditForm({ ...editForm, youtube: e.target.value })}
                        placeholder="channel"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {settingsError && (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
                  {settingsError}
                </div>
              )}

              {settingsSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>Settings saved successfully</span>
                </div>
              )}

              {/* Modal Footer with Clean Layout and Direct Open Hub Link */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <Link
                  href="/#workspace?section=vcard"
                  className="text-[11px] text-white/50 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>Open Hub</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
