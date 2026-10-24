/**
 * Date manipulation, weekday mapping, and week cycle evaluation
 */

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

/**
 * Normalizes weekday string (e.g., "mon", "Monday ", "TUESDAY") to title-cased full name
 */
export function normalizeWeekday(dayStr) {
  if (!dayStr || typeof dayStr !== 'string') return '';
  const clean = dayStr.trim().toLowerCase();
  for (const day of WEEKDAYS) {
    if (day.toLowerCase().startsWith(clean.slice(0, 3))) {
      return day;
    }
  }
  return '';
}

/**
 * Parses dates formatted as YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
 */
export function parseDateFlexible(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const clean = dateStr.trim();

  // Match ISO YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    return new Date(year, month, day);
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day);
  }

  const timestamp = Date.parse(clean);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Generates an array of date descriptor objects for the rolling window
 * @param {Date|string} refDate - Starting date (defaults to today)
 * @param {number} daysCount - Default 7
 */
export function getRollingWindowDates(refDate = new Date(), daysCount = 7) {
  let baseDate = typeof refDate === 'string' ? parseDateFlexible(refDate) : refDate;
  if (!baseDate || isNaN(baseDate.getTime())) {
    baseDate = new Date();
  }
  // normalize to midnight local time
  baseDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  const today = new Date();
  const todayStr = formatDateISO(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  const dates = [];
  for (let i = 0; i < daysCount; i++) {
    const curr = new Date(baseDate);
    curr.setDate(baseDate.getDate() + i);

    const dateStr = formatDateISO(curr);
    const weekday = WEEKDAYS[curr.getDay()];
    const dayOfMonth = curr.getDate();
    const monthName = curr.toLocaleString('default', { month: 'short' });

    dates.push({
      dateObj: curr,
      dateStr,
      weekday,
      dayOfMonth,
      monthName,
      label: `${weekday.slice(0, 3)} ${dayOfMonth} ${monthName}`,
      isToday: dateStr === todayStr
    });
  }

  return dates;
}

/**
 * Checks if a teacher allocation is scheduled/active on a specific date in the rolling window
 *
 * Factors in:
 *  1. Status: Must be ongoing (Blank, 'Active') or 'HOLD' (per user specification)
 *  2. Days: Matches the weekday
 *  3. Start Date: date >= Start Date
 *  4. End Date Req: if present, date <= End Date Req
 *  5. Week Cycle:
 *     - Cycle 1: every week
 *     - Cycle 2: alternate weeks (week 1 ON, week 2 OFF, week 3 ON...)
 *     - Cycle 3: every 3rd week (week 1 ON, week 2 OFF, week 3 OFF, week 4 ON...)
 */
export function isAllocationActiveOnDate(alloc, targetDateObj) {
  const status = (alloc.Status || '').trim().toLowerCase();
  // 'Closed' allocations do not occupy the teacher
  if (status === 'closed' || status === 'completed' || status === 'inactive') {
    return false;
  }

  // Check weekday match
  const allocDays = (alloc.Days || '')
    .split(',')
    .map(d => normalizeWeekday(d))
    .filter(Boolean);

  if (allocDays.length > 0 && !allocDays.includes(targetDateObj.weekday)) {
    return false;
  }

  // Check Start Date
  const startDate = parseDateFlexible(alloc['Start Date']);
  if (startDate) {
    if (targetDateObj.dateObj < startDate) {
      return false;
    }
  }

  // Check End Date Req if specified
  const endDate = parseDateFlexible(alloc['End Date Req']);
  if (endDate) {
    if (targetDateObj.dateObj > endDate) {
      return false;
    }
  }

  // Check Week Cycle
  const cycleVal = parseInt(alloc['Week Cycle'], 10);
  const cycle = isNaN(cycleVal) || cycleVal <= 1 ? 1 : cycleVal;

  if (cycle > 1 && startDate) {
    // Calculate week difference from startDate
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diffWeeks = Math.floor((targetDateObj.dateObj.getTime() - startDate.getTime()) / msPerWeek);
    if (diffWeeks >= 0) {
      if (diffWeeks % cycle !== 0) {
        return false;
      }
    }
  }

  return true;
}
