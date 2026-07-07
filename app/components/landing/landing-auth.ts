
export function landingAuthHref(
  base: "/auth/signup" | "/auth/login",
  returnTo?: string | null,
): string {
  if (returnTo != null && returnTo.trim() !== "") {
    return `${base}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return base;
}

export function landingSignupHref(returnTo?: string | null): string {
  return landingAuthHref("/auth/signup", returnTo);
}

export function landingLoginHref(returnTo?: string | null): string {
  return landingAuthHref("/auth/login", returnTo);
}
