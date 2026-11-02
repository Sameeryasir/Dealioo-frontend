"use client";

import { BusinessDetailRow } from "@/app/components/business/business-profile/BusinessDetailRow";
import { FileText } from "lucide-react";
import type { ReactNode, Ref } from "react";

const cardClass =
  "flex h-full min-h-full flex-col overflow-hidden rounded-2xl border border-[#e8edf5] bg-white shadow-[0_14px_40px_rgba(14,24,43,0.06)]";

function cleanPart(value: string): string {
  const trimmed = value.trim();
  return !trimmed || trimmed === "—" ? "" : trimmed;
}

function buildAddressLines(
  city: string,
  state: string,
  country: string,
  postalCode: string,
): string[] {
  const cityLine = cleanPart(city);
  const statePostal = [cleanPart(state), cleanPart(postalCode)]
    .filter(Boolean)
    .join(", ");
  const countryLine = cleanPart(country);

  return [cityLine, statePostal, countryLine].filter(Boolean);
}

type BusinessDetailsCardProps = {
  detailsRef?: Ref<HTMLElement>;
  displayName: string;
  businessTypeLabel: string;
  currencyLabel: string;
  phoneDisplay: string;
  phoneHref: string | null;
  emailDisplay: string;
  emailHref: string | null;
  websiteDisplay: string;
  websiteHref: string | null;
  branchLabel: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  description: string;
};

function DetailPair({
  children,
  last = false,
  fullWidth = false,
}: {
  children: ReactNode;
  last?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 ${
        fullWidth ? "" : "sm:grid-cols-2 sm:divide-x sm:divide-[#e2e8f0]"
      } ${last ? "" : "border-b border-[#eef2f7]"}`}
    >
      {children}
    </div>
  );
}

export function BusinessDetailsCard({
  detailsRef,
  displayName,
  businessTypeLabel,
  currencyLabel,
  phoneDisplay,
  phoneHref,
  emailDisplay,
  emailHref,
  websiteDisplay,
  websiteHref,
  branchLabel,
  city,
  state,
  country,
  postalCode,
  description,
}: BusinessDetailsCardProps) {
  const addressLines = buildAddressLines(city, state, country, postalCode);
  const aboutText =
    description.trim() || "No business description added yet.";
  const addressValue =
    addressLines.length > 0 ? addressLines.join(", ") : "—";

  return (
    <section
      ref={detailsRef}
      id="business-details"
      className={`scroll-mt-24 ${cardClass}`}
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-[#eef2f7] px-5 py-[22px] sm:px-6 sm:py-[26px]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1877f2] text-white shadow-[0_8px_18px_rgba(24,119,242,0.25)]">
          <FileText className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="m-0 text-base font-extrabold tracking-tight text-[#07111f]">
            Business details
          </h3>
          <p className="m-0 mt-0.5 text-sm text-slate-500">
            Core information about your business, organized for easy management.
          </p>
        </div>
      </div>

      <div className="flex flex-col">
        <DetailPair>
          <BusinessDetailRow
            label="Business name"
            htmlFor="business-settings-name"
            value={displayName}
          />
          <BusinessDetailRow
            label="Business type"
            htmlFor="business-settings-type"
            value={businessTypeLabel}
          />
        </DetailPair>

        <DetailPair>
          <BusinessDetailRow
            label="Currency"
            htmlFor="business-settings-currency"
            value={currencyLabel}
          />
          <BusinessDetailRow
            label="Phone number"
            htmlFor="business-settings-phone"
            value={phoneDisplay}
            href={phoneHref}
          />
        </DetailPair>

        <DetailPair>
          <BusinessDetailRow
            label="Email address"
            htmlFor="business-settings-email"
            value={emailDisplay}
            href={emailHref}
            wrap
          />
          <BusinessDetailRow
            label="Website"
            htmlFor="business-settings-website"
            value={websiteDisplay}
            href={websiteHref}
            wrap
          />
        </DetailPair>

        <DetailPair>
          <BusinessDetailRow label="Branches" value={branchLabel} />
          <BusinessDetailRow
            label="State"
            htmlFor="business-settings-state"
            value={state}
          />
        </DetailPair>

        <DetailPair>
          <BusinessDetailRow
            label="Country"
            htmlFor="business-settings-country"
            value={country}
          />
          <BusinessDetailRow
            label="Postal code"
            htmlFor="business-settings-address"
            value={postalCode}
          />
        </DetailPair>

        <DetailPair fullWidth>
          <BusinessDetailRow
            label="City"
            htmlFor="business-settings-city"
            value={city}
            wrap
          />
        </DetailPair>

        <DetailPair fullWidth>
          <BusinessDetailRow
            label="About"
            value={aboutText}
            wrap
            className="!py-[14px]"
          />
        </DetailPair>

        <DetailPair last fullWidth>
          <BusinessDetailRow label="Address" value={addressValue} wrap />
        </DetailPair>
      </div>
    </section>
  );
}
