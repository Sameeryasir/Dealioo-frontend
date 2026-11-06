import { broadcastAuthSessionChanged } from "@/app/lib/auth-broadcast";
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

export function ensureAuthSessionHint(): void {
  if (hasAuthSession()) return;
  setSetupAccessToken();
  setSetupRefreshToken();
}

export function markAuthSession(): void {
  setSetupAccessToken();
  setSetupRefreshToken();
  notifyAuthSessionChanged();
  broadcastAuthSessionChanged("marked");
  void import("@/app/lib/sync-product-meta-attribution")
    .then((m) => m.syncProductMetaAttributionAfterAuth())
    .catch(() => {});
}

export function setAuthTokens(_accessToken?: string, _refreshToken?: string): void {
  markAuthSession();
}

export function clearAuthSession(): void {
  clearSetupAccessToken();
  clearSetupRefreshToken();
  void import("@/app/lib/sync-product-meta-attribution")
    .then((m) => m.resetProductMetaAttributionOnLogout())
    .catch(() => {});
  notifyAuthSessionChanged();
  broadcastAuthSessionChanged("cleared");
}

export function hasAuthSession(): boolean {
  return Boolean(getSetupAccessToken().trim());
}

export { getSetupAccessToken, getSetupRefreshToken };
