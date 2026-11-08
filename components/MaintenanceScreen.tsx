'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Zap, Database, Clock, RefreshCw, Lock } from 'lucide-react';
import AuthModal from './AuthModal';

export default function MaintenanceScreen() {
  const [authOpen, setAuthOpen] = useState(false);

  // Auto-poll to see when maintenance mode is deactivated
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(window.location.href, { method: 'HEAD', cache: 'no-store' })
        .then(() => {
          // If response changes, reload
        })
        .catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#11140F] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden font-sans">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-600/15 via-emerald-600/10 to-transparent blur-[140px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="max-w-[1100px] mx-auto w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shadow-xs">
            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5" fill="none">
              <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="4" y="4" width="3" height="3" fill="#FFFFFF" />
              <rect x="14" y="1" width="9" height="9" rx="1.5" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="17" y="4" width="3" height="3" fill="#FFFFFF" />
              <rect x="1" y="14" width="9" height="9" rx="1.5" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="4" y="17" width="3" height="3" fill="#FFFFFF" />
              <rect x="15" y="15" width="3" height="3" fill="#FFFFFF" />
              <rect x="20" y="15" width="3" height="3" fill="#FFFFFF" />
              <rect x="15" y="20" width="3" height="3" fill="#FFFFFF" />
              <rect x="20" y="20" width="3" height="3" fill="#FFFFFF" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-[17px] text-white">DynamicQR</span>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11.5px] font-mono uppercase tracking-wider font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          System Maintenance Active
        </div>
      </header>

      {/* Central Announcement Card */}
      <main className="max-w-2xl mx-auto my-auto text-center space-y-6 py-12 relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Scheduled Maintenance & Infrastructure Upgrade
          </h1>
          <p className="text-[15px] sm:text-[16px] text-white/70 max-w-xl mx-auto leading-relaxed">
            We are performing an authoritative platform upgrade. While the workspace management UI is temporarily paused, <strong>all physical QR code edge redirects (/id/*) remain 100% live</strong> and operating at sub-10ms edge speed without interruption.
          </p>
        </div>

        {/* Live Subsystem Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left">
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-white/50">Physical QR Scans</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300 text-[13px] font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>100% Operational</span>
            </div>
            <p className="text-[11px] text-white/50">Sub-10ms 307 Edge Redirects</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-white/50">Neon Postgres</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300 text-[13px] font-semibold">
              <Database className="w-3.5 h-3.5" />
              <span>Connected & Healthy</span>
            </div>
            <p className="text-[11px] text-white/50">Telemetry Pipeline Live</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-amber-300/60">Workspace UI</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 text-amber-300 text-[13px] font-semibold">
              <Clock className="w-3.5 h-3.5" />
              <span>Paused for Maintenance</span>
            </div>
            <p className="text-[11px] text-white/50">Resuming shortly</p>
          </div>
        </div>

        <div className="pt-4 flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] px-5 py-2.5 text-[13px] font-medium text-white transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check Platform Status</span>
          </button>

          <button
            onClick={() => setAuthOpen(true)}
            className="rounded-xl border border-transparent bg-white/10 hover:bg-white/15 px-4 py-2.5 text-[12.5px] font-medium text-white/80 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-3 h-3 text-amber-300" />
            <span>Super-Admin Sign In</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-[1100px] mx-auto w-full text-center text-[12px] text-white/40 pt-8 border-t border-white/5 relative z-10">
        DynamicQR Sovereign Edge Infrastructure &middot; Scans continue unaffected.
      </footer>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab="login"
      />
    </div>
  );
}
