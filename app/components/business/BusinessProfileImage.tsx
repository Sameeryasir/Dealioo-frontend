"use client";

/**
 * Change: Circular profile/campaign images that fill the full round frame.
 * Why: Consistent full-circle thumbnails on business and campaign cards.
 * Related: BusinessDashboardCard.tsx, CampaignFunnelCard.tsx, globals.css (.org-biz-card-avatar*)
 */

import {
  resolveUploadImageUrl,
} from "@/app/lib/resolve-upload-image-url";
import { ImageIcon, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";

type Variant = "grid" | "list" | "campaign";

type Props = {
  src: string | null | undefined;
  variant?: Variant;
  className?: string;
  /** Mirrors prior card behavior: decorative when a logo is shown. */
  "aria-hidden"?: boolean;
};

function avatarRootClass(variant: Variant, isPlaceholder: boolean): string {
  if (variant === "list") {
    return [
      "org-biz-card-thumb",
      isPlaceholder ? "org-biz-card-thumb--placeholder" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    "org-biz-card-avatar",
    isPlaceholder ? "org-biz-card-avatar--placeholder" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function BusinessProfileImage({
  src,
  variant = "grid",
  className,
  "aria-hidden": ariaHidden,
}: Props) {
  const resolvedSrc = resolveUploadImageUrl(src);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedSrc]);

  const hasImage = Boolean(resolvedSrc) && !imageFailed;
  const isPlaceholder = !hasImage;

  const rootClassName = [avatarRootClass(variant, isPlaceholder), className]
    .filter(Boolean)
    .join(" ");

  const placeholderIcon =
    variant === "campaign" ? (
      <Megaphone className="size-7 sm:size-8" strokeWidth={1.75} />
    ) : (
      <ImageIcon
        className={variant === "grid" ? "size-6 sm:size-7" : "size-5"}
        strokeWidth={1.75}
      />
    );

  return (
    <span className={rootClassName} aria-hidden={ariaHidden}>
      {hasImage ? (
        <span className="org-biz-card-avatar-media">
          {/* Full circle: cover fills the round frame edge-to-edge. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedSrc}
            alt=""
            className="org-biz-card-avatar-img block size-full"
            onError={() => setImageFailed(true)}
          />
        </span>
      ) : (
        <span className="org-biz-card-avatar-placeholder" aria-hidden>
          {placeholderIcon}
        </span>
      )}
    </span>
  );
}
