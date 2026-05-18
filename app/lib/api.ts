export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4001";
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
