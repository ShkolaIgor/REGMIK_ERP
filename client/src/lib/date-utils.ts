import { format, parseISO, isValid } from "date-fns";
import { uk } from "date-fns/locale";

/**
 * Форматує дату в український формат ДД.ММ.РРРР
 */
export const formatUkrainianDate = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";
    
    return format(dateObj, "dd.MM.yyyy", { locale: uk });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Форматує дату і час в український формат ДД.ММ.РРРР ГГ:ХХ
 */
export const formatUkrainianDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";
    
    return format(dateObj, "dd.MM.yyyy HH:mm", { locale: uk });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Форматує дату і час з секундами в український формат ДД.ММ.РРРР ГГ:ХХ:СС
 */
export const formatUkrainianDateTimeWithSeconds = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";
    
    return format(dateObj, "dd.MM.yyyy HH:mm:ss", { locale: uk });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Форматує тільки час ГГ:ХХ
 */
export const formatUkrainianTime = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";
    
    return format(dateObj, "HH:mm", { locale: uk });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "";
  }
};

/**
 * Форматує дату для input[type="date"] (РРРР-ММ-ДД)
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";
    
    return format(dateObj, "yyyy-MM-dd");
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
};

/**
 * Форматує дату і час для input[type="datetime-local"] (РРРР-ММ-ДДTГГ:ХХ)
 */
export const formatDateTimeForInput = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return "";
    
    return format(dateObj, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error("Error formatting datetime for input:", error);
    return "";
  }
};

/**
 * Конвертує дату з українського формату ДД.ММ.РРРР в Date об'єкт
 */
export const parseUkrainianDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    // Перевіряємо формат ДД.ММ.РРРР
    const regex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = dateString.match(regex);
    
    if (!match) return null;
    
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    if (!isValid(date)) return null;
    
    return date;
  } catch (error) {
    console.error("Error parsing Ukrainian date:", error);
    return null;
  }
};

/**
 * Отримує поточну дату в українському форматі
 */
export const getCurrentUkrainianDate = (): string => {
  return formatUkrainianDate(new Date());
};

/**
 * Отримує поточну дату і час в українському форматі
 */
export const getCurrentUkrainianDateTime = (): string => {
  return formatUkrainianDateTime(new Date());
};