"use client";

type ProfileCompletionRingProps = {
  percent: number;
  size?: number;
};

export function ProfileCompletionRing({
  percent,
  size = 64,
}: ProfileCompletionRingProps) {
  const stroke = size >= 120 ? 10 : size <= 72 ? 6 : 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;
  const labelClass =
    size >= 120
      ? "text-[1.35rem] tracking-tight"
      : size <= 72
        ? "text-[0.72rem]"
        : "text-sm";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${clamped}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#dcfce7"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#09b66f"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-extrabold text-[#07111f] ${labelClass}`}
      >
        {clamped}%
      </span>
    </div>
  );
}
