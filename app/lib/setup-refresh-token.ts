export function setSetupRefreshToken(_token?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("refreshToken");
  window.sessionStorage.removeItem("refreshToken");
}

export function getSetupRefreshToken(): string {
  return "";
}

export function clearSetupRefreshToken(): void {
  setSetupRefreshToken();
}
