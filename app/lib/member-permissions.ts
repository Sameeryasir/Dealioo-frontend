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
  CampaignActionPermission,
  GoogleCampaignActionPermission,
  MetaCampaignActionPermission,
} from "@/app/services/member/types";
import {
  CAMPAIGN_ACTION_PERMISSIONS,
  GOOGLE_CAMPAIGN_ACTION_PERMISSIONS,
  META_CAMPAIGN_ACTION_PERMISSIONS,
} from "@/app/services/member/types";

export const BUSINESS_MEMBER_PERMISSIONS = [
  "campaigns",
  ...CAMPAIGN_ACTION_PERMISSIONS,
  "meta_ads",
  "meta_campaigns",
  ...META_CAMPAIGN_ACTION_PERMISSIONS,
  ...GOOGLE_CAMPAIGN_ACTION_PERMISSIONS,
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
    "campaigns_view",
    "campaigns_create",
    "campaigns_edit",
    "campaigns_delete",
    "meta_campaigns_view",
    "meta_campaigns_create",
    "meta_campaigns_delete",
    "google_campaigns_view",
    "google_campaigns_create",
    "google_campaigns_delete",
    "orders",
    "activity",
    "chats",
    "scanning",
  ],
  Staff: ["orders", "activity", "chats", "scanning"],
};

export const CAMPAIGN_ACTION_OPTIONS: {
  value: CampaignActionPermission;
  label: string;
}[] = [
  { value: "campaigns_view", label: "View" },
  { value: "campaigns_edit", label: "Edit" },
  { value: "campaigns_create", label: "Create" },
  { value: "campaigns_delete", label: "Delete" },
];

export const META_CAMPAIGN_ACTION_OPTIONS: {
  value: MetaCampaignActionPermission;
  label: string;
}[] = [
  { value: "meta_campaigns_view", label: "View" },
  { value: "meta_campaigns_create", label: "Create" },
  { value: "meta_campaigns_delete", label: "Delete" },
];

export const GOOGLE_CAMPAIGN_ACTION_OPTIONS: {
  value: GoogleCampaignActionPermission;
  label: string;
}[] = [
  { value: "google_campaigns_view", label: "View" },
  { value: "google_campaigns_create", label: "Create" },
  { value: "google_campaigns_delete", label: "Delete" },
];

export type PermissionAccent = {
  iconBg: string;
  iconColor: string;
  toggleOn: string;
};

export const MODULE_PERMISSION_OPTIONS: {
  value: BusinessMemberPermission;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: PermissionAccent;
}[] = [
  {
    value: "orders",
    label: "Orders",
    description: "See customer orders and payment activity.",
    icon: ShoppingBag,
    accent: {
      iconBg: "bg-[#ffedd5]",
      iconColor: "text-[#ea580c]",
      toggleOn: "bg-[#ea580c]",
    },
  },
  {
    value: "activity",
    label: "Activity",
    description: "Track business activity and performance.",
    icon: BarChart3,
    accent: {
      iconBg: "bg-[#dbeafe]",
      iconColor: "text-[#2563eb]",
      toggleOn: "bg-[#2563eb]",
    },
  },
  {
    value: "chats",
    label: "Chats",
    description: "Reply to guest conversations.",
    icon: MessageSquare,
    accent: {
      iconBg: "bg-[#ccfbf1]",
      iconColor: "text-[#0d9488]",
      toggleOn: "bg-[#0d9488]",
    },
  },
  {
    value: "scanning",
    label: "Scanning",
    description: "Scan and redeem customer QR passes.",
    icon: ScanLine,
    accent: {
      iconBg: "bg-[#fce7f3]",
      iconColor: "text-[#db2777]",
      toggleOn: "bg-[#db2777]",
    },
  },
];

export const CAMPAIGNS_MODULE_ACCENT: PermissionAccent = {
  iconBg: "bg-[#dbeafe]",
  iconColor: "text-[#2563eb]",
  toggleOn: "bg-[#2563eb]",
};

export const META_CAMPAIGNS_MODULE_ACCENT: PermissionAccent = {
  iconBg: "bg-[#e7f3ff]",
  iconColor: "text-[#0081FB]",
  toggleOn: "bg-[#0081FB]",
};

export const GOOGLE_CAMPAIGNS_MODULE_ACCENT: PermissionAccent = {
  iconBg: "bg-[#fff8e1]",
  iconColor: "text-[#FBBC04]",
  toggleOn: "bg-[#FBBC04]",
};

