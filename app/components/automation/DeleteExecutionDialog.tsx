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
  return (
    <DeleteConfirmationDialog
      open={open}
      itemName={itemName}
      title="Delete this run?"
      description="Are you sure you want to delete this run only?"
      checkboxLabel="Yes, delete this run only"
      confirmText="Delete"
      isLoading={isDeleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
