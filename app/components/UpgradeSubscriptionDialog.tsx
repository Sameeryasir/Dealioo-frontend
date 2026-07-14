"use client";

import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";

export type UpgradeSubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
};

export function UpgradeSubscriptionDialog({
  open,
  onOpenChange,
  title = "Upgrade your subscription",
  description = "Your Starter plan includes one business. Upgrade your subscription to add more businesses and locations.",
}: UpgradeSubscriptionDialogProps) {
  const router = useRouter();

  return (
    <ConfirmDialog
      open={open}
      tone="warning"
      icon={ArrowUpRight}
      title={title}
      description={description}
      zIndex={200}
      panelClassName="max-w-md"
      cancelLabel="Not now"
      confirmLabel="Upgrade subscription"
      onCancel={() => onOpenChange(false)}
      onConfirm={() => {
        onOpenChange(false);
        router.push("/auth/select-plan");
      }}
    />
  );
}
