/**
 * Landing auth links — single source for signup/login URLs site-wide.
 * Preserves returnTo when user was redirected from a protected route.
 */

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
