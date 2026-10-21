export type PlatformAdminBusiness = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  email: string | null;
  phoneNumber: string | null;
  onboardingCompleted: boolean;
  stripeConnected: boolean;
  metaConnected: boolean;
  googleAdsConnected: boolean;
  twilioConnected: boolean;
  setupProgressPercent: number;
  setupComplete: boolean;
  createdAt: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerAvatar: string | null;
  planName: string | null;
  planSlug: string | null;
};

export type PlatformAdminUserBusiness = {
  id: number;
  name: string;
  role: string;
  logoUrl: string | null;
};

export type PlatformAdminUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  roleName: string | null;
  isActive: boolean;
  emailVerified: boolean;
  provider: string;
  createdAt: string;
  lastLoginAt: string | null;
  planName: string | null;
  planSlug: string | null;
  businesses: PlatformAdminUserBusiness[];
};
