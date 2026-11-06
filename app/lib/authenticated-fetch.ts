import { fetchWithTimeout } from "@/app/lib/api";
import {
  clearAuthSession,
  ensureAuthSessionHint,
} from "@/app/lib/auth-session";
import { isAuthRefreshUrl } from "@/app/lib/auth-refresh-url";
import { refreshAccessToken } from "@/app/lib/refresh-access-token";

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearAuthSession();
  window.location.href = "/auth/login";
}

export type AuthenticatedFetchOptions = {
  redirectOnUnauthorized?: boolean;
};

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

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

  if (res.status === 401 && !isAuthRefreshUrl(requestUrl(input))) {
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

  if (res.ok) {
    ensureAuthSessionHint();
  }

  return res;
}
