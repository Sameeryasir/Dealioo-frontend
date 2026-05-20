"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";

export type DiscardChangesDialogProps = {
  open: boolean;
  pageLabel?: string;
  onCancel: () => void;
  onDiscard: () => void;
};

export function DiscardChangesDialog({
  open,
  pageLabel,
  onCancel,
  onDiscard,
}: DiscardChangesDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      titleId="discard-changes-title"
      title="Discard unsaved changes?"
      tone="warning"
      description={
        pageLabel
          ? `Your edits to ${pageLabel} won't be saved.`
          : "Your edits won't be saved."
      }
      cancelLabel="Keep editing"
      confirmLabel="Discard changes"
      autoFocusCancel
      onCancel={onCancel}
      onConfirm={onDiscard}
    />
  );
}
