const SESSION_COOKIE = "dealioo_signed_in";

function assertClient(): boolean {
  return typeof window !== "undefined";
}

function readCookie(name: string): string {
  if (!assertClient()) return "";
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return "";
}

function clearStoredSecrets(): void {
  if (!assertClient()) return;
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("refreshToken");
  window.sessionStorage.removeItem("accessToken");
  window.sessionStorage.removeItem("refreshToken");
}

export function setSignedInCookie(): void {
  if (!assertClient()) return;
  clearStoredSecrets();
  document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 10}; SameSite=Lax`;
}

export function clearSignedInCookie(): void {
  if (!assertClient()) return;
  clearStoredSecrets();
  document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function hasSignedInCookie(): boolean {
  return readCookie(SESSION_COOKIE) === "1";
}

export function setSetupAccessToken(_token?: string): void {
  setSignedInCookie();
}

export function getSetupAccessToken(): string {
  return hasSignedInCookie() ? "1" : "";
}

export function clearSetupAccessToken(): void {
  clearSignedInCookie();
}
