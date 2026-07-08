import {
  getApiBaseUrl,
  parseApiErrorMessage,
  parseApiMessage,
} from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { compressImageForUpload } from "@/app/lib/compress-image-file";

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

  const formData = new FormData();
  formData.append("name", payload.name.trim());
  formData.append("phoneNumber", payload.phoneNumber.trim());
  formData.append("branchCount", String(payload.branchCount));

  const email = optionalString(payload.email);
  if (email !== undefined) formData.append("email", email);

  const cuisineType = optionalString(payload.cuisineType);
  if (cuisineType !== undefined) formData.append("cuisineType", cuisineType);

  const description = optionalString(payload.description);
  if (description !== undefined) formData.append("description", description);

  const websiteUrl = optionalUrl(payload.websiteUrl ?? "");
  if (websiteUrl !== undefined) formData.append("websiteUrl", websiteUrl);

  const city = optionalString(payload.city);
  if (city !== undefined) formData.append("city", city);

  const state = optionalString(payload.state);
  if (state !== undefined) formData.append("state", state);

  const postalCode = optionalString(payload.postalCode);
  if (postalCode !== undefined) formData.append("postalCode", postalCode);

  const country = optionalString(payload.country);
  if (country !== undefined) formData.append("country", country);

  if (payload.logoFile instanceof File) {
    const logoFile = await compressImageForUpload(payload.logoFile);
    formData.append("file", logoFile, logoFile.name);
  }

  try {
    const response = await authenticatedFetch(
      `${getApiBaseUrl()}/restaurant/create`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error(
          "Upload is too large for the server. Try a smaller logo, or ask your host to set nginx client_max_body_size 20M.",
        );
      }
      throw new Error(
        await parseApiErrorMessage(response, "Could not register restaurant."),
      );
    }

    const data = (await response.json()) as RegisterRestaurantResponse & {
      message?: unknown;
    };

    return {
      ...data,
      restaurantId: data.restaurantId ?? data.id,
      id: data.id ?? data.restaurantId,
      message:
        typeof data.message === "string"
          ? data.message
          : parseApiMessage(data.message, "Restaurant created."),
    };
  } catch (error) {
    console.error("Register restaurant error:", error);
    throw error;
  }
}
