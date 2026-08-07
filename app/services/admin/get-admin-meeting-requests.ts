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
