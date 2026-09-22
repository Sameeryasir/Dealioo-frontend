export type MetaSelectableScopeId =
  | "ads_read"
  | "ads_management"
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
    title: "ads_read",
    description:
      "View your Meta ad accounts, campaigns, ads, and performance reports (spend, clicks, impressions, and insights) inside Dealioo.",
    tooltip:
      "Use this if you only need analytics and reporting. It does not let Dealioo create or change campaigns.",
    defaultSelected: false,
  },
  {
    id: "ads_management",
    title: "ads_management",
    description:
      "Create, read, delete, and publish Meta campaigns, ad sets, creatives, and ads from Dealioo’s campaign builder.",
    tooltip:
      "Required to build and publish ads in Dealioo. Selecting this also selects pages_show_list.",
    defaultSelected: false,
  },
  {
    id: "pages_show_list",
    title: "pages_show_list",
    description:
      "Lists Facebook Pages you manage in Dealioo’s Page picker so you can choose which Page will run your ads. This is Meta’s pages_show_list permission (list Pages only — it does not attach a Page to ads).",
    tooltip:
      "Needed to show your Page list. Selecting this also selects ads_management.",
    defaultSelected: false,
  },
  {
    id: "pages_read_engagement",
    title: "pages_read_engagement",
    description:
      "Uses the Facebook Page you already chose as the identity for your ads, and loads that Page’s details in campaign creation so you can verify the correct Page will represent your advertisement. This is Meta’s pages_read_engagement permission.",
    tooltip:
      "Needed so ads publish from your business Facebook Page and so Dealioo can show Page identity details in the campaign builder. Selecting this also selects ads_management and pages_show_list.",
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
    if (id === "ads_management" || id === "pages_show_list") {
      next.delete("ads_management");
      next.delete("pages_show_list");
      next.delete("pages_read_engagement");
    }
  } else {
    next.add(id);
    if (id === "pages_read_engagement") {
      next.add("ads_management");
      next.add("pages_show_list");
      next.add("pages_read_engagement");
    } else if (id === "ads_management" || id === "pages_show_list") {
      next.add("ads_management");
      next.add("pages_show_list");
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
