'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

/**
 * Unified pagination footer modeled after the AI Telemetry audit table.
 */
export default function PaginationControls({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [6, 10, 25, 50],
  itemLabel = 'items',
  className = '',
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(safePage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#11140F]/10 dark:border-white/10 text-[12px] ${className}`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[#11140F]/60 dark:text-white/55">
          Showing <strong className="text-[#11140F] dark:text-white">{startIndex}</strong>–
          <strong className="text-[#11140F] dark:text-white">{endIndex}</strong> of{' '}
          <strong className="text-[#11140F] dark:text-white">{totalItems}</strong> {itemLabel}
        </span>

        {onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => {
              onItemsPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            aria-label="Items per page"
            className="px-2.5 py-1 rounded-xl border border-[#11140F]/15 dark:border-white/20 text-[11.5px] bg-white dark:bg-[#161B13] text-[#11140F] dark:text-white outline-none cursor-pointer shadow-2xs"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size} className="bg-white dark:bg-[#161B13] text-[#11140F] dark:text-white">
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
          aria-label="Previous page"
          className="p-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/20 bg-white dark:bg-[#161B13] text-[#11140F] dark:text-white disabled:opacity-30 hover:bg-[#F7F8F5] dark:hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-mono px-2.5 text-[11.5px] text-[#11140F]/80 dark:text-white/80">
          Page <strong className="text-[#11140F] dark:text-white">{safePage}</strong> of{' '}
          <strong className="text-[#11140F] dark:text-white">{totalPages}</strong>
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage >= totalPages}
          aria-label="Next page"
          className="p-1.5 rounded-xl border border-[#11140F]/15 dark:border-white/20 bg-white dark:bg-[#161B13] text-[#11140F] dark:text-white disabled:opacity-30 hover:bg-[#F7F8F5] dark:hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
