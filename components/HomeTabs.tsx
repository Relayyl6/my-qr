'use client';

import { useState, useEffect } from 'react';
import HeaderNav from './HeaderNav';
import { ChevronRight } from 'lucide-react';

interface HomeTabsProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
  } | null;
  isAdmin?: boolean;
  overviewContent: React.ReactNode;
  workspaceContent: React.ReactNode;
  announcementBanner?: string | null;
}

export default function HomeTabs({
  user,
  isAdmin = false,
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
      {/* Unified Top Navigation Bar (Zero duplicate sub-bars) */}
      <HeaderNav
        user={user}
        isAdmin={isAdmin}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        announcementBanner={announcementBanner}
      />

      {/* Tab 1: Dedicated Workspace View (Zero scrolling past marketing copy) */}
      {activeTab === 'workspace' && (
        <section id="workspace" className="flex-1 bg-[#EEF0EA]">
          <div className="max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-8">
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
            <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
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
