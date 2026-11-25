'use client';

import { useState } from 'react';
import Link from 'next/link';
import BulkImportWizard from './BulkImportWizard';
import AccountSettingsModal from './AccountSettingsModal';
import { Layers, Activity, Shield, Settings, User } from 'lucide-react';

interface Props {
  isAdmin?: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    tier?: string;
  } | null;
}

export default function WorkspaceHeaderActions({ isAdmin = false, user }: Props) {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <button
        type="button"
        onClick={() => setShowBulkModal(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-white/[0.04] text-[12.5px] font-medium text-[#11140F] dark:text-white hover:bg-[#11140F]/[0.03] dark:hover:bg-white/10 transition-colors shadow-2xs cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
        Bulk Import (AI)
      </button>

      {user && (
        <button
          type="button"
          onClick={() => setShowAccountModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-white/[0.04] text-[12.5px] font-medium text-[#11140F]/80 dark:text-white/80 hover:text-[#11140F] dark:hover:text-white hover:bg-[#11140F]/[0.03] dark:hover:bg-white/10 transition-colors shadow-2xs cursor-pointer"
          title="Account Settings & Data Privacy"
        >
          <Settings className="w-3.5 h-3.5 text-slate-600 dark:text-white/60" />
          <span>Account & Privacy</span>
        </button>
      )}

      {isAdmin && (
        <>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-white/[0.04] text-[12.5px] font-medium text-[#11140F]/80 dark:text-white/80 hover:text-[#11140F] dark:hover:text-white hover:bg-[#11140F]/[0.03] dark:hover:bg-white/10 transition-colors shadow-2xs"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-700 dark:text-[#34D399]" />
            Admin Console
          </Link>

          <Link
            href="/admin/ai-usage"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/12 bg-white dark:bg-white/[0.04] text-[12.5px] font-medium text-[#11140F]/80 dark:text-white/80 hover:text-[#11140F] dark:hover:text-white hover:bg-[#11140F]/[0.03] dark:hover:bg-white/10 transition-colors shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            AI Telemetry
          </Link>
        </>
      )}

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
