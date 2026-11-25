'use client';

import { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => void;
  onConfirmArchive?: () => void;
  title: string;
  isArchived?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirmDelete,
  onConfirmArchive,
  title,
  isArchived = false,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[#11140F]/15 dark:border-white/15 bg-[#EEF0EA] dark:bg-[#0E1017] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-[#11140F] dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B8842E]/15 text-[#B8842E] text-lg font-bold">
            ⚠️
          </div>
          <div>
            <h3 className="text-[16px] font-medium text-[#11140F] dark:text-white">Delete "{title}"?</h3>
            <p className="text-[12px] text-[#11140F]/55 dark:text-white/50">Manage active QR destination</p>
          </div>
        </div>

        <p className="text-[13px] text-[#11140F]/70 dark:text-white/70 leading-relaxed">
          Physical materials already printed with this QR code will stop redirecting immediately.
        </p>

        <div className="space-y-2 pt-2">
          {!isArchived && onConfirmArchive && (
            <button
              onClick={() => {
                onConfirmArchive();
                onClose();
              }}
              className="w-full rounded-xl bg-[#2F6B4F] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#255740] transition-colors"
            >
              Archive instead (Recommended)
            </button>
          )}

          <button
            onClick={() => {
              onConfirmDelete();
              onClose();
            }}
            className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-[13px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
          >
            Permanently delete
          </button>

          <button
            onClick={onClose}
            className="w-full rounded-xl border border-[#11140F]/15 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2 text-[13px] font-medium text-[#11140F]/75 dark:text-white/80 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
