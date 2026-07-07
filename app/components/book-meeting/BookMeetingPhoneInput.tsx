"use client";
import { BookMeetingCountrySelect } from "@/app/components/book-meeting/BookMeetingCountrySelect";
import PhoneInput, {
  isValidPhoneNumber,
  type Country,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";
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
        className={`${styles.phoneInput}${variant === "boxed" ? ` ${styles.phoneInputBoxed}` : ""}`}
        numberInputProps={{
          className: styles.phoneNumberInput,
          placeholder: "555 000 0000",
        }}
      />
    </div>
  );
}

export { isValidPhoneNumber };
