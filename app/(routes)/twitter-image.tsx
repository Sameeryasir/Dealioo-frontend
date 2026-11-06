import { createDealioOgImage } from "@/app/lib/dealio-og-image";

export const runtime = "edge";
export const alt = "Dealioo — AI Growth Platform for Local Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return createDealioOgImage(size);
}
