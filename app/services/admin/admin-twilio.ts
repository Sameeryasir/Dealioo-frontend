/**
 * Super Admin Twilio actions: webhook, buy, assign, unassign.
 * Related: SuperAdminTwilioPanel, platform-admin Twilio routes
 */

import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type AdminTwilioAvailableNumber = {
  phoneNumber: string;
  friendlyName: string | null;
  locality: string | null;
  region: string | null;
  isoCountry: string | null;
  numberType: "Local" | "Mobile";
  addressRequirement: string;
  monthlyFee: string | null;
  capabilities: {
    sms: boolean;
    mms: boolean;
    voice: boolean;
    fax: boolean;
  };
};

export async function searchAdminTwilioAvailableNumbers(params: {
  country?: string;
  areaCode?: string;
  sms?: boolean;
  limit?: number;
}): Promise<AdminTwilioAvailableNumber[]> {
  try {
    const { data } = await authAxios.get<{
      numbers?: AdminTwilioAvailableNumber[];
    }>("/admin/twilio/available-numbers", { params });
    return Array.isArray(data?.numbers) ? data.numbers : [];
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not search Twilio numbers."),
    );
  }
}

export async function purchaseAdminTwilioNumber(input: {
  phoneNumber: string;
}): Promise<{ phoneNumber: string; friendlyName: string | null }> {
  try {
    const { data } = await authAxios.post<{
      phoneNumber: string;
      friendlyName: string | null;
    }>("/admin/twilio/phone-numbers/purchase", {
      phoneNumber: input.phoneNumber,
    });
    return {
      phoneNumber: String(data?.phoneNumber ?? ""),
      friendlyName: data?.friendlyName?.trim() || null,
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not buy that Twilio number."),
    );
  }
}

export async function assignAdminTwilioNumber(input: {
  phoneNumber: string;
  businessId: number;
  phoneSid?: string;
}): Promise<{
  businessId: number;
  businessName: string;
  twilioPhoneNumber: string;
  twilioConnectedAt: string | Date;
}> {
  try {
    const { data } = await authAxios.post<{
      businessId: number;
      businessName: string;
      twilioPhoneNumber: string;
      twilioConnectedAt: string | Date;
    }>("/admin/twilio/phone-numbers/assign", {
      phoneNumber: input.phoneNumber,
      businessId: input.businessId,
      ...(input.phoneSid?.trim() ? { phoneSid: input.phoneSid.trim() } : {}),
    });
    return {
      businessId: Number(data?.businessId) || input.businessId,
      businessName: String(data?.businessName ?? ""),
      twilioPhoneNumber: String(
        data?.twilioPhoneNumber ?? input.phoneNumber,
      ),
      twilioConnectedAt: data?.twilioConnectedAt ?? new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not assign that Twilio number."),
    );
  }
}

export async function unassignAdminTwilioNumber(input: {
  phoneNumber: string;
  phoneSid?: string;
}): Promise<{
  phoneNumber: string;
  unassigned: boolean;
  previousBusinessId: number | null;
}> {
  try {
    const { data } = await authAxios.post<{
      phoneNumber: string;
      unassigned: boolean;
      previousBusinessId?: number | null;
    }>("/admin/twilio/phone-numbers/unassign", {
      phoneNumber: input.phoneNumber,
      ...(input.phoneSid?.trim() ? { phoneSid: input.phoneSid.trim() } : {}),
    });
    return {
      phoneNumber: String(data?.phoneNumber ?? input.phoneNumber),
      unassigned: Boolean(data?.unassigned),
      previousBusinessId:
        data?.previousBusinessId == null
          ? null
          : Number(data.previousBusinessId),
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not remove that number from the business."),
    );
  }
}

export async function setAdminTwilioWebhook(input: {
  phoneNumber: string;
  smsUrl?: string;
}): Promise<{ phoneNumber: string; webhookUrl: string | null; ok: boolean }> {
  try {
    const { data } = await authAxios.post<{
      phoneNumber: string;
      webhookUrl?: string | null;
      ok: boolean;
    }>("/admin/twilio/webhook", {
      phoneNumber: input.phoneNumber,
      ...(input.smsUrl?.trim() ? { smsUrl: input.smsUrl.trim() } : {}),
    });
    return {
      phoneNumber: String(data?.phoneNumber ?? input.phoneNumber),
      webhookUrl: data?.webhookUrl?.trim() || null,
      ok: Boolean(data?.ok),
    };
  } catch (error) {
    throw new Error(
      parseApiMessage(error, "Could not set inbound webhook."),
    );
  }
}
