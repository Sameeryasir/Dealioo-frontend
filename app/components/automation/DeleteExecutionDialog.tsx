"use client";

import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";

export function DeleteExecutionDialog({
  open,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      icon={Trash2}
      titleId="delete-execution-title"
      title="Delete this run?"
      description="This removes the run and all of its activity logs. You can’t undo this action."
      isLoading={isDeleting}
      loadingLabel="Deleting…"
      confirmCheckbox={{
        label: "Yes, permanently delete this run",
      }}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
