"use client";

import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";

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
  const name = automationName.trim() || "this automation";

  return (
    <DeleteConfirmationDialog
      open={open}
      itemName={name}
      title="Delete this automation?"
      description={
        <>
          Are you sure you want to delete{" "}
          <span className="font-semibold text-[#1877f2]">{name}</span>? This
          cannot be undone.
        </>
      }
      confirmText="Delete automation"
      checkboxLabel={`Are you sure you want to delete ${name}?`}
      isLoading={isDeleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