export const PERMISSION_OPTIONS: {
  value: BusinessMemberPermission;
  label: string;
  description: string;
  icon: LucideIcon;
  accent?: PermissionAccent;
}[] = [
  {
    value: "campaigns",
    label: "Campaigns",
    description: "View and manage marketing campaigns.",
    icon: Megaphone,
    accent: CAMPAIGNS_MODULE_ACCENT,
  },
  {
    value: "campaigns_view",
    label: "View",
    description: "See marketing campaigns for this business.",
    icon: Eye,
  },
  {
    value: "campaigns_create",
    label: "Create",
    description: "Create new marketing campaigns.",
    icon: Megaphone,
  },
  {
    value: "campaigns_edit",
    label: "Edit",
    description: "Update existing marketing campaigns.",
    icon: Megaphone,
  },
  {
    value: "campaigns_delete",
    label: "Delete",
    description: "Remove marketing campaigns.",
    icon: Megaphone,
  },
  {
    value: "meta_ads",
    label: "Meta Campaigns",
    description: "View Meta Ads campaigns and performance.",
    icon: Eye,
    accent: META_CAMPAIGNS_MODULE_ACCENT,
  },
  {
    value: "meta_campaigns",
    label: "Meta Campaigns",
    description: "Create and manage Meta Ads campaigns.",
    icon: Megaphone,
    accent: META_CAMPAIGNS_MODULE_ACCENT,
  },
  {
    value: "meta_campaigns_view",
    label: "View",
    description: "View Meta Ads campaigns.",
    icon: Eye,
  },
  {
    value: "meta_campaigns_create",
    label: "Create",
    description: "Create Meta Ads campaigns.",
    icon: Megaphone,
  },
  {
    value: "meta_campaigns_delete",
    label: "Delete",
    description: "Delete Meta Ads campaigns.",
    icon: Megaphone,
  },
  {
    value: "google_campaigns_view",
    label: "View",
    description: "View Google Ads campaigns.",
    icon: Eye,
  },
  {
    value: "google_campaigns_create",
    label: "Create",
    description: "Create Google Ads campaigns.",
    icon: Megaphone,
  },
  {
    value: "google_campaigns_delete",
    label: "Delete",
    description: "Delete Google Ads campaigns.",
    icon: Megaphone,
  },
  ...MODULE_PERMISSION_OPTIONS,
];

const STAFF_PERMISSION_VALUES = new Set<BusinessMemberPermission>(
  DEFAULT_PERMISSIONS_BY_ROLE.Staff,
);

export function getModulePermissionOptionsForRole(role: BusinessMemberRole) {
  if (role === "Staff") {
    return MODULE_PERMISSION_OPTIONS.filter((option) =>
      STAFF_PERMISSION_VALUES.has(option.value),
    );
  }

  return MODULE_PERMISSION_OPTIONS;
}

export function roleSupportsCampaignModule(role: BusinessMemberRole): boolean {
  return role === "Manager";
}

export function roleSupportsMetaCampaignModule(
  role: BusinessMemberRole,
): boolean {
  return role === "Manager";
}

export function roleSupportsGoogleCampaignModule(
  role: BusinessMemberRole,
): boolean {
  return role === "Manager";
}

export function getPermissionOptionsForRole(role: BusinessMemberRole) {
  if (role === "Staff") {
    return PERMISSION_OPTIONS.filter((option) =>
      STAFF_PERMISSION_VALUES.has(option.value),
    );
  }

  return PERMISSION_OPTIONS;
}

export function getPermissionLabel(permission: string): string {
  const campaignAction = CAMPAIGN_ACTION_OPTIONS.find(
    (option) => option.value === permission,
  );
  if (campaignAction) {
    return `Campaigns ${campaignAction.label}`;
  }

  const metaAction = META_CAMPAIGN_ACTION_OPTIONS.find(
    (option) => option.value === permission,
  );
  if (metaAction) {
    return `Meta ${metaAction.label}`;
  }

  const googleAction = GOOGLE_CAMPAIGN_ACTION_OPTIONS.find(
    (option) => option.value === permission,
  );
  if (googleAction) {
    return `Google ${googleAction.label}`;
  }

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

export function hasAnyCampaignPermission(
  permissions: readonly string[],
): boolean {
  if (permissions.includes("campaigns")) {
    return true;
  }
  return CAMPAIGN_ACTION_PERMISSIONS.some((key) => permissions.includes(key));
}

export function hasAnyMetaCampaignPermission(
  permissions: readonly string[],
): boolean {
  if (
    permissions.includes("meta_ads") ||
    permissions.includes("meta_campaigns")
  ) {
    return true;
  }
  return META_CAMPAIGN_ACTION_PERMISSIONS.some((key) =>
    permissions.includes(key),
  );
}

export function hasAnyGoogleCampaignPermission(
  permissions: readonly string[],
): boolean {
  if (permissions.includes("campaigns")) {
    return true;
  }
  return GOOGLE_CAMPAIGN_ACTION_PERMISSIONS.some((key) =>
    permissions.includes(key),
  );
}

export function getSelectedCampaignActions(
  permissions: readonly BusinessMemberPermission[],
): CampaignActionPermission[] {
  if (permissions.includes("campaigns")) {
    return [...CAMPAIGN_ACTION_PERMISSIONS];
  }
  return CAMPAIGN_ACTION_PERMISSIONS.filter((key) => permissions.includes(key));
}

export function getSelectedMetaCampaignActions(
  permissions: readonly BusinessMemberPermission[],
): MetaCampaignActionPermission[] {
  if (permissions.includes("meta_campaigns")) {
    return [...META_CAMPAIGN_ACTION_PERMISSIONS];
  }
  if (permissions.includes("meta_ads")) {
    const selected = new Set<MetaCampaignActionPermission>(
      META_CAMPAIGN_ACTION_PERMISSIONS.filter((key) =>
        permissions.includes(key),
      ),
    );
    selected.add("meta_campaigns_view");
    return META_CAMPAIGN_ACTION_PERMISSIONS.filter((key) => selected.has(key));
  }
  return META_CAMPAIGN_ACTION_PERMISSIONS.filter((key) =>
    permissions.includes(key),
  );
}

export function getSelectedGoogleCampaignActions(
  permissions: readonly BusinessMemberPermission[],
): GoogleCampaignActionPermission[] {
  return GOOGLE_CAMPAIGN_ACTION_PERMISSIONS.filter((key) =>
    permissions.includes(key),
  );
}
