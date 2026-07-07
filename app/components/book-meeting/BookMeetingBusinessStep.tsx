"use client";
import { BUSINESS_ROLE_OPTIONS } from "@/app/components/book-meeting/book-meeting-config";
import { Briefcase, Building2, Check, Handshake, MapPin, Megaphone, Store, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import styles from "./BookMeetingForm.module.css";

const ROLE_ICONS: Record<string, LucideIcon> = {
  business_owner: Store,
  in_house_marketer: Megaphone,
  marketing_agency: Briefcase,
  consultant_partner: Handshake,
};

const ROLE_ICON_TONES: Record<string, keyof typeof styles> = {
  business_owner: "optionIconToneGreen",
  in_house_marketer: "optionIconToneBlue",
  marketing_agency: "optionIconToneViolet",
  consultant_partner: "optionIconTonePink",
};

export type BookMeetingBusinessStepProps = {
  businessRole: string;
  businessCategory: string;
  businessName: string;
  cityLocation: string;
  onRoleChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onCityChange: (value: string) => void;
};

export function BookMeetingBusinessStep({
  businessRole,
  businessCategory,
  businessName,
  cityLocation,
  onRoleChange,
  onCategoryChange,
  onNameChange,
  onCityChange,
}: BookMeetingBusinessStepProps) {
  return (
    <div className={styles.businessStep}>
      <section className={styles.businessSection}>
        <p className={styles.fieldLabel}>What best describes you?</p>
        <div className={styles.roleList} role="listbox" aria-label="What best describes you">
          {BUSINESS_ROLE_OPTIONS.map((option) => {
            const Icon = ROLE_ICONS[option.value] ?? Store;
            const selected = businessRole === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                aria-label={option.description}
                title={option.description}
                className={`${styles.roleOption}${selected ? ` ${styles.roleOptionSelected}` : ""}`}
                onClick={() => onRoleChange(option.value)}
              >
                <span
                  className={`${styles.roleOptionIcon} ${styles[ROLE_ICON_TONES[option.value] ?? "optionIconToneBlue"]}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </span>
                <span className={styles.roleOptionLabel}>{option.label}</span>
                <span
                  className={`${styles.roleOptionCheck}${selected ? ` ${styles.roleOptionCheckVisible}` : ""}`}
                  aria-hidden
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {businessRole ? (
        <section className={styles.businessNamePanel} data-business-details>
          <p className={styles.businessSectionLabel}>What type of business is it?</p>
          <label className={styles.businessNameField}>
            <span className={styles.businessNameIconWrap}>
              <Tag className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
            <input
              type="text"
              autoFocus
              className={styles.businessNameInput}
              placeholder="Restaurant, salon, or gym"
              value={businessCategory}
              onChange={(event) => onCategoryChange(event.target.value)}
            />
          </label>

          <p className={`${styles.businessSectionLabel} ${styles.groupLabelSpaced}`}>
            What is the business name?
          </p>
          <label className={styles.businessNameField}>
            <span className={styles.businessNameIconWrap}>
              <Building2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </span>
            <input
              type="text"
              className={styles.businessNameInput}
              placeholder="Maple Street Cafe"
              value={businessName}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </label>
          <p className={styles.businessNameHint}>List multiple locations on one line.</p>

          <div className={styles.cityField}>
            <p className={styles.businessSectionLabel}>Which city are you in?</p>
            <label className={styles.businessNameField}>
              <span className={styles.businessNameIconWrap}>
                <MapPin className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </span>
              <input
                type="text"
                autoComplete="address-level2"
                className={styles.businessNameInput}
                placeholder="Toronto, Ontario"
                value={cityLocation}
                onChange={(event) => onCityChange(event.target.value)}
              />
            </label>
          </div>
        </section>
      ) : (
        <p className={styles.businessNamePrompt}>Select your role above first.</p>
      )}
    </div>
  );
}
