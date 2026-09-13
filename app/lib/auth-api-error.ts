import axios from "axios";
import { parseApiMessage } from "@/app/lib/api";

export class AuthApiError extends Error {
  readonly code: string | null;
  readonly status: number | null;

  constructor(
    message: string,
    options?: { code?: string | null; status?: number | null },
  ) {
    super(message);
    this.name = "AuthApiError";
    this.code = options?.code ?? null;
    this.status = options?.status ?? null;
  }
}

export function throwAuthApiError(
  error: unknown,
  fallback: string,
): never {
  if (axios.isAxiosError(error) && error.response?.data != null) {
    const data = error.response.data as {
      message?: unknown;
      error?: unknown;
    };
    const message = parseApiMessage(data.message, fallback);
    const code =
      typeof data.error === "string" && data.error.trim()
        ? data.error.trim()
        : null;
    throw new AuthApiError(message, {
      code,
      status: error.response.status ?? null,
    });
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(fallback);
}

export function isEmailNotVerifiedError(error: unknown): boolean {
  if (error instanceof AuthApiError) {
    return (
      error.code === "EMAIL_NOT_VERIFIED" ||
      /verify your email/i.test(error.message)
    );
  }
  if (error instanceof Error) {
    return /verify your email/i.test(error.message);
  }
  return false;
}

export function isGoogleOnlyAccountError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return /uses Google sign-in|Continue with Google/i.test(message);
}
