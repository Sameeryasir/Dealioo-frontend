import {
  getApiBaseUrl,
  parseApiErrorMessage,
} from "@/app/lib/api";
import { authenticatedFetch, redirectToLogin } from "@/app/lib/authenticated-fetch";
import { hasAuthSession } from "@/app/lib/auth-session";

export class AutomationApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AutomationApiError";
    this.status = status;
  }
}

function redirectIfUnauthenticated(): void {
  redirectToLogin();
}

export async function automationFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!hasAuthSession()) {
    redirectIfUnauthenticated();
    throw new AutomationApiError("Missing access token. Sign in again.", 401);
  }

  const res = await authenticatedFetch(`${getApiBaseUrl()}/automation${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const message = await parseApiErrorMessage(
      res,
      `Request failed: ${res.status}`,
    );
    throw new AutomationApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
