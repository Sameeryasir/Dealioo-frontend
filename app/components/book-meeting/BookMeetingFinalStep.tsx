"use client";

import {
  MEETING_TIME_SLOTS,
  isBookableMeetingDay,
  latestBookableMeetingDay,
  meetingDateKey,
  meetingSlotMinutes,
  meetingSlotStillOpen,
  nextOpenMeeting,
} from "@/app/components/book-meeting/book-meeting-config";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./BookMeetingForm.module.css";

export type BookMeetingFinalStepProps = {
  meetingDate: string;
  meetingTime: string;
  meetingDuration: 15 | 30;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onDurationChange: (value: 15 | 30) => void;
  onTimeZoneChange: (value: string) => void;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function monthCells(year: number, month: number) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];
  for (let index = 0; index < firstWeekday; index += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function clockLabel(slot: string) {
  const [hourText, minuteText] = slot.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "pm" : "am";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minuteText} ${suffix}`;
}

function localZoneLabel(now: Date) {
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZoneName: "long",
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(now);
  const zone = parts.find((part) => part.type === "timeZoneName")?.value ?? "Local time";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";
  const dayPeriod = (parts.find((part) => part.type === "dayPeriod")?.value ?? "").toLowerCase();
  return `${zone} (${hour}:${minute} ${dayPeriod})`.trim();
}

export function BookMeetingFinalStep({
  meetingDate,
  meetingTime,
  meetingDuration,
  onDateChange,
  onTimeChange,
  onDurationChange,
  onTimeZoneChange,
}: BookMeetingFinalStepProps) {
  const [now, setNow] = useState(() => new Date());
  const today = startOfDay(now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone) onTimeZoneChange(zone);
  }, [onTimeZoneChange]);

  useEffect(() => {
    if (meetingSlotStillOpen(meetingDate, meetingTime, now)) return;
    const picked = nextOpenMeeting(now);
    if (picked.date === meetingDate && picked.time === meetingTime) return;
    onDateChange(picked.date);
    onTimeChange(picked.time);
  }, [meetingDate, meetingTime, now, onDateChange, onTimeChange]);

  const selected = meetingDate ? startOfDay(new Date(`${meetingDate}T00:00:00`)) : null;
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const basis = selected ?? today;
    return new Date(basis.getFullYear(), basis.getMonth(), 1);
  });

  useEffect(() => {
    if (!selected) return;
    setVisibleMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [meetingDate]);

  const cells = useMemo(
    () => monthCells(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth],
  );
  const monthName = visibleMonth.toLocaleDateString(undefined, { month: "long" });
  const atCurrentMonth =
    visibleMonth.getFullYear() === today.getFullYear() &&
    visibleMonth.getMonth() === today.getMonth();
  const horizon = latestBookableMeetingDay(now);
  const atLastMonth =
    visibleMonth.getFullYear() === horizon.getFullYear() &&
    visibleMonth.getMonth() === horizon.getMonth();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const dateHeading = (selected ?? today).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const chooseDay = (date: Date) => {
    const day = startOfDay(date);
    onDateChange(meetingDateKey(day));
    if (!meetingSlotStillOpen(meetingDateKey(day), meetingTime, now)) {
      const upcoming = MEETING_TIME_SLOTS.find((slot) => meetingSlotMinutes(slot) >= nowMinutes);
      onTimeChange(meetingDateKey(day) === meetingDateKey(today) ? upcoming ?? "" : MEETING_TIME_SLOTS[0]);
    }
  };

  return (
    <div className={styles.finalStep}>
      <section className={styles.meetCard} aria-label="Choose a meeting day and time">
        <div className={styles.meetSide}>
          <p className={styles.meetTitle}>Pick a time</p>
          <p className={styles.meetSubtitle}>Choose a day that works for you</p>

          <div className={styles.meetMonthNav}>
            <button
              type="button"
              className={styles.meetMonthArrow}
              aria-label="Previous month"
              disabled={atCurrentMonth}
              onClick={() =>
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
            </button>
            <p className={styles.meetMonthName}>{monthName}</p>
            <button
              type="button"
              className={styles.meetMonthArrow}
              aria-label="Next month"
              disabled={atLastMonth}
              onClick={() =>
                setVisibleMonth(
                  (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div className={styles.meetWeekdays} aria-hidden>
            {WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className={styles.meetDays} role="grid" aria-label={monthName}>
            {cells.map((date, index) => {
              if (!date) return <span key={`empty-${index}`} />;
              const value = meetingDateKey(date);
              const disabled = !isBookableMeetingDay(date, now);
              const isSelected = value === meetingDate;
              return (
                <button
                  key={value}
                  type="button"
                  role="gridcell"
                  disabled={disabled}
                  aria-selected={isSelected}
                  aria-current={value === meetingDateKey(today) ? "date" : undefined}
                  className={[
                    styles.meetDay,
                    disabled ? styles.meetDayMuted : styles.meetDayOpen,
                    isSelected ? styles.meetDaySelected : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => chooseDay(date)}
                >
                  <span>{date.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.meetMain}>
          <p className={styles.meetDatePill}>{dateHeading}</p>

          <p className={styles.meetLabel}>Duration</p>
          <div className={styles.meetDuration} role="group" aria-label="Duration">
            {([15, 30] as const).map((minutes) => (
              <button
                key={minutes}
                type="button"
                aria-pressed={meetingDuration === minutes}
                className={`${styles.meetDurationButton}${meetingDuration === minutes ? ` ${styles.meetDurationSelected}` : ""}`}
                onClick={() => onDurationChange(minutes)}
              >
                {minutes} min
              </button>
            ))}
          </div>

          <p className={styles.meetLabel}>Time</p>
          <p className={styles.meetZone}>
            <span>{localZoneLabel(now)}</span>
            <ChevronDown className="size-3.5" strokeWidth={2} aria-hidden />
          </p>

          <div className={styles.meetTimes} role="listbox" aria-label={`Times on ${dateHeading}`}>
            {MEETING_TIME_SLOTS.map((slot) => {
              const selectedTime = Boolean(meetingDate) && meetingTime === slot;
              const passed = !meetingSlotStillOpen(meetingDate || meetingDateKey(today), slot, now);
              return (
                <button
                  key={slot}
                  type="button"
                  role="option"
                  aria-selected={selectedTime}
                  disabled={!meetingDate || passed}
                  className={`${styles.meetTime}${selectedTime ? ` ${styles.meetTimeSelected}` : ""}`}
                  onClick={() => onTimeChange(selectedTime ? "" : slot)}
                >
                  {clockLabel(slot)}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
