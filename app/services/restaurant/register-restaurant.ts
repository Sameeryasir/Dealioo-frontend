import axios from "axios";
import { getApiBaseUrl, parseApiMessage } from "@/app/lib/api";

export type RegisterRestaurantPayload = {
  name: string;
  phoneNumber: string;
  email?: string;
  cuisineType?: string;
  description?: string;
  websiteUrl?: string;
  logoUrl?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  branchCount: number;
};

export type RegisterRestaurantResponse = {
  message: string;
  restaurantId?: number;
  id?: number;
};

function optionalString(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function optionalUrl(value: string): string | undefined {
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

export async function registerRestaurant(
  accessToken: string,
  payload: RegisterRestaurantPayload,
): Promise<RegisterRestaurantResponse> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!payload.name.trim()) {
    throw new Error("Restaurant name is required.");
  }
  if (!payload.phoneNumber.trim()) {
    throw new Error("Phone number is required.");
  }
  if (!Number.isFinite(payload.branchCount) || payload.branchCount < 1) {
    throw new Error("Branch count must be at least 1.");
  }

  const body: Record<string, string | number> = {
    name: payload.name.trim(),
    phoneNumber: payload.phoneNumber.trim(),
    branchCount: payload.branchCount,
  };

  const email = optionalString(payload.email);
  if (email !== undefined) body.email = email;

  const cuisineType = optionalString(payload.cuisineType);
  if (cuisineType !== undefined) body.cuisineType = cuisineType;

  const description = optionalString(payload.description);
  if (description !== undefined) body.description = description;

  const websiteUrl = optionalUrl(payload.websiteUrl ?? "");
  if (websiteUrl !== undefined) body.websiteUrl = websiteUrl;

  const logoUrl = optionalString(payload.logoUrl);
  if (logoUrl !== undefined) body.logoUrl = logoUrl;

  const city = optionalString(payload.city);
  if (city !== undefined) body.city = city;

  const state = optionalString(payload.state);
  if (state !== undefined) body.state = state;

  const postalCode = optionalString(payload.postalCode);
  if (postalCode !== undefined) body.postalCode = postalCode;

  const country = optionalString(payload.country);
  if (country !== undefined) body.country = country;

  try {
    const response = await axios.post<RegisterRestaurantResponse>(
      `${getApiBaseUrl()}/restaurant/create`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Register restaurant error:", error);
    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(
          error.response.data.message,
          "Could not register restaurant.",
        ),
      );
    }
    throw error;
  }
}
