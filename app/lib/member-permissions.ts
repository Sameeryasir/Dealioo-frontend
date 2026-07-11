import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Megaphone,
  MessageSquare,
  ScanLine,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import type {
  BusinessMemberPermission,
  BusinessMemberRole,
} from "@/app/services/member/types";

export const BUSINESS_MEMBER_PERMISSIONS = [
  "campaigns",
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
  Manager: ["campaigns", "orders", "activity", "chats", "scanning"],
  Staff: ["orders", "chats", "scanning"],
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
  {
    value: "members",
    label: "Members",
    description: "View the team list for this business.",
    icon: Users,
  },
  {
    value: "settings",
    label: "Settings",
    description: "Open business profile and configuration.",
    icon: Settings,
  },
];

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
