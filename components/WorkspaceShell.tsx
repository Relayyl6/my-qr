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
  ExternalLink,
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
  SlidersHorizontal,
  ChevronDown,
  Compass,
} from 'lucide-react';
import BulkImportWizard from './BulkImportWizard';
import AccountSettingsModal from './AccountSettingsModal';
import { signOut } from '@/app/auth-actions';

export type WorkspaceSection =
  | 'overview'
  | 'links'
  | 'analyst'
  | 'domains'
  | 'mailing'
  | 'vcard'
  | 'shortener'
  | 'menu'
  | 'wifi'
  | 'all';

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
  renderMicroSaasHub: (
    activeTab: 'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi',
    onTabChange: (t: 'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi') => void
  ) => React.ReactNode;
  linkCreationAndList: React.ReactNode;
  activeLinksCount: number;
}

export default function WorkspaceShell({
  user,
  isAdmin = false,
  planUsageMeter,
  campaignAnalyst,
  brandedDomainsManager,
  renderMicroSaasHub,
  linkCreationAndList,
  activeLinksCount,
}: WorkspaceShellProps) {
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('all');
  const [microSaasTab, setMicroSaasTab] = useState<'mailing' | 'vcard' | 'shortener' | 'menu' | 'wifi'>('mailing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Sync section with micro-saas internal tab
  const handleSelectSection = (section: WorkspaceSection) => {
    setActiveSection(section);
    if (['mailing', 'vcard', 'shortener', 'menu', 'wifi'].includes(section)) {
      setMicroSaasTab(section as any);
    }
    setMobileDrawerOpen(false);
    // Smooth scroll to top of workspace container
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isMicroSaasSection = ['mailing', 'vcard', 'shortener', 'menu', 'wifi'].includes(activeSection);

  const navSections = [
    {
      group: 'MAIN WORKSPACE',
      items: [
        {
          id: 'all' as WorkspaceSection,
          label: 'Complete Workspace',
          icon: LayoutDashboard,
          badge: 'All Tools',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
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
          badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
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
          badge: 'Double Opt-in',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
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
          badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
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
    <div className="w-full flex min-h-[calc(100vh-4rem)] relative">
      {/* 1. DESKTOP STICKY SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[#11140F]/10 dark:border-white/10 bg-white/70 dark:bg-[#0D0F0C]/80 backdrop-blur-md transition-all duration-300 sticky top-16 h-[calc(100vh-4rem)] z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-64 lg:w-72'
        }`}
      >
        {/* Workspace Brand / User Card */}
        <div className="p-4 border-b border-[#11140F]/10 dark:border-white/10 flex items-center justify-between gap-3 shrink-0">
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider font-bold text-[#11140F]/45 dark:text-white/45 truncate">
                WORKSPACE
              </div>
              <div className="text-sm font-bold text-[#11140F] dark:text-white truncate">
                {user ? (user.name ? `${user.name}'s Suite` : user.email.split('@')[0]) : 'Guest Suite'}
              </div>
            </div>
          )}

          {/* Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg bg-[#11140F]/5 dark:bg-white/5 hover:bg-[#11140F]/10 dark:hover:bg-white/10 text-[#11140F]/70 dark:text-white/70 transition-colors ml-auto cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar width"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {navSections.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 py-1 text-[10.5px] font-mono uppercase tracking-wider font-bold text-[#11140F]/40 dark:text-white/40">
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

          {/* Alternate Navigation & Quick Action Utilities */}
          <div className="pt-2 border-t border-[#11140F]/10 dark:border-white/10 space-y-1">
            {!sidebarCollapsed && (
              <div className="px-3 py-1 text-[10.5px] font-mono uppercase tracking-wider font-bold text-[#11140F]/40 dark:text-white/40">
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
              <Layers className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              {!sidebarCollapsed && <span className="truncate flex-1 text-left">Bulk Import (AI)</span>}
            </button>

            {user && (
              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-[#11140F]/70 dark:text-white/70 hover:bg-[#11140F]/5 dark:hover:bg-white/5 hover:text-[#11140F] dark:hover:text-white transition-all cursor-pointer"
                title="Account & Privacy"
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate flex-1 text-left">Account & Privacy</span>}
              </button>
            )}

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

        {/* User Footer / Log Out */}
        {user && (
          <div className="p-3 border-t border-[#11140F]/10 dark:border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => signOut()}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Log out</span>}
            </button>
          </div>
        )}
      </aside>

      {/* 2. MOBILE SIDEBAR DRAWER (Slide-over on smartphones & tablets) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/60 backdrop-blur-xs flex">
          <div className="w-72 bg-[#EEF0EA] dark:bg-[#0D0F0C] h-full shadow-2xl p-4 flex flex-col justify-between border-r border-[#11140F]/10 dark:border-white/10">
            <div className="space-y-5 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#11140F]/10 dark:border-white/10">
                <span className="text-sm font-bold text-[#11140F] dark:text-white">Workspace Services</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-[#11140F]/60 dark:text-white/60 hover:text-[#11140F] dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
              <div className="pt-3 border-t border-[#11140F]/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT AREA */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Workspace Top Bar Header (Breadcrumb + Controls) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/60 dark:bg-[#11140F]/60 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-[#11140F]/10 dark:border-white/10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-[#11140F]/5 dark:bg-white/5 text-[#11140F] dark:text-white hover:bg-[#11140F]/10"
              aria-label="Open workspace navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#11140F]/50 dark:text-white/50">
                <span>Workspace</span>
                <span>/</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase">
                  {activeSection === 'all'
                    ? 'All Services View'
                    : isMicroSaasSection
                    ? `Micro-SaaS • ${activeSection}`
                    : activeSection}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#11140F] dark:text-white tracking-tight truncate">
                {activeSection === 'all' && 'Unified DynamicQR Workspace'}
                {activeSection === 'overview' && 'Plan Capacity & Real-Time Usage'}
                {activeSection === 'links' && 'Dynamic QR Link Manager & Engine'}
                {activeSection === 'analyst' && 'AI Automated Campaign Intelligence'}
                {activeSection === 'domains' && 'Custom Branded Domains & SSL'}
                {activeSection === 'mailing' && 'Customer Mailing Lists & Physical Print QR'}
                {activeSection === 'vcard' && 'Digital Executive vCards & Contact Cards'}
                {activeSection === 'shortener' && 'Smart Deep Link Shortener & OS Routing'}
                {activeSection === 'menu' && 'Digital Restaurant Menus & Contactless Dining'}
                {activeSection === 'wifi' && 'Instant Guest Wi-Fi Sharing & Tent Displays'}
              </h1>
            </div>
          </div>

          {/* Quick View Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {activeSection !== 'all' ? (
              <button
                type="button"
                onClick={() => handleSelectSection('all')}
                className="px-3 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-[#11140F] text-xs font-semibold text-[#11140F] dark:text-white hover:bg-[#11140F]/5 dark:hover:bg-white/5 transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Show All Services</span>
              </button>
            ) : (
              <span className="text-xs text-[#11140F]/60 dark:text-white/60 font-medium hidden sm:inline-block">
                Sidebar allows direct 1-click focus on any tool
              </span>
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
            {renderMicroSaasHub(microSaasTab, (t) => setMicroSaasTab(t))}
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
            {renderMicroSaasHub(microSaasTab, (t) => {
              setMicroSaasTab(t);
              setActiveSection(t as any);
            })}
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
    </div>
  );
}
