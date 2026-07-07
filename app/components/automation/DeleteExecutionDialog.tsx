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
      description={
        <>
          You are about to remove{" "}
          <span className="font-medium text-zinc-900">{itemName}</span> from your
          runs list. This cannot be undone, the run record and its activity
          logs will be permanently deleted.
        </>
      }
      confirmText="Delete"
      isLoading={isDeleting}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
