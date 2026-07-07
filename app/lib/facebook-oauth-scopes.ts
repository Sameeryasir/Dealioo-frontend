export type FacebookScopeDetail = {
  id: string;
  label: string;
  description: string;
  required: boolean;
};

/** Matches backend FACEBOOK_OAUTH_SCOPES, shown in Settings after connect. */
export const FACEBOOK_OAUTH_SCOPE_DETAILS: FacebookScopeDetail[] = [
  {
    id: "ads_management",
    label: "Manage ads",
    description: "Create and publish campaigns, ad sets, creatives, and ads.",
    required: true,
  },
  {
    id: "ads_read",
    label: "Read ad data",
    description: "View campaign performance, spend, and ad account stats.",
    required: true,
  },
  {
    id: "business_management",
    label: "Business assets",
    description: "Access ad accounts linked through Meta Business Manager.",
    required: true,
  },
  {
    id: "pages_show_list",
    label: "List Facebook Pages",
    description: "Show Pages you manage when building ad creatives.",
    required: false,
  },
  {
    id: "pages_read_engagement",
    label: "Page information",
    description: "Read basic Page details needed for ad delivery.",
    required: false,
  },
];

export function parseGrantedScopes(scopes: string[] | null | undefined): Set<string> {
  return new Set((scopes ?? []).map((scope) => scope.trim()).filter(Boolean));
}
