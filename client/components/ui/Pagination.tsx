/**
 * Pagination Component
 *
 * Renders "Previous / Page X of Y / Next" controls.
 * Uses the pagination metadata returned by the backend.
 */

"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 pt-4">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage}
        className="
          flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
          bg-surface-800 border border-surface-600
          text-slate-300 hover:bg-surface-700
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors duration-200
        "
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      {/* Page Indicator */}
      <span className="text-sm text-slate-400">
        Page <span className="text-white font-semibold">{currentPage}</span> of{" "}
        <span className="text-white font-semibold">{totalPages}</span>
      </span>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="
          flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium
          bg-surface-800 border border-surface-600
          text-slate-300 hover:bg-surface-700
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-colors duration-200
        "
        aria-label="Next page"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
