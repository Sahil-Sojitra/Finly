/**
 * Pure, UTC-based calendar date utilities
 * Guarantees zero timezone offset drift and deterministic day calculations
 */

export function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected YYYY-MM-DD.`);
  }

  return { year, month, day };
}

export function formatUtcDate(year: number, month: number, day: number): string {
  const y = year.toString().padStart(4, '0');
  const m = month.toString().padStart(2, '0');
  const d = day.toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds or subtracts days deterministically from an ISO date string (YYYY-MM-DD)
 */
export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseDateParts(dateStr);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

/**
 * Returns difference in calendar days (date2 - date1)
 */
export function diffInDays(dateStr1: string, dateStr2: string): number {
  const p1 = parseDateParts(dateStr1);
  const p2 = parseDateParts(dateStr2);
  const utc1 = Date.UTC(p1.year, p1.month - 1, p1.day);
  const utc2 = Date.UTC(p2.year, p2.month - 1, p2.day);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay);
}

/**
 * Checks if targetDate is between startDate and endDate (inclusive)
 * If endDate is null, checks if targetDate >= startDate
 */
export function isDateWithinInterval(
  targetDate: string,
  startDate: string,
  endDate: string | null
): boolean {
  if (targetDate < startDate) {
    return false;
  }
  if (endDate !== null && targetDate > endDate) {
    return false;
  }
  return true;
}

/**
 * Formats YYYY-MM-DD into a human-readable string (e.g. "5 Nov 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthName = monthNames[month - 1] ?? '';
  return `${day} ${monthName} ${year}`;
}

/**
 * Formats YYYY-MM-DD into short date (e.g. "05 Nov")
 */
export function formatShortDate(dateStr: string): string {
  const { month, day } = parseDateParts(dateStr);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthName = monthNames[month - 1] ?? '';
  const d = day.toString().padStart(2, '0');
  return `${d} ${monthName}`;
}

/**
 * Formats YYYY-MM-DD into full day, date, month, year (e.g. "Saturday, 7 Nov 2026")
 */
export function formatFullDate(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const dayName = dayNames[utcDate.getUTCDay()] ?? '';
  const monthName = monthNames[month - 1] ?? '';
  return `${dayName}, ${day} ${monthName} ${year}`;
}

/**
 * Returns the short name for day of week (e.g. "Mon", "Tue")
 */
export function formatDayOfWeek(dateStr: string): string {
  const { year, month, day } = parseDateParts(dateStr);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[utcDate.getUTCDay()] ?? '';
}

/**
 * Generates an array of all dates (YYYY-MM-DD) between startDate and endDate (inclusive)
 */
export function generateDateRange(startDate: string, endDate: string): string[] {
  if (startDate > endDate) {
    return [];
  }
  const dates: string[] = [];
  let current = startDate;
  while (current <= endDate) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Returns appropriate greeting based on local hour
 */
export function getGreeting(hour?: number): string {
  const h = hour !== undefined ? hour : new Date().getHours();
  if (h < 12) {
    return 'Good morning';
  }
  if (h < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}


