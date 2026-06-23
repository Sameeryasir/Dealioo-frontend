export const API_REQUEST_TIMEOUT_MS = 5_000;
export const API_MIN_LOADING_MS = 500;

function configuredApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4001";
}

function isNgrokHostname(hostname: string): boolean {
  return (
    hostname.endsWith(".ngrok-free.app") ||
    hostname.endsWith(".ngrok-free.dev") ||
    hostname.endsWith(".ngrok.io") ||
    hostname.endsWith(".ngrok.app")
  );
}

/**
 * On mobile via ngrok, localhost points at the phone — not your Mac.
 * Use the Next.js /backend proxy so API calls stay on the same ngrok host.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    return configuredApiUrl();
  }

  const hostname = window.location.hostname;
  const ngrokHost = process.env.NEXT_PUBLIC_NGROK_HOST?.trim();

  // Any ngrok URL → same-origin proxy (avoids CORS when the tunnel URL changes).
  if (isNgrokHostname(hostname) || (ngrokHost && hostname === ngrokHost)) {
    return "/backend";
  }

  if (process.env.NEXT_PUBLIC_USE_API_PROXY === "true") {
    return "/backend";
  }

  return configuredApiUrl();
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
    const errBody = (await res.json()) as { message?: unknown };
    return parseApiMessage(errBody?.message, fallback);
  } catch {
    return fallback;
  }
}
