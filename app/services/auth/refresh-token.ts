import {
  fetchWithTimeout,
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";

export async function refreshAuthTokens(): Promise<void> {
  const res = await fetchWithTimeout(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(
      await parseApiErrorMessage(res, "Could not refresh session."),
    );
  }
}
