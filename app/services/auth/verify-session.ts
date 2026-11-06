import { getApiBaseUrl, parseApiErrorMessage } from "@/app/lib/api";
import { authenticatedFetch } from "@/app/lib/authenticated-fetch";
import { ensureAuthSessionHint } from "@/app/lib/auth-session";
import { parseAuthUser } from "@/app/services/user/parse-auth-user";
import type { VerifyOtpUser } from "@/app/services/auth/verify-otp";

export type SessionVerifyResult =
  | { status: "authenticated"; user: VerifyOtpUser }
  | { status: "unauthenticated" }
  | { status: "error"; message: string };

let inFlight: Promise<SessionVerifyResult> | null = null;

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function isSessionExpiredError(error: unknown): boolean {
  return (
    error instanceof Error &&
    /session expired|sign in again/i.test(error.message)
  );
}

export async function verifyAuthSession(
  signal?: AbortSignal,
): Promise<SessionVerifyResult> {
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<SessionVerifyResult> => {
    try {
      const res = await authenticatedFetch(
        `${getApiBaseUrl()}/user/me`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          signal,
        },
        undefined,
        { redirectOnUnauthorized: false },
      );

      if (res.status === 401) {
        return { status: "unauthenticated" };
      }

      if (!res.ok) {
        return {
          status: "error",
          message: await parseApiErrorMessage(
            res,
            "Could not verify your session.",
          ),
        };
      }

      const user = parseAuthUser(await res.json());
      if (!user) {
        return {
          status: "error",
          message: "Invalid profile data from server.",
        };
      }

      ensureAuthSessionHint();
      return { status: "authenticated", user };
    } catch (error) {
      if (isAbortError(error)) {
        return {
          status: "error",
          message: "Session verification was cancelled.",
        };
      }
      if (isSessionExpiredError(error)) {
        return { status: "unauthenticated" };
      }
      return {
        status: "error",
        message:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Could not reach the server to verify your session.",
      };
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
