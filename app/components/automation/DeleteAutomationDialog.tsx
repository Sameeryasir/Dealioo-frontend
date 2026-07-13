"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";

export function DeleteAutomationDialog({
  open,
  automationName,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  automationName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      titleId="delete-automation-title"
      title="Delete automation?"
      description={
        <>
          <span className="font-semibold text-[#1877f2]">{automationName}</span>{" "}
          will be removed permanently. This cannot be undone.
        </>
      }
      isLoading={isDeleting}
      loadingLabel="Deleting…"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
