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
} from 'lucide-react';
import BulkImportWizard from './BulkImportWizard';
import AccountSettingsModal from './AccountSettingsModal';
import EntryPromoModal from './EntryPromoModal';
import MicroSaasHub from './MicroSaasHub';
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
  | 'wifi';

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
  } | null;
  isAdmin?: boolean;
  planUsageMeter: React.ReactNode;
  campaignAnalyst: React.ReactNode;
  brandedDomainsManager: React.ReactNode;
  linkCreationAndList: React.ReactNode;
  activeLinksCount: number;
}

export default function WorkspaceShell({
  user,
  isAdmin = false,
  planUsageMeter,
  campaignAnalyst,
  brandedDomainsManager,
  linkCreationAndList,
  activeLinksCount,
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

    // 1. Check URL hash (e.g. #workspace?section=vcard or #workspace/vcard)
    const hash = window.location.hash;
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

    return () => {
      window.removeEventListener('dynamicqr-preferences-change', handlePrefChange);
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

  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('dynamicqr_user_avatar');
      if (cached) setUserAvatar(cached);
    } catch (e) {}

    const handleAvatarChange = (e: any) => {
      if (e.detail?.avatarUrl !== undefined) {
        setUserAvatar(e.detail.avatarUrl);
      }
    };
    window.addEventListener('dynamicqr-avatar-change', handleAvatarChange);
    return () => window.removeEventListener('dynamicqr-avatar-change', handleAvatarChange);
  }, []);

  const navSections = [
    {
      group: 'MAIN WORKSPACE',
      items: [
        {
          id: 'all' as WorkspaceSection,
          label: 'Complete Workspace',
          icon: LayoutDashboard,
          badge: 'All Tools',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        },
        {
          id: 'overview' as WorkspaceSection,
          label: 'Plan & Usage Meter',
          icon: Gauge,
        },
        {
          id: 'links' as WorkspaceSection,
          label: 'Dynamic QR Links',
          icon: QrCode,
          badge: `${activeLinksCount}`,
          badgeColor: 'bg-[#11140F]/10 dark:bg-white/10 text-[#11140F] dark:text-white',
        },
        {
          id: 'analyst' as WorkspaceSection,
          label: 'AI Campaign Analyst',
          icon: Sparkles,
          badge: 'AI',
          badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
        },
        {
          id: 'domains' as WorkspaceSection,
          label: 'Branded Domains',
          icon: Globe,
        },
      ],
    },
    {
      group: 'MICRO-SAAS ECOSYSTEM',
      items: [
        {
          id: 'mailing' as WorkspaceSection,
          label: 'Mailing Lists & Print',
          icon: Mail,
          badge: 'Print QR',
          badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
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
          badge: 'OS Route',
          badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
        },
        {
          id: 'menu' as WorkspaceSection,
          label: 'Restaurant Menus',
          icon: Utensils,
        },
        {
          id: 'wifi' as WorkspaceSection,
          label: 'Dynamic Guest Wi-Fi',
          icon: Wifi,
        },
      ],
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F4F5F1] dark:bg-[#080907] text-[#11140F] dark:text-[#EEF0EA] flex flex-col md:flex-row relative">
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
            <button
              type="button"
              onClick={() => setShowPromoModalPreview(true)}
              className="p-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#11140F] text-xs font-semibold text-[#11140F] dark:text-white flex items-center gap-1"
              title="Preview Entry Promo Modal"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Modal</span>
            </button>
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
                <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
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
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSection(item.id)}
                    className={`relative rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      sidebarCollapsed
                        ? `w-10 h-10 flex items-center justify-center mx-auto ${
                            isActive
                              ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] shadow-xs'
                              : 'text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                          }`
                        : `w-full flex items-center gap-3 px-3 py-2.5 ${
                            isActive
                              ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-semibold shadow-xs'
                              : 'text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                          }`
                    }`}
                    title={item.label}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400 dark:text-[#2F6B4F]' : ''}`} />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge && (
                      <span
                        className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold shrink-0 ${
                          isActive
                            ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                            : item.badgeColor
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {sidebarCollapsed && item.badge && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D0F0C]" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Alternate Platform Navigation & Utilities */}
          <div className="pt-2 border-t border-[#11140F]/10 dark:border-white/10 space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-bold text-[#11140F]/40 dark:text-white/40">
                PLATFORM & UTILITIES
              </div>
            )}

            <Link
              href="/product-tour"
              className={`rounded-xl text-xs font-medium transition-all ${
                sidebarCollapsed
                  ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                  : 'w-full flex items-center gap-3 px-3 py-2.5 text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
              }`}
              title="Product Tour"
            >
              <Compass className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Product Tour</span>}
            </Link>

            <Link
              href="/pricing"
              className={`rounded-xl text-xs font-medium transition-all ${
                sidebarCollapsed
                  ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                  : 'w-full flex items-center gap-3 px-3 py-2.5 text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
              }`}
              title="Pricing Plans"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Pricing Plans</span>}
            </Link>

            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className={`rounded-xl text-xs font-medium transition-all cursor-pointer ${
                sidebarCollapsed
                  ? 'w-10 h-10 flex items-center justify-center mx-auto text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                  : 'w-full flex items-center gap-3 px-3 py-2.5 text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
              }`}
              title="Bulk Import (AI)"
            >
              <Layers className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Bulk Import (AI)</span>}
            </button>

            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className={`rounded-xl text-xs font-medium transition-all ${
                    sidebarCollapsed
                      ? 'w-10 h-10 flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                      : 'w-full flex items-center gap-3 px-3 py-2.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title="Admin Console"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">Admin Console</span>}
                </Link>

                <Link
                  href="/admin/ai-usage"
                  className={`rounded-xl text-xs font-medium transition-all ${
                    sidebarCollapsed
                      ? 'w-10 h-10 flex items-center justify-center mx-auto text-purple-700 dark:text-purple-400 hover:bg-purple-500/10'
                      : 'w-full flex items-center gap-3 px-3 py-2.5 text-purple-700 dark:text-purple-400 hover:bg-purple-500/10'
                  }`}
                  title="AI Telemetry"
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">AI Telemetry</span>}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* User Profile Card (Bottom of Sidebar) */}
        {user && (
          <div className="p-2 lg:p-3 border-t border-[#11140F]/10 dark:border-white/10 shrink-0 bg-white/50 dark:bg-[#0D0F0C]/50">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#11140F]/[0.03] dark:bg-white/[0.03]">
                {/* Avatar & User Details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(true)}
                    className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-emerald-600 to-[#11140F] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs hover:ring-2 hover:ring-emerald-500/50 transition-all cursor-pointer"
                    title="Account Settings"
                  >
                    {userAvatar ? (
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#11140F] dark:text-white truncate">
                        {userName}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold">
                        {tierName}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#11140F]/50 dark:text-white/50 truncate block">
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Settings & Logout Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAccountModal(true)}
                    className="p-1.5 rounded-lg text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white hover:bg-[#11140F]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    title="Account & Privacy Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
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
                    <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
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
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-bold'
                            : 'text-[#11140F]/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {item.badge && (
                          <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold">
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
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#11140F]/70 dark:text-white/70"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span>Product Tour</span>
                </Link>
                <Link
                  href="/pricing"
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#11140F]/70 dark:text-white/70"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pricing Plans</span>
                </Link>
              </div>
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
                      <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
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

      {/* 4. MAIN WORKSPACE CONTENT AREA (Inspired by Healthy Dashboard) */}
      <main
        className={`flex-1 min-w-0 transition-all duration-150 ${
          density === 'compact'
            ? 'p-3 sm:p-4 lg:p-6 space-y-4'
            : 'p-4 sm:p-6 lg:p-8 space-y-6'
        }`}
      >
        {/* Main Header Row (Insp. from "Welcome, Diana!" row in Image 6) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-[#11140F]/10 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#11140F]/50 dark:text-white/50">
              <span>DynamicQR</span>
              <span>/</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
                {activeSection === 'all'
                  ? 'All Services'
                  : isMicroSaasSection
                  ? `Micro-SaaS • ${activeSection}`
                  : activeSection}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#11140F] dark:text-white mt-0.5">
              Welcome, {userName}!
            </h1>
            <p className="text-xs sm:text-[13px] text-[#11140F]/60 dark:text-white/60">
              Manage dynamic routes, review scan intelligence, and dispatch physical print campaigns.
            </p>
          </div>

          {/* Top Quick Actions & Stat Pills (Insp. from Image 6 top pill cards) */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Promo Modal Preview Trigger (Admin only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowPromoModalPreview(true)}
                className="px-3.5 py-1.5 rounded-xl border border-dashed border-[#11140F]/20 dark:border-white/20 bg-white/70 dark:bg-[#11140F] hover:bg-white text-xs font-semibold text-[#11140F] dark:text-white transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Test Promotional Entry Popup"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test Promo Modal</span>
              </button>
            )}

            {/* Quick Create Button */}
            <button
              type="button"
              onClick={handleCreateNewClick}
              className="px-3.5 py-1.5 rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-xs font-bold hover:bg-[#2A2E25] transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400 dark:text-[#2F6B4F]" />
              <span>New QR Link</span>
            </button>

            {/* View Mode Toggle */}
            {activeSection !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectSection('all')}
                className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#11140F] text-xs font-semibold text-[#11140F] dark:text-white hover:bg-[#11140F]/5 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Show All Tools</span>
              </button>
            )}
          </div>
        </div>

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
            {linkCreationAndList}
          </div>
        )}

        {/* VIEW 2: PLAN USAGE METER FOCUSED */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {planUsageMeter}
            {campaignAnalyst}
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
