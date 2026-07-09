import { connectGoogleAds } from "@/app/services/google-ads/connect-google-ads";

export const GOOGLE_OAUTH_COMPLETE_MESSAGE = "google-oauth-complete" as const;

export type GoogleOAuthResult =
  | { status: "connected"; businessId: number }
  | { status: "cancelled" };

function openGoogleConnectPopup(oauthUrl: string): Window | null {
  const width = 560;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);

  return window.open(
    oauthUrl,
    "dealioo_google_oauth",
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
  );
}

function readBusinessIdFromMessage(data: object): number | null {
  const record = data as { businessId?: unknown; restaurantId?: unknown };
  const raw = record.businessId ?? record.restaurantId;
  if (typeof raw !== "number" || raw < 1) return null;
  return raw;
}

function waitForGoogleOAuthPopup(
  popup: Window,
  timeoutMs = 10 * 60 * 1000,
): Promise<GoogleOAuthResult> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: GoogleOAuthResult) => {
      if (settled) return;
      settled = true;
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
      window.removeEventListener("message", onMessage);
      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type !== GOOGLE_OAUTH_COMPLETE_MESSAGE) {
        return;
      }

      const businessId = readBusinessIdFromMessage(data);
      if (businessId == null) return;

      try {
        popup.close();
      } catch {
        /* popup may already be closed */
      }
      finish({ status: "connected", businessId });
    };

    window.addEventListener("message", onMessage);

    const pollTimer = window.setInterval(() => {
      if (popup.closed) {
        finish({ status: "cancelled" });
      }
    }, 400);

    const timeoutTimer = window.setTimeout(() => {
      try {
        popup.close();
      } catch {
        /* ignore */
      }
      finish({ status: "cancelled" });
    }, timeoutMs);
  });
}

export async function connectGoogleAdsInPopup(
  accessToken: string,
  businessId: number,
): Promise<GoogleOAuthResult> {
  const { url } = await connectGoogleAds(accessToken, businessId);
  const popup = openGoogleConnectPopup(url);

  if (!popup) {
    throw new Error(
      "Pop-up was blocked. Allow pop-ups for Dealioo, then try again.",
    );
  }

  return waitForGoogleOAuthPopup(popup);
}

export function notifyGoogleOAuthComplete(businessId: number): boolean {
  if (typeof window === "undefined") return false;
  const opener = window.opener;
  if (!opener || opener.closed) return false;

  opener.postMessage(
    { type: GOOGLE_OAUTH_COMPLETE_MESSAGE, businessId },
    window.location.origin,
  );
  window.close();
  return true;
}
