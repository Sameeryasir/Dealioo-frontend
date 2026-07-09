"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";

export type DeleteBusinessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessName: string;
  onConfirm: () => void | Promise<void>;
};

export default function DeleteBusinessDialog({
  open,
  onOpenChange,
  businessName,
  onConfirm,
}: DeleteBusinessDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete business permanently?"
      description={
        <>
          This will permanently delete{" "}
          <span className="font-semibold text-zinc-900">{businessName}</span>.
          Make sure this is the business you intend to remove. You cannot undo
          this action.
        </>
      }
      zIndex={200}
      panelClassName="max-w-md"
      confirmLabel="Delete permanently"
      onCancel={() => onOpenChange(false)}
      onConfirm={() => {
        onOpenChange(false);
        void onConfirm();
      }}
    />
  );
}
