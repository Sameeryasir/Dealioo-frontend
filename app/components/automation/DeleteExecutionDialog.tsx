"use client";

import { DeleteConfirmationDialog } from "@/app/components/shared/DeleteConfirmationDialog";

export function DeleteExecutionDialog({
  open,
  itemName,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  itemName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const name = itemName.trim() || "this run";

  return (
    <DeleteConfirmationDialog
      open={open}
      itemName={name}
      title={`Delete “${name}”?`}
      description={
        <>
          This removes only{" "}
          <span className="font-semibold text-[#1877f2]">{name}</span>. Other
          runs stay as they are.
        </>
      }
      checkboxLabel={`Yes, delete “${name}”`}
      confirmText="Delete run"
      isLoading={isDeleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
