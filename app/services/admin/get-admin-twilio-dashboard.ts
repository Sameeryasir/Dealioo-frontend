/**
 * Super Admin Twilio dashboard client.
 * Only maps known safe fields — ignores SIDs / tokens if a response ever includes them.
 * Related: GET /admin/twilio/dashboard, SuperAdminTwilioPanel
 */

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
  error: string | null;
};

function normalizeDashboard(
  data: Partial<AdminTwilioDashboard> | null | undefined,
): AdminTwilioDashboard {
  // Explicit pick — never pass through unknown keys (sid, accountSid, authToken, etc.).
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
    numbers: Array.isArray(data?.numbers)
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
      : [],
    counts: {
      phoneNumbers: Number(data?.counts?.phoneNumbers) || 0,
      assigned: Number(data?.counts?.assigned) || 0,
      unassigned: Number(data?.counts?.unassigned) || 0,
    },
    error: data?.error?.trim() || null,
  };
}

export async function getAdminTwilioDashboard(): Promise<AdminTwilioDashboard> {
  try {
    const { data } = await authAxios.get<AdminTwilioDashboard>(
      "/admin/twilio/dashboard",
    );
    return normalizeDashboard(data);
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not load Twilio dashboard."),
    );
  }
}
