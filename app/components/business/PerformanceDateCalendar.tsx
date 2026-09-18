"use client";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useAnchoredMenu } from "@/app/hooks/use-anchored-menu";
import {
  buildActivityDateKey,
  currentActivityDateKey,
  formatActivityDateLabel,
  getEarliestSelectableActivityMonth,
  isActivityDateSelectable,
  parseActivityDateKey,
} from "@/app/lib/activity-month-filter";
import { automationEase } from "@/app/lib/motion";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronDown } from "lucide-react";
import dayjs, { type Dayjs } from "dayjs";

const calendarTheme = createTheme({
  palette: {
    primary: { main: "#1877f2" },
  },
});

function dateValueToDayjs(value: string): Dayjs {
  const parsed = parseActivityDateKey(value);
  if (!parsed) return dayjs(currentActivityDateKey());
  return dayjs(new Date(parsed.year, parsed.month - 1, parsed.day));
}

export function PerformanceDateCalendar({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (dateKey: string) => void;
  className?: string;
}) {
  const selectedLabel = formatActivityDateLabel(value);
  const {
    open,
    setOpen,
    mounted,
    anchorRef,
    menuRef,
    menuPosition,
    menuStyle,
  } = useAnchoredMenu({
    width: 340,
    align: "right",
    estimatedHeight: 390,
  });

  const minDate = dayjs(getEarliestSelectableActivityMonth());
  const maxDate = dayjs(currentActivityDateKey());

  const menu =
    open && menuPosition && mounted ? (
      <div ref={menuRef}>
        <motion.div
          role="dialog"
          aria-label="Choose date"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.24, ease: automationEase }}
          style={menuStyle}
          className="overflow-hidden rounded-[1.1rem] border border-[#e8edf5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
        >
          <ThemeProvider theme={calendarTheme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                value={dateValueToDayjs(value)}
                minDate={minDate}
                maxDate={maxDate}
                showDaysOutsideCurrentMonth
                fixedWeekNumber={6}
                onChange={(next: Dayjs | null) => {
                  if (!next) return;
                  const dateKey = buildActivityDateKey(
                    next.year(),
                    next.month() + 1,
                    next.date(),
                  );
                  if (!isActivityDateSelectable(dateKey)) return;
                  onChange(dateKey);
                  setOpen(false);
                }}
              />
            </LocalizationProvider>
          </ThemeProvider>
        </motion.div>
      </div>
    ) : null;

  return (
    <div ref={anchorRef} className={className}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Choose date"
        className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-2 text-[0.75rem] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/15 ${
          open
            ? "border-[#1877f2]/35 bg-[#f4f8ff] text-[#1877f2]"
            : "border-[#e8edf5] bg-[#f8fafc] text-slate-700 hover:border-[#1877f2]/35 hover:bg-[#f4f8ff] hover:text-[#1877f2]"
        }`}
      >
        <Calendar className="size-3.5 shrink-0 text-[#1877f2]" aria-hidden />
        <span className="max-w-[10rem] truncate">{selectedLabel}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.24, ease: automationEase }}
          className="shrink-0 text-slate-400"
        >
          <ChevronDown className="size-3.5" aria-hidden />
        </motion.span>
      </button>
      <AnimatePresence>{menu}</AnimatePresence>
    </div>
  );
}
