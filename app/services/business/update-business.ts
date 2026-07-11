import axios from "axios";
import {
  getApiBaseUrl,
  parseApiErrorMessage,
  parseApiMessage,
} from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { authAxios } from "@/app/lib/auth-axios";
import { compressImageForUpload } from "@/app/lib/compress-image-file";
import {
  parseBusinessFromApi,
  type AdminBusiness,
} from "@/app/services/business/get-my-business";

export type UpdateBusinessPayload = {
  name?: string;
  description?: string;
  cuisineType?: string;
  phoneNumber?: string;
  email?: string;
  websiteUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  branchCount?: number;
  logoFile?: File | null;
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

export async function updateBusiness(
  businessId: number,
  payload: UpdateBusinessPayload,
): Promise<AdminBusiness> {
  if (!Number.isFinite(businessId) || businessId < 1) {
    throw new Error("Invalid business.");
  }

  const hasLogoFile = payload.logoFile instanceof File;

  try {
    if (hasLogoFile) {
      const formData = new FormData();

      if (payload.name !== undefined) formData.append("name", payload.name.trim());
      if (payload.description !== undefined) {
        formData.append("description", payload.description.trim());
      }
      if (payload.cuisineType !== undefined) {
        formData.append("cuisineType", payload.cuisineType.trim());
      }
      if (payload.phoneNumber !== undefined) {
        formData.append("phoneNumber", payload.phoneNumber.trim());
      }
      if (payload.email !== undefined) {
        const email = optionalString(payload.email);
        if (email !== undefined) formData.append("email", email);
      }
      const websiteUrl = optionalUrl(payload.websiteUrl);
      if (websiteUrl !== undefined) formData.append("websiteUrl", websiteUrl);
      if (payload.city !== undefined) {
        const city = optionalString(payload.city);
        if (city !== undefined) formData.append("city", city);
      }
      if (payload.state !== undefined) {
        const state = optionalString(payload.state);
        if (state !== undefined) formData.append("state", state);
      }
      if (payload.country !== undefined) {
        const country = optionalString(payload.country);
        if (country !== undefined) formData.append("country", country);
      }
      if (payload.postalCode !== undefined) {
        const postalCode = optionalString(payload.postalCode);
        if (postalCode !== undefined) formData.append("postalCode", postalCode);
      }
      if (payload.branchCount !== undefined) {
        formData.append("branchCount", String(payload.branchCount));
      }

      const logoFile = await compressImageForUpload(payload.logoFile as File);
      formData.append("file", logoFile, logoFile.name);

      const response = await authenticatedFetch(
        `${getApiBaseUrl()}/business/${businessId}`,
        {
          method: "PUT",
          body: formData,
        },
        60_000,
      );

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error(
            "Upload is too large for the server. Try a smaller logo.",
          );
        }
        throw new Error(
          await parseApiErrorMessage(
            response,
            "Could not update business profile.",
          ),
        );
      }

      const data = await response.json();
      return (
        parseBusinessFromApi(data) ?? {
          id: businessId,
          name: payload.name?.trim() ?? "",
        }
      );
    }

    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) body.name = payload.name.trim();
    if (payload.description !== undefined) {
      body.description = payload.description.trim();
    }
    if (payload.cuisineType !== undefined) {
      body.cuisineType = payload.cuisineType.trim();
    }
    if (payload.phoneNumber !== undefined) {
      body.phoneNumber = payload.phoneNumber.trim();
    }
    if (payload.email !== undefined) {
      const email = optionalString(payload.email);
      if (email !== undefined) body.email = email;
    }
    const websiteUrl = optionalUrl(payload.websiteUrl);
    if (websiteUrl !== undefined) body.websiteUrl = websiteUrl;
    if (payload.city !== undefined) {
      const city = optionalString(payload.city);
      if (city !== undefined) body.city = city;
    }
    if (payload.state !== undefined) {
      const state = optionalString(payload.state);
      if (state !== undefined) body.state = state;
    }
    if (payload.country !== undefined) {
      const country = optionalString(payload.country);
      if (country !== undefined) body.country = country;
    }
    if (payload.postalCode !== undefined) {
      const postalCode = optionalString(payload.postalCode);
      if (postalCode !== undefined) body.postalCode = postalCode;
    }
    if (payload.branchCount !== undefined) body.branchCount = payload.branchCount;

    const { data } = await authAxios.put(`/business/${businessId}`, body);
    return (
      parseBusinessFromApi(data) ?? {
        id: businessId,
        name: payload.name?.trim() ?? "",
      }
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.message != null) {
      throw new Error(
        parseApiMessage(
          error.response.data.message,
          "Could not update business profile.",
        ),
      );
    }
    throw error instanceof Error
      ? error
      : new Error("Could not update business profile.");
  }
}
