'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  QrCode,
  Link2,
  Sparkles,
  Globe,
  Mail,
  Contact,
  Utensils,
  Wifi,
  Layers,
  Settings,
  Shield,
  Activity,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Gauge,
  Compass,
  Plus,
  Eye,
  CheckCircle2,
  Share2,
  TrendingUp,
  Video,
  AtSign,
} from 'lucide-react';
import BulkImportWizard from './BulkImportWizard';
import AccountSettingsModal from './AccountSettingsModal';
import EntryPromoModal from './EntryPromoModal';
import MicroSaasHub from './MicroSaasHub';
import WorkspaceOverviewTab from './WorkspaceOverviewTab';
import NameLaunchService from './NameLaunchService';
import { getOptimizedStorageUrl } from '@/lib/media';
import { signOut } from '@/app/auth-actions';
import { getStoredPreferences } from '@/lib/theme';

export type WorkspaceSection =
  | 'all'
  | 'overview'
  | 'links'
  | 'analyst'
  | 'domains'
  | 'mailing'
  | 'vcard'
  | 'shortener'
  | 'menu'
  | 'wifi'
  | 'namelaunch';

const VALID_SECTIONS: WorkspaceSection[] = [
  'all',
  'overview',
  'links',
  'analyst',
  'domains',
  'mailing',
  'vcard',
  'shortener',
  'menu',
  'wifi',
  'namelaunch',
];

function QrMark({ className = 'w-5 h-5', fill = '#11140F' }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="1" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="4" width="3" height="3" fill={fill} />
      <rect x="14" y="1" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="17" y="4" width="3" height="3" fill={fill} />
      <rect x="1" y="14" width="9" height="9" rx="1.5" stroke={fill} strokeWidth="2" />
      <rect x="4" y="17" width="3" height="3" fill={fill} />
      <rect x="15" y="15" width="3" height="3" fill={fill} />
      <rect x="20" y="15" width="3" height="3" fill={fill} />
      <rect x="15" y="20" width="3" height="3" fill={fill} />
      <rect x="20" y="20" width="3" height="3" fill={fill} />
    </svg>
  );
}

interface WorkspaceShellProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
    avatarUrl?: string | null;
  } | null;
  isAdmin?: boolean;
  planUsageMeter: React.ReactNode;
  campaignAnalyst: React.ReactNode;
  brandedDomainsManager: React.ReactNode;
  linkCreationAndList: React.ReactNode;
  activeLinksCount: number;
  monthlyScansCount?: number;
  links?: any[];
  microSaasItems?: any[];
  mailLists?: any[];
  recentScans?: any[];
  customerContacts?: any[];
}

