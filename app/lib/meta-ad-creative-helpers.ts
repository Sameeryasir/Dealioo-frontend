import type { AdSetPlacements } from "@/app/lib/meta-campaign-builder-types";

export function hasInstagramPlacements(placements: AdSetPlacements): boolean {
  if (placements.advantagePlusPlacements) return true;
  if (placements.publisherPlatforms.instagram) return true;
  return Object.values(placements.instagramPositions).some(Boolean);
}

export const CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn more" },
  { value: "SIGN_UP", label: "Sign up" },
  { value: "GET_OFFER", label: "Get offer" },
  { value: "ORDER_NOW", label: "Order now" },
  { value: "BOOK_NOW", label: "Book now" },
  { value: "CALL_NOW", label: "Call now" },
  { value: "SEND_MESSAGE", label: "Send message" },
  { value: "CONTACT_US", label: "Contact us" },
] as const;
