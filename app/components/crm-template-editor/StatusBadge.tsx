"use client";

import type { EditorSaveStatus } from "@/app/components/crm-template-editor/editor-status";
import { editorStatusLabel } from "@/app/components/crm-template-editor/editor-status";

export function StatusBadge({
  status,
  isDirty,
}: {
  status: EditorSaveStatus;
  isDirty: boolean;
}) {
  const label = editorStatusLabel(status, isDirty);
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.625rem] font-bold ring-1 ring-inset ${tone}`}
      aria-live="polite"
    >
      {label}
    </span>
  );
}
