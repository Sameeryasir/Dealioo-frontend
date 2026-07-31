type GoogleAdsStarIconProps = {
  className?: string;
};

export function GoogleAdsStarIcon({ className }: GoogleAdsStarIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      fill="none"
    >
      <rect x="21" y="2" width="6" height="16" rx="2" fill="#EA4335" />
      <rect
        x="21"
        y="2"
        width="6"
        height="16"
        rx="2"
        fill="#4285F4"
        transform="rotate(45 24 24)"
      />
      <rect
        x="21"
        y="2"
        width="6"
        height="16"
        rx="2"
        fill="#4285F4"
        transform="rotate(90 24 24)"
      />
      <rect
        x="21"
        y="2"
        width="6"
        height="16"
        rx="2"
        fill="#34A853"
        transform="rotate(135 24 24)"
      />
      <rect
        x="21"
        y="2"
        width="6"
        height="16"
        rx="2"
        fill="#34A853"
        transform="rotate(180 24 24)"
      />
      <rect
        x="21"
        y="2"
        width="6"
        height="16"
        rx="2"
        fill="#FBBC05"
        transform="rotate(225 24 24)"
      />
      <rect
        x="21"
        y="2"
        width="6"
        height="16"
        rx="2"
        fill="#FBBC05"
        transform="rotate(270 24 24)"
      />
      <rect
        x="21"
        y="2"
        width="6"
        height="16"
        rx="2"
        fill="#EA4335"
        transform="rotate(315 24 24)"
      />
    </svg>
  );
}
