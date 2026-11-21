'use client';

import { useState, useEffect } from 'react';
import HeaderNav from './HeaderNav';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
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
  promoBanner?: any;
}

export default function HomeTabs({
  user,
  isAdmin = false,
  overviewContent,
  workspaceContent,
  announcementBanner,
  promoBanner,
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
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
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
      {/* Sticky Top Header: ONLY shown on marketing/tour overview, NOT in dedicated workspace */}
      {activeTab !== 'workspace' && (
        <div className="sticky top-0 inset-x-0 z-50 w-full">
          <AnnouncementBar initialBanner={promoBanner} />

          {/* Unified Top Navigation Bar */}
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
        </div>
      )}

      {/* Tab 1: Dedicated Workspace View (Full-height dashboard with sidebar, NO marketing footer) */}
      {activeTab === 'workspace' && (
        <section id="workspace-tab" className="flex-1 bg-[#EEF0EA] dark:bg-[#0C0E0A] flex flex-col justify-between transition-colors duration-200">
          <div className="w-full flex-1">
            {workspaceContent}
          </div>
        </section>
      )}

      {/* Tab 2: Marketing Overview & Tour */}
      {activeTab === 'overview' && (
        <div id="overview" className="flex-1 bg-[#11140F] flex flex-col">
          {overviewContent}

          {/* Bottom Banner prompting user to enter Workspace */}
          <div className="bg-[#11140F] text-white py-14 px-4 sm:px-6 border-t border-white/10">
            <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
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

          <Footer theme="dark" />
        </div>
      )}
    </div>
  );
}
