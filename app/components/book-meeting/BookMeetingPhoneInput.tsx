"use client";
import { BookMeetingCountrySelect } from "@/app/components/book-meeting/BookMeetingCountrySelect";
import PhoneInput, {
  isValidPhoneNumber,
  type Country,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";
import styles from "./BookMeetingPhoneInput.module.css";

export const BOOK_MEETING_DEFAULT_COUNTRY: Country = "CA";

export type BookMeetingPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  variant?: "default" | "boxed";
  wrapClassName?: string;
};

export function BookMeetingPhoneInput({
  value,
  onChange,
  variant = "default",
  wrapClassName,
}: BookMeetingPhoneInputProps) {
  const boxed = variant === "boxed";

  return (
    <div
      className={`${styles.phoneInputWrap}${wrapClassName ? ` ${wrapClassName}` : ""}`}
      data-phone-input-row
    >
      <PhoneInput
        international
        defaultCountry={BOOK_MEETING_DEFAULT_COUNTRY}
        countryCallingCodeEditable={false}
        labels={en}
        value={value || undefined}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        countrySelectComponent={BookMeetingCountrySelect}
        className={`${styles.phoneInput}${boxed ? ` ${styles.phoneInputBoxed}` : ""} flex !flex-row !flex-nowrap !items-center`}
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: boxed ? "center" : "flex-end",
          gap: boxed ? "0.45rem" : "0.65rem",
          width: "100%",
        }}
        numberInputProps={{
          className: `${styles.phoneNumberInput} min-w-0 flex-1`,
          placeholder: "555 000 0000",
          style: {
            minWidth: 0,
            flex: "1 1 auto",
          },
        }}
      />
    </div>
  );
}

export { isValidPhoneNumber };
