"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4 bg-background rounded-lg shadow-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-6",
        caption: "flex justify-center pt-2 pb-4 relative items-center border-b",
        caption_label: "text-base font-semibold dark:text-white text-black",
        nav: "space-x-2 h-10 flex items-center text-white dark:bg-white/70 rounded-md",
        nav_button: cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-8 w-8 p-0 text-white",
          "hover:bg-accent/50 text-white",
          "dark:bg-gray-600 dark:hover:bg-gray-500 bg-gray-200 hover:bg-gray-300 text-white"
        ),
        nav_button_previous: "absolute left-2",
        nav_button_next: "absolute right-2",
        table: "w-full border-collapse",
        head_row: "flex w-full mt-2",
        head_cell: cn(
          "font-medium text-xs uppercase tracking-wider w-10 h-10 flex items-center justify-center",
          "text-gray-600 dark:text-gray-300"
        ),
        row: "flex w-full mt-1",
        cell: cn(
          "w-10 h-10 flex items-center justify-center p-0 relative",
          "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
        ),
        day: cn(
          "h-8 w-8 p-0 font-normal rounded-full",
          "hover:bg-accent/50 dark:text-white text-black",
          "focus:bg-accent focus:text-accent-foreground focus:outline-none",
          "aria-selected:opacity-100"
        ),
        day_selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          "focus:bg-primary focus:text-primary-foreground"
        ),
        day_today: cn(
          "bg-accent/50 text-accent-foreground",
          "before:absolute before:w-1 before:h-1 before:bottom-1 before:left-1/2",
          "before:-translate-x-1/2 before:rounded-full before:bg-primary"
        ),
        day_outside: "text-muted-foreground/50 opacity-50",
        day_disabled: "text-muted-foreground/50 opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
      }}
      components={{
        IconLeft: () => (
          <ChevronLeft className="h-4 w-4 stroke-current text-black dark:text-white" />
        ),
        IconRight: () => (
          <ChevronRight className="h-4 w-4 stroke-current text-black dark:text-white" />
        ),
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
