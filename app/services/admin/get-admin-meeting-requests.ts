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
  createdAt: string;
};

export type AdminMeetingRequestsResponse = {
  total: number;
  items: AdminMeetingRequest[];
};

export async function getAdminMeetingRequests(): Promise<AdminMeetingRequestsResponse> {
  try {
    const { data } = await authAxios.get<AdminMeetingRequestsResponse>(
      "/admin/meeting-requests",
    );
    return {
      total: Number(data?.total) || 0,
      items: Array.isArray(data?.items) ? data.items : [],
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load meeting requests."),
    );
  }
}
