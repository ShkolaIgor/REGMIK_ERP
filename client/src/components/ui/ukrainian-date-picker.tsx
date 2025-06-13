import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { formatShortUkrainianDate, toInputDateValue } from "@/lib/date-utils";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface UkrainianDatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function UkrainianDatePicker({
  date,
  onDateChange,
  placeholder = "Оберіть дату",
  className,
  disabled = false,
}: UkrainianDatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);

  React.useEffect(() => {
    setSelectedDate(date);
  }, [date]);

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            formatShortUkrainianDate(selectedDate)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

interface UkrainianDateInputProps {
  date?: Date | null;
  onDateChange?: (date: Date | undefined) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * Компонент для простого вводу дати з HTML input[type="date"]
 * з українським форматуванням
 */
export function UkrainianDateInput({
  date,
  onDateChange,
  className,
  disabled = false,
  placeholder,
}: UkrainianDateInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      onDateChange?.(new Date(value));
    } else {
      onDateChange?.(undefined);
    }
  };

  return (
    <div className="relative">
      <input
        type="date"
        value={date ? toInputDateValue(date) : ""}
        onChange={handleChange}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        disabled={disabled}
        placeholder={placeholder}
      />
      {/* Українське форматування дат активне */}
    </div>
  );
}