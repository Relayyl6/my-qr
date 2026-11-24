'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Flag,
  Copy,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_URL } from '@/lib/config';
import { getOptimizedStorageUrl } from '@/lib/media';

// --- Brand SVG Glyphs (Linktree Style Circular Icons) ---
function FacebookGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25.7-.72 1.33-1.4 1.71-.58.32-1.32.48-2.64.08-1.57-.48-3.03-1.44-4.18-2.58-1.14-1.15-2.1-2.6-2.58-4.18-.4-1.32-.24-2.06.08-2.64.38-.68 1.01-1.15 1.71-1.4.22-.08.47-.1.7-.02.26.09.43.37.54.61.35.79.84 1.95.94 2.15.11.22.13.43.02.66-.11.23-.22.42-.38.61-.17.18-.34.33-.48.49-.16.18-.19.33-.09.52.4.77 1.05 1.63 1.83 2.38.75.78 1.61 1.43 2.38 1.83.19.1.34.07.52-.09.16-.14.31-.31.49-.48.19-.16.38-.27.61-.38.23-.11.44-.09.66.02.2.1 1.36.59 2.15.94.24.11.52.28.61.54.08.23.06.48-.02.7" />
    </svg>
  );
}

function TikTokGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.41a6.33 6.33 0 0 0-.85-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 10.78 4.48 6.27 6.27 0 0 0 1.9-4.5V9.08a8.16 8.16 0 0 0 5.17 1.83V7.47a4.85 4.85 0 0 1-1.4-.78z" />
    </svg>
  );
}

function SpotifyGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.206c-2.348-1.435-5.304-1.76-8.785-.964a.625.625 0 1 1-.278-1.218c3.807-.872 7.075-.5 9.714 1.119a.623.623 0 0 1 .206.857zm1.224-2.72a.78.78 0 0 1-1.073.257c-2.688-1.652-6.786-2.131-9.965-1.166a.78.78 0 1 1-.453-1.492c3.632-1.103 8.147-.568 11.234 1.328a.78.78 0 0 1 .257 1.073zm.105-2.835C14.692 8.947 9.38 8.77 6.287 9.71a.936.936 0 1 1-.543-1.792c3.555-1.079 9.428-.87 13.197 1.368a.937.937 0 0 1-.941 1.624z" />
    </svg>
  );
}

function YouTubeGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.58 7.19a2.76 2.76 0 0 0-1.94-1.95C17.92 4.7 12 4.7 12 4.7s-5.92 0-7.64.54A2.76 2.76 0 0 0 2.42 7.19 28.96 28.96 0 0 0 2 12a28.96 28.96 0 0 0 .42 4.81 2.76 2.76 0 0 0 1.94 1.95c1.72.54 7.64.54 7.64.54s5.92 0 7.64-.54a2.76 2.76 0 0 0 1.94-1.95 28.96 28.96 0 0 0 .42-4.81 28.96 28.96 0 0 0-.42-4.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
    </svg>
  );
}

function AppleMusicGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  );
}

function LinkedInGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 1 0 1.6 1.6 1.6 1.6 0 0 0-1.6-1.6z" />
    </svg>
  );
}

