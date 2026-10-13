export const adsStatsQueryKeys = {
  all: ["ads-stats"] as const,
  meta: () => [...adsStatsQueryKeys.all, "meta"] as const,
  metaDisabled: () => [...adsStatsQueryKeys.meta(), "disabled"] as const,
  metaCampaignStats: (
    businessId: number,
    options: {
      period: string;
      page: number;
      pageSize: number;
      query: string;
      campaignIds?: string[];
    },
  ) =>
    [
      ...adsStatsQueryKeys.meta(),
      "campaign-stats",
      businessId,
      options.period,
      options.page,
      options.pageSize,
      options.query,
      ...(options.campaignIds?.length
        ? [options.campaignIds.slice().sort().join(",")]
        : []),
    ] as const,
  facebookConnection: (businessId: number) =>
    [...adsStatsQueryKeys.meta(), "connection", businessId] as const,
  businessMetaSpend: (businessId: number, period: string) =>
    [
      ...adsStatsQueryKeys.meta(),
      "business-meta-spend",
      businessId,
      period,
    ] as const,
  dealioCampaignMetaSpend: (
    businessId: number,
    campaignId: number,
    period: string,
  ) =>
    [
      ...adsStatsQueryKeys.meta(),
      "dealio-campaign-meta-spend",
      businessId,
      campaignId,
      period,
    ] as const,
  google: () => [...adsStatsQueryKeys.all, "google"] as const,
  googleDisabled: () => [...adsStatsQueryKeys.google(), "disabled"] as const,
  googleCampaignStats: (
    businessId: number,
    options: { period: string },
  ) =>
    [
      ...adsStatsQueryKeys.google(),
      "campaign-stats",
      businessId,
      options.period,
    ] as const,
  businessGoogleSpend: (businessId: number, period: string) =>
    [
      ...adsStatsQueryKeys.google(),
      "business-google-spend",
      businessId,
      period,
    ] as const,
  dealioCampaignGoogleSpend: (
    businessId: number,
    campaignId: number,
    period: string,
  ) =>
    [
      ...adsStatsQueryKeys.google(),
      "dealio-campaign-google-spend",
      businessId,
      campaignId,
      period,
    ] as const,
};

export const businessActivityQueryKeys = {
  all: ["business-activity"] as const,
  disabled: () => [...businessActivityQueryKeys.all, "disabled"] as const,
  dashboardSummary: (
    businessId: number,
    options: {
      from: string;
      to: string;
      previousFrom: string | null;
      previousTo: string | null;
      timezone: string;
    },
  ) =>
    [
      ...businessActivityQueryKeys.all,
      "dashboard-summary",
      businessId,
      options.from,
      options.to,
      options.previousFrom,
      options.previousTo,
      options.timezone,
    ] as const,
  yearPeak: (businessId: number, year: number) =>
    [...businessActivityQueryKeys.all, "year-peak", businessId, year] as const,
};
