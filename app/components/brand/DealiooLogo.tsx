import Image from "next/image";

type DealiooLogoProps = {
  /**
   * light = dark wordmark for light backgrounds (black-logo.png)
   * dark  = light wordmark asset for dark backgrounds (Dealioo-black.png)
   */
  variant?: "light" | "dark";
  /** Override default logo path (e.g. landing nav/footer). */
  src?: string;
  width?: number;
  height?: number;
  /** Uses PNG with alpha channel, no black box on dark nav */
  transparent?: boolean;
  className?: string;
  priority?: boolean;
};

export default function DealiooLogo({
  variant = "light",
  src,
  width,
  height,
  transparent = false,
  className = "h-8 w-auto",
  priority = false,
}: DealiooLogoProps) {
  const defaultSrc =
    variant === "dark"
      ? transparent
        ? "/Dealioo-transparent.png"
        : "/Dealioo-black.png"
      : "/Delioo-white.png";

  const resolvedSrc = src ?? defaultSrc;
  const resolvedWidth = width ?? (variant === "dark" ? 1273 : 1389);
  const resolvedHeight = height ?? (variant === "dark" ? 307 : 334);

  return (
    <Image
      src={resolvedSrc}
      alt="Dealioo"
      width={resolvedWidth}
      height={resolvedHeight}
      priority={priority}
      className={className}
    />
  );
}
