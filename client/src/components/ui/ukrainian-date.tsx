import React from 'react';
import { 
  formatUkrainianDate, 
  formatShortUkrainianDate, 
  formatShortUkrainianDateTime,
  formatTime,
  getRelativeDate,
  isToday,
  isYesterday
} from '@/lib/date-utils';
import { cn } from '@/lib/utils';

interface UkrainianDateProps {
  date: Date | string | null | undefined;
  format?: 'full' | 'short' | 'time' | 'datetime' | 'relative';
  className?: string;
  showRelative?: boolean;
  fallback?: string;
}

/**
 * Компонент для відображення дат у українському форматі
 */
export function UkrainianDate({ 
  date, 
  format = 'short', 
  className,
  showRelative = false,
  fallback = ''
}: UkrainianDateProps) {
  if (!date) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  const formatDate = () => {
    if (showRelative && (isToday(date) || isYesterday(date))) {
      return getRelativeDate(date);
    }

    switch (format) {
      case 'full':
        return formatUkrainianDate(date, false, false);
      case 'short':
        return formatShortUkrainianDate(date);
      case 'time':
        return formatTime(date);
      case 'datetime':
        return formatShortUkrainianDateTime(date);
      case 'relative':
        return getRelativeDate(date);
      default:
        return formatShortUkrainianDate(date);
    }
  };

  return (
    <span className={cn("whitespace-nowrap", className)}>
      {formatDate()}
    </span>
  );
}

/**
 * Компонент для відображення діапазону дат
 */
interface UkrainianDateRangeProps {
  startDate: Date | string | null | undefined;
  endDate: Date | string | null | undefined;
  format?: 'full' | 'short';
  className?: string;
  separator?: string;
}

export function UkrainianDateRange({
  startDate,
  endDate,
  format = 'short',
  className,
  separator = ' - '
}: UkrainianDateRangeProps) {
  if (!startDate && !endDate) {
    return null;
  }

  const formatSingle = format === 'full' ? formatUkrainianDate : formatShortUkrainianDate;

  if (!startDate) {
    return (
      <span className={cn("whitespace-nowrap", className)}>
        до {formatSingle(endDate)}
      </span>
    );
  }

  if (!endDate) {
    return (
      <span className={cn("whitespace-nowrap", className)}>
        від {formatSingle(startDate)}
      </span>
    );
  }

  return (
    <span className={cn("whitespace-nowrap", className)}>
      {formatSingle(startDate)}{separator}{formatSingle(endDate)}
    </span>
  );
}

/**
 * Компонент для відображення часу з українським форматуванням
 */
interface UkrainianTimeProps {
  date: Date | string | null | undefined;
  className?: string;
  showSeconds?: boolean;
}

export function UkrainianTime({ 
  date, 
  className,
  showSeconds = false 
}: UkrainianTimeProps) {
  if (!date) return null;

  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return null;

  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = showSeconds ? `:${d.getSeconds().toString().padStart(2, '0')}` : '';

  return (
    <span className={cn("font-mono", className)}>
      {hours}:{minutes}{seconds}
    </span>
  );
}