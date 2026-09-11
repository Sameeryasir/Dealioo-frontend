import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type CampaignAddonTopStatus = "clear" | "tied" | "emerging";

export type CampaignAddonCountItem = {
  name: string;
  times: number;
  visitCount: number;
};

export type CampaignAddonCountsGroup = {
  campaignId: number;
  campaignName: string;
  imageUrl: string | null;
  totalAddonPurchases: number;
    totalAddonVisits: number;
  topStatus: CampaignAddonTopStatus;
  topAddonName: string | null;
  addons: CampaignAddonCountItem[];
};

export type CampaignAddonCountsResponse = {
  businessId: number;
  from: string | null;
  to: string | null;
  campaigns: CampaignAddonCountsGroup[];
};

export type CampaignAddonCountsFilters = {
  from?: string;
  to?: string;
  campaignId?: number;
  limit?: number;
};

export async function getCampaignAddonCounts(
  businessId: number,
  filters: CampaignAddonCountsFilters = {},
): Promise<CampaignAddonCountsResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams();
  if (filters.from?.trim()) q.set("from", filters.from.trim());
  if (filters.to?.trim()) q.set("to", filters.to.trim());
  if (filters.campaignId != null && Number.isFinite(filters.campaignId)) {
    q.set("campaignId", String(Math.round(filters.campaignId)));
  }
  if (filters.limit != null && Number.isFinite(filters.limit)) {
    q.set("limit", String(Math.max(1, Math.round(filters.limit))));
  }

  const query = q.toString();
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/addon-suggestion/business/${encodeURIComponent(String(businessId))}/by-campaign${query ? `?${query}` : ""}`,
    {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load add-on counts."),
    );
  }

  const data = (await res.json()) as CampaignAddonCountsResponse;
  const campaigns: CampaignAddonCountsGroup[] = Array.isArray(data.campaigns)
    ? data.campaigns
        .map((row) => {
          const campaignId = Number(row.campaignId);
          if (!Number.isFinite(campaignId) || campaignId <= 0) return null;
          const campaignName =
            String(row.campaignName ?? "Campaign").trim() || "Campaign";
          const addons = Array.isArray(row.addons)
            ? row.addons
                .map((item) => {
                  const name = String(item.name ?? "").trim();
                  if (!name) return null;
                  const times = Math.max(
                    0,
                    Math.round(Number(item.times) || 0),
                  );
                  return {
                    name,
                    times,
                    visitCount: Math.max(
                      0,
                      Math.round(Number(item.visitCount) || 0),
                    ),
                  };
                })
                .filter((item): item is CampaignAddonCountItem => item != null)
            : [];

          const topStatusRaw = String(row.topStatus ?? "").trim();
          const topStatus: CampaignAddonTopStatus =
            topStatusRaw === "clear" ||
            topStatusRaw === "tied" ||
            topStatusRaw === "emerging"
              ? topStatusRaw
              : "emerging";
          const topAddonNameRaw = String(row.topAddonName ?? "").trim();

          return {
            campaignId,
            campaignName,
            imageUrl: row.imageUrl?.trim() ? row.imageUrl.trim() : null,
            totalAddonPurchases: Math.max(
              0,
              Math.round(Number(row.totalAddonPurchases) || 0),
            ),
            totalAddonVisits: Math.max(
              0,
              Math.round(Number(row.totalAddonVisits) || 0),
            ),
            topStatus,
            topAddonName: topAddonNameRaw || null,
            addons,
          };
        })
        .filter((row): row is CampaignAddonCountsGroup => row != null)
    : [];

  return {
    businessId: Number(data.businessId) || businessId,
    from: data.from ?? null,
    to: data.to ?? null,
    campaigns,
  };
}
