import { formatUkrainianDate, formatUkrainianDateTime, formatUkrainianTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

interface DateDisplayProps {
  date: string | Date | null | undefined;
  format?: "date" | "datetime" | "time";
  className?: string;
  fallback?: string;
}

export function DateDisplay({ 
  date, 
  format = "date", 
  className, 
  fallback = "—" 
}: DateDisplayProps) {
  if (!date) {
    return <span className={cn("text-muted-foreground", className)}>{fallback}</span>;
  }

  let formattedDate: string;
  
  switch (format) {
    case "datetime":
      formattedDate = formatUkrainianDateTime(date);
      break;
    case "time":
      formattedDate = formatUkrainianTime(date);
      break;
    default:
      formattedDate = formatUkrainianDate(date);
  }

  if (!formattedDate) {
    return <span className={cn("text-muted-foreground", className)}>{fallback}</span>;
  }

  return <span className={className}>{formattedDate}</span>;
}

// Зручні компоненти для різних форматів
export function DateOnly({ date, className, fallback }: Omit<DateDisplayProps, "format">) {
  return <DateDisplay date={date} format="date" className={className} fallback={fallback} />;
}

export function DateTime({ date, className, fallback }: Omit<DateDisplayProps, "format">) {
  return <DateDisplay date={date} format="datetime" className={className} fallback={fallback} />;
}

export function TimeOnly({ date, className, fallback }: Omit<DateDisplayProps, "format">) {
  return <DateDisplay date={date} format="time" className={className} fallback={fallback} />;
}