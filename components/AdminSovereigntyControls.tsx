'use client';

import { useState, useMemo } from 'react';
import {
  adminSaveSystemConfig,
  SystemSovereigntyConfig,
} from '@/app/admin/actions';
import PaginationControls from './PaginationControls';
import {
  ShieldAlert,
  Cpu,
  Megaphone,
  CheckCircle,
  Loader2,
  AlertTriangle,
  History,
  Activity,
  Zap,
} from 'lucide-react';

interface AdminSovereigntyControlsProps {
  initialConfig: SystemSovereigntyConfig;
  auditLogs: Array<{ adminEmail: string; action: string; details?: string; timestamp: string }>;
}

export default function AdminSovereigntyControls({
  initialConfig,
  auditLogs,
}: AdminSovereigntyControlsProps) {
  const [config, setConfig] = useState<SystemSovereigntyConfig>(initialConfig);
  const [bannerInput, setBannerInput] = useState(initialConfig.announcementBanner || '');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPerPage, setAuditPerPage] = useState(5);

  const paginatedLogs = useMemo(() => {
    const start = (auditPage - 1) * auditPerPage;
    return auditLogs.slice(start, start + auditPerPage);
  }, [auditLogs, auditPage, auditPerPage]);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSaveGateway = async (mode: SystemSovereigntyConfig['aiGatewayMode']) => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await adminSaveSystemConfig({ aiGatewayMode: mode });
      setConfig((prev) => ({ ...prev, aiGatewayMode: mode }));
      setStatusMsg(`AI Engine set to ${mode.toUpperCase()}`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e: any) {
      setStatusMsg(e.message || 'Failed to update gateway.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleMaintenance = async () => {
    const nextState = !config.maintenanceMode;
    setSaving(true);
    try {
      await adminSaveSystemConfig({ maintenanceMode: nextState });
      setConfig((prev) => ({ ...prev, maintenanceMode: nextState }));
      setStatusMsg(nextState ? 'Maintenance mode ACTIVATED' : 'Maintenance mode DEACTIVATED');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e: any) {
      setStatusMsg(e.message || 'Failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBanner = async () => {
    setSaving(true);
    try {
      const bannerVal = bannerInput.trim() ? bannerInput.trim() : null;
      await adminSaveSystemConfig({ announcementBanner: bannerVal });
      setConfig((prev) => ({ ...prev, announcementBanner: bannerVal }));
      setStatusMsg(bannerVal ? 'Platform announcement published!' : 'Announcement banner cleared');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (e: any) {
      setStatusMsg(e.message || 'Failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sovereignty Governance Panel */}
      <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0E1017] p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#11140F] dark:text-white">
                System Sovereignty &amp; Kill Switches
              </h3>
              <p className="text-[12.5px] text-[#11140F]/50 dark:text-white/50">
                Execute authoritative platform-wide overrides, emergency bypasses, and route controls
              </p>
            </div>
          </div>

          {statusMsg && (
            <span className="text-[12px] font-medium text-emerald-700 dark:text-[#34D399] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-3 py-1 rounded-full animate-fade-in flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {statusMsg}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* AI Gateway Sovereignty Switch */}
          <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#11140F]/[0.015] dark:bg-white/[0.02] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#11140F] dark:text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-emerald-600 dark:text-[#34D399]" />
                Active AI Gateway Routing
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold">
                {config.aiGatewayMode.toUpperCase()}
              </span>
            </div>
            <p className="text-[12px] text-[#11140F]/60 dark:text-white/60 leading-relaxed">
              Dynamically switch the execution backbone across providers or route immediately through the offline deterministic engine for zero latency &amp; zero budget impact.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { id: 'gemini', label: 'Gemini Frontier Cascade', desc: 'Argon / 3.8 / 3.6 Flash' },
                { id: 'neon', label: 'Neon AI Gateway', desc: 'Managed proxy' },
                { id: 'openai', label: 'OpenAI Direct', desc: 'Direct GPT-4o' },
                { id: 'heuristic_offline', label: 'Offline Heuristic', desc: '0s latency fallback' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveGateway(opt.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    config.aiGatewayMode === opt.id
                      ? 'border-emerald-600 dark:border-[#34D399] bg-emerald-50 dark:bg-[#34D399]/15 text-emerald-950 dark:text-white ring-1 ring-emerald-600 dark:ring-[#34D399] font-medium shadow-xs'
                      : 'border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-[#11140F]/20 dark:hover:border-white/20 text-[#11140F]/80 dark:text-white/80'
                  }`}
                >
                  <span className="text-[12px] block font-semibold">{opt.label}</span>
                  <span className="text-[10.5px] text-[#11140F]/50 dark:text-white/50 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Maintenance & Emergency Controls */}
          <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#11140F]/[0.015] dark:bg-white/[0.02] p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#11140F] dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Emergency Maintenance Bypass
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                    config.maintenanceMode
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                      : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {config.maintenanceMode ? 'MAINTENANCE ACTIVE' : 'ALL SYSTEMS LIVE'}
                </span>
              </div>
              <p className="text-[12px] text-[#11140F]/60 dark:text-white/60 leading-relaxed">
                When activated, non-admin visitors see an informational service update page while redirection endpoints continue operating at full speed.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={handleToggleMaintenance}
                className={`w-full py-2.5 px-4 rounded-xl text-[12.5px] font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  config.maintenanceMode
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {config.maintenanceMode ? (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Restore Live System Access
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Activate System Maintenance Mode
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Global Platform Broadcast Banner */}
        <div className="rounded-xl border border-[#11140F]/10 dark:border-white/10 bg-[#11140F]/[0.015] dark:bg-white/[0.02] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#11140F] dark:text-white flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Platform-Wide Broadcast Banner
            </span>
            {config.announcementBanner && (
              <span className="text-[11px] font-mono text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/50 px-2 py-0.5 rounded font-medium">
                BROADCASTING NOW
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#11140F]/60 dark:text-white/60">
            Publish an urgent announcement or update alert displayed at the top of every customer's workspace.
          </p>

          <div className="flex items-center gap-2 flex-col sm:flex-row">
            <input
              type="text"
              value={bannerInput}
              onChange={(e) => setBannerInput(e.target.value)}
              placeholder="e.g. 📢 Scheduled system upgrade Sunday at 02:00 UTC. Redirects will remain active."
              className="flex-1 w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/[0.04] px-3 py-2 text-[13px] text-[#11140F] dark:text-white placeholder:text-[#11140F]/30 dark:placeholder:text-white/30 outline-none focus:border-[#34D399]"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveBanner}
                className="px-4 py-2 rounded-xl bg-[#11140F] dark:bg-[#34D399] text-white dark:text-[#09110D] text-[12.5px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Publish Broadcast
              </button>
              {config.announcementBanner && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setBannerInput('');
                    adminSaveSystemConfig({ announcementBanner: null }).then(() => {
                      setConfig((c) => ({ ...c, announcementBanner: null }));
                      setStatusMsg('Broadcast cleared.');
                      setTimeout(() => setStatusMsg(null), 3000);
                    });
                  }}
                  className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 text-[12px] font-medium hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Trail */}
      {auditLogs.length > 0 && (
        <div className="rounded-2xl border border-[#11140F]/10 dark:border-white/10 bg-white dark:bg-[#0E1017] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[14px] font-semibold text-[#11140F] dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-[#2F6B4F] dark:text-[#34D399]" />
              Super-Admin Sovereign Audit Trail ({auditLogs.length})
            </h4>
            <span className="text-[11.5px] font-mono text-[#11140F]/50 dark:text-white/50">
              Immutable session history
            </span>
          </div>

          <div className="space-y-2">
            {paginatedLogs.map((log, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-[#11140F]/5 dark:border-white/10 bg-[#F7F8F5]/60 dark:bg-white/[0.03] flex items-center justify-between text-[12px]"
              >
                <div>
                  <span className="font-semibold text-[#11140F] dark:text-white">{log.action}</span>
                  {log.details && (
                    <span className="block text-[11px] text-[#11140F]/50 dark:text-white/50 truncate max-w-md font-mono">
                      {log.details}
                    </span>
                  )}
                </div>
                <div className="text-right text-[11px] font-mono text-[#11140F]/50 dark:text-white/50 shrink-0">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="block text-[10px] text-[#11140F]/40 dark:text-white/40">{log.adminEmail}</span>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            currentPage={auditPage}
            totalItems={auditLogs.length}
            itemsPerPage={auditPerPage}
            onPageChange={setAuditPage}
            onItemsPerPageChange={setAuditPerPage}
            pageSizeOptions={[5, 10, 25]}
            itemLabel="logs"
          />
        </div>
      )}
    </div>
  );
}
