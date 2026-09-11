import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type CampaignAddonTopStatus = "clear" | "tied" | "emerging";

export type CampaignAddonSuggestionItem = {
  rank: number;
  addonName: string;
  timesPurchased: number;
  visitCount: number;
  sharePercent: number;
  visitSharePercent: number;
  lift: number;
  score: number;
  priority: "high" | "medium" | "low";
  isTiedForTop: boolean;
  isClearTop: boolean;
  message: string;
};

export type CampaignAddonSuggestionsGroup = {
  campaignId: number;
  campaignName: string;
  imageUrl: string | null;
  totalAddonPurchases: number;
  totalAddonVisits: number;
  topStatus: CampaignAddonTopStatus;
  topAddonName: string | null;
  totalSuggestions: number;
  suggestions: CampaignAddonSuggestionItem[];
};

export type AddonSuggestionPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CampaignAddonSuggestionsResponse = {
  businessId: number;
  from: string | null;
  to: string | null;
  campaigns: CampaignAddonSuggestionsGroup[];
  pagination: AddonSuggestionPagination;
};

export type CampaignAddonSuggestionsFilters = {
  from?: string;
  to?: string;
  campaignId?: number;
  limit?: number;
  page?: number;
  pageSize?: number;
};

function parsePriority(value: unknown): "high" | "medium" | "low" {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "low";
}

function parseTopStatus(value: unknown): CampaignAddonTopStatus {
  if (value === "clear" || value === "tied" || value === "emerging") {
    return value;
  }
  return "emerging";
}

export async function getCampaignAddonSuggestions(
  businessId: number,
  filters: CampaignAddonSuggestionsFilters = {},
): Promise<CampaignAddonSuggestionsResponse> {
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
  if (filters.page != null && Number.isFinite(filters.page)) {
    q.set("page", String(Math.max(1, Math.round(filters.page))));
  }
  if (filters.pageSize != null && Number.isFinite(filters.pageSize)) {
    q.set("pageSize", String(Math.max(1, Math.round(filters.pageSize))));
  }

  const query = q.toString();
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/addon-suggestion/business/${encodeURIComponent(String(businessId))}/suggestions${query ? `?${query}` : ""}`,
    {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not load add-on suggestions.",
      ),
    );
  }

  const data = (await res.json()) as CampaignAddonSuggestionsResponse;
  const campaigns: CampaignAddonSuggestionsGroup[] = Array.isArray(
    data.campaigns,
  )
    ? data.campaigns
        .map((row) => {
          const campaignId = Number(row.campaignId);
          if (!Number.isFinite(campaignId) || campaignId <= 0) return null;
          const campaignName =
            String(row.campaignName ?? "Campaign").trim() || "Campaign";
          const suggestions = Array.isArray(row.suggestions)
            ? row.suggestions
                .map((item) => {
                  const addonName = String(item.addonName ?? "").trim();
                  if (!addonName) return null;
                  const timesPurchased = Math.max(
                    0,
                    Math.round(Number(item.timesPurchased) || 0),
                  );
                  return {
                    rank: Math.max(1, Math.round(Number(item.rank) || 1)),
                    addonName,
                    timesPurchased,
                    visitCount: Math.max(
                      0,
                      Math.round(Number(item.visitCount) || 0),
                    ),
                    sharePercent: Math.max(
                      0,
                      Math.round((Number(item.sharePercent) || 0) * 10) / 10,
                    ),
                    visitSharePercent: Math.max(
                      0,
                      Math.round((Number(item.visitSharePercent) || 0) * 10) /
                        10,
                    ),
                    lift: Math.max(
                      0,
                      Math.round((Number(item.lift) || 1) * 100) / 100,
                    ),
                    score: Math.max(
                      0,
                      Math.round((Number(item.score) || 0) * 1000) / 1000,
                    ),
                    priority: parsePriority(item.priority),
                    isTiedForTop: Boolean(item.isTiedForTop),
                    isClearTop: Boolean(item.isClearTop),
                    message: String(item.message ?? "").trim(),
                  };
                })
                .filter(
                  (item): item is CampaignAddonSuggestionItem => item != null,
                )
            : [];

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
            topStatus: parseTopStatus(row.topStatus),
            topAddonName: topAddonNameRaw || null,
            totalSuggestions: Math.max(
              0,
              Math.round(
                Number(row.totalSuggestions) || suggestions.length || 0,
              ),
            ),
            suggestions,
          };
        })
        .filter(
          (row): row is CampaignAddonSuggestionsGroup => row != null,
        )
    : [];

  const paginationRaw = data.pagination;
  const pageSize = Math.max(
    1,
    Math.round(Number(paginationRaw?.pageSize) || filters.pageSize || 10),
  );
  const totalItems = Math.max(
    0,
    Math.round(Number(paginationRaw?.totalItems) || 0),
  );
  const totalPages = Math.max(
    0,
    Math.round(
      Number(paginationRaw?.totalPages) ||
        (totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0),
    ),
  );
  const page = Math.max(
    1,
    Math.min(
      Math.round(Number(paginationRaw?.page) || filters.page || 1),
      Math.max(1, totalPages || 1),
    ),
  );

  return {
    businessId: Number(data.businessId) || businessId,
    from: data.from ?? null,
    to: data.to ?? null,
    campaigns,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}
