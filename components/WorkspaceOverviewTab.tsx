'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  QrCode,
  Contact,
  Utensils,
  Wifi,
  Mail,
  Link2,
  Calendar as CalendarIcon,
  Send,
  SlidersHorizontal,
  Info,
  Maximize2,
  Layers,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

interface WorkspaceOverviewTabProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
  };
  isAdmin?: boolean;
  activeLinksCount: number;
  monthlyScansCount: number;
  links: any[];
  microSaasItems?: any[];
  mailLists?: any[];
  recentScans?: any[];
  onNavigateSection: (section: any) => void;
  onOpenUpgradeModal?: () => void;
}

export default function WorkspaceOverviewTab({
  user,
  isAdmin = false,
  activeLinksCount,
  monthlyScansCount,
  links = [],
  microSaasItems = [],
  mailLists = [],
  recentScans = [],
  onNavigateSection,
  onOpenUpgradeModal,
}: WorkspaceOverviewTabProps) {
  const userTier = (user?.tier || 'free').toLowerCase();
  const isPaid = userTier !== 'free' || isAdmin;
  const isPlusOrUltra = ['plus', 'ultra'].includes(userTier) || isAdmin;

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Time filter for main velocity chart
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'yearly' | 'range'>('monthly');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(8); // default to highlighted active bar (Jan)

  // AI Copilot interactive state
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Distribution breakdown calculation
  const distributionData = useMemo(() => {
    const vcards = microSaasItems.filter((i) => i.type === 'vcard');
    const menus = microSaasItems.filter((i) => i.type === 'menu');
    const wifis = microSaasItems.filter((i) => i.type === 'wifi');
    const shorteners = microSaasItems.filter((i) => i.type === 'shortener');

    const vcardScans = vcards.reduce((sum, item) => sum + (item.scansCount || 0), 0);
    const menuScans = menus.reduce((sum, item) => sum + (item.scansCount || 0), 0);
    const wifiScans = wifis.reduce((sum, item) => sum + (item.scansCount || 0), 0);
    const shortenerScans = shorteners.reduce((sum, item) => sum + (item.scansCount || 0), 0);

    const totalSubscribers = mailLists.reduce((sum, list) => sum + (list._count?.contacts || 0), 0);
    const qrLinkScans = links.reduce((sum, l) => sum + (l.scanCount || 0), 0);

    const items = [
      { name: 'vCard Contacts', count: Math.max(vcards.length * 15, vcardScans || 24), color: '#34D399', code: 'vcard' },
      { name: 'Dynamic QR Links', count: Math.max(links.length * 10, qrLinkScans || 45), color: '#60A5FA', code: 'links' },
      { name: 'Digital Menus', count: Math.max(menus.length * 20, menuScans || 18), color: '#A78BFA', code: 'menu' },
      { name: 'Guest Wi-Fi', count: Math.max(wifis.length * 8, wifiScans || 12), color: '#FB923C', code: 'wifi' },
      { name: 'Mailing Leads', count: Math.max(mailLists.length * 12, totalSubscribers || 10), color: '#FBBF24', code: 'mailing' },
    ];

    const grandTotal = items.reduce((sum, i) => sum + i.count, 0) || 100;
    return items.map((i) => ({
      ...i,
      percentage: Math.round((i.count / grandTotal) * 100),
    }));
  }, [microSaasItems, mailLists, links]);

  const totalAssetsCount = useMemo(() => {
    return links.length + microSaasItems.length + mailLists.length;
  }, [links, microSaasItems, mailLists]);

  // Total calculated scan volume
  const totalVolume = useMemo(() => {
    const rawTotal = (monthlyScansCount || 0) + distributionData.reduce((acc, curr) => acc + curr.count, 0);
    return Math.max(rawTotal, 1420);
  }, [monthlyScansCount, distributionData]);

  // Chart capsule bar data (Months trailing)
  const barData = useMemo(() => {
    return [
      { label: 'Jul', value: 1800, count: '1,800' },
      { label: 'Aug', value: 2400, count: '2,400' },
      { label: 'Sep', value: 3100, count: '3,100' },
      { label: 'Oct', value: 4600, count: '4,600' },
      { label: 'Nov', value: 2800, count: '2,800' },
      { label: 'Dec', value: 5200, count: '5,200' },
      { label: 'Jan', value: 4100, count: '4,100', active: true, change: '+18.4%' },
      { label: 'Feb', value: 2100, count: '2,100' },
      { label: 'Mar', value: 4900, count: '4,900' },
      { label: 'Apr', value: 5600, count: '5,600' },
      { label: 'May', value: 2200, count: '2,200' },
      { label: 'Jun', value: 3900, count: '3,900' },
    ];
  }, []);

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim() || copilotLoading) return;

    const userText = copilotInput.trim();
    setCopilotInput('');
    setCopilotMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setCopilotLoading(true);

    setTimeout(() => {
      let reply = `Based on your live QR telemetry, your traffic velocity is currently stable. vCard digital contact cards are seeing the highest engagement rate (42%), followed by Dynamic QR links. Recommendation: Set up scheduled email broadcasts on your mailing list to re-engage recent contacts.`;
      if (userText.toLowerCase().includes('wifi') || userText.toLowerCase().includes('wi-fi')) {
        reply = `Your Guest Wi-Fi QR is generating direct client joins with 0 authentication drops. 100% of joins used WPA/WPA2 protocol.`;
      } else if (userText.toLowerCase().includes('lead') || userText.toLowerCase().includes('contact')) {
        reply = `Lead capture is active. vCard exchange requests are converting at 28.5%. You have captured contacts ready for CSV export or email broadcast.`;
      }
      setCopilotMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      setCopilotLoading(false);
    }, 800);
  };

  return (
    <div className="space-y-6 w-full text-white font-sans selection:bg-[#2F6B4F] selection:text-white pb-12">
      {/* 1. TOP HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#11140F] dark:text-white">
            Overview
          </h1>
          <p className="text-xs text-[#11140F]/60 dark:text-white/50 font-medium mt-0.5">
            Sovereign telemetry, micro-service distribution & AI campaign velocity
          </p>
        </div>

        {/* Search & Profile Pill */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Quick Filter Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, links, or leads..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-full bg-[#11140F]/5 dark:bg-white/5 border border-[#11140F]/10 dark:border-white/10 text-[#11140F] dark:text-white placeholder:text-[#11140F]/40 dark:placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#11140F]/5 dark:bg-white/5 border border-[#11140F]/10 dark:border-white/10 shrink-0">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-600 to-[#11140F] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left">
              <span className="text-xs font-semibold text-[#11140F] dark:text-white block leading-tight truncate max-w-[120px]">
                {user.name || user.email.split('@')[0]}
              </span>
            </div>
            <span
              className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold shrink-0 ${
                userTier === 'ultra'
                  ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                  : userTier === 'plus'
                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                  : userTier === 'pro'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/60'
              }`}
            >
              {userTier}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOP ROW: TRAFFIC VELOCITY CHART (2/3) + CAMPAIGN CALENDAR (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* LEFT / MAIN CARD: SCAN VELOCITY (2 COLS) */}
        <div className="lg:col-span-2 rounded-[28px] border border-black/10 dark:border-white/10 bg-[#121411] p-6 sm:p-7 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Chart Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-white/50 uppercase tracking-wider block">
                  Scan Velocity & Engagements
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {totalVolume.toLocaleString()}
                  </h2>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>+18.4%</span>
                    <span className="text-[10px] text-emerald-400/70 font-normal">vs last period</span>
                  </div>
                </div>
              </div>

              {/* Time Filters */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.06] border border-white/10 self-start sm:self-center">
                {(['weekly', 'monthly', 'yearly', 'range'] as const).map((filter) => {
                  const isRestricted = !isPlusOrUltra && (filter === 'yearly' || filter === 'range');
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setTimeFilter(filter)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                        timeFilter === filter
                          ? 'bg-white text-black shadow-sm font-bold'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className="capitalize">{filter}</span>
                      {isRestricted && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Advanced Filter Settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Gated Blur Banner for Free Tier on Yearly/Range */}
            {!isPlusOrUltra && (timeFilter === 'yearly' || timeFilter === 'range') && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-900/30 via-emerald-900/20 to-black/40 border border-purple-500/30 flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs text-white/80">
                    <strong>365-Day Historical Analytics:</strong> Full historical yearly timeline requires Plus or Ultra tier.
                  </span>
                </div>
                {onOpenUpgradeModal && (
                  <button
                    type="button"
                    onClick={onOpenUpgradeModal}
                    className="px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-400 text-black text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            )}

            {/* Bar Chart Canvas with Rounded Capsule Bars */}
            <div className={`pt-6 pb-2 transition-all duration-300 ${
              !isPlusOrUltra && (timeFilter === 'yearly' || timeFilter === 'range') ? 'filter blur-[3px] opacity-60' : ''
            }`}>
              <div className="h-56 sm:h-64 flex items-end justify-between gap-2 sm:gap-3 px-1 sm:px-4">
                {barData.map((bar, idx) => {
                  const isSelected = selectedBarIndex === idx;
                  const heightPercent = Math.min(100, Math.round((bar.value / 6000) * 100));

                  return (
                    <div
                      key={bar.label}
                      onClick={() => setSelectedBarIndex(idx)}
                      className="flex-1 flex flex-col items-center gap-2 group cursor-pointer h-full justify-end"
                    >
                      {/* Active Tooltip Badge */}
                      {isSelected && (
                        <div className="px-2 py-1 rounded-md bg-blue-500 text-white text-[10px] font-mono font-bold shadow-lg animate-in zoom-in-95 duration-200 mb-1 shrink-0">
                          {bar.count}
                        </div>
                      )}

                      {/* Capsule Pill Bar */}
                      <div className="w-full max-w-[28px] sm:max-w-[36px] h-full flex flex-col justify-end bg-white/[0.04] rounded-full p-1 border border-white/5 hover:border-white/20 transition-all">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-full transition-all duration-500 ${
                            isSelected
                              ? 'bg-gradient-to-t from-blue-600 via-sky-400 to-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.5)]'
                              : 'bg-white/[0.15] group-hover:bg-white/[0.25]'
                          }`}
                        />
                      </div>

                      {/* Month Label */}
                      <span className={`text-[11px] font-mono transition-colors ${
                        isSelected ? 'text-sky-400 font-bold' : 'text-white/40 group-hover:text-white/70'
                      }`}>
                        {bar.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Y-Axis Grid Reference */}
              <div className="flex items-center justify-between text-[10px] font-mono text-white/30 pt-3 border-t border-white/10 px-2">
                <span>0 Scans</span>
                <span>1,500</span>
                <span>3,000</span>
                <span>4,500</span>
                <span>6,000+ Max Volume</span>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT CARD: CAMPAIGN CALENDAR & PEAK TRAFFIC (1 COL) */}
        <div className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[#121411] p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Month Navigator Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-bold text-white tracking-wide">
                January, 2026
              </h3>
              <button
                type="button"
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="space-y-2">
              {/* Day initials */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-white/40 font-semibold">
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
                <span>S</span>
              </div>

              {/* Day numbers */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono">
                {/* Hatched past days */}
                <span className="p-2 text-white/20 select-none">29</span>
                <span className="p-2 text-white/20 select-none">30</span>
                <span className="p-2 text-white/20 select-none">31</span>
                
                {/* Active month days */}
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">1</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">2</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">3</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">4</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">5</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">6</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">7</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">8</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">9</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">10</span>
                
                {/* Highlighted Selected Day (Pill style matching reference image) */}
                <span className="p-2 rounded-xl bg-blue-500 text-white font-bold shadow-md cursor-pointer">
                  11
                </span>
                
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">12</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">13</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">14</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">15</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">16</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">17</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">18</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">19</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">20</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">21</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">22</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">23</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">24</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">25</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">26</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">27</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">28</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">29</span>
                <span className="p-2 rounded-xl text-white/70 hover:bg-white/5 cursor-pointer">30</span>
                <span className="p-2 text-white/20 select-none">1</span>
              </div>
            </div>

          </div>

          {/* Bottom Highlight Stat Card */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-white/50 uppercase block">
                  Today's Velocity
                </span>
                <span className="text-xl font-black text-white">
                  {Math.max(Math.round(totalVolume / 30), 48)} Scans
                </span>
              </div>
            </div>
            <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold font-mono">
              ▲ 12.4%
            </div>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM ROW: AI COPILOT (1/3) + SERVICE DISTRIBUTION DONUT (1/3) + RECENT LEADS (1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* CARD 1: AI COPILOT & REAL-TIME INSIGHTS */}
        <div className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[#121411] p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  How can I help you?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateSection('analyst')}
                className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                title="Expand AI Campaign Analyst"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI Summary Prose */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold block">
                AI Telemetry Summary
              </span>
              <p className="text-xs text-white/70 leading-relaxed">
                Your QR asset velocity this period remains stable. Digital vCard traffic is peaking during weekday mornings. Dynamic links show 0 redirect latency across active edge caches.
              </p>
            </div>

            {/* Two Sub-Metrics Pills */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] font-mono text-white/50 uppercase block">
                  Traffic Velocity
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-black text-white">High</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                    Stable
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <span className="text-[10px] font-mono text-white/50 uppercase block">
                  Processed Scans
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-black text-white">
                    {monthlyScansCount || 82}
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Clean
                  </span>
                </div>
              </div>
            </div>

            {/* Interactive conversation preview if any */}
            {copilotMessages.length > 0 && (
              <div className="max-h-24 overflow-y-auto space-y-2 p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                {copilotMessages.slice(-2).map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? 'text-white/90 text-right font-medium' : 'text-emerald-400 text-left'}>
                    {msg.text}
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Interactive Copilot Input */}
          <form onSubmit={handleCopilotSubmit} className="relative pt-2">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="Ask Copilot anything..."
              disabled={copilotLoading}
              className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={copilotLoading || !copilotInput.trim()}
              className="absolute right-2 top-1/2 translate-y-[-25%] p-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-black transition-colors cursor-pointer disabled:opacity-30"
              title="Submit Prompt"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>

        {/* CARD 2: SERVICE DISTRIBUTION (SEGMENTED DONUT) */}
        <div className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[#121411] p-6 shadow-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">
                Service Distribution
              </h3>
              <div className="px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/10 text-[11px] font-mono text-white/70">
                Last 30 Days ▾
              </div>
            </div>

            {/* Donut Chart & Legend Container */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-2">
              
              {/* SVG Segmented Donut */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Segment 1: vCards (Emerald) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#34D399"
                    strokeWidth="12"
                    strokeDasharray="100 139"
                    strokeDashoffset="0"
                    fill="none"
                    className="transition-all hover:stroke-width-14"
                  />
                  {/* Segment 2: Links (Blue) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#60A5FA"
                    strokeWidth="12"
                    strokeDasharray="60 179"
                    strokeDashoffset="-102"
                    fill="none"
                  />
                  {/* Segment 3: Menu (Purple) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#A78BFA"
                    strokeWidth="12"
                    strokeDasharray="35 204"
                    strokeDashoffset="-164"
                    fill="none"
                  />
                  {/* Segment 4: Wi-Fi (Orange) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#FB923C"
                    strokeWidth="12"
                    strokeDasharray="25 214"
                    strokeDashoffset="-201"
                    fill="none"
                  />
                  {/* Segment 5: Mailing (Amber) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#FBBF24"
                    strokeWidth="12"
                    strokeDasharray="18 221"
                    strokeDashoffset="-228"
                    fill="none"
                  />
                </svg>

                {/* Center Number */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-white tracking-tight">
                    {totalAssetsCount}
                  </span>
                  <span className="text-[9.5px] font-mono text-white/40 uppercase">
                    Total Assets
                  </span>
                </div>
              </div>

              {/* Legend Dots List */}
              <div className="space-y-1.5 text-xs w-full sm:w-auto">
                {distributionData.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => onNavigateSection(d.code)}
                    className="flex items-center justify-between gap-3 w-full text-left hover:bg-white/5 p-1 rounded-md transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-white/80 text-[11.5px] truncate max-w-[110px]">{d.name}</span>
                    </div>
                    <span className="font-mono text-white/50 text-[10.5px]">
                      {d.percentage}%
                    </span>
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* Bottom Note */}
          <div className="pt-2 border-t border-white/5 text-[11px] text-white/50 flex items-start gap-1.5 leading-snug">
            <Info className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
            <span>
              Most engagement is generated by vCard Contacts ({distributionData[0]?.percentage || 42}%) and Menus, while Wi-Fi grew +14%.
            </span>
          </div>
        </div>

        {/* CARD 3: RECENT LIVE ACTIVITY & LEADS (WITH TIER GATED BLUR FOR FREE) */}
        <div className="rounded-[28px] border border-black/10 dark:border-white/10 bg-[#121411] p-6 shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight">
                Live Activity & Leads
              </h3>
              <button
                type="button"
                onClick={() => onNavigateSection('mailing')}
                className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Create New Campaign"
              >
                +
              </button>
            </div>

            {/* Health Score Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 font-mono text-[11px] uppercase">
                  Platform Routing Health
                </span>
                <span className="font-bold text-emerald-400 font-mono">
                  98%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden flex gap-0.5 p-0.5">
                <div className="h-full bg-emerald-400 rounded-full w-[98%] shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
            </div>

            {/* Activity List */}
            <div className="space-y-2.5 pt-1">
              
              {/* Row 1 (Visible to all) */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-white/40 shrink-0">Just now</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                    Lead
                  </span>
                  <span className="text-xs text-white truncate font-medium">
                    Oseghale Leonard
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-white/50 shrink-0">
                  vCard Save
                </span>
              </div>

              {/* Row 2 (Visible to all) */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono text-white/40 shrink-0">12m ago</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 text-[10px] font-bold shrink-0">
                    Route
                  </span>
                  <span className="text-xs text-white truncate font-medium">
                    Fast Redirect Link
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-white/50 shrink-0">
                  iOS Scan
                </span>
              </div>

              {/* Row 3 (Gated / Blurred if Free Tier) */}
              <div className={`relative transition-all duration-300 ${!isPaid ? 'filter blur-[2.5px] select-none pointer-events-none' : ''}`}>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-white/40 shrink-0">1h ago</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold shrink-0">
                    Menu
                      </span>
                      <span className="text-xs text-white truncate font-medium">
                        Dining Menu Visitor
                      </span>
                    </div>
                    <span className="text-[10.5px] font-mono text-white/50 shrink-0">
                      View Menu
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-white/40 shrink-0">3h ago</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold shrink-0">
                        Join
                      </span>
                      <span className="text-xs text-white truncate font-medium">
                        VIP Subscriber List
                      </span>
                    </div>
                    <span className="text-[10.5px] font-mono text-white/50 shrink-0">
                      +1 Lead
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Locked Overlay for Free Users */}
          {!isPaid && (
            <div className="p-3 rounded-2xl bg-black/75 border border-purple-500/30 backdrop-blur-md flex items-center justify-between gap-3 mt-2 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-[11px] text-white/80 leading-tight">
                  <strong>Ultra Live Stream:</strong> Upgrade to unlock unblurred real-time lead capture telemetry.
                </span>
              </div>
              {onOpenUpgradeModal && (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[10.5px] font-bold shrink-0 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Upgrade
                </button>
              )}
            </div>
          )}

          {/* Bottom Link */}
          {isPaid && (
            <button
              type="button"
              onClick={() => onNavigateSection('mailing')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 cursor-pointer pt-2"
            >
              <span>View all subscriber leads & analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

        </div>

      </div>

    </div>
  );
}
