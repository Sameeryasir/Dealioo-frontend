import { markAuthSession } from "@/app/lib/auth-session";
import { refreshAuthTokens } from "@/app/services/auth/refresh-token";

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      await refreshAuthTokens();
      markAuthSession();
      return "1";
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
