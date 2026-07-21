export const API_REQUEST_TIMEOUT_MS = 5_000;
export const API_MIN_LOADING_MS = 500;

const LOCAL_API_DEFAULT = "http://localhost:4001/api";

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]"
  );
}

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (!isLocalHostname(hostname)) {
      return normalizeApiBaseUrl(origin);
    }
  }

  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return normalizeApiBaseUrl(fromEnv);
  }

  return LOCAL_API_DEFAULT;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = API_REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const externalSignal = init?.signal;
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    externalSignal.addEventListener(
      "abort",
      () => controller.abort(),
      { once: true },
    );
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      if (externalSignal?.aborted) {
        throw e;
      }
      throw new Error("Request timed out. Please try again.");
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function parseApiMessage(message: unknown, fallback: string): string {
  if (Array.isArray(message)) return message.join(" ");
  if (typeof message === "string" && message.trim()) return message.trim();
  return fallback;
}

export async function parseApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const errBody = (await res.json()) as {
      message?: unknown;
      metaError?: { message?: string; error_user_msg?: string };
    };
    const metaMessage =
      errBody?.metaError?.error_user_msg?.trim() ||
      errBody?.metaError?.message?.trim();
    if (metaMessage) {
      return metaMessage;
    }
    return parseApiMessage(errBody?.message, fallback);
  } catch {
    return fallback;
  }
}
