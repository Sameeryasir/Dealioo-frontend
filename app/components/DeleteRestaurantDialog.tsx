"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";

export type DeleteRestaurantDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantName: string;
  onConfirm: () => void | Promise<void>;
};

export default function DeleteRestaurantDialog({
  open,
  onOpenChange,
  restaurantName,
  onConfirm,
}: DeleteRestaurantDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete restaurant permanently?"
      description={
        <>
          This will permanently delete{" "}
          <span className="font-semibold text-zinc-900">{restaurantName}</span>.
          Make sure this is the restaurant you intend to remove. You cannot undo
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
