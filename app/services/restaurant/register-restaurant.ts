import axios from "axios";
import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";

export type RegisterRestaurantPayload = {
  name: string;
  phoneNumber: string;
  email?: string;
  cuisineType?: string;
  description?: string;
  websiteUrl?: string;
  logoFile?: File | null;
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

  const form = new FormData();
  form.append("name", payload.name.trim());
  form.append("phoneNumber", payload.phoneNumber.trim());
  form.append("branchCount", String(payload.branchCount));

  const email = optionalString(payload.email);
  if (email !== undefined) form.append("email", email);

  const cuisineType = optionalString(payload.cuisineType);
  if (cuisineType !== undefined) form.append("cuisineType", cuisineType);

  const description = optionalString(payload.description);
  if (description !== undefined) form.append("description", description);

  const websiteUrl = optionalUrl(payload.websiteUrl ?? "");
  if (websiteUrl !== undefined) form.append("websiteUrl", websiteUrl);

  const city = optionalString(payload.city);
  if (city !== undefined) form.append("city", city);

  const state = optionalString(payload.state);
  if (state !== undefined) form.append("state", state);

  const postalCode = optionalString(payload.postalCode);
  if (postalCode !== undefined) form.append("postalCode", postalCode);

  const country = optionalString(payload.country);
  if (country !== undefined) form.append("country", country);

  if (payload.logoFile instanceof File) {
    form.append("file", payload.logoFile, payload.logoFile.name);
  }

  try {
    const response = await authAxios.post<RegisterRestaurantResponse>(
      "/restaurant/create",
      form,
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
