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
  allAssigned?: boolean;
};

export type AssociatedTwilioPhoneNumber = {
  twilioPhoneSid: string;
  twilioPhoneNumber: string;
  twilioConnectedAt: string;
};

export async function getAvailableTwilioPhoneNumbers(): Promise<TwilioPhoneNumbersResponse> {
  if (!hasAuthSession()) {
    throw new Error("Missing access token. Sign in again.");
  }

  const res = await authenticatedFetch(
    `${getApiBaseUrl()}/business/available-twilio-numbers`,
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
  const numbers = Array.isArray(json.numbers) ? json.numbers : [];
  return {
    numbers,
    selectedPhoneSid: json.selectedPhoneSid ?? null,
    selectedPhoneNumber: json.selectedPhoneNumber ?? null,
    allAssigned: Boolean(json.allAssigned),
  };
}

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
