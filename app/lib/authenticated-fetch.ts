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

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs?: number,
): Promise<Response> {
  const requestInit: RequestInit = {
    ...init,
    credentials: "include",
  };

  let res = await fetchWithTimeout(input, requestInit, timeoutMs);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      redirectToLogin();
      throw new Error("Session expired. Please sign in again.");
    }

    res = await fetchWithTimeout(input, requestInit, timeoutMs);

    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expired. Please sign in again.");
    }
  }

  if (res.ok && !hasAuthSession()) {
    markAuthSession();
  }

  return res;
}
