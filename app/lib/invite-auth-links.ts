export function buildAuthHref(base: string, returnTo: string | null): string {
  if (returnTo != null && returnTo.trim() !== "") {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

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
  const returnTo = `/accept-invitation?token=${inviteToken.trim()}`;
  return `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
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
    loginHref: buildAuthHref("/auth/login", options.returnTo ?? null),
    signupHref: buildAuthHref("/auth/signup", options.returnTo ?? null),
  };
}
