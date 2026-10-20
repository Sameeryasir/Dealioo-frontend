import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import type { AdminMeetingRequest } from "@/app/services/admin/get-admin-meeting-requests";
import axios from "axios";

export type CustomerOnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "INVITATION_SENT"
  | "ACTIVATED"
  | "ON_HOLD"
  | "CANCELLED";

export type OnboardingTaskStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "BLOCKED"
  | "NOT_APPLICABLE";

export type CustomerOnboardingListItem = {
  id: number;
  meetingId: number;
  status: CustomerOnboardingStatus;
  customerName: string;
  customerEmail: string;
  businessName: string;
  businessCategory: string | null;
  selectedPlanId: number | null;
  assignedAdminId: number | null;
  assignedAdminName: string | null;
  meetingDate: string | null;
  meetingTime: string | null;
  progressCompleted: number;
  progressTotal: number;
  progressPercent: number;
  userId: number | null;
  businessId: number | null;
  updatedAt: string;
  createdAt: string;
};

export type CustomerOnboardingTask = {
  id: number;
  taskKey: string;
  label: string;
  status: OnboardingTaskStatus;
  notes: string | null;
  completedAt: string | null;
  completedBy: number | null;
  updatedAt: string;
};

export type CustomerOnboardingDetail = CustomerOnboardingListItem & {
  customerPhone: string | null;
  internalNotes: string | null;
  draftPayload: Record<string, unknown> | null;
  startedAt: string | null;
  approvedAt: string | null;
  approvedBy: number | null;
  completedAt: string | null;
  meeting: AdminMeetingRequest | null;
  user: { id: number; name: string; email: string } | null;
  business: { id: number; name: string; slug: string } | null;
  tasks: CustomerOnboardingTask[];
  createdNewUser?: boolean;
  passwordSetupEmailSent?: boolean;
  setPasswordUrl?: string | null;
};

export type CreateAccountFromMeetingInput = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  businessName?: string;
  businessType?: string;
  phoneNumber?: string;
  businessEmail?: string;
  websiteUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  currency?: string;
  existingUserAction?:
    | "link_and_create_business"
    | "link_existing_business";
  linkBusinessId?: number;
};

export class ExistingUserConflictError extends Error {
  readonly code = "EXISTING_USER" as const;

  constructor(
    message: string,
    public readonly existingUser: {
      id: number;
      name: string;
      email: string;
    },
    public readonly businesses: Array<{
      id: number;
      name: string;
      slug: string;
    }>,
  ) {
    super(message);
    this.name = "ExistingUserConflictError";
  }
}

function readExistingUserConflict(
  data: unknown,
): ExistingUserConflictError | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const nested =
    root.message && typeof root.message === "object"
      ? (root.message as Record<string, unknown>)
      : null;
  const payload =
    root.error === "EXISTING_USER"
      ? root
      : nested?.error === "EXISTING_USER"
        ? nested
        : null;
  if (!payload) return null;

  const existingUser = payload.existingUser as
    | { id?: number; name?: string; email?: string }
    | undefined;
  if (!existingUser?.id || !existingUser.email) return null;

  const businesses = Array.isArray(payload.businesses)
    ? (payload.businesses as Array<{ id?: number; name?: string; slug?: string }>)
        .filter((row) => typeof row?.id === "number")
        .map((row) => ({
          id: row.id as number,
          name: String(row.name ?? "Business"),
          slug: String(row.slug ?? ""),
        }))
    : [];

  const message = parseApiMessage(
    payload.message,
    "A user with this email already exists.",
  );

  return new ExistingUserConflictError(
    message,
    {
      id: existingUser.id,
      name: String(existingUser.name ?? existingUser.email),
      email: String(existingUser.email),
    },
    businesses,
  );
}

export type CustomerOnboardingsPage = {
  items: CustomerOnboardingListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: Record<string, number>;
};

export async function startAdminCustomerOnboarding(
  meetingId: number,
  input: CreateAccountFromMeetingInput = {},
): Promise<CustomerOnboardingDetail> {
  try {
    const { data } = await authAxios.post<CustomerOnboardingDetail>(
      `/admin/meeting-requests/${meetingId}/onboarding`,
      input,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const conflict = readExistingUserConflict(error.response?.data);
      if (conflict) throw conflict;
      throw new Error(
        parseApiMessage(
          error.response?.data?.message ?? error.message,
          "Could not create customer account.",
        ),
      );
    }
    throw new Error(
      parseApiMessage(error, "Could not create customer account."),
    );
  }
}

export async function getAdminCustomerOnboardings(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: "newest" | "oldest" | "updated";
}): Promise<CustomerOnboardingsPage> {
  try {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("limit", String(params.limit ?? 10));
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.status?.trim()) query.set("status", params.status.trim());
    if (params.sort) query.set("sort", params.sort);
    const { data } = await authAxios.get<CustomerOnboardingsPage>(
      `/admin/customer-onboardings?${query.toString()}`,
    );
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      meta: {
        page: Number(data?.meta?.page) || 1,
        limit: Number(data?.meta?.limit) || 10,
        total: Number(data?.meta?.total) || 0,
        totalPages: Number(data?.meta?.totalPages) || 1,
      },
      counts: data?.counts ?? { all: 0 },
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load customer onboardings."),
    );
  }
}

export async function getAdminCustomerOnboarding(
  onboardingId: number,
): Promise<CustomerOnboardingDetail> {
  try {
    const { data } = await authAxios.get<CustomerOnboardingDetail>(
      `/admin/customer-onboardings/${onboardingId}`,
    );
    return data;
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load customer onboarding."),
    );
  }
}

export async function updateAdminCustomerOnboarding(
  onboardingId: number,
  input: {
    status?: CustomerOnboardingStatus;
    internalNotes?: string | null;
    draftPayload?: Record<string, unknown> | null;
  },
): Promise<CustomerOnboardingDetail> {
  try {
    const { data } = await authAxios.patch<CustomerOnboardingDetail>(
      `/admin/customer-onboardings/${onboardingId}`,
      input,
    );
    return data;
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not update customer onboarding."),
    );
  }
}

export async function updateAdminOnboardingTask(
  onboardingId: number,
  taskId: number,
  input: { status: OnboardingTaskStatus; notes?: string | null },
): Promise<CustomerOnboardingDetail> {
  try {
    const { data } = await authAxios.patch<CustomerOnboardingDetail>(
      `/admin/customer-onboardings/${onboardingId}/tasks/${taskId}`,
      input,
    );
    return data;
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not update onboarding task."));
  }
}

export async function prepareAdminCustomerAccount(
  onboardingId: number,
): Promise<CustomerOnboardingDetail> {
  try {
    const { data } = await authAxios.post<CustomerOnboardingDetail>(
      `/admin/customer-onboardings/${onboardingId}/prepare-account`,
    );
    return data;
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not prepare customer account."),
    );
  }
}

export async function createAdminOnboardingBusiness(
  onboardingId: number,
  input: Record<string, unknown> = {},
): Promise<CustomerOnboardingDetail> {
  try {
    const { data } = await authAxios.post<CustomerOnboardingDetail>(
      `/admin/customer-onboardings/${onboardingId}/create-business`,
      input,
    );
    return data;
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not create or link business."),
    );
  }
}
