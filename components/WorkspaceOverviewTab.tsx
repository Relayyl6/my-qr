'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Send,
  SlidersHorizontal,
  Info,
  Maximize2,
  Lock,
  ChevronDown,
  Bell,
  ArrowUpRight,
} from 'lucide-react';
import { getOptimizedStorageUrl } from '@/lib/media';

interface WorkspaceOverviewTabProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
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

  // Filter tabs
  const [timeFilter, setTimeFilter] = useState<'weekly' | 'monthly' | 'yearly' | 'range'>('yearly');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarIndex, setSelectedBarIndex] = useState<number>(2); // Default to 'Sep' (index 2) matching reference image!

  // Copilot interactive state
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotExpanded, setCopilotExpanded] = useState(false);
  const [copilotChat, setCopilotChat] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Capsule Bar Data (Jul through Jun matching reference image layout)
  const barData = useMemo(() => [
    { month: 'Jul', value: 4600, display: '$1,240', pct: '+6%' },
    { month: 'Aug', value: 3900, display: '$980', pct: '+8%' },
    { month: 'Sep', value: 4500, display: '$1048', pct: '+12%', defaultActive: true },
    { month: 'Oct', value: 4800, display: '$1,320', pct: '+14%' },
    { month: 'Nov', value: 3000, display: '$840', pct: '-2%' },
    { month: 'Dec', value: 5600, display: '$1,890', pct: '+22%' },
    { month: 'Jan', value: 3700, display: '$1,110', pct: '+5%' },
    { month: 'Feb', value: 4100, display: '$1,180', pct: '+7%' },
    { month: 'Mar', value: 5000, display: '$1,650', pct: '+16%' },
    { month: 'Apr', value: 5800, display: '$2,100', pct: '+19%' },
    { month: 'May', value: 4000, display: '$1,290', pct: '+4%' },
    { month: 'Jun', value: 3500, display: '$1,020', pct: '+3%' },
  ], []);

  const handleCopilotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotInput.trim() || copilotLoading) return;
    const q = copilotInput.trim();
    setCopilotInput('');
    setCopilotChat((prev) => [...prev, { role: 'user', text: q }]);
    setCopilotLoading(true);

    setTimeout(() => {
      let reply = `Your campaign revenue velocity is tracking +8.3% ahead of forecast. vCard digital business cards and Dynamic QR routes are converting at peak rates.`;
      if (q.toLowerCase().includes('invoice') || q.toLowerCase().includes('payment')) {
        reply = `Payment score is 76/100. 1 invoice of $130.00 is unpaid (due in 1 week). John Smith's $220.00 transaction was confirmed.`;
      } else if (q.toLowerCase().includes('spend') || q.toLowerCase().includes('cost')) {
        reply = `Total monthly spend is $28,165. Top categories are Activity (16%) and Meals, with Internet & Telecom showing normal variance.`;
      }
      setCopilotChat((prev) => [...prev, { role: 'assistant', text: reply }]);
      setCopilotLoading(false);
    }, 600);
  };

  const displayName = user?.name || 'Oseghale Leonard';
  const displayEmail = user?.email || 'oseghaleleonard39@gmail.com';
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="w-full h-full flex flex-col justify-between gap-3 sm:gap-3.5 text-white font-sans select-none overflow-hidden max-w-[1600px] mx-auto">
      
      {/* 1. TOP BAR: TITLE + SEARCH + PROFILE PILL */}
      <div className="flex items-center justify-between gap-4 shrink-0 px-0.5 pt-0.5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Overview
        </h1>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Pill Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-36 sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-full bg-[#181A20] border border-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          {/* User Profile Pill */}
          <button
            type="button"
            onClick={() => onOpenUpgradeModal && onOpenUpgradeModal()}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#181A20] border border-white/5 hover:border-white/15 transition-all cursor-pointer text-left"
            title="Profile & Subscription Settings"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-tr from-[#3B5998] to-[#1E2638] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={getOptimizedStorageUrl(user.avatarUrl)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>
            <div className="hidden sm:block leading-none pr-1">
              <span className="text-[11.5px] font-semibold text-white block leading-tight truncate max-w-[110px]">
                {displayName}
              </span>
              <span className="text-[9.5px] text-white/40 font-mono block leading-tight truncate max-w-[110px]">
                {displayEmail}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-white/40 shrink-0" />
          </button>

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => onNavigateSection('mailing')}
            className="w-8 h-8 rounded-full bg-[#181A20] border border-white/5 hover:border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-all relative cursor-pointer shrink-0"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-[#181A20]" />
          </button>
        </div>
      </div>

      {/* 2. TOP ROW: REVENUE BAR CHART (65%) + CALENDAR WIDGET (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 flex-1 min-h-0">
        
        {/* CARD A: REVENUE (8 COLS) */}
        <div className="lg:col-span-8 rounded-3xl bg-[#121318] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between shadow-xl min-h-[250px] lg:min-h-0">
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 shrink-0">
            <div>
              <span className="text-xs font-semibold text-white/80 tracking-tight block">
                Revenue
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  $ 28,165
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold">
                  ▲ 8.3%
                </span>
                <span className="text-[11px] text-white/40 font-normal hidden sm:inline">
                  vs 24,280 last period
                </span>
              </div>
            </div>

            {/* Time Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center p-0.5 rounded-full bg-[#1A1C24] border border-white/5 text-[11px]">
                {(['weekly', 'monthly', 'yearly', 'range'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setTimeFilter(tab)}
                    className={`px-2.5 py-0.5 rounded-full font-medium capitalize transition-all cursor-pointer ${
                      timeFilter === tab
                        ? 'bg-white text-black font-bold shadow-xs'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-[#1A1C24] border border-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors cursor-pointer"
                title="Filters"
              >
                <SlidersHorizontal className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Capsule Bar Chart with Y-Axis */}
          <div className="flex items-stretch gap-2 pt-3 pb-1 flex-1 min-h-0">
            {/* Left Y-Axis */}
            <div className="flex flex-col justify-between text-[10px] font-mono text-white/35 py-1 select-none pr-1 shrink-0">
              <span>6000</span>
              <span>4500</span>
              <span>3000</span>
              <span>1500</span>
              <span>0</span>
            </div>

            {/* 12 Capsule Bars */}
            <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2 px-1 relative">
              {/* Subtle Horizontal Guide Lines */}
              <div className="absolute inset-x-0 top-0 border-b border-white/[0.03] pointer-events-none" />
              <div className="absolute inset-x-0 top-1/4 border-b border-white/[0.03] pointer-events-none" />
              <div className="absolute inset-x-0 top-2/4 border-b border-white/[0.03] pointer-events-none" />
              <div className="absolute inset-x-0 top-3/4 border-b border-white/[0.03] pointer-events-none" />

              {barData.map((bar, idx) => {
                const isActive = selectedBarIndex === idx;
                const heightPct = Math.min(96, Math.max(16, (bar.value / 6000) * 100));

                return (
                  <div
                    key={bar.month}
                    onClick={() => setSelectedBarIndex(idx)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                  >
                    {/* The Capsule Slot Track */}
                    <div className="w-full max-w-[32px] sm:max-w-[40px] h-[85%] bg-[#1A1C23] rounded-full relative flex flex-col justify-end items-center p-0.5 group-hover:bg-[#20222B] transition-colors">
                      
                      {/* INACTIVE BAR: Horizontal white tick mark indicator at value height */}
                      {!isActive && (
                        <div
                          style={{ bottom: `${heightPct}%` }}
                          className="absolute left-1/2 -translate-x-1/2 w-[70%] h-[3px] bg-white/90 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.4)] transition-all"
                        />
                      )}

                      {/* ACTIVE BAR: Filled solid blue pill + Tooltip pill on top */}
                      {isActive && (
                        <div
                          style={{ height: `${heightPct}%` }}
                          className="w-full bg-[#4E82EE] rounded-full relative flex flex-col justify-end items-center pb-2 shadow-[0_0_20px_rgba(78,130,238,0.45)] transition-all animate-in zoom-in-95 duration-200"
                        >
                          {/* Floating badge above the blue pill */}
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#4E82EE] text-white text-[9.5px] font-bold rounded-full shadow-lg flex items-center gap-0.5 whitespace-nowrap z-10">
                            <span>▲ {bar.pct}</span>
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#4E82EE]" />
                          </div>

                          {/* Inside stat label */}
                          <span className="text-[10px] font-bold text-white tracking-tight leading-none">
                            {bar.display}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[10px] font-mono mt-1.5 transition-colors ${
                        isActive ? 'text-white font-bold' : 'text-white/40 group-hover:text-white/70'
                      }`}
                    >
                      {bar.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* CARD B: CALENDAR WIDGET (4 COLS) */}
        <div className="lg:col-span-4 rounded-3xl bg-[#121318] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between shadow-xl min-h-[250px] lg:min-h-0">
          
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <h3 className="text-xs font-bold text-white tracking-wide">
              January, 2026
            </h3>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1.5 py-1">
            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-mono text-white/35 uppercase font-semibold">
              <span>M</span>
              <span>T</span>
              <span>W</span>
              <span>T</span>
              <span>F</span>
              <span>S</span>
              <span>S</span>
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10.5px] font-mono">
              {/* Hatched past days 1 to 10 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                <div
                  key={d}
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 6px)',
                  }}
                  className="h-6 sm:h-7 rounded-lg text-white/25 flex items-center justify-center text-[10px]"
                >
                  {d}
                </div>
              ))}

              {/* Day 11 (Active Blue Pill with Dot) */}
              <div className="h-6 sm:h-7 rounded-xl bg-[#4E82EE] text-white flex flex-col items-center justify-center font-bold text-[10.5px] shadow-md cursor-pointer">
                <span>11</span>
                <span className="w-1 h-1 bg-white rounded-full mt-0.5" />
              </div>

              {/* Days 12 to 30 */}
              {[12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((d) => (
                <div
                  key={d}
                  className="h-6 sm:h-7 rounded-lg text-white/70 hover:bg-white/5 flex items-center justify-center cursor-pointer transition-colors text-[10.5px]"
                >
                  {d}
                </div>
              ))}

              {/* Day 31 Hatched */}
              <div
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06) 1.5px, transparent 1.5px, transparent 6px)',
                }}
                className="h-6 sm:h-7 rounded-lg text-white/25 flex items-center justify-center text-[10px]"
              >
                31
              </div>
            </div>
          </div>

          {/* Bottom Inset Stat Box */}
          <div className="p-3 rounded-2xl bg-[#181A22] border border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70">
                <BarChart3 className="w-3.5 h-3.5 text-white/60" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                $1,434
              </span>
            </div>
            <span className="text-[10.5px] font-mono text-emerald-400 font-bold">
              ▲ 12.4%
            </span>
          </div>

        </div>

      </div>

      {/* 3. BOTTOM ROW: HOW CAN I HELP YOU? (1/3) + SPENDING DONUT (1/3) + INVOICES (1/3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5 flex-1 min-h-0">
        
        {/* CARD 1: HOW CAN I HELP YOU? (AI COPILOT) */}
        <div className="rounded-3xl bg-[#121318] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between shadow-xl min-h-[200px] lg:min-h-0">
          
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-white/90" />
              <h3 className="text-xs font-bold text-white tracking-tight">
                How can I help you?
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('analyst')}
              className="p-1 rounded-md text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Expand Copilot"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* AI Summary */}
          <div className="space-y-1 py-1">
            <span className="text-[10px] font-semibold text-white/80 block">
              AI Summary
            </span>
            <p className="text-[10.5px] text-white/60 leading-snug">
              Your financial activity this period remains stable. Revenue shows expected seasonal variation, spending is balanced across key categories. No unusual patterns det...{' '}
              <button
                type="button"
                onClick={() => setCopilotExpanded(!copilotExpanded)}
                className="text-[#4E82EE] font-medium hover:underline inline cursor-pointer"
              >
                Read more
              </button>
            </p>
          </div>

          {/* Two Metric Chips: Spending Trends & Customer Payments */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="p-2 rounded-xl bg-[#181A22] border border-white/5">
              <span className="text-[9.5px] text-white/40 block leading-tight">
                Spending Trends
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-white">7</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#FF8800]/20 text-[#FF9E2C] border border-[#FF8800]/30 text-[9px] font-semibold">
                  Stable
                </span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-[#181A22] border border-white/5">
              <span className="text-[9.5px] text-white/40 block leading-tight">
                Customer Payments
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-white">25</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-semibold">
                  Processed
                </span>
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <form onSubmit={handleCopilotSubmit} className="relative shrink-0 pt-1">
            <input
              type="text"
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="Ask me anything..."
              className="w-full pl-3 pr-8 py-1.5 text-xs rounded-full bg-[#181A22] border border-white/5 text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 transition-all"
            />
            <button
              type="submit"
              disabled={!copilotInput.trim() || copilotLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/60 hover:text-white cursor-pointer disabled:opacity-30"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>

        </div>

        {/* CARD 2: SPENDING (DONUT CHART) */}
        <div className="rounded-3xl bg-[#121318] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between shadow-xl min-h-[200px] lg:min-h-0 relative">
          
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-white tracking-tight">
              Spending
            </h3>
            <button
              type="button"
              className="px-2 py-0.5 rounded-full bg-[#181A22] border border-white/5 text-[9.5px] text-white/60 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>Last 30 Days</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Donut Chart & Legend Row */}
          <div className="flex items-center justify-between gap-3 py-1 flex-1 min-h-0">
            
            {/* SVG Segmented Donut with Floating Tooltip */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
              
              {/* Floating Tooltip Pill pointing to Violet Slice */}
              <div className="absolute -top-1 right-1 z-10 px-1.5 py-0.5 rounded-full bg-[#1E2029] border border-white/10 text-[9px] font-semibold text-white shadow-lg whitespace-nowrap flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A259FF]" />
                <span>$1840 (16%)</span>
              </div>

              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Yellow Arc (Activity / Office) */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  stroke="#F5B938"
                  strokeWidth="11"
                  strokeDasharray="65 161"
                  strokeDashoffset="0"
                  fill="none"
                />
                {/* Green/Teal Arc (Meals) */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  stroke="#2EC4B6"
                  strokeWidth="11"
                  strokeDasharray="45 181"
                  strokeDashoffset="-68"
                  fill="none"
                />
                {/* Orange Arc (Supplies) */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  stroke="#FF7849"
                  strokeWidth="11"
                  strokeDasharray="40 186"
                  strokeDashoffset="-115"
                  fill="none"
                />
                {/* Blue Arc (Rewards) */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  stroke="#4E82EE"
                  strokeWidth="11"
                  strokeDasharray="35 191"
                  strokeDashoffset="-158"
                  fill="none"
                />
                {/* Violet Arc (Internet & Telephone) */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  stroke="#A259FF"
                  strokeWidth="11"
                  strokeDasharray="36 190"
                  strokeDashoffset="-195"
                  fill="none"
                />
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-none">
                  $28,165
                </span>
                <span className="text-[8px] font-mono text-white/40 uppercase mt-0.5">
                  Total
                </span>
              </div>
            </div>

            {/* Legend List */}
            <div className="space-y-1 text-[10px] flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF7849] shrink-0" />
                <span className="text-white/70 truncate">Activity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6] shrink-0" />
                <span className="text-white/70 truncate">Meals</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5B938] shrink-0" />
                <span className="text-white/70 truncate">Office supplies</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4E82EE] shrink-0" />
                <span className="text-white/70 truncate">Rewards</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A259FF] shrink-0" />
                <span className="text-white/70 truncate">Internet&Telephone</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                <span className="text-white/40 truncate">Other</span>
              </div>
            </div>

          </div>

          {/* Bottom Note */}
          <div className="pt-1.5 border-t border-white/5 flex items-start gap-1 text-[9px] text-white/40 leading-snug shrink-0">
            <Info className="w-3 h-3 text-white/40 shrink-0 mt-0.5" />
            <span>
              Most expenses come from Activity and Meals, while Internet&Telephone shows a slight increase.
            </span>
          </div>

        </div>

        {/* CARD 3: INVOICES (WITH SEGMENTED PAYMENT SCORE METER) */}
        <div className="rounded-3xl bg-[#121318] border border-white/[0.06] p-4 sm:p-5 flex flex-col justify-between shadow-xl min-h-[200px] lg:min-h-0 relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-xs font-bold text-white tracking-tight">
              Invoices
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection('mailing')}
              className="w-5 h-5 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer text-xs"
              title="Create Invoice"
            >
              +
            </button>
          </div>

          {/* Payment Score Segmented Meter */}
          <div className="flex items-center justify-between gap-2 py-1 shrink-0">
            <span className="text-[10px] text-white/60 font-medium">
              Payment Score
            </span>
            <div className="flex items-center gap-0.5 flex-1 max-w-[140px] px-2">
              {Array.from({ length: 22 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-3 rounded-xs ${
                    i < 16 ? 'bg-[#F5B938]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-white/90 font-mono">
              76
            </span>
          </div>

          {/* Recent Invoices Rows */}
          <div className="space-y-1.5 py-1">
            {/* Row 1: Aug 9 (Unpaid) */}
            <div className="flex items-center justify-between text-xs p-1.5 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="leading-tight">
                <span className="text-[11px] font-semibold text-white block">Aug 9</span>
                <span className="text-[9px] text-white/40">in 1 week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B5B]" />
                <span className="text-[10.5px] text-[#FF5B5B] font-medium">Unpaid</span>
              </div>
              <span className="text-[11px] text-white/80 font-medium truncate max-w-[90px]">
                Leonard Kim
              </span>
              <span className="text-[11px] font-bold text-white font-mono">
                $130.00
              </span>
            </div>

            {/* Row 2: Aug 24 (Paid) */}
            <div className={`flex items-center justify-between text-xs p-1.5 rounded-xl bg-white/[0.02] border border-white/5 ${!isPaid ? 'filter blur-[1.5px] opacity-75' : ''}`}>
              <div className="leading-tight">
                <span className="text-[11px] font-semibold text-white block">Aug 24</span>
                <span className="text-[9px] text-white/40">in 2 week</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10.5px] text-emerald-400 font-medium">Paid</span>
              </div>
              <span className="text-[11px] text-white/80 font-medium truncate max-w-[90px]">
                John Smith
              </span>
              <span className="text-[11px] font-bold text-white font-mono">
                $220.00
              </span>
            </div>

            {/* Row 3: Sep 9 (Pending) */}
            <div className={`flex items-center justify-between text-xs p-1.5 rounded-xl bg-white/[0.02] border border-white/5 ${!isPaid ? 'filter blur-[1.5px] opacity-75' : ''}`}>
              <div className="leading-tight">
                <span className="text-[11px] font-semibold text-white block">Sep 9</span>
                <span className="text-[9px] text-white/40">in 1 month</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10.5px] text-amber-400 font-medium">Pending</span>
              </div>
              <span className="text-[11px] text-white/80 font-medium truncate max-w-[90px]">
                Anna Spirid
              </span>
              <span className="text-[11px] font-bold text-white font-mono">
                $2080.00
              </span>
            </div>
          </div>

          {/* Bottom Link or Free Tier Prompt */}
          <div className="pt-1 border-t border-white/5 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => onNavigateSection('mailing')}
              className="text-[10.5px] text-white/70 hover:text-white font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View all invoices</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>

            {!isPaid && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                PRO / ULTRA
              </span>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
