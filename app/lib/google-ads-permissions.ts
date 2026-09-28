/**
 * Google Ads OAuth permissions shown before connect.
 * Mirrors scopes in dealio-backend google-oauth.client.ts (adwords + GTM readonly).
 * MCP context 7: keep copy aligned with Google’s consent screen wording.
 */

export type GoogleAdsPermissionId = "adwords" | "tagmanager_readonly";

export type GoogleAdsPermissionOption = {
  id: GoogleAdsPermissionId;
  title: string;
  description: string;
  required: boolean;
};

export const GOOGLE_ADS_PERMISSION_OPTIONS: GoogleAdsPermissionOption[] = [
  {
    id: "adwords",
    title: "See, edit, create, and delete your Google Ads accounts and data",
    description:
      "Lets Dealioo manage Google Ads campaigns, ad groups, ads, and performance data for this business.",
    required: true,
  },
  {
    id: "tagmanager_readonly",
    title: "View your Google Tag Manager container configurations",
    description:
      "Lets Dealioo read Tag Manager containers so conversion tracking can stay linked to your funnels.",
    required: true,
  },
];
