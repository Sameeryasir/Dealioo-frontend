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
      title={`Delete “${name}”?`}
      description={
        <>
          This permanently removes{" "}
          <span className="font-semibold text-[#1877f2]">{name}</span> and its
          flow. You can’t undo this.
        </>
      }
      confirmText="Delete automation"
      checkboxLabel={`Yes, delete “${name}”`}
      isLoading={isDeleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
