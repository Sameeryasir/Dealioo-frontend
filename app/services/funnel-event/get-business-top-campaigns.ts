import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type BusinessTopCampaign = {
  campaignId: number;
  campaignName: string;
  campaignType: "prepaid" | "postpaid" | null;
  imageUrl: string | null;
  price: number | null;
  earningsCents: number;
  orderCount: number;
  paidPaymentCount: number;
  uniqueCustomerCount: number;
  guestCount: number;
  repeatedCustomerCount: number;
  viewCount: number;
  signupCount: number;
  newCustomerCount: number;
  returningCustomerCount: number;
};

export type BusinessConversionCampaign = {
  campaignId: number;
  campaignName: string;
  campaignType: "prepaid" | "postpaid" | null;
  imageUrl: string | null;
  viewCount: number;
  signupCount: number;
  orderCount: number;
};

export type BusinessPerformancePreviousPeriod = {
  totalEarningsCents: number;
  totalOrderCount: number;
  totalUniqueCustomerCount: number;
};

export type BusinessPerformanceDailyTotal = {
  date: string;
  earningsCents: number;
  orderCount: number;
  uniqueCustomerCount: number;
};

export type BusinessPerformanceDailyCampaign = {
  date: string;
  campaignId: number;
  earningsCents: number;
  orderCount: number;
  uniqueCustomerCount: number;
};

export type BusinessTopCampaignsResponse = {
  businessId: number;
  from: string | null;
  to: string | null;
  totalEarningsCents: number;
  totalOrderCount: number;
  totalUniqueCustomerCount: number;
  totalRepeatedCustomerCount: number;
  previousPeriod: BusinessPerformancePreviousPeriod | null;
  dailyTotals: BusinessPerformanceDailyTotal[];
  dailyByCampaign: BusinessPerformanceDailyCampaign[];
  campaigns: BusinessTopCampaign[];
  conversionCampaigns: BusinessConversionCampaign[];
};

export type BusinessTopCampaignsFilters = {
  from?: string;
  to?: string;
  limit?: number;
};

function parseDailyTotal(row: BusinessPerformanceDailyTotal): BusinessPerformanceDailyTotal {
  return {
    date: /^\d{4}-\d{2}-\d{2}T\d{2}/.test(String(row.date ?? ""))
      ? String(row.date).trim().slice(0, 13)
      : String(row.date ?? "").slice(0, 10),
    earningsCents: Math.max(0, Math.round(Number(row.earningsCents) || 0)),
    orderCount: Math.max(0, Math.round(Number(row.orderCount) || 0)),
    uniqueCustomerCount: Math.max(
      0,
      Math.round(Number(row.uniqueCustomerCount) || 0),
    ),
  };
}

function parseConversionCampaign(
  row: BusinessConversionCampaign,
): BusinessConversionCampaign | null {
  const campaignId = Number(row.campaignId);
  if (!Number.isFinite(campaignId) || campaignId <= 0) return null;
  return {
    campaignId,
    campaignName: String(row.campaignName ?? "Campaign").trim() || "Campaign",
    campaignType:
      row.campaignType === "prepaid" || row.campaignType === "postpaid"
        ? row.campaignType
        : null,
    imageUrl: row.imageUrl?.trim() ? row.imageUrl.trim() : null,
    viewCount: Math.max(0, Math.round(Number(row.viewCount) || 0)),
    signupCount: Math.max(0, Math.round(Number(row.signupCount) || 0)),
    orderCount: Math.max(0, Math.round(Number(row.orderCount) || 0)),
  };
}

