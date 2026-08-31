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
      "View your Meta ad accounts, campaigns, ads, and performance reports (spend, clicks, impressions, and insights) inside Dealioo.",
    tooltip:
      "Use this if you only need analytics and reporting. It does not let Dealioo create or change campaigns.",
    defaultSelected: false,
  },
  {
    id: "ads_management",
    title: "Manage advertising campaigns",
    description:
      "Create, read, delete, and publish Meta campaigns, ad sets, creatives, and ads from Dealioo’s campaign builder.",
    tooltip:
      "Required to build and publish ads in Dealioo. Selecting this also selects Facebook Page access so ads can run from your Page.",
    defaultSelected: false,
  },
  {
    id: "pages_read_engagement",
    title: "Read Facebook Page data",
    description:
      "List Facebook Pages you manage and use the Page you choose as the identity for your ads (name, profile picture, and Page ID).",
    tooltip:
      "Needed so ads can be published from your business Facebook Page. Dealioo does not read Page posts, comments, or follower lists.",
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
