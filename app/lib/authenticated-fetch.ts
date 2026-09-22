import { fetchWithTimeout } from "@/app/lib/api";
import { clearAuthSession, hasAuthSession } from "@/app/lib/auth-session";
import { refreshAccessToken } from "@/app/lib/refresh-access-token";

export class AuthSessionError extends Error {
  constructor(message = "Session expired. Please sign in again.") {
    super(message);
    this.name = "AuthSessionError";
  }
}

export type AuthenticatedFetchOptions = {
  redirectOnAuthFailure?: boolean;
};

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearAuthSession();
  window.location.href = "/auth/login";
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs?: number,
  authOptions?: AuthenticatedFetchOptions,
): Promise<Response> {
  const redirectOnAuthFailure = authOptions?.redirectOnAuthFailure !== false;

  const failAuth = (message: string): never => {
    if (redirectOnAuthFailure) {
      redirectToLogin();
    }
    throw new AuthSessionError(message);
  };

  if (!hasAuthSession()) {
    failAuth("Missing session. Sign in again.");
  }

  const requestInit: RequestInit = {
    ...init,
    credentials: "include",
  };

  let res = await fetchWithTimeout(input, requestInit, timeoutMs);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      failAuth("Session expired. Please sign in again.");
    }

    res = await fetchWithTimeout(input, requestInit, timeoutMs);

    if (res.status === 401) {
      failAuth("Session expired. Please sign in again.");
    }
  }

  return res;
}
