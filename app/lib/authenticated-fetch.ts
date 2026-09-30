import { fetchWithTimeout } from "@/app/lib/api";
import {
  clearAuthSession,
  hasAuthSession,
  markAuthSession,
} from "@/app/lib/auth-session";
import { refreshAccessToken } from "@/app/lib/refresh-access-token";

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearAuthSession();
  window.location.href = "/auth/login";
}

export type AuthenticatedFetchOptions = {
  redirectOnUnauthorized?: boolean;
};

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs?: number,
  options?: AuthenticatedFetchOptions,
): Promise<Response> {
  const redirectOnUnauthorized = options?.redirectOnUnauthorized !== false;
  const requestInit: RequestInit = {
    ...init,
    credentials: "include",
  };

  let res = await fetchWithTimeout(input, requestInit, timeoutMs);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      if (redirectOnUnauthorized) {
        redirectToLogin();
      }
      throw new Error("Session expired. Please sign in again.");
    }

    res = await fetchWithTimeout(input, requestInit, timeoutMs);

    if (res.status === 401) {
      if (redirectOnUnauthorized) {
        redirectToLogin();
      }
      throw new Error("Session expired. Please sign in again.");
    }
  }

  if (res.ok && !hasAuthSession()) {
    markAuthSession();
  }

  return res;
}
