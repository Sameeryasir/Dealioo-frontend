import { fetchWithTimeout, getApiBaseUrl } from "@/app/lib/api";
import { clearAuthSession } from "@/app/lib/auth-session";

export async function logoutSession(): Promise<void> {
  try {
    await fetchWithTimeout(`${getApiBaseUrl()}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
  } catch {
    // Local session is cleared even if the server revoke fails.
  }

  clearAuthSession();
}
