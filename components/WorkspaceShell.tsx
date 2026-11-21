'use client';

import React, { useState } from 'react';
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
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('all');
  const [microSaasTab, setMicroSaasTab] = useState<'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi'>('mailing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPromoModalPreview, setShowPromoModalPreview] = useState(false);

  const handleSelectSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    if (['mailing', 'vcard', 'shortener', 'menu', 'wifi'].includes(section)) {
      setMicroSaasTab(section as any);
    }
    setMobileDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCreateNewClick = () => {
    setActiveSection('links');
    setMobileDrawerOpen(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isMicroSaasSection = ['mailing', 'vcard', 'shortener', 'menu', 'wifi'].includes(activeSection);
  const userName = user?.name || user?.email?.split('@')[0] || 'Creator';
  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const tierName = (user?.tier || 'free').toUpperCase();

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
      <div className="md:hidden sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0D0F0C]/90 backdrop-blur-md border-b border-[#11140F]/10 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-xl bg-[#11140F]/5 dark:bg-white/5 text-[#11140F] dark:text-white hover:bg-[#11140F]/10 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/#workspace" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#11140F] dark:bg-white flex items-center justify-center text-white dark:text-[#11140F]">
              <QrMark className="w-4 h-4" fill="currentColor" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#11140F] dark:text-white">DynamicQR</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPromoModalPreview(true)}
            className="p-1.5 rounded-lg border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#11140F] text-xs font-semibold text-[#11140F] dark:text-white flex items-center gap-1"
            title="Preview Entry Promo Modal"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Modal</span>
          </button>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
            {tierName}
          </span>
        </div>
      </div>

      {/* 2. DESKTOP SIDEBAR (Principal Source of Navigation — Insp. from Healthy App) */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0D0F0C] transition-all duration-300 sticky top-0 h-screen z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-64 lg:w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 lg:p-5 border-b border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          <Link href="/#workspace" className="flex items-center gap-2.5 min-w-0 group">
            <div className="w-9 h-9 rounded-xl bg-[#11140F] dark:bg-white flex items-center justify-center text-white dark:text-[#11140F] shadow-sm group-hover:scale-105 transition-transform">
              <QrMark className="w-5 h-5" fill="currentColor" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <span className="font-bold text-base tracking-tight text-[#11140F] dark:text-white block leading-tight">
                  DynamicQR
                </span>
                <span className="text-[10.5px] font-mono text-[#11140F]/50 dark:text-white/50 block leading-tight">
                  Sovereign Workspace
                </span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg bg-[#11140F]/5 dark:bg-white/5 hover:bg-[#11140F]/10 dark:hover:bg-white/10 text-[#11140F]/60 dark:text-white/60 transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Primary Action Button (Inspired by "+ New prescription" in Insp. image) */}
        <div className="p-3 shrink-0 space-y-2">
          <button
            type="button"
            onClick={handleCreateNewClick}
            className={`w-full py-2.5 px-3.5 rounded-xl bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] text-xs font-bold hover:bg-[#2A2E25] dark:hover:bg-white/90 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
              sidebarCollapsed ? 'p-2.5' : ''
            }`}
            title="Create New QR Code"
          >
            <Plus className="w-4 h-4 shrink-0 text-emerald-400 dark:text-[#2F6B4F]" />
            {!sidebarCollapsed && <span>New QR Code</span>}
          </button>

          {/* Test / Preview Promo Modal Button */}
          {!sidebarCollapsed && (
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
          )}
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          {navSections.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider font-bold text-[#11140F]/40 dark:text-white/40">
                  {group.group}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#11140F] dark:bg-white text-white dark:text-[#11140F] font-semibold shadow-xs'
                        : 'text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
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
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white transition-all"
              title="Product Tour"
            >
              <Compass className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Product Tour</span>}
            </Link>

            <Link
              href="/pricing"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white transition-all"
              title="Pricing Plans"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Pricing Plans</span>}
            </Link>

            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white transition-all cursor-pointer"
              title="Bulk Import (AI)"
            >
              <Layers className="w-4 h-4 shrink-0 text-purple-600 dark:text-purple-400" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Bulk Import (AI)</span>}
            </button>

            {isAdmin && (
              <>
                <Link
                  href="/admin"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  title="Admin Console"
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">Admin Console</span>}
                </Link>

                <Link
                  href="/admin/ai-usage"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-purple-700 dark:text-purple-400 hover:bg-purple-500/10 transition-all"
                  title="AI Telemetry"
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate flex-1 text-left">AI Telemetry</span>}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* User Profile Card (Bottom of Sidebar — Insp. from Healthy App) */}
        {user && (
          <div className="p-3 border-t border-[#11140F]/10 dark:border-white/10 shrink-0 bg-white/50 dark:bg-[#0D0F0C]/50">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-[#11140F]/[0.03] dark:bg-white/[0.03]">
                {/* Avatar & User Details */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-[#11140F] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                    {userInitial}
                  </div>
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
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-[#11140F] text-white flex items-center justify-center text-xs font-bold">
                  {userInitial}
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* 3. MOBILE SIDEBAR DRAWER (Full mobile navigation) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex">
          <div className="w-72 bg-[#F4F5F1] dark:bg-[#0D0F0C] h-full shadow-2xl p-4 flex flex-col justify-between border-r border-[#11140F]/10 dark:border-white/10">
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
                <div className="text-xs font-bold text-[#11140F] dark:text-white truncate">
                  {userName}
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="p-1 text-xs font-medium text-red-500 flex items-center gap-1"
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
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
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
            {/* Promo Modal Preview Trigger */}
            <button
              type="button"
              onClick={() => setShowPromoModalPreview(true)}
              className="px-3.5 py-1.5 rounded-xl border border-dashed border-[#11140F]/20 dark:border-white/20 bg-white/70 dark:bg-[#11140F] hover:bg-white text-xs font-semibold text-[#11140F] dark:text-white transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Test Promotional Entry Popup"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Test Promo Modal</span>
            </button>

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
              onTabChange={(t) => setMicroSaasTab(t)}
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
