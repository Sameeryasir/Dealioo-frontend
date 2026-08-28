export type MetaSelectableScopeId =
  | "ads_read"
  | "ads_management"
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
      "Create, read, delete, and publish campaigns, ad sets, and ads.",
    tooltip:
      "Used to create, read, delete, and publish Meta ads from Dealioo. Maps to ads_management.",
    defaultSelected: false,
  },
  {
    id: "pages_read_engagement",
    title: "Read Facebook Page data",
    description:
      "Access Facebook Pages you manage so ads can run from your Page.",
    tooltip:
      "Required with manage advertising campaigns. Used to associate ads with your Facebook Page. Maps to pages_read_engagement.",
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

export function hasMetaAdsManagementScope(
  scopes: string[] | null | undefined,
): boolean {
  return (scopes ?? []).includes("ads_management");
}

export function formatMetaScopeTitle(scopeId: string): string {
  return META_SCOPE_LABELS[scopeId] ?? formatFacebookScopeLabelFallback(scopeId);
}

export function toggleMetaSelectableScope(
  current: MetaSelectableScopeId[],
  id: MetaSelectableScopeId,
): MetaSelectableScopeId[] {
  const next = new Set(current);

  if (next.has(id)) {
    next.delete(id);
    if (id === "ads_management") {
      next.delete("pages_read_engagement");
    }
    if (id === "pages_read_engagement") {
      next.delete("ads_management");
    }
  } else {
    next.add(id);
    if (id === "ads_management") {
      next.add("pages_read_engagement");
    }
    if (id === "pages_read_engagement") {
      next.add("ads_management");
    }
  }

  return META_ADS_PERMISSION_OPTIONS.map((opt) => opt.id).filter((scopeId) =>
    next.has(scopeId),
  );
}

function formatFacebookScopeLabelFallback(scopeId: string): string {
  return scopeId
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
