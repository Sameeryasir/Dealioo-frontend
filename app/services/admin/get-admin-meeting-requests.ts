import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminMeetingRequest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  businessName: string;
  businessRole: string;
  businessCategory: string;
  cityLocation: string;
  monthlyRevenue: string;
  marketingActivities: string[];
  currentSituation: string;
  startTimeline: string;
  meetingCommitment: string;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  scheduledDuration?: number | null;
  scheduledTimeZone?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  website?: string | null;
  description?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  currency?: string | null;
  googleEventLink?: string | null;
  googleMeetLink?: string | null;
  attendance?: string | null;
  salesOutcome?: string | null;
  meetingNotes?: string | null;
  followUpNotes?: string | null;
  outcomeUpdatedAt?: string | null;
  outcomeUpdatedBy?: number | null;
  onboardingId?: number | null;
  onboardingStatus?: string | null;
  businessId?: number | null;
  userId?: number | null;
  createdAt: string;
};

export type AdminMeetingRequestsResponse = {
  total: number;
  items: AdminMeetingRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: {
    upcoming: number;
    past: number;
    dealWon: number;
    all: number;
  };
};

export type AdminMeetingRequestsSummary = {
  total: number;
  upcoming: number;
  past: number;
  attended: number;
  onboardingStarted: number;
  createdThisWeek: number;
};

export async function getAdminMeetingRequests(params: {
  scope?: "upcoming" | "past" | "deal_won" | "all";
  page?: number;
  limit?: number;
  search?: string;
  sort?: "meeting_asc" | "meeting_desc" | "newest" | "oldest";
}): Promise<AdminMeetingRequestsResponse> {
  try {
    const query = new URLSearchParams();
    query.set("scope", params.scope ?? "all");
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 10));
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.sort) query.set("sort", params.sort);
    const { data } = await authAxios.get<AdminMeetingRequestsResponse>(
      `/admin/meeting-requests?${query.toString()}`,
    );
    return {
      total: Number(data?.total) || 0,
      items: Array.isArray(data?.items) ? data.items : [],
      meta: {
        page: Number(data?.meta?.page) || 1,
        limit: Number(data?.meta?.limit) || 10,
        total: Number(data?.meta?.total) || Number(data?.total) || 0,
        totalPages: Number(data?.meta?.totalPages) || 1,
      },
      counts: {
        upcoming: Number(data?.counts?.upcoming) || 0,
        past: Number(data?.counts?.past) || 0,
        dealWon: Number(data?.counts?.dealWon) || 0,
        all: Number(data?.counts?.all) || 0,
      },
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load meeting requests."),
    );
  }
}

export async function getAdminMeetingRequestsSummary(): Promise<AdminMeetingRequestsSummary> {
  try {
    const { data } = await authAxios.get<AdminMeetingRequestsSummary>(
      "/admin/meeting-requests/summary",
    );
    return {
      total: Number(data?.total) || 0,
      upcoming: Number(data?.upcoming) || 0,
      past: Number(data?.past) || 0,
      attended: Number(data?.attended) || 0,
      onboardingStarted: Number(data?.onboardingStarted) || 0,
      createdThisWeek: Number(data?.createdThisWeek) || 0,
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load meeting summary."),
    );
  }
}

export async function exportAdminMeetingRequestsCsv(params: {
  scope?: "upcoming" | "past" | "deal_won" | "all";
  search?: string;
}): Promise<Blob> {
  try {
    const query = new URLSearchParams();
    query.set("scope", params.scope ?? "all");
    if (params.search?.trim()) query.set("search", params.search.trim());
    const { data } = await authAxios.get<Blob>(
      `/admin/meeting-requests/export?${query.toString()}`,
      { responseType: "blob" },
    );
    return data;
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not export meeting requests."),
    );
  }
}