function GitHubGlyph({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

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
    tiktok?: string;
    spotify?: string;
    facebook?: string;
    appleMusic?: string;
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

function formatSocialUrl(val: string, prefixDomain: string) {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${prefixDomain}${trimmed.replace(/^@/, '')}`;
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareViewMode, setShareViewMode] = useState<'preview' | 'qr'>('preview');
  const [copied, setCopied] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportSuccess, setReportSuccess] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [showCookieModal, setShowCookieModal] = useState(false);
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
  const [activeTiktok, setActiveTiktok] = useState(socials?.tiktok || '');
  const [activeSpotify, setActiveSpotify] = useState(socials?.spotify || '');
  const [activeFacebook, setActiveFacebook] = useState(socials?.facebook || '');
  const [activeAppleMusic, setActiveAppleMusic] = useState(socials?.appleMusic || '');
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
    tiktok: socials?.tiktok || '',
    spotify: socials?.spotify || '',
    facebook: socials?.facebook || '',
    appleMusic: socials?.appleMusic || '',
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
    setActiveTiktok(socials?.tiktok || '');
    setActiveSpotify(socials?.spotify || '');
    setActiveFacebook(socials?.facebook || '');
    setActiveAppleMusic(socials?.appleMusic || '');
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
      tiktok: activeTiktok,
      spotify: activeSpotify,
      facebook: activeFacebook,
      appleMusic: activeAppleMusic,
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
        tiktok: editForm.tiktok,
        spotify: editForm.spotify,
        facebook: editForm.facebook,
        appleMusic: editForm.appleMusic,
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
      setActiveTiktok(editForm.tiktok);
      setActiveSpotify(editForm.spotify);
      setActiveFacebook(editForm.facebook);
      setActiveAppleMusic(editForm.appleMusic);
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

  const handleSendReport = async () => {
    setSubmittingReport(true);
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'vcard',
          targetSlug: slug,
          targetTitle: fullName,
          reason: reportReason,
          details: `Reported by user from card /c/${slug}`,
        }),
      });
      setReportSuccess(true);
    } catch {
      setReportSuccess(true);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareNative = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} • Digital Business Card`,
          text: `Connect with ${fullName} on DynamicQR:`,
          url: cardUrl,
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const circularActions = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      href: string;
      icon: any;
      color: string;
    }> = [];

    if (activePhone) {
      list.push({
        id: 'call',
        title: 'Call',
        href: `tel:${activePhone}`,
        icon: Phone,
        color: 'hover:text-emerald-400 hover:border-emerald-500/40',
      });
    }

    if (activeWhatsapp) {
      list.push({
        id: 'whatsapp',
        title: 'WhatsApp',
        href: formatWhatsAppUrl(activeWhatsapp),
        icon: WhatsAppGlyph,
        color: 'hover:text-[#25D366] hover:border-[#25D366]/40',
      });
    }

    if (activeInstagram) {
      list.push({
        id: 'instagram',
        title: 'Instagram',
        href: formatSocialUrl(activeInstagram, 'instagram.com/'),
        icon: Instagram,
        color: 'hover:text-[#E1306C] hover:border-[#E1306C]/40',
      });
    }

    if (activeTiktok) {
      list.push({
        id: 'tiktok',
        title: 'TikTok',
        href: formatSocialUrl(activeTiktok, 'tiktok.com/@'),
        icon: TikTokGlyph,
        color: 'hover:text-[#ff0050] hover:border-[#ff0050]/40',
      });
    }

    if (activeSpotify) {
      list.push({
        id: 'spotify',
        title: 'Spotify',
        href: formatSocialUrl(activeSpotify, 'open.spotify.com/'),
        icon: SpotifyGlyph,
        color: 'hover:text-[#1DB954] hover:border-[#1DB954]/40',
      });
    }

    if (activeYoutube) {
      list.push({
        id: 'youtube',
        title: 'YouTube',
        href: formatSocialUrl(activeYoutube, 'youtube.com/'),
        icon: YouTubeGlyph,
        color: 'hover:text-[#FF0000] hover:border-[#FF0000]/40',
      });
    }

    if (activeAppleMusic) {
      list.push({
        id: 'applemusic',
        title: 'Apple Music',
        href: formatSocialUrl(activeAppleMusic, 'music.apple.com/'),
        icon: AppleMusicGlyph,
        color: 'hover:text-[#FC3C44] hover:border-[#FC3C44]/40',
      });
    }

    if (activeTwitter) {
      list.push({
        id: 'x',
        title: 'X',
        href: formatSocialUrl(activeTwitter, 'x.com/'),
        icon: XGlyph,
        color: 'hover:text-white hover:border-white/40',
      });
    }

    if (activeLinkedin) {
      list.push({
        id: 'linkedin',
        title: 'LinkedIn',
        href: formatSocialUrl(activeLinkedin, 'linkedin.com/in/'),
        icon: LinkedInGlyph,
        color: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/40',
      });
    }

    if (activeFacebook) {
      list.push({
        id: 'facebook',
        title: 'Facebook',
        href: formatSocialUrl(activeFacebook, 'facebook.com/'),
        icon: FacebookGlyph,
        color: 'hover:text-[#1877F2] hover:border-[#1877F2]/40',
      });
    }

    if (activeGithub) {
      list.push({
        id: 'github',
        title: 'GitHub',
        href: formatSocialUrl(activeGithub, 'github.com/'),
        icon: GitHubGlyph,
        color: 'hover:text-white hover:border-white/40',
      });
    }

    if (activeEmail) {
      list.push({
        id: 'email',
        title: 'Email',
        href: `mailto:${activeEmail}`,
        icon: Mail,
        color: 'hover:text-sky-400 hover:border-sky-500/40',
      });
    }

    if (activePhone) {
      list.push({
        id: 'sms',
        title: 'SMS',
        href: `sms:${activePhone}`,
        icon: MessageSquare,
        color: 'hover:text-teal-400 hover:border-teal-500/40',
      });
    }

    if (activeTelegram) {
      list.push({
        id: 'telegram',
        title: 'Telegram',
        href: formatTelegramUrl(activeTelegram),
        icon: Send,
        color: 'hover:text-[#29B6F6] hover:border-[#29B6F6]/40',
      });
    }

    if (activeWebsite) {
      list.push({
        id: 'website',
        title: 'Website',
        href: activeWebsite.startsWith('http') ? activeWebsite : `https://${activeWebsite}`,
        icon: Globe,
        color: 'hover:text-emerald-400 hover:border-emerald-500/40',
      });
    }

    if (activeAddress) {
      list.push({
        id: 'directions',
        title: 'Directions',
        href: `https://maps.google.com/?q=${encodeURIComponent(activeAddress)}`,
        icon: MapPin,
        color: 'hover:text-rose-400 hover:border-rose-500/40',
      });
    }

    return list;
  }, [
    activePhone,
    activeWhatsapp,
    activeInstagram,
    activeTiktok,
    activeSpotify,
    activeYoutube,
    activeAppleMusic,
    activeTwitter,
    activeLinkedin,
    activeFacebook,
    activeGithub,
    activeEmail,
    activeTelegram,
    activeWebsite,
    activeAddress,
  ]);

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
        
        {/* Main Card - Clean, Calm, Uncluttered Container */}
        <div className={`${activeTheme.cardBg} rounded-3xl border ${activeTheme.border} p-5 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-md`}>
          {/* Header Cover Banner */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 relative h-36 sm:h-40 overflow-hidden rounded-t-3xl bg-[#090A09]">
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
            {/* Soft vignette to blend banner into card background */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

            {/* Top Action Buttons: Sleek Frosted Glass Pills */}
            <div className="absolute top-3.5 inset-x-3.5 sm:inset-x-5 flex items-center justify-between z-20">
              <button
                type="button"
                onClick={() => {
                  setShareViewMode('preview');
                  setShowShareModal(true);
                }}
                className="px-3 py-1.5 rounded-full bg-black/45 hover:bg-black/70 text-white/95 hover:text-white border border-white/15 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer backdrop-blur-md shadow-sm"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <button
                    type="button"
                    onClick={handleOpenSettings}
                    className="px-3 py-1.5 rounded-full bg-black/45 hover:bg-black/70 text-white font-medium text-xs border border-white/15 hover:border-emerald-400/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm backdrop-blur-md"
                    title="Customize Quick Actions & Mini Linktree"
                  >
                    <Settings className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Settings</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowExchangeModal(true)}
                  className="px-3.5 py-1.5 rounded-full bg-black/45 hover:bg-black/70 text-white font-medium text-xs border border-white/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm backdrop-blur-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Exchange Info</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Details: Balanced avatar and clean typography */}
          <div className="text-center space-y-2.5 !-mt-12 sm:!-mt-14 relative z-20">
            <div
              style={{ borderColor: activeTheme.accent }}
              className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden shadow-2xl border-2 ${activeTheme.cardBg === 'bg-white' ? 'ring-white' : 'ring-black/70'} ring-4 shrink-0 relative bg-black flex items-center justify-center`}
            >
              {/* Fallback initials */}
              <span className="text-xl sm:text-2xl font-bold tracking-wider text-white select-none">
                {initials}
              </span>

              {/* Profile Image */}
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
              <h1 className={`text-xl sm:text-2xl font-black ${activeTheme.text} tracking-tight`}>
                {fullName}
              </h1>
              {activeTitle && (
                <p style={{ color: activeTheme.accent }} className="text-xs sm:text-sm font-semibold mt-0.5 tracking-wide">
                  {activeTitle}
                </p>
              )}
              {activeCompany && (
                <div className="inline-flex items-center justify-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 shadow-xs max-w-full">
                  {logoUrl && (
                    <img
                      src={logoSrc}
                      alt={activeCompany}
                      loading="lazy"
                      decoding="async"
                      onError={() => {
                        if (logoSrc !== logoUrl && logoUrl) setLogoSrc(logoUrl);
                      }}
                      className="w-4 h-4 rounded-full object-contain shrink-0 bg-white/10 p-0.5"
                    />
                  )}
                  <p className={`text-[11px] font-bold uppercase tracking-wider truncate ${activeTheme.subtext}`}>
                    {activeCompany}
                  </p>
                </div>
              )}
            </div>

            {activeBio && (
              <p className={`text-xs ${activeTheme.subtext} leading-relaxed max-w-sm mx-auto pt-0.5`}>
                {activeBio}
              </p>
            )}
          </div>

          {/* Primary Action Button: Save Contact */}
          <div className="pt-0.5">
            <a
              href={`/api/vcard/${slug}/download`}
              style={{ backgroundColor: activeTheme.accent, color: theme === 'executive_white' ? '#fff' : '#000' }}
              className="w-full py-3 px-6 rounded-2xl font-bold text-xs sm:text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Save Contact to Phone</span>
            </a>
          </div>

          {/* Centered Circular Brand Glyphs Row (Linktree Style Dock) */}
          {circularActions.length > 0 && (
            <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
              {circularActions.map((action) => {
                const Icon = action.icon;
                const isDirect = action.id === 'call' || action.id === 'sms' || action.id === 'email';
                return (
                  <a
                    key={action.id}
                    href={action.href}
                    target={isDirect ? undefined : '_blank'}
                    rel={isDirect ? undefined : 'noopener noreferrer'}
                    title={action.title}
                    aria-label={action.title}
                    className={`w-11 h-11 rounded-full bg-white/[0.07] hover:bg-white/[0.14] border border-white/10 flex items-center justify-center text-white/90 ${action.color} transition-all transform hover:scale-110 active:scale-95 shadow-sm backdrop-blur-xs`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                  </a>
                );
              })}
            </div>
          )}

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
                    className="group flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 transition-all text-left shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#34D399] group-hover:scale-105 transition-transform shrink-0">
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

        </div>

        {/* Linktree-Style Footer (Reference Image 1 / Image 10) */}
        <div className="w-full max-w-md mx-auto pt-6 pb-4 text-center space-y-4">
          <div>
            <Link
              href="/?section=vcard#workspace"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-white text-[#11140F] font-semibold text-sm hover:bg-white/90 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              Get your own DynamicQR
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-white/50">
            <button
              type="button"
              onClick={() => setShowCookieModal(true)}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Cookie Preferences
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                setReportSuccess(false);
                setShowReportModal(true);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Report
            </button>
            <span>&bull;</span>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <span>&bull;</span>
            <Link href="/product-tour" className="hover:text-white transition-colors">
              Explore
            </Link>
            <span>&bull;</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                setShareViewMode('preview');
                setShowShareModal(true);
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About this account
            </button>
            <span>&bull;</span>
            <Link href="/?section=vcard#workspace" className="hover:text-white transition-colors">
              More from DynamicQR
            </Link>
          </div>
        </div>

      </div>

      {/* Modal 1: Rich Share Link & QR Modal (Reference Image 3) */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#131518] text-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 border border-white/10 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Share link</h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher: Social Preview vs QR Code */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-white/[0.04] rounded-xl border border-white/5 text-xs">
              <button
                type="button"
                onClick={() => setShareViewMode('preview')}
                className={`py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer text-center ${
                  shareViewMode === 'preview'
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Social & Preview
              </button>
              <button
                type="button"
                onClick={() => setShareViewMode('qr')}
                className={`py-1.5 px-3 rounded-lg font-medium transition-all cursor-pointer text-center ${
                  shareViewMode === 'qr'
                    ? 'bg-white text-black font-semibold shadow-xs'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                Scannable QR
              </button>
            </div>

            {shareViewMode === 'preview' ? (
              <div className="space-y-4">
                {/* Hyper-Detailed Open Graph / Social Link Preview Card */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex items-center gap-3.5 text-left">
                  <div className="relative w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] rounded-full overflow-hidden border-2 border-white/20 shrink-0 bg-black flex items-center justify-center">
                    {avatarUrl && !avatarError ? (
                      <img
                        src={avatarSrc || avatarUrl}
                        alt={fullName}
                        className="w-full h-full object-cover block rounded-full"
                        onError={handleAvatarError}
                      />
                    ) : (
                      <span className="text-sm font-bold text-white">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-sm font-bold text-white truncate">{fullName}</p>
                    <p className="text-[11px] text-emerald-400 font-mono truncate">
                      {cardUrl.replace(/^https?:\/\//, '')}
                    </p>
                    <p className="text-[11px] text-white/60 truncate">
                      {activeBio || `${activeTitle || 'Digital Card'} • ${activeCompany || 'DynamicQR'}`}
                    </p>
                  </div>
                </div>

                {/* Circular Share Buttons Row (Linktree Style: Copy, X, WhatsApp, Facebook, LinkedIn, Native Share) */}
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider text-center mb-3">
                    Share directly to channels
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      title="Copy link"
                    >
                      <div className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
                        copied
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                      }`}>
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </div>
                      <span className="text-[10px] text-white/70 group-hover:text-white transition-colors">
                        {copied ? 'Copied!' : 'Copy link'}
                      </span>
                    </button>

                    {/* X (Twitter) */}
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(cardUrl)}&text=${encodeURIComponent(`Check out ${fullName}'s digital vCard on DynamicQR:`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                      title="Share to X"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all group-hover:scale-105">
                        <XGlyph className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-white/70 group-hover:text-white transition-colors">
                        X
                      </span>
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Connect with ${fullName} on DynamicQR: ${cardUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                      title="Share via WhatsApp"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] transition-all group-hover:scale-105">
                        <WhatsAppGlyph className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-white/70 group-hover:text-white transition-colors">
                        WhatsApp
                      </span>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cardUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                      title="Share to Facebook"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1877F2]/15 hover:bg-[#1877F2]/25 border border-[#1877F2]/30 flex items-center justify-center text-[#1877F2] transition-all group-hover:scale-105">
                        <FacebookGlyph className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-white/70 group-hover:text-white transition-colors">
                        Facebook
                      </span>
                    </a>

                    {/* LinkedIn */}
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 group"
                      title="Share to LinkedIn"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/30 flex items-center justify-center text-[#0A66C2] transition-all group-hover:scale-105">
                        <LinkedInGlyph className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-white/70 group-hover:text-white transition-colors">
                        LinkedIn
                      </span>
                    </a>

                    {/* More / Native Share */}
                    <button
                      type="button"
                      onClick={handleShareNative}
                      className="flex flex-col items-center gap-1.5 group cursor-pointer"
                      title="More share options"
                    >
                      <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-all group-hover:scale-105">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-white/70 group-hover:text-white transition-colors">
                        More
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* QR Code Mode */
              <div className="space-y-4 text-center">
                <div className="p-4 bg-white rounded-2xl inline-block shadow-inner mx-auto border border-white/20">
                  <QRCodeSVG value={cardUrl} size={220} level="M" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-white/80 font-medium">Scan to connect instantly</p>
                  <p className="text-[11px] text-white/40 font-mono break-all">{cardUrl}</p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Link Copied to Clipboard' : 'Copy Card Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Promotional Banner: Join [Name] on DynamicQR */}
            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent border border-white/10 space-y-3">
                <p className="text-xs font-bold text-white">Join {fullName} on DynamicQR</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/join"
                    className="py-2 px-3 rounded-xl bg-white text-black font-bold text-xs text-center hover:bg-white/90 transition-all shadow-xs"
                  >
                    Sign up free
                  </Link>
                  <Link
                    href="/product-tour"
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs text-center border border-white/10 transition-all"
                  >
                    Find out more
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer Report Link */}
            <div className="pt-1 text-center border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setReportSuccess(false);
                  setShowReportModal(true);
                }}
                className="inline-flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/80 transition-colors cursor-pointer"
              >
                <Flag className="w-3 h-3" />
                <span>Report link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Report Account */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#131518] text-white rounded-3xl p-6 shadow-2xl space-y-4 border border-white/10 relative">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Report profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-full text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                <p className="text-xs font-semibold text-emerald-300">Thank you for your report</p>
                <p className="text-[11px] text-white/60">
                  Our trust & safety team will review this profile promptly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-white/60">
                  Help us understand what is wrong with this profile:
                </p>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: 'spam', label: 'Spam, scam, or commercial abuse' },
                    { id: 'impersonation', label: 'Impersonation or false identity' },
                    { id: 'inappropriate', label: 'Inappropriate or harmful content' },
                    { id: 'copyright', label: 'Intellectual property infringement' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        checked={reportReason === opt.id}
                        onChange={() => setReportReason(opt.id)}
                        className="text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-white/80">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submittingReport}
                    onClick={handleSendReport}
                    className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingReport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{submittingReport ? 'Submitting...' : 'Submit Report'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Cookie Preferences */}
      {showCookieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#131518] text-white rounded-3xl p-6 shadow-2xl space-y-4 border border-white/10 relative">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">Cookie Preferences</h3>
              <button
                type="button"
                onClick={() => setShowCookieModal(false)}
                className="p-1 rounded-full text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              DynamicQR uses essential cookies to authenticate sessions, securely route QR traffic, and collect anonymous telemetry.
            </p>
            <div className="space-y-2 pt-1 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Strictly Necessary</p>
                  <p className="text-[10px] text-white/50">Required for routing & auth</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Always Active</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-white">Performance & Telemetry</p>
                  <p className="text-[10px] text-white/50">Anonymous scan analytics</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
              </div>
            </div>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCookieModal(false)}
                className="w-full py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-white/90 transition-colors"
              >
                Save Preferences
              </button>
            </div>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">TikTok</label>
                      <input
                        type="text"
                        value={editForm.tiktok}
                        onChange={(e) => setEditForm({ ...editForm, tiktok: e.target.value })}
                        placeholder="@username"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Spotify</label>
                      <input
                        type="text"
                        value={editForm.spotify}
                        onChange={(e) => setEditForm({ ...editForm, spotify: e.target.value })}
                        placeholder="Spotify URL or artist link"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Facebook</label>
                      <input
                        type="text"
                        value={editForm.facebook}
                        onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })}
                        placeholder="facebook.com/..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/25 focus:outline-hidden focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-white/70">Apple Music</label>
                      <input
                        type="text"
                        value={editForm.appleMusic}
                        onChange={(e) => setEditForm({ ...editForm, appleMusic: e.target.value })}
                        placeholder="music.apple.com/..."
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
