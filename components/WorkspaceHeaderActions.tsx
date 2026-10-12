'use client';

import { useState } from 'react';
import Link from 'next/link';
import BulkImportWizard from './BulkImportWizard';
import { Layers, Activity, Shield } from 'lucide-react';

export default function WorkspaceHeaderActions() {
  const [showBulkModal, setShowBulkModal] = useState(false);

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <button
        type="button"
        onClick={() => setShowBulkModal(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#11140F]/15 bg-white text-[12.5px] font-medium text-[#11140F] hover:bg-[#11140F]/[0.03] transition-colors shadow-2xs cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 text-emerald-600" />
        Bulk Import (AI)
      </button>

      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#11140F]/15 bg-white text-[12.5px] font-medium text-[#11140F]/80 hover:text-[#11140F] hover:bg-[#11140F]/[0.03] transition-colors shadow-2xs"
      >
        <Shield className="w-3.5 h-3.5 text-emerald-700" />
        Admin Console
      </Link>

      <Link
        href="/admin/ai-usage"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[#11140F]/15 bg-white text-[12.5px] font-medium text-[#11140F]/80 hover:text-[#11140F] hover:bg-[#11140F]/[0.03] transition-colors shadow-2xs"
      >
        <Activity className="w-3.5 h-3.5 text-purple-600" />
        AI Telemetry
      </Link>

      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-[#11140F]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <BulkImportWizard
            onImportComplete={() => {
              window.location.reload();
            }}
            onClose={() => setShowBulkModal(false)}
          />
        </div>
      )}
    </div>
  );
}
