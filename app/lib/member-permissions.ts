import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Eye,
  Megaphone,
  MessageSquare,
  ScanLine,
  ShoppingBag,
} from "lucide-react";
import type {
  BusinessMemberPermission,
  BusinessMemberRole,
} from "@/app/services/member/types";

export const BUSINESS_MEMBER_PERMISSIONS = [
  "campaigns",
  "meta_ads",
  "meta_campaigns",
  "orders",
  "activity",
  "chats",
  "scanning",
  "members",
  "settings",
] as const;

export const DEFAULT_PERMISSIONS_BY_ROLE: Record<
  BusinessMemberRole,
  BusinessMemberPermission[]
> = {
  Manager: [
    "campaigns",
    "meta_ads",
    "meta_campaigns",
    "orders",
    "activity",
    "chats",
    "scanning",
  ],
  Staff: ["orders", "activity", "chats", "scanning"],
};

export const PERMISSION_OPTIONS: {
  value: BusinessMemberPermission;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "campaigns",
    label: "Campaigns",
    description: "View and manage marketing campaigns.",
    icon: Megaphone,
  },
  {
    value: "meta_ads",
    label: "Read Meta Campaigns",
    description: "View Meta Ads campaigns and performance.",
    icon: Eye,
  },
  {
    value: "meta_campaigns",
    label: "Create Meta Campaigns",
    description: "Create and manage Meta Ads campaigns.",
    icon: Megaphone,
  },
  {
    value: "orders",
    label: "Orders",
    description: "See customer orders and payment activity.",
    icon: ShoppingBag,
  },
  {
    value: "activity",
    label: "Activity",
    description: "Track business activity and performance.",
    icon: BarChart3,
  },
  {
    value: "chats",
    label: "Chats",
    description: "Reply to guest conversations.",
    icon: MessageSquare,
  },
  {
    value: "scanning",
    label: "Scanning",
    description: "Scan and redeem customer QR passes.",
    icon: ScanLine,
  },
];

const STAFF_PERMISSION_VALUES = new Set<BusinessMemberPermission>(
  DEFAULT_PERMISSIONS_BY_ROLE.Staff,
);

export function getPermissionOptionsForRole(role: BusinessMemberRole) {
  if (role === "Staff") {
    return PERMISSION_OPTIONS.filter((option) =>
      STAFF_PERMISSION_VALUES.has(option.value),
    );
  }

  return PERMISSION_OPTIONS;
}

export function getPermissionLabel(permission: string): string {
  return (
    PERMISSION_OPTIONS.find((option) => option.value === permission)?.label ??
    permission
  );
}

export function getDefaultPermissionsForRole(
  role: BusinessMemberRole,
): BusinessMemberPermission[] {
  return [...DEFAULT_PERMISSIONS_BY_ROLE[role]];
}
