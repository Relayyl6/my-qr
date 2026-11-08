'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Fatal platform exception:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F7F7F5] text-[#11140F] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#11140F]/10 shadow-sm text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-[#EEF0EA] flex items-center justify-center text-[#11140F]">
            <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#11140F]">
              DynamicQR Engine
            </h1>
            <p className="text-[14px] text-[#11140F]/60 leading-relaxed">
              An unexpected system interruption occurred while loading the workspace.
            </p>
            {error?.digest && (
              <p className="text-[11px] font-mono text-[#11140F]/35 pt-1">
                Digest ID: {error.digest}
              </p>
            )}
          </div>

          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#11140F] text-white text-[13px] font-semibold hover:bg-[#2A2E25] transition-colors shadow-xs cursor-pointer"
          >
            Reload Platform
          </button>
        </div>
      </body>
    </html>
  );
}
