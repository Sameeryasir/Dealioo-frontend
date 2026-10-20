import { parseApiMessage } from "@/app/lib/api";
import { authAxios } from "@/app/lib/auth-axios";
import type { PlatformAdminBusiness } from "@/app/services/admin/get-platform-overview";

export type CreateAdminBusinessInput = {
  name: string;
  ownerEmail: string;
  phoneNumber: string;
  businessType: string;
  currency: string;
  slug?: string;
  email?: string;
  description?: string;
  websiteUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
};

function normalizeBusiness(
  data: Partial<PlatformAdminBusiness> | null | undefined,
): PlatformAdminBusiness {
  const setupProgressPercent = Math.max(
    0,
    Math.min(100, Number(data?.setupProgressPercent) || 0),
  );
  return {
    id: Number(data?.id) || 0,
    name: String(data?.name ?? ""),
    slug: String(data?.slug ?? ""),
    logoUrl: data?.logoUrl ?? null,
    city: data?.city ?? null,
    state: data?.state ?? null,
    country: data?.country ?? null,
    postalCode: data?.postalCode ?? null,
    email: data?.email ?? null,
    phoneNumber: data?.phoneNumber ?? null,
    onboardingCompleted: Boolean(data?.onboardingCompleted),
    stripeConnected: Boolean(data?.stripeConnected),
    metaConnected: Boolean(data?.metaConnected),
    googleAdsConnected: Boolean(data?.googleAdsConnected),
    twilioConnected: Boolean(data?.twilioConnected),
    setupProgressPercent,
    setupComplete:
      typeof data?.setupComplete === "boolean"
        ? data.setupComplete
        : setupProgressPercent === 100,
    createdAt: String(data?.createdAt ?? ""),
    ownerName: data?.ownerName ?? null,
    ownerEmail: data?.ownerEmail ?? null,
    ownerAvatar: data?.ownerAvatar ?? null,
    planName: data?.planName ?? null,
    planSlug: data?.planSlug ?? null,
  };
}

export async function createAdminBusiness(
  input: CreateAdminBusinessInput,
): Promise<PlatformAdminBusiness> {
  try {
    const { data } = await authAxios.post<PlatformAdminBusiness>(
      "/admin/businesses",
      input,
    );
    return normalizeBusiness(data);
  } catch (error) {
    throw new Error(parseApiMessage(error, "Could not create business."));
  }
}
