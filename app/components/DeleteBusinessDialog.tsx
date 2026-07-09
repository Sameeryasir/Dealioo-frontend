"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";

export type DeleteBusinessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName: string;
  onConfirm: () => void | Promise<void>;
};

export default function DeleteBusinessDialog({
  open,
  onOpenChange,
  restaurantName,
  onConfirm,
}: DeleteBusinessDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete business permanently?"
      description={
        <>
          This will permanently delete{" "}
          <span className="font-semibold text-zinc-900">{restaurantName}</span>.
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
