import { fetchAuthenticatedOnboardingDestination } from "@/app/lib/onboarding-redirect";

export function inviteTokenFromReturnTo(returnTo: string | null): string {
  if (!returnTo?.trim()) return "";

  try {
    const url = new URL(returnTo.trim(), "http://local.invalid");
    const path = url.pathname.replace(/\/$/, "") || "/";
    if (path !== "/accept-invitation") return "";
    return url.searchParams.get("token")?.trim() || "";
  } catch {
    return "";
  }
}

export function inviteSignupHref(inviteToken: string): string {
  return `/auth/signup?inviteToken=${encodeURIComponent(inviteToken.trim())}`;
}

export function inviteLoginHref(inviteToken: string): string {
  return `/auth/login?inviteToken=${encodeURIComponent(inviteToken.trim())}`;
}

export function resolveInviteAuthHrefs(options: {
  inviteToken?: string | null;
  returnTo?: string | null;
}): { inviteToken: string; loginHref: string; signupHref: string } {
  const fromQuery = options.inviteToken?.trim() || "";
  const fromReturnTo = inviteTokenFromReturnTo(options.returnTo ?? null);
  const inviteToken = fromQuery || fromReturnTo;

  if (inviteToken) {
    return {
      inviteToken,
      loginHref: inviteLoginHref(inviteToken),
      signupHref: inviteSignupHref(inviteToken),
    };
  }

  return {
    inviteToken: "",
    loginHref: "/auth/login",
    signupHref: "/auth/signup",
  };
}

export async function resolvePostAuthDestination(
  inviteToken?: string | null,
): Promise<string> {
  const token = inviteToken?.trim();
  if (token) {
    return `/accept-invitation?token=${encodeURIComponent(token)}`;
  }

  return fetchAuthenticatedOnboardingDestination();
}