export default function WorkspaceShell({
  user,
  isAdmin = false,
  planUsageMeter,
  campaignAnalyst,
  brandedDomainsManager,
  linkCreationAndList,
  activeLinksCount,
  monthlyScansCount = 0,
  links = [],
  microSaasItems = [],
  mailLists = [],
  recentScans = [],
  customerContacts = [],
}: WorkspaceShellProps) {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('links');
  const [microSaasTab, setMicroSaasTab] = useState<'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi'>('mailing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPromoModalPreview, setShowPromoModalPreview] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const storageSectionKey = user?.id ? `dynamicqr_workspace_section_${user.id}` : 'dynamicqr_workspace_section';
  const storageTabKey = user?.id ? `dynamicqr_microsaas_tab_${user.id}` : 'dynamicqr_microsaas_tab';

  // Restore remembered section & subtab on mount/refresh
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const prefs = getStoredPreferences();
      if (prefs.analyticsDensity) {
        setDensity(prefs.analyticsDensity);
      }
    } catch (e) {}

    const handlePrefChange = (e: any) => {
      if (e.detail?.analyticsDensity) {
        setDensity(e.detail.analyticsDensity);
      }
    };
    window.addEventListener('dynamicqr-preferences-change', handlePrefChange);

    try {
      const savedCollapsed = localStorage.getItem('dynamicqr_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setSidebarCollapsed(savedCollapsed === 'true');
      }
    } catch (e) {}

    let targetSection: WorkspaceSection | null = null;
    let targetMicroTab: 'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi' | null = null;

    // 1. Check URL search params or hash (e.g. ?section=vcard or #workspace?section=vcard)
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const searchSec = (searchParams.get('section') || searchParams.get('tab')) as WorkspaceSection | null;
      if (searchSec && VALID_SECTIONS.includes(searchSec)) {
        targetSection = searchSec;
      }
    } catch (e) {}

    const hash = window.location.hash;
    if (!targetSection) {
      if (hash.includes('section=')) {
        const match = hash.match(/section=([a-z0-9_-]+)/i);
        if (match && VALID_SECTIONS.includes(match[1] as WorkspaceSection)) {
          targetSection = match[1] as WorkspaceSection;
        }
      } else if (hash.startsWith('#workspace/')) {
        const sub = hash.replace('#workspace/', '').toLowerCase() as WorkspaceSection;
        if (VALID_SECTIONS.includes(sub)) {
          targetSection = sub;
        }
      }
    }

    // 2. If not specified in URL, check localStorage for remembered location
    if (!targetSection) {
      try {
        const saved = localStorage.getItem(storageSectionKey) as WorkspaceSection | null;
        if (saved && VALID_SECTIONS.includes(saved)) {
          targetSection = saved;
        }
      } catch (e) {}
    }

    // 3. Restore remembered MicroSaaS subtab
    try {
      const savedTab = localStorage.getItem(storageTabKey) as 'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi' | null;
      if (savedTab && ['mailing', 'vcard', 'shortener', 'menu', 'wifi'].includes(savedTab)) {
        targetMicroTab = savedTab;
      }
    } catch (e) {}

    if (targetSection) {
      setActiveSection(targetSection);
      if (['mailing', 'vcard', 'shortener', 'menu', 'wifi'].includes(targetSection)) {
        setMicroSaasTab(targetSection as any);
      } else if (targetMicroTab) {
        setMicroSaasTab(targetMicroTab);
      }
    } else if (targetMicroTab) {
      setMicroSaasTab(targetMicroTab);
    }

    const handleNavigateEvent = (e: any) => {
      if (e.detail?.section && VALID_SECTIONS.includes(e.detail.section)) {
        handleSelectSection(e.detail.section);
      }
    };
    window.addEventListener('dynamicqr-navigate-section', handleNavigateEvent);

    return () => {
      window.removeEventListener('dynamicqr-preferences-change', handlePrefChange);
      window.removeEventListener('dynamicqr-navigate-section', handleNavigateEvent);
    };
  }, [storageSectionKey, storageTabKey]);

  const handleSelectSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    if (['mailing', 'vcard', 'shortener', 'menu', 'wifi'].includes(section)) {
      setMicroSaasTab(section as any);
      try {
        localStorage.setItem(storageTabKey, section);
      } catch (e) {}
    }
    try {
      localStorage.setItem(storageSectionKey, section);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `#workspace?section=${section}`);
      }
    } catch (e) {}
    setMobileDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCreateNewClick = () => {
    setActiveSection('links');
    try {
      localStorage.setItem(storageSectionKey, 'links');
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '#workspace?section=links');
      }
    } catch (e) {}
    setMobileDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dynamicqr_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const isMicroSaasSection = ['mailing', 'vcard', 'shortener', 'menu', 'wifi'].includes(activeSection);
  const userName = user?.name || user?.email?.split('@')[0] || 'Creator';
  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const tierName = (user?.tier || 'free').toUpperCase();

  const [userAvatar, setUserAvatar] = useState<string | null>(user?.avatarUrl || null);

  useEffect(() => {
    if (user?.avatarUrl) {
      setUserAvatar(user.avatarUrl);
    } else {
      try {
        const cached = localStorage.getItem('dynamicqr_user_avatar');
        if (cached) setUserAvatar(cached);
      } catch (e) {}
    }

    const handleAvatarChange = (e: any) => {
      if (e.detail?.avatarUrl !== undefined) {
        setUserAvatar(e.detail.avatarUrl);
      }
    };
    window.addEventListener('dynamicqr-avatar-change', handleAvatarChange);
    return () => window.removeEventListener('dynamicqr-avatar-change', handleAvatarChange);
  }, [user?.avatarUrl]);

  const navSections = [
    {
      group: 'WORKSPACE',
      items: [
        {
          id: 'overview' as WorkspaceSection,
          label: 'Overview',
          icon: LayoutDashboard,
        },
        {
          id: 'all' as WorkspaceSection,
          label: 'All Tools',
          icon: Layers,
        },
        {
          id: 'links' as WorkspaceSection,
          label: 'Dynamic QR Links',
          icon: QrCode,
          badge: `${activeLinksCount}`,
          badgeColor: 'bg-[#11140F]/8 dark:bg-white/10 text-[#11140F]/70 dark:text-white/70',
        },
        {
          id: 'analyst' as WorkspaceSection,
          label: 'Campaign Analyst',
          icon: Sparkles,
        },
        {
          id: 'domains' as WorkspaceSection,
          label: 'Branded Domains',
          icon: Globe,
        },
      ],
    },
    {
      group: 'APPS & SERVICES',
      items: [
        {
          id: 'mailing' as WorkspaceSection,
          label: 'Mailing Lists & Print',
          icon: Mail,
        },
        {
          id: 'vcard' as WorkspaceSection,
          label: 'Digital vCards',
          icon: Contact,
        },
        {
          id: 'shortener' as WorkspaceSection,
          label: 'Smart Link Shortener',
          icon: Link2,
        },
        {
          id: 'menu' as WorkspaceSection,
          label: 'Restaurant Menus',
          icon: Utensils,
        },
        {
          id: 'wifi' as WorkspaceSection,
          label: 'Guest Wi-Fi',
          icon: Wifi,
        },
        {
          id: 'namelaunch' as WorkspaceSection,
          label: 'Domains & Email',
          icon: AtSign,
        },
      ],
    },
  ];

  const sectionHeaderMeta: Record<string, { breadcrumb: string; title: string; subtitle: string }> = {
    all: {
      breadcrumb: 'All Tools',
      title: `Welcome, ${userName}`,
      subtitle: 'Manage dynamic QR links, scan intelligence, custom domains, and workspace tools.',
    },
    links: {
      breadcrumb: 'Dynamic QR Links',
      title: 'Dynamic QR Links',
      subtitle: 'Create, customize, and route trackable QR codes with instant destination control.',
    },
    analyst: {
      breadcrumb: 'Campaign Analyst',
      title: 'Campaign Analyst',
      subtitle: 'Scan performance diagnostics, audience trends, and optimization recommendations.',
    },
    domains: {
      breadcrumb: 'Branded Domains',
      title: 'Branded Domains',
      subtitle: 'Connect your own domain to serve shortlinks and print assets under your brand.',
    },
    mailing: {
      breadcrumb: 'Mailing Lists & Print',
      title: 'Mailing Lists & Print',
      subtitle: 'Collect subscriber leads via QR opt-in and generate print-ready campaign layouts.',
    },
    vcard: {
      breadcrumb: 'Digital vCards',
      title: 'Digital vCards',
      subtitle: 'Interactive mobile business cards with instant one-tap contact saving.',
    },
    shortener: {
      breadcrumb: 'Smart Link Shortener',
      title: 'Smart Link Shortener',
      subtitle: 'Short URLs with intelligent device, schedule, and location-aware routing.',
    },
    menu: {
      breadcrumb: 'Restaurant Menus',
      title: 'Restaurant Menus',
      subtitle: 'Contactless digital menus with instant item updates and table QR codes.',
    },
    wifi: {
      breadcrumb: 'Guest Wi-Fi',
      title: 'Guest Wi-Fi',
      subtitle: 'Instant one-scan Wi-Fi access portals for offices, venues, and hospitality.',
    },
    namelaunch: {
      breadcrumb: 'Domains & Email',
      title: 'Domains & Business Email',
      subtitle: 'Register custom domains with managed DNS and branded business email forwarding.',
    },
  };

  const activeMeta = sectionHeaderMeta[activeSection] || sectionHeaderMeta.all;

  return (
    <div className={`w-full min-h-screen ${activeSection === 'overview' ? 'bg-[#090A0E] text-white' : 'bg-[#F4F5F1] dark:bg-[#080907] text-[#11140F] dark:text-[#EEF0EA]'} flex flex-col md:flex-row relative transition-colors duration-200`}>
      {/* 1. MOBILE TOP HEADER (Phones & Tablets only) */}
      <div
        style={{
          top: 'var(--announcement-bar-height, 0px)',
        }}
        className="md:hidden sticky z-40 w-full bg-white/90 dark:bg-[#0D0F0C]/90 backdrop-blur-md border-b border-[#11140F]/10 dark:border-white/10 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-[#11140F]/5 dark:bg-white/5 text-[#11140F] dark:text-white hover:bg-[#11140F]/10 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleSelectSection('links')}
            className="flex items-center gap-2 cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#11140F] dark:bg-white flex items-center justify-center text-white dark:text-[#11140F]">
              <QrMark className="w-4 h-4" fill="currentColor" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#11140F] dark:text-white">DynamicQR</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className="px-2 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 shadow-2xs hover:bg-emerald-500/20 transition-colors"
                title="Super-Admin Sovereign Console"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-mono uppercase font-bold hidden xs:inline">Admin</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowPromoModalPreview(true)}
                className="p-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#11140F] text-xs font-semibold text-[#11140F] dark:text-white flex items-center gap-1"
                title="Preview Entry Promo Modal"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Modal</span>
              </button>
            </>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
            {tierName}
          </span>
          {user && (
            <button
              type="button"
              onClick={() => setShowAccountModal(true)}
              className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-[#11140F] text-white flex items-center justify-center text-[11px] font-bold shrink-0 shadow-xs ring-1 ring-[#11140F]/10 dark:ring-white/10 cursor-pointer"
              title="Account Settings"
            >
              {userAvatar ? (
                <img
                  src={getOptimizedStorageUrl(userAvatar)}
                  alt="Profile"
                  loading="eager"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitial
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. DESKTOP SIDEBAR (Principal Source of Navigation — Insp. from Healthy App) */}
      <aside
        style={{
          top: 'var(--announcement-bar-height, 0px)',
          height: 'calc(100vh - var(--announcement-bar-height, 0px))',
        }}
        className={`hidden md:flex flex-col shrink-0 border-r border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0D0F0C] transition-all duration-300 sticky z-30 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-64 lg:w-72'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`border-b border-[#11140F]/10 dark:border-white/10 shrink-0 transition-all ${
            sidebarCollapsed
              ? 'py-4 px-2 flex flex-col items-center gap-2.5'
              : 'p-4 lg:p-5 flex items-center justify-between gap-3'
          }`}
        >
          {sidebarCollapsed ? (
            <>
              <button
                type="button"
                onClick={() => handleSelectSection('links')}
                className="w-10 h-10 rounded-xl bg-[#11140F] dark:bg-white flex items-center justify-center text-white dark:text-[#11140F] shadow-sm hover:scale-105 transition-transform cursor-pointer"
                title="DynamicQR Home"
              >
                <QrMark className="w-5 h-5" fill="currentColor" />
              </button>
              <button
                type="button"
                onClick={handleToggleSidebar}
                className="w-7 h-7 rounded-lg bg-[#11140F]/5 dark:bg-white/5 hover:bg-[#11140F]/10 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 flex items-center justify-center transition-colors cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSelectSection('links')}
                className="flex items-center gap-2.5 min-w-0 group cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-[#11140F] dark:bg-white flex items-center justify-center text-white dark:text-[#11140F] shadow-sm group-hover:scale-105 transition-transform shrink-0">
                  <QrMark className="w-5 h-5" fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-base tracking-tight text-[#11140F] dark:text-white block leading-tight truncate">
                    DynamicQR
                  </span>
                  <span className="text-[10.5px] font-mono text-[#11140F]/50 dark:text-white/50 block leading-tight truncate">
                    Sovereign Workspace
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={handleToggleSidebar}
                className="p-1.5 rounded-lg bg-[#11140F]/5 dark:bg-white/5 hover:bg-[#11140F]/10 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 transition-colors cursor-pointer shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Primary Action Button (New QR Code & Test Promo Modal) */}
        <div className={`shrink-0 ${sidebarCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 space-y-2'}`}>
          <button
            type="button"
            onClick={handleCreateNewClick}
            className={`rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-bold hover:bg-[#2A2E25] dark:hover:bg-white/90 transition-all flex items-center justify-center shadow-xs cursor-pointer ${
              sidebarCollapsed
                ? 'w-10 h-10 p-0'
                : 'w-full py-2.5 px-3.5 text-xs gap-2'
            }`}
            title="Create New QR Code"
          >
            <Plus className="w-4 h-4 shrink-0 text-emerald-400 dark:text-[#2F6B4F]" />
            {!sidebarCollapsed && <span>New QR Code</span>}
          </button>

          {/* Test / Preview Promo Modal Button (Admin only) */}
          {isAdmin && (
            sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setShowPromoModalPreview(true)}
                className="w-10 h-8 rounded-xl border border-dashed border-[#11140F]/20 dark:border-white/20 hover:border-emerald-500/50 bg-[#11140F]/[0.02] dark:bg-white/[0.02] flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-[#11140F]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                title="Preview Promotional Popup Modal"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowPromoModalPreview(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-[#11140F]/20 dark:border-white/20 hover:border-[#11140F]/40 dark:hover:border-white/40 bg-[#11140F]/[0.02] dark:bg-white/[0.02] text-xs font-semibold text-[#11140F]/80 dark:text-white/80 transition-colors flex items-center justify-between cursor-pointer"
                title="Preview Promotional Popup Modal"
              >
                <div className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Test Promo Modal</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 uppercase font-bold">
                  Preview
                </span>
              </button>
            )
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className={`flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10 ${
          sidebarCollapsed ? 'px-2 py-2' : 'px-3 py-2'
        }`}>
          {navSections.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!sidebarCollapsed ? (
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-bold text-[#11140F]/40 dark:text-white/40">
                  {group.group}
                </div>
              ) : (
                idx > 0 && <div className="w-7 h-px bg-[#11140F]/10 dark:bg-white/10 mx-auto my-2" />
              )}
              {group.items.map((item: { id: WorkspaceSection; label: string; icon: any; badge?: string; badgeColor?: string }) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSection(item.id)}
                    className={`relative rounded-xl text-[12.5px] font-medium transition-all cursor-pointer ${
                      sidebarCollapsed
                        ? `w-10 h-10 flex items-center justify-center mx-auto ${
                            isActive
                              ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] shadow-xs'
                              : 'text-[#11140F]/70 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                          }`
                        : `w-full flex items-center gap-2.5 px-3 py-2 ${
                            isActive
                              ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-semibold shadow-xs'
                              : 'text-[#11140F]/70 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                          }`
                    }`}
                    title={item.label}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400 dark:text-[#2F6B4F]' : 'opacity-75'}`} />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium shrink-0 ${
                          isActive
                            ? 'bg-white/15 dark:bg-black/15 text-white dark:text-[#11140F]'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {sidebarCollapsed && item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Platform Navigation & Utilities */}
          <div className="pt-2 border-t border-[#11140F]/10 dark:border-white/10 space-y-0.5">
            {!sidebarCollapsed && (
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-semibold text-[#11140F]/40 dark:text-white/40">
                PLATFORM
              </div>
            )}

            <Link
              href="/product-tour"
              className={`rounded-xl text-[12.5px] font-medium transition-all ${
                sidebarCollapsed
                  ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                  : 'w-full flex items-center gap-2.5 px-3 py-2 text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
              }`}
              title="Product Tour"
            >
              <Compass className="w-4 h-4 shrink-0 opacity-75" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Product Tour</span>}
            </Link>

            <Link
              href="/pricing"
              className={`rounded-xl text-[12.5px] font-medium transition-all ${
                sidebarCollapsed
                  ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                  : 'w-full flex items-center gap-2.5 px-3 py-2 text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
              }`}
              title="Pricing Plans"
            >
              <CreditCard className="w-4 h-4 shrink-0 opacity-75" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Pricing Plans</span>}
            </Link>

            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className={`rounded-xl text-[12.5px] font-medium transition-all cursor-pointer ${
                sidebarCollapsed
                  ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                  : 'w-full flex items-center gap-2.5 px-3 py-2 text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
              }`}
              title="Bulk Import"
            >
              <Layers className="w-4 h-4 shrink-0 opacity-75" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Bulk Import</span>}
            </button>

            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={`rounded-xl text-[12.5px] font-medium transition-all ${
                    sidebarCollapsed
                      ? 'w-10 h-10 flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                      : 'w-full flex items-center gap-2.5 px-3 py-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title="Admin Console"
                >
                  <Shield className="w-4 h-4 shrink-0 opacity-85" />
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">Admin Console</span>}
                </Link>

                <Link
                  href="/admin/ai-usage"
                  className={`rounded-xl text-[12.5px] font-medium transition-all ${
                    sidebarCollapsed
                      ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5'
                      : 'w-full flex items-center gap-2.5 px-3 py-2 text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5'
                  }`}
                  title="AI Telemetry"
                >
                  <Activity className="w-4 h-4 shrink-0 opacity-75" />
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">AI Telemetry</span>}
                </Link>

                <Link
                  href="/admin/analytics"
                  className={`rounded-xl text-[12.5px] font-medium transition-all ${
                    sidebarCollapsed
                      ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5'
                      : 'w-full flex items-center gap-2.5 px-3 py-2 text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5'
                  }`}
                  title="Analytics Hub"
                >
                  <TrendingUp className="w-4 h-4 shrink-0 opacity-75" />
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">Analytics Hub</span>}
                </Link>

                <Link
                  href="/admin/sessions"
                  className={`rounded-xl text-[12.5px] font-medium transition-all ${
                    sidebarCollapsed
                      ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5'
                      : 'w-full flex items-center gap-2.5 px-3 py-2 text-[#11140F]/65 dark:text-white/65 hover:bg-[#11140F]/5 dark:hover:bg-white/5'
                  }`}
                  title="Session Replay"
                >
                  <Video className="w-4 h-4 shrink-0 opacity-75" />
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">Session Replay</span>}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* User Profile Card (Bottom of Sidebar) */}
        {user && (
          <div className="p-2 lg:p-3 border-t border-[#11140F]/10 dark:border-white/10 shrink-0">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-[#11140F]/8 dark:border-white/[0.08] hover:border-[#34D399]/35 transition-all">
                {/* Entire Identity Area Clickable for Settings */}
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                  title="Account Settings"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#34D399] bg-[#121614] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                    {userAvatar ? (
                      <img
                        src={getOptimizedStorageUrl(userAvatar)}
                        alt="Profile"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#11140F] dark:text-white truncate group-hover:text-[#34D399] transition-colors">
                        {userName}
                      </span>
                      <span className="text-[9px] font-mono font-bold uppercase text-[#2F6B4F] dark:text-[#34D399]">
                        {tierName}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#11140F]/50 dark:text-white/45 truncate block font-mono">
                      {user.email}
                    </span>
                  </div>
                </button>

                {/* Subtle Logout Action */}
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg text-[#11140F]/45 dark:text-white/45 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-[#11140F] text-white flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-emerald-500/50 transition-all cursor-pointer shadow-xs"
                  title={`Signed in as ${userName} (${user.email}) - Account Settings`}
                >
                  {userAvatar ? (
                    <img
                      src={getOptimizedStorageUrl(userAvatar)}
                      alt="Profile"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </button>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(true)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white hover:bg-[#11140F]/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                    title="Account & Privacy Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* 3. MOBILE SIDEBAR DRAWER (Full mobile navigation) */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-72 bg-[#F4F5F1] dark:bg-[#0D0F0C] h-full shadow-2xl p-4 flex flex-col justify-between border-r border-[#11140F]/10 dark:border-white/10 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#11140F] dark:bg-white flex items-center justify-center text-white dark:text-[#11140F]">
                    <QrMark className="w-4 h-4" fill="currentColor" />
                  </div>
                  <span className="text-sm font-bold text-[#11140F] dark:text-white">Workspace Services</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Buttons in Mobile */}
              <button
                type="button"
                onClick={handleCreateNewClick}
                className="w-full py-2.5 px-3 rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-400 dark:text-[#2F6B4F]" />
                <span>New QR Code</span>
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPromoModalPreview(true);
                    setMobileDrawerOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-dashed border-[#11140F]/20 dark:border-white/20 bg-white/50 text-xs font-semibold text-[#11140F] dark:text-white flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Test Promo Modal</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 uppercase font-bold">
                    Preview
                  </span>
                </button>
              )}

              {navSections.map((group, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#11140F]/40 dark:text-white/40 px-2">
                    {group.group}
                  </div>
                  {group.items.map((item: { id: WorkspaceSection; label: string; icon: any; badge?: string }) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-semibold'
                            : 'text-[#11140F]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-80" />
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium opacity-75">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              <div className="pt-2 border-t border-[#11140F]/10 dark:border-white/10 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#11140F]/40 dark:text-white/40 px-2">
                  ALTERNATE NAVIGATION
                </div>
                <Link
                  href="/product-tour"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#11140F]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>Product Tour</span>
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#11140F]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <span>Pricing Plans</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setShowBulkModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#11140F]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Bulk Import (AI)</span>
                </button>
              </div>

              {isAdmin && (
                <div className="pt-2 border-t border-[#11140F]/10 dark:border-white/10 space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 px-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      ADMIN SOVEREIGNTY
                    </span>
                    <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                      PROD
                    </span>
                  </div>

                  <Link
                    href="/admin"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Admin Console</span>
                    </div>
                    <span className="text-[8.5px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                      SUPER
                    </span>
                  </Link>

                  <Link
                    href="/admin/ai-usage"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-500/10 transition-all"
                  >
                    <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span className="truncate">AI Telemetry</span>
                  </Link>

                  <Link
                    href="/admin/analytics"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-500/10 transition-all"
                  >
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">Analytics Hub</span>
                  </Link>

                  <Link
                    href="/admin/sessions"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <Video className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="truncate">Session Replay</span>
                  </Link>
                </div>
              )}
            </div>

            {user && (
              <div className="pt-3 border-t border-[#11140F]/10 dark:border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMobileDrawerOpen(false);
                    setShowAccountModal(true);
                  }}
                  className="flex items-center gap-2 min-w-0 cursor-pointer text-left"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-[#11140F] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    {userAvatar ? (
                      <img
                        src={getOptimizedStorageUrl(userAvatar)}
                        alt="Profile"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userInitial
                    )}
                  </div>
                  <div className="text-xs font-bold text-[#11140F] dark:text-white truncate">
                    {userName}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-1 text-xs font-medium text-red-500 flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* 4. MAIN WORKSPACE CONTENT AREA */}
      <main
        className={`flex-1 min-w-0 transition-all duration-150 ${
          activeSection === 'overview'
            ? 'p-2 sm:p-3 lg:p-4 h-[calc(100vh-var(--announcement-bar-height,0px))] overflow-y-auto lg:overflow-hidden flex flex-col justify-between bg-[#090A0E] text-white'
            : density === 'compact'
            ? 'p-3 sm:p-4 lg:p-6 space-y-4'
            : 'p-4 sm:p-6 lg:p-8 space-y-6'
        }`}
      >
        {/* Unified Contextual Page Header (Consistent across all sidebar menu pages) */}
        {activeSection !== 'overview' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#11140F]/10 dark:border-white/[0.08]">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#11140F]/45 dark:text-white/45">
                <span>Workspace</span>
                <span>/</span>
                <span className="text-[#2F6B4F] dark:text-[#34D399]">
                  {activeMeta.breadcrumb}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#11140F] dark:text-white mt-0.5">
                {activeMeta.title}
              </h1>
              <p className="text-xs sm:text-[13px] text-[#11140F]/60 dark:text-white/55 mt-0.5">
                {activeMeta.subtitle}
              </p>
            </div>

            {/* Clean Pill Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowPromoModalPreview(true)}
                  className="px-3.5 py-1.5 rounded-full border border-[#11140F]/12 dark:border-white/12 bg-white dark:bg-white/[0.04] hover:bg-black/[0.03] dark:hover:bg-white/[0.08] text-xs font-medium text-[#11140F]/80 dark:text-white/85 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Test Promotional Entry Popup"
                >
                  <Eye className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Preview Promo</span>
                </button>
              )}

              {activeSection !== 'links' && (
                <button
                  type="button"
                  onClick={handleCreateNewClick}
                  className="px-4 py-1.5 rounded-full bg-[#34D399] hover:bg-[#34D399]/90 text-[#09110D] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New QR Link</span>
                </button>
              )}

              {activeSection !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleSelectSection('all')}
                  className="px-3.5 py-1.5 rounded-full border border-[#11140F]/12 dark:border-white/12 bg-white dark:bg-white/[0.04] text-xs font-medium text-[#11140F]/80 dark:text-white/85 hover:bg-black/[0.03] dark:hover:bg-white/[0.08] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>All Tools</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* SECTION RENDER LOGIC */}
        {/* VIEW 1: COMPLETE ALL-IN-ONE VIEW (Default) */}
        {activeSection === 'all' && (
          <div className="space-y-8">
            {planUsageMeter}
            {campaignAnalyst}
            {brandedDomainsManager}
            <MicroSaasHub
              userTier={user?.tier || 'free'}
              isAdmin={isAdmin}
              externalActiveTab={microSaasTab}
              onTabChange={(t) => {
                setMicroSaasTab(t);
                try {
                  localStorage.setItem(storageTabKey, t);
                } catch (e) {}
              }}
            />
            <NameLaunchService user={user} isAdmin={isAdmin} />
            {linkCreationAndList}
          </div>
        )}

        {/* VIEW 2: EXECUTIVE LIVE OVERVIEW TAB (Single Page Desktop Fit) */}
        {activeSection === 'overview' && (
          <div className="w-full h-full flex flex-col min-h-0 overflow-y-auto lg:overflow-visible">
            <WorkspaceOverviewTab
              user={user!}
              isAdmin={isAdmin}
              activeLinksCount={activeLinksCount}
              monthlyScansCount={monthlyScansCount}
              links={links}
              microSaasItems={microSaasItems}
              mailLists={mailLists}
              recentScans={recentScans}
              customerContacts={customerContacts}
              onNavigateSection={handleSelectSection}
              onOpenUpgradeModal={() => setShowAccountModal(true)}
            />
          </div>
        )}

        {/* VIEW 3: DYNAMIC QR LINKS FOCUSED */}
        {activeSection === 'links' && (
          <div className="space-y-6">
            {linkCreationAndList}
          </div>
        )}

        {/* VIEW 4: AI ANALYST FOCUSED */}
        {activeSection === 'analyst' && (
          <div className="space-y-6">
            {campaignAnalyst}
          </div>
        )}

        {/* VIEW 5: CUSTOM DOMAINS FOCUSED */}
        {activeSection === 'domains' && (
          <div className="space-y-6">
            {brandedDomainsManager}
          </div>
        )}

        {/* VIEW 6-10: INDIVIDUAL MICRO-SAAS TOOLS FOCUSED */}
        {isMicroSaasSection && (
          <div className="space-y-6">
            <MicroSaasHub
              userTier={user?.tier || 'free'}
              isAdmin={isAdmin}
              hideHeader={true}
              externalActiveTab={microSaasTab}
              onTabChange={(t) => {
                setMicroSaasTab(t);
                setActiveSection(t as any);
                try {
                  localStorage.setItem(storageTabKey, t);
                  localStorage.setItem(storageSectionKey, t);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `#workspace?section=${t}`);
                  }
                } catch (e) {}
              }}
            />
          </div>
        )}

        {/* VIEW 11: DOMAINS & BUSINESS EMAIL */}
        {activeSection === 'namelaunch' && (
          <div className="space-y-6">
            <NameLaunchService user={user} isAdmin={isAdmin} />
          </div>
        )}
      </main>

      {/* MODALS */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <BulkImportWizard
            userTier={user?.tier || 'free'}
            isAdmin={isAdmin}
            onImportComplete={() => {
              window.location.reload();
            }}
            onClose={() => setShowBulkModal(false)}
          />
        </div>
      )}

      {showAccountModal && user && (
        <AccountSettingsModal
          user={user}
          onClose={() => setShowAccountModal(false)}
        />
      )}

      {/* Promo Modal Live Test / Preview */}
      {showPromoModalPreview && (
        <EntryPromoModal
          forceOpen={true}
          onClose={() => setShowPromoModalPreview(false)}
        />
      )}
    </div>
  );
}
