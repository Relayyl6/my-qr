'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutGrid, Sparkles, CreditCard, ChevronRight } from 'lucide-react';

interface HomeTabsProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
  } | null;
  overviewContent: React.ReactNode;
  workspaceContent: React.ReactNode;
  announcementBanner?: string | null;
}

export default function HomeTabs({
  user,
  overviewContent,
  workspaceContent,
  announcementBanner,
}: HomeTabsProps) {
  // If user is logged in, default directly to the dedicated Workspace tab; otherwise Overview tour
  const [activeTab, setActiveTab] = useState<'workspace' | 'overview'>(
    user ? 'workspace' : 'overview'
  );

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#workspace') {
        setActiveTab('workspace');
      } else if (
        hash === '#overview' ||
        hash === '#how-it-works' ||
        hash === '#features' ||
        hash === '#top'
      ) {
        setActiveTab('overview');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Platform-Wide Sovereign Broadcast Announcement */}
      {announcementBanner && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-[#11140F] text-white px-4 py-2 text-[12.5px] font-medium text-center flex items-center justify-center gap-2 shadow-sm shrink-0">
          <span className="px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono uppercase tracking-wider font-bold">
            SYSTEM BROADCAST
          </span>
          <span>{announcementBanner}</span>
        </div>
      )}

      {/* Top Tab Bar Navigation */}
      <div className="sticky top-16 z-40 bg-[#EEF0EA]/95 backdrop-blur-md border-b border-[#11140F]/10 px-4 sm:px-6 shadow-2xs">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 py-2.5">
          {/* Main View Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white/90 rounded-2xl border border-[#11140F]/10 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('workspace');
                window.history.replaceState(null, '', '#workspace');
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'workspace'
                  ? 'bg-[#11140F] text-white shadow-xs'
                  : 'text-[#11140F]/65 hover:text-[#11140F] hover:bg-[#EEF0EA]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Workspace</span>
              {user && (
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    activeTab === 'workspace' ? 'bg-emerald-400' : 'bg-emerald-600'
                  }`}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                window.history.replaceState(null, '', '#overview');
              }}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#11140F] text-white shadow-xs'
                  : 'text-[#11140F]/65 hover:text-[#11140F] hover:bg-[#EEF0EA]'
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Product Tour</span>
            </button>

            <Link
              href="/pricing"
              className="px-3 sm:px-4 py-2 rounded-xl text-[12.5px] sm:text-[13px] font-semibold text-[#2F6B4F] hover:bg-[#2F6B4F]/10 transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span>Pricing</span>
            </Link>
          </div>

          {/* Quick Status Pill */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden sm:flex items-center gap-2 text-[12px] font-mono text-[#11140F]/70 bg-white/70 px-3 py-1.5 rounded-full border border-[#11140F]/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">{user.name || user.email.split('@')[0]}</span>
                <span>•</span>
                <span className="uppercase text-emerald-800 font-semibold">{user.tier || 'FREE'}</span>
              </div>
            ) : (
              <div className="hidden sm:block text-[12px] text-[#11140F]/60">
                Sign in to manage your dynamic QR codes
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab 1: Dedicated Workspace View (Zero scrolling past marketing copy) */}
      {activeTab === 'workspace' && (
        <section id="workspace" className="flex-1 bg-[#EEF0EA]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8 py-8 sm:py-12 space-y-8">
            {workspaceContent}
          </div>
        </section>
      )}

      {/* Tab 2: Marketing Overview & Tour */}
      {activeTab === 'overview' && (
        <div id="overview" className="flex-1">
          {overviewContent}

          {/* Bottom Banner prompting user to enter Workspace */}
          <div className="bg-[#11140F] text-white py-12 px-4 sm:px-6 border-t border-white/10">
            <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">
                  Ready to manage your dynamic codes?
                </h3>
                <p className="text-white/60 text-[14px] mt-1">
                  Access your active QR links, campaign analyst, and custom branded domains.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('workspace');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  window.history.replaceState(null, '', '#workspace');
                }}
                className="px-6 py-3 rounded-xl bg-white text-[#11140F] font-semibold text-[14px] hover:bg-[#EEF0EA] transition-colors flex items-center gap-2 shrink-0 shadow-sm cursor-pointer"
              >
                <span>Go to Workspace</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
