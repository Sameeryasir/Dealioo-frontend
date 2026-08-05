import {
  clearSetupAccessToken,
  getSetupAccessToken,
  setSetupAccessToken,
} from "@/app/lib/setup-access-token";
import {
  clearSetupRefreshToken,
  getSetupRefreshToken,
  setSetupRefreshToken,
} from "@/app/lib/setup-refresh-token";

export const AUTH_SESSION_CHANGED_EVENT = "auth-session-changed";

function notifyAuthSessionChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  setSetupAccessToken(accessToken);
  setSetupRefreshToken(refreshToken);
  notifyAuthSessionChanged();
  void import("@/app/lib/sync-product-meta-attribution")
    .then((m) => m.syncProductMetaAttributionAfterAuth())
    .catch(() => {});
}

export function clearAuthSession(): void {
  clearSetupAccessToken();
  clearSetupRefreshToken();
  void import("@/app/lib/sync-product-meta-attribution")
    .then((m) => m.resetProductMetaAttributionOnLogout())
    .catch(() => {});
  notifyAuthSessionChanged();
}

export function hasAuthSession(): boolean {
  return Boolean(
    getSetupAccessToken().trim() || getSetupRefreshToken().trim(),
  );
}

export { getSetupAccessToken, getSetupRefreshToken };
