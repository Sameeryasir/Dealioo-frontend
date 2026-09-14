import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Eye,
  Filter,
  Megaphone,
  MessageSquare,
  ScanLine,
  ShoppingBag,
  Workflow,
} from "lucide-react";
import type {
  AutomationActionPermission,
  BusinessMemberPermission,
  BusinessMemberRole,
  CampaignActionPermission,
  GoogleCampaignActionPermission,
  MetaCampaignActionPermission,
} from "@/app/services/member/types";
import {
  AUTOMATION_ACTION_PERMISSIONS,
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
  ...AUTOMATION_ACTION_PERMISSIONS,
  "funnels_edit",
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
    "campaigns_create",
    "campaigns_edit",
    "campaigns_delete",
    "meta_campaigns_create",
    "meta_campaigns_delete",
    "google_campaigns_create",
    "google_campaigns_delete",
    "automations_create",
    "automations_edit",
    "automations_delete",
    "funnels_edit",
    "orders",
    "activity",
    "chats",
    "scanning",
    "members",
  ],
  Staff: ["orders", "activity", "chats", "scanning"],
  Scanner: ["scanning", "orders"],
};

export const CAMPAIGN_ACTION_OPTIONS: {
  value: CampaignActionPermission;
  label: string;
}[] = [
  { value: "campaigns_edit", label: "Edit" },
  { value: "campaigns_create", label: "Create" },
  { value: "campaigns_delete", label: "Delete" },
];

export const META_CAMPAIGN_ACTION_OPTIONS: {
  value: MetaCampaignActionPermission;
  label: string;
}[] = [
  { value: "meta_campaigns_create", label: "Create" },
  { value: "meta_campaigns_delete", label: "Delete" },
];

export const GOOGLE_CAMPAIGN_ACTION_OPTIONS: {
  value: GoogleCampaignActionPermission;
  label: string;
}[] = [
  { value: "google_campaigns_create", label: "Create" },
  { value: "google_campaigns_delete", label: "Delete" },
];

export const AUTOMATION_ACTION_OPTIONS: {
  value: AutomationActionPermission;
  label: string;
}[] = [
  { value: "automations_create", label: "Create" },
  { value: "automations_edit", label: "Update" },
  { value: "automations_delete", label: "Delete" },
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

export const AUTOMATIONS_MODULE_ACCENT: PermissionAccent = {
  iconBg: "bg-[#ede9fe]",
  iconColor: "text-[#7c3aed]",
  toggleOn: "bg-[#7c3aed]",
};

export const FUNNELS_MODULE_ACCENT: PermissionAccent = {
  iconBg: "bg-[#ecfdf5]",
  iconColor: "text-[#059669]",
  toggleOn: "bg-[#059669]",
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
  {
    value: "automations_create",
    label: "Create",
    description: "Create automations for this business.",
    icon: Workflow,
  },
  {
    value: "automations_edit",
    label: "Update",
    description: "Update and activate automations.",
    icon: Workflow,
  },
  {
    value: "automations_delete",
    label: "Delete",
    description: "Delete automations.",
    icon: Workflow,
  },
  {
    value: "funnels_edit",
    label: "Update funnel",
    description: "Update campaign funnel pages and settings.",
    icon: Filter,
    accent: FUNNELS_MODULE_ACCENT,
  },
  ...MODULE_PERMISSION_OPTIONS,
];

const STAFF_PERMISSION_VALUES = new Set<BusinessMemberPermission>(
  DEFAULT_PERMISSIONS_BY_ROLE.Staff,
);

const SCANNER_PERMISSION_VALUES = new Set<BusinessMemberPermission>(
  DEFAULT_PERMISSIONS_BY_ROLE.Scanner,
);

export function getModulePermissionOptionsForRole(role: BusinessMemberRole) {
  if (role === "Scanner") {
    return MODULE_PERMISSION_OPTIONS.filter((option) =>
      SCANNER_PERMISSION_VALUES.has(option.value),
    );
  }

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

export function roleSupportsAutomationModule(
  role: BusinessMemberRole,
): boolean {
  return role === "Manager";
}

export function roleSupportsFunnelModule(role: BusinessMemberRole): boolean {
  return role === "Manager";
}

export function getPermissionOptionsForRole(role: BusinessMemberRole) {
  if (role === "Scanner") {
    return PERMISSION_OPTIONS.filter((option) =>
      SCANNER_PERMISSION_VALUES.has(option.value),
    );
  }

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

  const automationAction = AUTOMATION_ACTION_OPTIONS.find(
    (option) => option.value === permission,
  );
  if (automationAction) {
    return `Automations ${automationAction.label}`;
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
  if (
    permissions.includes("campaigns") ||
    permissions.includes("campaigns_view")
  ) {
    return true;
  }
  return CAMPAIGN_ACTION_PERMISSIONS.some((key) => permissions.includes(key));
}

export function hasAnyMetaCampaignPermission(
  permissions: readonly string[],
): boolean {
  if (
    permissions.includes("meta_ads") ||
    permissions.includes("meta_campaigns") ||
    permissions.includes("meta_campaigns_view")
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
  if (
    permissions.includes("campaigns") ||
    permissions.includes("google_campaigns_view")
  ) {
    return true;
  }
  return GOOGLE_CAMPAIGN_ACTION_PERMISSIONS.some((key) =>
    permissions.includes(key),
  );
}

export function hasAnyAutomationPermission(
  permissions: readonly string[],
): boolean {
  return AUTOMATION_ACTION_PERMISSIONS.some((key) =>
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
    return META_CAMPAIGN_ACTION_PERMISSIONS.filter((key) =>
      permissions.includes(key),
    );
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

export function getSelectedAutomationActions(
  permissions: readonly BusinessMemberPermission[],
): AutomationActionPermission[] {
  return AUTOMATION_ACTION_PERMISSIONS.filter((key) =>
    permissions.includes(key),
  );
}
