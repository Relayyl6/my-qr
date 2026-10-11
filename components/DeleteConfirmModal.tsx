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
        className="relative w-full max-w-sm rounded-2xl border border-[#11140F]/15 bg-[#EEF0EA] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B8842E]/15 text-[#B8842E] text-lg font-bold">
            ⚠️
          </div>
          <div>
            <h3 className="text-[16px] font-medium text-[#11140F]">Delete "{title}"?</h3>
            <p className="text-[12px] text-[#11140F]/55">Manage active QR destination</p>
          </div>
        </div>

        <p className="text-[13px] text-[#11140F]/70 leading-relaxed">
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
            className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-100 transition-colors"
          >
            Permanently delete
          </button>

          <button
            onClick={onClose}
            className="w-full rounded-xl border border-[#11140F]/15 bg-white px-4 py-2 text-[13px] font-medium text-[#11140F]/70 hover:bg-white/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
