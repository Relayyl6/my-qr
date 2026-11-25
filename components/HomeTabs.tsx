'use client';

import { useState, useEffect } from 'react';
import HeaderNav from './HeaderNav';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import { ChevronRight } from 'lucide-react';
import { getStoredPreferences } from '@/lib/theme';

interface HomeTabsProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
    avatarUrl?: string | null;
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
  // Respect user preference for default landing tab (Workspace vs Tour overview)
  const [activeTab, setActiveTab] = useState<'workspace' | 'overview'>('overview');

  useEffect(() => {
    const prefs = getStoredPreferences();
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      const search = (typeof window !== 'undefined' ? window.location.search : '').toLowerCase();
      if (
        hash === '#workspace' ||
        hash.startsWith('#workspace?') ||
        hash.startsWith('#workspace/') ||
        search.includes('section=') ||
        search.includes('tab=')
      ) {
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
      } else {
        // No hash in URL: Apply user's defaultLanding preference
        if (!user) {
          // Unauthenticated visitors always see the Product Tour
          setActiveTab('overview');
        } else if (prefs.defaultLanding === 'overview') {
          setActiveTab('overview');
        } else if (prefs.defaultLanding === 'workspace') {
          setActiveTab('workspace');
        } else {
          setActiveTab('workspace'); // logged-in default
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);

    const handlePrefChange = (e: any) => {
      if (e.detail?.defaultLanding && !window.location.hash) {
        setActiveTab(e.detail.defaultLanding);
      }
    };
    window.addEventListener('dynamicqr-preferences-change', handlePrefChange);

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('dynamicqr-preferences-change', handlePrefChange);
    };
  }, [user]);

  return (
    <div className="w-full min-h-screen flex flex-col">
      {/* Platform Announcement / Promo Bar: Renders atop both Workspace and Marketing tabs when active in Admin Console */}
      <AnnouncementBar initialBanner={promoBanner} />

      {/* Sticky Top Header: ONLY shown on marketing/tour overview, NOT in dedicated workspace */}
      {activeTab !== 'workspace' && (
        <div
          style={{
            top: 'var(--announcement-bar-height, 0px)',
          }}
          className="sticky inset-x-0 z-40 w-full"
        >
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
