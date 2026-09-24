import {
  formatCampaignPrice,
  resolveDealDiscount,
} from "@/app/lib/campaign-price";

type DealPriceDisplayProps = {
  price: number | string | null | undefined;
  originalPrice?: number | string | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
  showSaveBadge?: boolean;
  emptyLabel?: string;
};

const sizeClass = {
  sm: {
    price: "text-sm font-bold",
    original: "text-xs",
    badge: "text-[0.62rem]",
  },
  md: {
    price: "text-[1.35rem] font-extrabold sm:text-[1.45rem]",
    original: "text-sm",
    badge: "text-[0.65rem]",
  },
  lg: {
    price: "text-2xl font-extrabold",
    original: "text-base",
    badge: "text-xs",
  },
} as const;

export function DealPriceDisplay({
  price,
  originalPrice,
  size = "md",
  className = "",
  showSaveBadge = true,
  emptyLabel = "No price set",
}: DealPriceDisplayProps) {
  const deal = resolveDealDiscount({ price, originalPrice });
  const styles = sizeClass[size];

  if (deal.price == null) {
    return (
      <span className={`font-medium text-slate-500 ${className}`}>
        {emptyLabel}
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`leading-none text-[#07111f] ${styles.price}`}>
        {formatCampaignPrice(deal.price)}
      </span>
      {deal.hasDiscount && deal.originalPrice != null ? (
        <>
          <span
            className={`leading-none text-slate-400 line-through ${styles.original}`}
          >
            {formatCampaignPrice(deal.originalPrice)}
          </span>
          {showSaveBadge && deal.percentOff != null && deal.percentOff > 0 ? (
            <span
              className={`rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 ring-1 ring-emerald-200 ${styles.badge}`}
            >
              Save {deal.percentOff}%
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}
