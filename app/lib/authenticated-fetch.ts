import { fetchWithTimeout } from "@/app/lib/api";
import {
  clearAuthSession,
  getSetupAccessToken,
} from "@/app/lib/auth-session";
import { getSetupRefreshToken } from "@/app/lib/setup-refresh-token";
import { refreshAccessToken } from "@/app/lib/refresh-access-token";

export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  clearAuthSession();
  const returnTo = encodeURIComponent(
    `${window.location.pathname}${window.location.search}`,
  );
  window.location.href = `/?returnTo=${returnTo}`;
}

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs?: number,
): Promise<Response> {
  const token = getSetupAccessToken().trim();
  const refreshToken = getSetupRefreshToken().trim();

  if (!token && !refreshToken) {
    redirectToLogin();
    throw new Error("Missing session. Sign in again.");
  }

  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetchWithTimeout(input, { ...init, headers }, timeoutMs);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      redirectToLogin();
      throw new Error("Session expired. Please sign in again.");
    }

    headers.set("Authorization", `Bearer ${newToken}`);
    res = await fetchWithTimeout(input, { ...init, headers }, timeoutMs);

    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expired. Please sign in again.");
    }
  }

  return res;
}
