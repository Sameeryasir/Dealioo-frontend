"use client";

import type { EditorSaveStatus } from "@/app/components/crm-template-editor/editor-status";
import { editorStatusLabel } from "@/app/components/crm-template-editor/editor-status";

function compactStatusLabel(
  status: EditorSaveStatus,
  isDirty: boolean,
): string {
  if (status === "saving") return "Saving";
  if (status === "error") return "Failed";
  if (status === "saved") return "Saved";
  if (isDirty) return "Unsaved";
  return "Synced";
}

export function StatusBadge({
  status,
  isDirty,
  compact = false,
}: {
  status: EditorSaveStatus;
  isDirty: boolean;
  compact?: boolean;
}) {
  const label = compact
    ? compactStatusLabel(status, isDirty)
    : editorStatusLabel(status, isDirty);
  const tone =
    status === "error"
      ? "bg-red-50 text-red-700 ring-red-200/80"
      : status === "saving"
        ? "bg-amber-50 text-amber-800 ring-amber-200/80"
        : status === "saved"
          ? "bg-[#f0fdf4] text-[#34a853] ring-[#34a853]/20"
          : isDirty
            ? "bg-[#fce7f3]/60 text-[#e1306c] ring-[#e1306c]/20"
            : "bg-[#f4f8ff] text-[#1877f2] ring-[#1877f2]/15";

  return (
    <span
      className={`inline-flex max-w-full items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.625rem] font-bold leading-none ring-1 ring-inset ${tone}`}
      title={editorStatusLabel(status, isDirty)}
      aria-live="polite"
    >
      {label}
    </span>
  );
}
