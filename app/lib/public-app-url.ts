/** Public app URL for default ad landing links (ngrok or production). */
export function getPublicAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3002";
}