export async function getBusinessTopEarningCampaigns(
  businessId: number,
  filters: BusinessTopCampaignsFilters = {},
): Promise<BusinessTopCampaignsResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const q = new URLSearchParams();
  if (filters.from?.trim()) q.set("from", filters.from.trim());
  if (filters.to?.trim()) q.set("to", filters.to.trim());
  if (filters.limit != null && Number.isFinite(filters.limit)) {
    q.set("limit", String(Math.max(1, Math.round(filters.limit))));
  }

  const query = q.toString();
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/funnel-event/business/${encodeURIComponent(String(businessId))}/performance/top-campaigns${query ? `?${query}` : ""}`,
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
        "Could not load top earning campaigns.",
      ),
    );
  }

  const data = (await res.json()) as BusinessTopCampaignsResponse;
  const previous = data.previousPeriod;
  const campaigns: BusinessTopCampaign[] = Array.isArray(data.campaigns)
    ? data.campaigns.map((row) => {
        const priceRaw =
          row.price != null && Number.isFinite(Number(row.price))
            ? Number(row.price)
            : null;
        const orderCount = Math.max(
          0,
          Math.round(Number(row.orderCount ?? row.paidPaymentCount) || 0),
        );
        const uniqueCustomerCount = Math.max(
          0,
          Math.round(Number(row.uniqueCustomerCount ?? row.guestCount) || 0),
        );
        const newCustomerCount = Math.max(
          0,
          Math.round(Number(row.newCustomerCount) || 0),
        );
        const returningCustomerCount = Math.max(
          0,
          Math.round(Number(row.returningCustomerCount) || 0),
        );
        return {
          campaignId: Number(row.campaignId),
          campaignName:
            String(row.campaignName ?? "Campaign").trim() || "Campaign",
          campaignType:
            row.campaignType === "prepaid" || row.campaignType === "postpaid"
              ? row.campaignType
              : null,
          imageUrl:
            (typeof row.imageUrl === "string" && row.imageUrl.trim()) ||
            (typeof (row as { image_url?: string }).image_url === "string" &&
              (row as { image_url?: string }).image_url?.trim()) ||
            null,
          price:
            priceRaw != null && priceRaw >= 0
              ? Math.round(priceRaw * 100) / 100
              : null,
          earningsCents: Math.max(
            0,
            Math.round(Number(row.earningsCents) || 0),
          ),
          orderCount,
          paidPaymentCount: orderCount,
          uniqueCustomerCount,
          guestCount: uniqueCustomerCount,
          repeatedCustomerCount: Math.max(
            0,
            Math.round(Number(row.repeatedCustomerCount) || 0),
          ),
          viewCount: Math.max(0, Math.round(Number(row.viewCount) || 0)),
          signupCount: Math.max(0, Math.round(Number(row.signupCount) || 0)),
          newCustomerCount,
          returningCustomerCount,
        };
      })
    : [];

  const conversionCampaigns = Array.isArray(data.conversionCampaigns)
    ? data.conversionCampaigns
        .map(parseConversionCampaign)
        .filter((row): row is BusinessConversionCampaign => row != null)
    : campaigns.slice(0, 3).map((row) => ({
        campaignId: row.campaignId,
        campaignName: row.campaignName,
        campaignType: row.campaignType,
        imageUrl: row.imageUrl,
        viewCount: row.viewCount,
        signupCount: row.signupCount,
        orderCount: row.orderCount,
      }));

  return {
    businessId: Number(data.businessId) || businessId,
    from: data.from ?? null,
    to: data.to ?? null,
    totalEarningsCents: Math.max(
      0,
      Math.round(Number(data.totalEarningsCents) || 0),
    ),
    totalOrderCount: Math.max(
      0,
      Math.round(Number(data.totalOrderCount) || 0),
    ),
    totalUniqueCustomerCount: Math.max(
      0,
      Math.round(Number(data.totalUniqueCustomerCount) || 0),
    ),
    totalRepeatedCustomerCount: Math.max(
      0,
      Math.round(Number(data.totalRepeatedCustomerCount) || 0),
    ),
    previousPeriod:
      previous && typeof previous === "object"
        ? {
            totalEarningsCents: Math.max(
              0,
              Math.round(Number(previous.totalEarningsCents) || 0),
            ),
            totalOrderCount: Math.max(
              0,
              Math.round(Number(previous.totalOrderCount) || 0),
            ),
            totalUniqueCustomerCount: Math.max(
              0,
              Math.round(Number(previous.totalUniqueCustomerCount) || 0),
            ),
          }
        : null,
    dailyTotals: Array.isArray(data.dailyTotals)
      ? data.dailyTotals
          .map(parseDailyTotal)
          .filter((row) => /^\d{4}-\d{2}-\d{2}(T\d{2})?$/.test(row.date))
      : [],
    dailyByCampaign: Array.isArray(data.dailyByCampaign)
      ? data.dailyByCampaign
          .map((row) => ({
            ...parseDailyTotal(row),
            campaignId: Number(row.campaignId),
          }))
          .filter(
            (row) =>
              /^\d{4}-\d{2}-\d{2}(T\d{2})?$/.test(row.date) &&
              Number.isFinite(row.campaignId) &&
              row.campaignId > 0,
          )
      : [],
    campaigns,
    conversionCampaigns,
  };
}
