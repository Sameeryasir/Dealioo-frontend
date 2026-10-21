"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

function showingLabel(input: {
  page: number;
  total: number;
  limit: number;
}): string {
  const { page, total, limit } = input;
  if (total <= 0) return "Showing 0 results";
  if (total === 1) return "Showing 1 result";

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `Showing ${start}–${end} of ${total} results`;
}

export function OffsetPagination({
  page,
  totalPages,
  total,
  limit,
  loading,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}) {
  const label = showingLabel({ page, total, limit });
  const showControls = totalPages > 1;

  return (
    <div
      className={`flex flex-col gap-3 border-t border-[#e8edf5] px-2.5 py-3 sm:flex-row sm:items-center sm:px-3 ${
        showControls ? "sm:justify-between" : "sm:justify-end"
      }`}
    >
      <p
        className={`m-0 text-xs text-slate-500 ${
          showControls ? "" : "w-full text-right"
        }`}
      >
        {label}
      </p>
      {showControls ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="size-4" aria-hidden />
            Previous
          </button>
          <span className="min-w-[5rem] text-center text-sm font-medium tabular-nums text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-[#e8edf5] bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-[#1877f2]/30 hover:bg-[#f4f8ff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
