"use client";

import { DayPicker } from "react-day-picker";
import { format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

interface DatePickerProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  disabledDates?: Date[];
  availableDays?: number[]; // 0-6 for days of week with availability
  minDate?: Date;
  className?: string;
}

export function DatePicker({
  selected,
  onSelect,
  disabledDates = [],
  availableDays,
  minDate,
  className,
}: DatePickerProps) {
  const today = startOfDay(new Date());
  const effectiveMinDate = minDate || today;

  const disableMatcher = (date: Date) => {
    // Disable past dates
    if (isBefore(date, effectiveMinDate)) {
      return true;
    }

    // Disable days not in business availability
    if (availableDays && availableDays.length > 0 && !availableDays.includes(date.getDay())) {
      return true;
    }

    // Disable specific dates (exceptions, holidays)
    if (disabledDates.some((d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"))) {
      return true;
    }

    return false;
  };

  return (
    <div className={cn("p-3 bg-white rounded-lg border", className)}>
      <DayPicker
        mode="single"
        selected={selected}
        onSelect={onSelect}
        disabled={disableMatcher}
        showOutsideDays={false}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          month_caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          button_previous: cn(
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent"
          ),
          button_next: cn(
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent"
          ),
          month_grid: "w-full border-collapse space-y-1",
          weekdays: "flex",
          weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          week: "flex w-full mt-2",
          day: "h-9 w-9 text-center text-sm p-0 relative",
          day_button: cn(
            "h-9 w-9 p-0 font-normal rounded-md",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:bg-accent focus:text-accent-foreground focus:outline-none"
          ),
          selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
          outside: "text-muted-foreground opacity-50",
          today: "bg-accent text-accent-foreground font-semibold",
        }}
      />
    </div>
  );
}
