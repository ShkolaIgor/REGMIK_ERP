/**
 * Утиліти для форматування дат у українському форматі
 */

// Українські назви місяців
const UKRAINIAN_MONTHS = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
];

const UKRAINIAN_MONTHS_NOMINATIVE = [
  'січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
  'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'
];

const UKRAINIAN_WEEKDAYS = [
  'неділя', 'понеділок', 'вівторок', 'середа', 'четвер', 'п\'ятниця', 'субота'
];

/**
 * Форматує дату у українському форматі: день місяць рік
 * @param date - Дата для форматування
 * @param includeTime - Чи включати час (за замовчуванням false)
 * @param shortFormat - Використовувати короткий формат (ДД.ММ.РРРР)
 * @returns Відформатована дата
 */
export function formatUkrainianDate(
  date: Date | string | null | undefined,
  includeTime: boolean = false,
  shortFormat: boolean = false
): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  if (shortFormat) {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    
    if (includeTime) {
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    }
    
    return `${day}.${month}.${year}`;
  }
  
  const day = d.getDate();
  const month = UKRAINIAN_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  
  if (includeTime) {
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} року, ${hours}:${minutes}`;
  }
  
  return `${day} ${month} ${year} року`;
}

/**
 * Форматує дату у короткому українському форматі: ДД.ММ.РРРР
 */
export function formatShortUkrainianDate(date: Date | string | null | undefined): string {
  return formatUkrainianDate(date, false, true);
}

/**
 * Форматує дату з часом у українському форматі
 */
export function formatUkrainianDateTime(date: Date | string | null | undefined): string {
  return formatUkrainianDate(date, true, false);
}

/**
 * Форматує дату з часом у короткому українському форматі
 */
export function formatShortUkrainianDateTime(date: Date | string | null | undefined): string {
  return formatUkrainianDate(date, true, true);
}

/**
 * Форматує тільки час
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Повертає відносну дату (сьогодні, вчора, тощо)
 */
export function getRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Сьогодні';
  if (diffDays === -1) return 'Вчора';
  if (diffDays === 1) return 'Завтра';
  if (diffDays > 1 && diffDays <= 7) return `Через ${diffDays} днів`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} днів тому`;
  
  return formatUkrainianDate(d);
}

/**
 * Форматує період між двома датами
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  shortFormat: boolean = false
): string {
  if (!startDate && !endDate) return '';
  if (!startDate) return `до ${formatUkrainianDate(endDate, false, shortFormat)}`;
  if (!endDate) return `від ${formatUkrainianDate(startDate, false, shortFormat)}`;
  
  const start = formatUkrainianDate(startDate, false, shortFormat);
  const end = formatUkrainianDate(endDate, false, shortFormat);
  
  return `${start} - ${end}`;
}

/**
 * Перевіряє чи дата сьогоднішня
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * Перевіряє чи дата вчорашня
 */
export function isYesterday(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear();
}

/**
 * Конвертує дату у формат для input[type="date"]
 */
export function toInputDateValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Конвертує дату у формат для input[type="datetime-local"]
 */
export function toInputDateTimeValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}