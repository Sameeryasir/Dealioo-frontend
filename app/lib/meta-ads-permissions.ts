export type MetaSelectableScopeId =
  | "ads_read"
  | "ads_management"
  | "business_management"
  | "pages_show_list"
  | "pages_read_engagement";

export type MetaPermissionOption = {
  id: MetaSelectableScopeId;
  title: string;
  description: string;
  tooltip: string;
  defaultSelected: boolean;
};

export const META_ADS_PERMISSION_OPTIONS: MetaPermissionOption[] = [
  {
    id: "ads_read",
    title: "Read advertising data",
    description:
      "Read ad accounts, campaigns, ads, insights, and performance data.",
    tooltip:
      "Used to read Meta Ads analytics and campaign reporting. Maps to ads_read.",
    defaultSelected: false,
  },
  {
    id: "ads_management",
    title: "Manage advertising campaigns",
    description:
      "Create, update, pause, and publish campaigns, ad sets, and ads.",
    tooltip:
      "Used for creating and editing ads from Dealioo. Maps to ads_management.",
    defaultSelected: false,
  },
  {
    id: "business_management",
    title: "Access business assets",
    description:
      "Access Business Manager assets like ad accounts linked to your Meta user.",
    tooltip:
      "Used to discover and select the correct Meta Ad Account. Maps to business_management.",
    defaultSelected: false,
  },
  {
    id: "pages_show_list",
    title: "Access Facebook Pages",
    description:
      "List Facebook Pages you manage so you can select the correct Page for ad creatives.",
    tooltip:
      "Used to show and select your Facebook Page when building Meta ads. Maps to pages_show_list.",
    defaultSelected: false,
  },
  {
    id: "pages_read_engagement",
    title: "Read Page engagement data",
    description:
      "Read Page association and engagement data needed to run and review ads linked to your Page.",
    tooltip:
      "Used for Page association with ads and engagement context. Maps to pages_read_engagement.",
    defaultSelected: false,
  },
];

export const META_SCOPE_LABELS: Record<string, string> = Object.fromEntries(
  META_ADS_PERMISSION_OPTIONS.map((opt) => [opt.id, opt.title]),
);

export function getDefaultSelectedMetaScopes(): MetaSelectableScopeId[] {
  return META_ADS_PERMISSION_OPTIONS.filter((opt) => opt.defaultSelected).map(
    (opt) => opt.id,
  );
}

export function formatMetaScopeTitle(scopeId: string): string {
  return META_SCOPE_LABELS[scopeId] ?? formatFacebookScopeLabelFallback(scopeId);
}

function formatFacebookScopeLabelFallback(scopeId: string): string {
  return scopeId
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
