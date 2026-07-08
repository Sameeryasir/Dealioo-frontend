"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getSetupUser } from "@/app/lib/setup-user";

export const CAMPAIGN_OFFER_CARD_COLOR = "#CC6E52";

export type CampaignOfferPreviewCardProps = {
  offerName: string;
  offerPrice: string;
  imageUrl?: string | null;
  customerName?: string;
  /** Optional campaign id encoded in the QR payload after create. */
  campaignId?: number;
};

function formatExpiryDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function CampaignOfferPreviewCard({
  offerName,
  offerPrice,
  imageUrl,
  customerName,
  campaignId,
}: CampaignOfferPreviewCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const displayCustomerName =
    customerName?.trim() ||
    getSetupUser()?.name?.trim() ||
    "Guest customer";

  const offerLine =
    offerName.trim() || offerPrice.trim()
      ? [offerName.trim(), offerPrice.trim() ? `$${offerPrice.trim()}` : ""]
          .filter(Boolean)
          .join(", ") || "Your offer"
      : "Your offer name";

  useEffect(() => {
    let cancelled = false;
    const expires = formatExpiryDate();
    const payloadParts = [
      campaignId != null
        ? `retention:campaign:${campaignId}`
        : "retention:offer-preview",
      `customer=${displayCustomerName}`,
      `offer=${offerName.trim() || "-"}`,
      `price=${offerPrice.trim() || "-"}`,
      `expires=${expires}`,
    ];
    const payload = payloadParts.join("|");

    void QRCode.toDataURL(payload, {
      width: 112,
      margin: 2,
      color: { dark: "#18181b", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [campaignId, displayCustomerName, offerName, offerPrice]);

  return (
    <div
      className="rounded-2xl border border-black/15 p-5 shadow-md ring-1 ring-white/10"
      style={{ backgroundColor: CAMPAIGN_OFFER_CARD_COLOR }}
    >
      <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-black/20 bg-black/20 shadow-inner ring-1 ring-white/10">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center px-4 text-center text-xs font-medium text-white/55">
            Your offer image appears here
          </div>
        )}
      </div>
      <dl className="mt-4 space-y-2.5 text-[11px] leading-tight text-white">
        <div className="border-b border-white/20 pb-2.5">
          <div className="min-w-0">
            <dt className="font-semibold uppercase tracking-wide text-white/65">
              Name
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-white">
              {displayCustomerName}
            </dd>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-b border-white/20 pb-2.5">
          <div className="min-w-0">
            <dt className="font-semibold uppercase tracking-wide text-white/65">
              Offer
            </dt>
            <dd className="mt-0.5 truncate text-sm font-semibold text-white">
              {offerLine}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="font-semibold uppercase tracking-wide text-white/65">
              Expires
            </dt>
            <dd className="mt-0.5 text-sm font-semibold text-white">
              {formatExpiryDate()}
            </dd>
          </div>
        </div>
      </dl>
      <div
        className="mt-4 flex justify-center p-3"
        style={{ backgroundColor: CAMPAIGN_OFFER_CARD_COLOR }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR code for your campaign offer"
            width={168}
            height={168}
            className="h-[168px] w-[168px]"
          />
        ) : (
          <div
            className="flex h-[168px] w-[168px] items-center justify-center rounded-lg bg-black/10 text-xs text-white/80"
            aria-hidden
          >
            Generating…
          </div>
        )}
      </div>
    </div>
  );
}
