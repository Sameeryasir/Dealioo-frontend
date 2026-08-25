export function landingAuthHref(
  base: "/auth/signup" | "/auth/login",
): string {
  return base;
}

export function landingSignupHref(): string {
  return landingAuthHref("/auth/signup");
}

export function landingLoginHref(): string {
  return landingAuthHref("/auth/login");
}
