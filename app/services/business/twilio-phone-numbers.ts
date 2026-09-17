import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { hasAuthSession } from "@/app/lib/auth-session";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { isPositiveInt } from "@/app/lib/numbers";

export type TwilioPhoneNumberOption = {
  sid: string;
  phoneNumber: string;
  friendlyName: string | null;
};

export type TwilioPhoneNumbersResponse = {
  numbers: TwilioPhoneNumberOption[];
  selectedPhoneSid: string | null;
  selectedPhoneNumber: string | null;
  credentialsConnected?: boolean;
  accountSidMasked?: string | null;
};

export type AssociatedTwilioPhoneNumber = {
  twilioPhoneSid: string;
  twilioPhoneNumber: string;
  twilioConnectedAt: string;
};

export type ConnectedTwilioCredentials = {
  credentialsConnected: boolean;
  accountSidMasked: string | null;
  selectedPhoneSid: string | null;
  selectedPhoneNumber: string | null;
};

export type TwilioAvailableToBuyNumber = {
  phoneNumber: string;
  friendlyName: string | null;
  locality: string | null;
  region: string | null;
  isoCountry: string | null;
  capabilities: {
    sms: boolean;
    mms: boolean;
    voice: boolean;
  };
};

export type TwilioAvailableToBuyResponse = {
  numbers: TwilioAvailableToBuyNumber[];
};

export async function getBusinessTwilioPhoneNumbers(
  businessId: number,
): Promise<TwilioPhoneNumbersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business/${encodeURIComponent(String(businessId))}/twilio/phone-numbers`,
    {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
    15_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not load Twilio phone numbers."),
    );
  }

  const json = (await res.json()) as TwilioPhoneNumbersResponse;
  return {
    numbers: Array.isArray(json.numbers) ? json.numbers : [],
    selectedPhoneSid: json.selectedPhoneSid ?? null,
    selectedPhoneNumber: json.selectedPhoneNumber ?? null,
    credentialsConnected: Boolean(json.credentialsConnected),
    accountSidMasked: json.accountSidMasked ?? null,
  };
}

export async function connectBusinessTwilioCredentials(
  businessId: number,
  body: { accountSid: string; authToken: string },
): Promise<ConnectedTwilioCredentials> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business/${encodeURIComponent(String(businessId))}/twilio/connect`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accountSid: body.accountSid.trim(),
        authToken: body.authToken.trim(),
      }),
    },
    20_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not connect Twilio credentials."),
    );
  }

  return (await res.json()) as ConnectedTwilioCredentials;
}

export async function disconnectBusinessTwilioCredentials(
  businessId: number,
): Promise<{ disconnected: true; inboundWebhookCleared?: boolean }> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business/${encodeURIComponent(String(businessId))}/twilio/disconnect`,
    {
      method: "DELETE",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
    15_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not disconnect Twilio."),
    );
  }

  return (await res.json()) as {
    disconnected: true;
    inboundWebhookCleared?: boolean;
  };
}

export async function associateBusinessTwilioPhoneNumber(
  businessId: number,
  body: { phoneSid: string; phoneNumber: string },
): Promise<AssociatedTwilioPhoneNumber> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business/${encodeURIComponent(String(businessId))}/twilio/phone-number`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneSid: body.phoneSid,
        phoneNumber: body.phoneNumber,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not associate Twilio phone number.",
      ),
    );
  }

  return (await res.json()) as AssociatedTwilioPhoneNumber;
}

export async function searchTwilioAvailableToBuyNumbers(
  businessId: number,
  params: {
    countryCode?: string;
    country?: string;
    areaCode?: string;
    areaName?: string;
    contains?: string;
    limit?: number;
  } = {},
): Promise<TwilioAvailableToBuyResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const query = new URLSearchParams();
  const country = params.country?.trim() || params.countryCode?.trim();
  if (country) {
    query.set("country", country);
  }
  if (params.areaCode?.trim()) {
    query.set("areaCode", params.areaCode.trim());
  }
  if (params.areaName?.trim()) {
    query.set("areaName", params.areaName.trim());
  }
  if (params.contains?.trim()) {
    query.set("contains", params.contains.trim());
  }
  if (typeof params.limit === "number" && Number.isFinite(params.limit)) {
    query.set("limit", String(params.limit));
  }

  const qs = query.toString();
  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business/${encodeURIComponent(String(businessId))}/twilio/available-to-buy${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    },
    20_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(
        res,
        "Could not search available Twilio numbers.",
      ),
    );
  }

  const json = (await res.json()) as TwilioAvailableToBuyResponse;
  return {
    numbers: Array.isArray(json.numbers) ? json.numbers : [],
  };
}

export async function purchaseBusinessTwilioPhoneNumber(
  businessId: number,
  body: { phoneNumber: string },
): Promise<AssociatedTwilioPhoneNumber> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!isPositiveInt(businessId)) {
    throw new Error("Valid business id is required.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business/${encodeURIComponent(String(businessId))}/twilio/purchase-number`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: body.phoneNumber.trim(),
      }),
    },
    30_000,
  );

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not buy that Twilio number."),
    );
  }

  return (await res.json()) as AssociatedTwilioPhoneNumber;
}
