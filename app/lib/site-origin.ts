export function getSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_FRONTEND_URL?.trim().replace(/\/$/, "");
  if (
    fromEnv &&
    fromEnv.startsWith("https://") &&
    !fromEnv.includes("localhost") &&
    !fromEnv.includes("ngrok")
  ) {
    return fromEnv;
  }
  return "https://dealioo.io";
}
