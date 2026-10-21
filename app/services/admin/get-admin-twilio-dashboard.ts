import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminTwilioNumberOverview = {
  phoneNumber: string;
  label: string | null;
  status: string | null;
  addressRequirement: string | null;
  dateCreated: string | null;
  webhookUrl: string | null;
  webhookConfigured: boolean;
  capabilities: {
    sms: boolean;
    mms: boolean;
    voice: boolean;
    fax: boolean;
  };
  businessName: string | null;
  connectedAt: string | null;
};

export type AdminTwilioDashboardMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminTwilioDashboard = {
  configured: boolean;
  accountOwnerName: string | null;
  defaultWebhookUrl: string | null;
  balance: {
    amount: number | null;
    currency: string | null;
  } | null;
  numbers: AdminTwilioNumberOverview[];
  counts: {
    phoneNumbers: number;
    assigned: number;
    unassigned: number;
  };
  meta: AdminTwilioDashboardMeta;
  error: string | null;
};

export type GetAdminTwilioDashboardParams = {
  page?: number;
  limit?: number;
  sync?: boolean;
};

function normalizeDashboard(
  data: Partial<AdminTwilioDashboard> | null | undefined,
  fallback: { page: number; limit: number },
): AdminTwilioDashboard {
  const numbers = Array.isArray(data?.numbers)
    ? data.numbers.map((item) => ({
        phoneNumber: String(item?.phoneNumber ?? ""),
        label: item?.label?.trim() || null,
        status: item?.status?.trim() || null,
        addressRequirement: item?.addressRequirement?.trim() || null,
        dateCreated: item?.dateCreated ? String(item.dateCreated) : null,
        webhookUrl: item?.webhookUrl?.trim() || null,
        webhookConfigured: Boolean(item?.webhookConfigured),
        capabilities: {
          sms: Boolean(item?.capabilities?.sms),
          mms: Boolean(item?.capabilities?.mms),
          voice: Boolean(item?.capabilities?.voice),
          fax: Boolean(item?.capabilities?.fax),
        },
        businessName: item?.businessName?.trim() || null,
        connectedAt: item?.connectedAt ? String(item.connectedAt) : null,
      }))
    : [];

  const page = Number(data?.meta?.page) || fallback.page;
  const limit = Number(data?.meta?.limit) || fallback.limit;
  const total =
    Number(data?.meta?.total) ||
    Number(data?.counts?.phoneNumbers) ||
    numbers.length;
  const totalPages =
    Number(data?.meta?.totalPages) ||
    (total === 0 ? 0 : Math.ceil(total / limit));

  return {
    configured: Boolean(data?.configured),
    accountOwnerName: data?.accountOwnerName?.trim() || null,
    defaultWebhookUrl: data?.defaultWebhookUrl?.trim() || null,
    balance: data?.balance
      ? {
          amount:
            data.balance.amount == null ? null : Number(data.balance.amount),
          currency: data.balance.currency?.trim() || null,
        }
      : null,
    numbers,
    counts: {
      phoneNumbers: Number(data?.counts?.phoneNumbers) || total,
      assigned: Number(data?.counts?.assigned) || 0,
      unassigned: Number(data?.counts?.unassigned) || 0,
    },
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    error: data?.error?.trim() || null,
  };
}

export async function getAdminTwilioDashboard(
  params: GetAdminTwilioDashboardParams = {},
): Promise<AdminTwilioDashboard> {
  const page = params.page && params.page > 0 ? params.page : 1;
  const limit = params.limit && params.limit > 0 ? params.limit : 10;

  try {
    const { data } = await authAxios.get<AdminTwilioDashboard>(
      "/admin/twilio/dashboard",
      {
        params: {
          page,
          limit,
          ...(params.sync ? { sync: "1" } : {}),
        },
      },
    );
    return normalizeDashboard(data, { page, limit });
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load Twilio dashboard."),
    );
  }
}
