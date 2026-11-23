'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Command,
  X,
  LayoutGrid,
  Sparkles,
  CreditCard,
  QrCode,
  Contact2,
  Utensils,
  Link2,
  Wifi,
  Mail,
  Globe,
  BarChart3,
  Palette,
  Settings,
  Sun,
  Moon,
  Shield,
  HelpCircle,
  CornerDownLeft,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { applyTheme, getStoredTheme } from '@/lib/theme';

export interface SearchCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: 'workspace' | 'overview') => void;
  onOpenAccountSettings?: () => void;
  user?: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
  } | null;
  isAdmin?: boolean;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation & Overview' | 'Micro-Apps & Generators' | 'Workspace & Analytics' | 'System & Preferences';
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  keywords: string[];
  action: () => void;
}

export default function SearchCommandModal({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAccountSettings,
  user,
  isAdmin = false,
}: SearchCommandModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const handleNavigateTab = (tab: 'workspace' | 'overview') => {
    onClose();
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.location.href = `/#${tab}`;
      return;
    }
    if (onSelectTab) {
      onSelectTab(tab);
      window.history.replaceState(null, '', `#${tab}`);
    } else {
      window.location.hash = tab;
    }
  };

  const handleNavigateWorkspaceSection = (section: string) => {
    onClose();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dynamicqr-navigate-section', { detail: { section } }));
      if (window.location.pathname !== '/') {
        window.location.href = `/#workspace?section=${section}`;
        return;
      }
      if (onSelectTab) {
        onSelectTab('workspace');
      }
      window.history.replaceState(null, '', `#workspace?section=${section}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleTheme = () => {
    onClose();
    const current = getStoredTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };

  // Static commands catalog
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // 1. Navigation & Overview
      {
        id: 'nav-workspace',
        title: 'Workspace Dashboard',
        subtitle: 'Manage active dynamic links, routing rules, and live telemetry',
        category: 'Navigation & Overview',
        icon: LayoutGrid,
        badge: 'Workspace',
        badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        keywords: ['workspace', 'dashboard', 'home', 'links', 'manage', 'qr codes', 'portal', 'control'],
        action: () => handleNavigateTab('workspace'),
      },
      {
        id: 'nav-tour',
        title: 'Interactive Product Tour',
        subtitle: 'Explore deep link branching, sub-10ms edge latency, and vector math',
        category: 'Navigation & Overview',
        icon: Sparkles,
        badge: 'Tour',
        badgeColor: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20',
        keywords: ['tour', 'product tour', 'overview', 'features', 'showcase', 'architecture', 'speed'],
        action: () => handleNavigateTab('overview'),
      },
      {
        id: 'nav-pricing',
        title: 'Pricing Plans & Subscriptions',
        subtitle: 'Compare Free, Pro, and Ultra tiers with the Zero-Reprint guarantee',
        category: 'Navigation & Overview',
        icon: CreditCard,
        badge: 'Plans',
        badgeColor: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20',
        keywords: ['pricing', 'plans', 'subscription', 'upgrade', 'cost', 'ultra', 'pro', 'billing', 'limits'],
        action: () => {
          onClose();
          window.location.href = '/pricing';
        },
      },

      // 2. Micro-Apps & Generators
      {
        id: 'tool-qr-code',
        title: 'Dynamic QR Code Generator',
        subtitle: 'High-precision SVG vector codes with branded frame styling and logo embed',
        category: 'Micro-Apps & Generators',
        icon: QrCode,
        badge: 'Core Engine',
        badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
        keywords: ['create', 'new', 'generator', 'qr code', 'vector', 'logo', 'styling', 'dynamic', 'svg'],
        action: () => handleNavigateWorkspaceSection('links'),
      },
      {
        id: 'tool-vcard',
        title: 'Digital vCard Builder',
        subtitle: 'Interactive business cards with 1-tap Apple & Android contacts download (.vcf)',
        category: 'Micro-Apps & Generators',
        icon: Contact2,
        badge: 'Micro-SaaS',
        badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
        keywords: ['vcard', 'business card', 'contact', 'vcf', 'phone', 'email', 'profile', 'headshot', 'lead'],
        action: () => handleNavigateWorkspaceSection('vcard'),
      },
      {
        id: 'tool-menu',
        title: 'Restaurant & Bar Menu Maker',
        subtitle: 'Digital tabletop menus with instant price swaps, dishes, and allergen badges',
        category: 'Micro-Apps & Generators',
        icon: Utensils,
        badge: 'Micro-SaaS',
        badgeColor: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20',
        keywords: ['menu', 'restaurant', 'food', 'dishes', 'drinks', 'bar', 'tabletop', 'allergens', 'price'],
        action: () => handleNavigateWorkspaceSection('menu'),
      },
      {
        id: 'tool-shortener',
        title: 'Branded Link Shortener',
        subtitle: 'Clean short links with sub-10ms 307 ingress, UTM tagging, and click tracking',
        category: 'Micro-Apps & Generators',
        icon: Link2,
        badge: 'Micro-SaaS',
        badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        keywords: ['shortener', 'short link', 'url', 'redirect', 'utm', 'tracking', 'slug', 'clicks'],
        action: () => handleNavigateWorkspaceSection('shortener'),
      },
      {
        id: 'tool-wifi',
        title: 'Instant Wi-Fi Onboarding',
        subtitle: '1-scan guest Wi-Fi access with zero password typing or typing errors',
        category: 'Micro-Apps & Generators',
        icon: Wifi,
        badge: 'Micro-SaaS',
        badgeColor: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        keywords: ['wifi', 'wi-fi', 'network', 'password', 'guest', 'wpa', 'wpa2', 'connect', 'ssid'],
        action: () => handleNavigateWorkspaceSection('wifi'),
      },
      {
        id: 'tool-mailing',
        title: 'Customer Mailing Lists',
        subtitle: 'Lead capture forms, subscriber opt-ins, and direct campaign broadcast',
        category: 'Micro-Apps & Generators',
        icon: Mail,
        badge: 'Micro-SaaS',
        badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20',
        keywords: ['mailing', 'mail list', 'leads', 'subscribers', 'newsletter', 'email capture', 'contacts'],
        action: () => handleNavigateWorkspaceSection('mailing'),
      },

      // 3. Workspace & Analytics
      {
        id: 'section-analyst',
        title: 'AI Campaign Telemetry & Analyst',
        subtitle: 'Scan velocity, diurnal patterns, city locations, and device OS telemetry',
        category: 'Workspace & Analytics',
        icon: BarChart3,
        badge: 'AI Telemetry',
        badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        keywords: ['analytics', 'analyst', 'metrics', 'scans', 'velocity', 'telemetry', 'charts', 'ai', 'geo'],
        action: () => handleNavigateWorkspaceSection('analyst'),
      },
      {
        id: 'section-domains',
        title: 'Branded Custom Domains',
        subtitle: 'Connect custom CNAME domains with automated SSL routing and zero branding',
        category: 'Workspace & Analytics',
        icon: Globe,
        badge: 'Custom CNAME',
        badgeColor: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20',
        keywords: ['domain', 'custom domain', 'cname', 'dns', 'ssl', 'branding', 'white label'],
        action: () => handleNavigateWorkspaceSection('domains'),
      },
      {
        id: 'section-art-studio',
        title: 'QR Art Studio (AI Generative)',
        subtitle: 'Generate stylized generative art QR codes blending aesthetics with scannability',
        category: 'Workspace & Analytics',
        icon: Palette,
        badge: 'AI Creative',
        badgeColor: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20',
        keywords: ['art', 'art studio', 'ai qr', 'generative', 'creative', 'diffusion', 'aesthetic'],
        action: () => handleNavigateWorkspaceSection('all'),
      },

      // 4. System & Preferences
      {
        id: 'action-settings',
        title: 'Account Settings & Profile',
        subtitle: 'Manage profile avatar picture, display name, account credentials, and preferences',
        category: 'System & Preferences',
        icon: Settings,
        badge: 'Account',
        badgeColor: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
        keywords: ['account', 'settings', 'profile', 'avatar', 'picture', 'preferences', 'name', 'email'],
        action: () => {
          onClose();
          if (onOpenAccountSettings) onOpenAccountSettings();
        },
      },
      {
        id: 'action-theme',
        title: 'Toggle Theme (Dark / Light)',
        subtitle: 'Switch appearance between deep obsidian dark and clean daylight theme',
        category: 'System & Preferences',
        icon: Sun,
        badge: 'Appearance',
        badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
        keywords: ['theme', 'dark mode', 'light mode', 'appearance', 'mode', 'color scheme', 'toggle'],
        action: handleToggleTheme,
      },
    ];

    if (isAdmin) {
      list.unshift({
        id: 'nav-admin',
        title: 'Sovereign Admin Console',
        subtitle: 'Platform sovereignty, system announcement broadcast, and platform oversight',
        category: 'Navigation & Overview',
        icon: Shield,
        badge: 'Admin Only',
        badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
        keywords: ['admin', 'console', 'sovereign', 'broadcast', 'maintenance', 'users', 'system'],
        action: () => {
          onClose();
          window.location.href = '/admin';
        },
      });
    }

    return list;
  }, [isAdmin]);

  // Filter commands based on user query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;

    return allCommands.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(q));
      return matchTitle || matchSubtitle || matchCategory || matchKeywords;
    });
  }, [allCommands, query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Group items by category for clean visual hierarchy
  const groupedCategories = useMemo(() => {
    const groups: { [cat: string]: { item: CommandItem; index: number }[] } = {};
    filteredCommands.forEach((item, idx) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push({ item, index: idx });
    });
    return groups;
  }, [filteredCommands]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search and command palette"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 pt-16 sm:pt-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl border border-[#11140F]/15 dark:border-white/15 bg-white/98 dark:bg-[#121610]/98 text-[#11140F] dark:text-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] backdrop-blur-xl animate-in zoom-in-95 duration-150"
      >
        {/* Top Search Input Row */}
        <div className="relative flex items-center px-4 py-3.5 sm:py-4 border-b border-[#11140F]/10 dark:border-white/10 shrink-0">
          <Search className="w-5 h-5 text-[#11140F]/45 dark:text-white/45 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search micro-apps, links, tour, pricing, settings..."
            className="w-full bg-transparent text-[14.5px] sm:text-[15px] font-medium text-[#11140F] dark:text-white placeholder:text-[#11140F]/40 dark:placeholder:text-white/40 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-[#11140F]/40 dark:text-white/40 hover:text-[#11140F] dark:hover:text-white transition-colors mr-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono text-[#11140F]/50 dark:text-white/50 border border-[#11140F]/10 dark:border-white/10 bg-[#11140F]/[0.03] dark:bg-white/[0.05]">
            ESC
          </kbd>
        </div>

        {/* Quick Suggestion Pills when input is empty */}
        {!query && (
          <div className="px-4 py-2 bg-[#11140F]/[0.02] dark:bg-white/[0.02] border-b border-[#11140F]/5 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[11px] font-semibold text-[#11140F]/45 dark:text-white/40 mr-1 shrink-0">
              Suggestions:
            </span>
            {[
              { label: 'vCard', q: 'vcard' },
              { label: 'Menu', q: 'menu' },
              { label: 'Wi-Fi', q: 'wifi' },
              { label: 'Shortener', q: 'shortener' },
              { label: 'Mailing', q: 'mailing' },
              { label: 'Pricing', q: 'pricing' },
            ].map((pill) => (
              <button
                key={pill.q}
                type="button"
                onClick={() => setQuery(pill.q)}
                className="px-2.5 py-0.5 rounded-full text-[11.5px] font-medium border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-white/5 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors shrink-0 cursor-pointer"
              >
                {pill.label}
              </button>
            ))}
          </div>
        )}

        {/* Results Scroll Area */}
        <div ref={resultsRef} className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-3">
          {filteredCommands.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-10 h-10 rounded-2xl bg-[#11140F]/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3 text-[#11140F]/40 dark:text-white/40">
                <Search className="w-5 h-5" />
              </div>
              <p className="text-[13.5px] font-semibold text-[#11140F] dark:text-white">
                No matching results found
              </p>
              <p className="text-[12px] text-[#11140F]/50 dark:text-white/50 mt-1 max-w-sm mx-auto">
                No commands or tools matched &ldquo;{query}&rdquo;. Try searching for &ldquo;vCard&rdquo;, &ldquo;Menu&rdquo;, &ldquo;Wi-Fi&rdquo;, or &ldquo;Pricing&rdquo;.
              </p>
            </div>
          ) : (
            Object.entries(groupedCategories).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-[#11140F]/45 dark:text-white/40">
                  {category}
                </div>
                {items.map(({ item, index }) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all text-left cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 dark:bg-white/[0.09] text-emerald-950 dark:text-white ring-1 ring-emerald-500/30 dark:ring-white/15 shadow-xs'
                          : 'hover:bg-[#11140F]/[0.03] dark:hover:bg-white/[0.04] text-[#11140F] dark:text-white/90'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                              : 'bg-[#11140F]/[0.05] dark:bg-white/[0.08] text-[#11140F]/70 dark:text-white/70'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-bold truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                  item.badgeColor ||
                                  'bg-[#11140F]/5 dark:bg-white/10 text-[#11140F]/70 dark:text-white/70 border-current'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-[#11140F]/55 dark:text-white/50 truncate">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Right Indicator: Enter arrow when selected */}
                      <div className="shrink-0 flex items-center gap-1.5">
                        {isSelected && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <span>Open</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </span>
                        )}
                        <ArrowRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isSelected
                              ? 'text-emerald-600 dark:text-emerald-400 translate-x-0.5'
                              : 'text-[#11140F]/20 dark:text-white/20'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom Footer Row with Shortcuts */}
        <div className="px-4 py-2.5 bg-[#11140F]/[0.03] dark:bg-white/[0.03] border-t border-[#11140F]/10 dark:border-white/10 flex items-center justify-between text-[11px] text-[#11140F]/50 dark:text-white/45 shrink-0">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-white/10 font-mono">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.2 rounded border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-white/10 font-mono">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-white/10 font-mono">
                ↵
              </kbd>
              to select
            </span>
            <span className="inline-flex sm:hidden">
              Tap any item to jump directly
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono">
            <span>DynamicQR Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
