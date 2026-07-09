import {
  getApiBaseUrl,
  parseApiErrorMessage,
  parseApiMessage,
} from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { compressImageForUpload } from "@/app/lib/compress-image-file";
import {
  parseBusinessFromApi,
  type AdminBusiness,
} from "@/app/services/business/get-my-business";

export type RegisterBusinessPayload = {
  name: string;
  slug?: string;
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

export type RegisterBusinessResponse = {
  message: string;
  businessId?: number;
  id?: number;
  business: AdminBusiness | null;
};

function optionalString(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalUrl(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  try {
    const normalized = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    new URL(normalized);
    return normalized;
  } catch {
    return undefined;
  }
}

function extractBusinessPayload(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  const record = data as Record<string, unknown>;
  if (record.business && typeof record.business === "object") {
    return record.business;
  }
  if (record.data && typeof record.data === "object") {
    return record.data;
  }

  return data;
}

function parseIdFromResponse(data: Record<string, unknown>): number | undefined {
  const direct =
    typeof data.id === "number"
      ? data.id
      : typeof data.businessId === "number"
        ? data.businessId
        : undefined;

  if (direct != null && Number.isFinite(direct) && direct >= 1) {
    return direct;
  }

  return undefined;
}

export async function registerBusiness(
  accessToken: string,
  payload: RegisterBusinessPayload,
): Promise<RegisterBusinessResponse> {
  if (!accessToken.trim()) {
    throw new Error("Missing access token. Sign in again.");
  }
  if (!payload.name.trim()) {
    throw new Error("Business name is required.");
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

  const slug = optionalString(payload.slug);
  if (slug !== undefined) formData.append("slug", slug);

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
      `${getApiBaseUrl()}/business/create`,
      {
        method: "POST",
        body: formData,
      },
      60_000,
    );

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error(
          "Upload is too large for the server. Try a smaller logo, or ask your host to set nginx client_max_body_size 20M.",
        );
      }
      throw new Error(
        await parseApiErrorMessage(response, "Could not add business."),
      );
    }

    const data = (await response.json()) as Record<string, unknown>;
    const businessPayload = extractBusinessPayload(data);
    const business = parseBusinessFromApi(businessPayload);
    const id =
      business?.id ??
      parseIdFromResponse(data) ??
      (businessPayload &&
      typeof businessPayload === "object" &&
      businessPayload !== null
        ? parseIdFromResponse(businessPayload as Record<string, unknown>)
        : undefined);

    const businessWithId =
      business && id != null && business.id == null
        ? { ...business, id }
        : business;

    return {
      businessId: id,
      id,
      business: businessWithId,
      message: parseApiMessage(data.message, "Business added."),
    };
  } catch (error) {
    console.error("Register business error:", error);
    throw error;
  }
}
