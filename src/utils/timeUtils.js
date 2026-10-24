/**
 * Time manipulation and interval subtraction utilities
 */

/**
 * Normalizes any time string (e.g., '07:00 pm', '7 pm', '19:00', '19:30:00', '08:15 am', '10am')
 * to minutes from midnight (0..1439).
 * Returns -1 if invalid.
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  const clean = timeStr.trim().toLowerCase();

  // Match 12-hour format e.g. "7:30 pm", "07:30pm", "7 pm", "7pm", "12:15 am"
  const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const meridian = match12[3];

    if (meridian === 'pm' && hours < 12) hours += 12;
    if (meridian === 'am' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Match 24-hour format e.g. "19:00", "19:30:00", "07:30"
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return -1;
}

/**
 * Converts minutes from midnight to a 12-hour formatted string e.g. "07:30 PM"
 */
export function minutesToTimeString(minutes) {
  if (minutes < 0 || minutes == null) return '';
  const totalMins = minutes % 1440;
  let hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const meridian = hours >= 12 ? 'PM' : 'AM';

  let displayHours = hours % 12;
  if (displayHours === 0) displayHours = 12;

  const hh = displayHours.toString().padStart(2, '0');
  const mm = mins.toString().padStart(2, '0');
  return `${hh}:${mm} ${meridian}`;
}

/**
 * Converts minutes from midnight to a 24-hour formatted string e.g. "19:30"
 */
export function minutesTo24H(minutes) {
  if (minutes < 0 || minutes == null) return '';
  const totalMins = minutes % 1440;
  const hours = Math.floor(totalMins / 60).toString().padStart(2, '0');
  const mins = (totalMins % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

/**
 * Formats a duration in minutes to human-readable format e.g. "30m", "1h", "1h 30m"
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
  if (hrs > 0) return `${hrs}h`;
  return `${mins}m`;
}

/**
 * Performs interval subtraction.
 * Given an initial available window [start, end] and a list of occupied intervals [oStart, oEnd],
 * subtracts all occupied intervals and returns the remaining free sub-intervals.
 *
 * Example:
 * Window: 19:00 - 22:00 (1140..1320)
 * Occupied: 19:30 - 20:30 (1170..1230)
 * Result:
 * [1140..1170] (19:00 - 19:30)
 * [1230..1320] (20:30 - 22:00)
 *
 * @param {Array<{start: number, end: number, id?: string, raw?: any}>} availableWindows
 * @param {Array<{start: number, end: number, id?: string, raw?: any}>} occupiedIntervals
 * @returns {Array<{start: number, end: number, origStart: number, origEnd: number, duration: number, isSplit: boolean, cutByAssignId?: string}>}
 */
export function subtractIntervals(availableWindows, occupiedIntervals) {
  const remaining = [];

  for (const win of availableWindows) {
    if (win.start >= win.end) continue;

    // Filter occupied intervals that overlap with this window
    const overlapping = occupiedIntervals
      .filter(occ => occ.start < win.end && occ.end > win.start)
      .map(occ => ({
        start: Math.max(win.start, occ.start),
        end: Math.min(win.end, occ.end),
        id: occ.id,
        raw: occ.raw
      }))
      .sort((a, b) => a.start - b.start);

    if (overlapping.length === 0) {
      // Entire window is free
      remaining.push({
        start: win.start,
        end: win.end,
        origStart: win.start,
        origEnd: win.end,
        origAvailId: win.id,
        duration: win.end - win.start,
        isSplit: false,
        cutByAssignId: null
      });
      continue;
    }

    // Progressively slice the window
    let currentPointer = win.start;

    for (const occ of overlapping) {
      if (occ.start > currentPointer) {
        // Free interval before this class starts
        remaining.push({
          start: currentPointer,
          end: occ.start,
          origStart: win.start,
          origEnd: win.end,
          origAvailId: win.id,
          duration: occ.start - currentPointer,
          isSplit: true,
          cutByAssignId: occ.id
        });
      }
      currentPointer = Math.max(currentPointer, occ.end);
    }

    // Trailing interval after the last class ends
    if (currentPointer < win.end) {
      remaining.push({
        start: currentPointer,
        end: win.end,
        origStart: win.start,
        origEnd: win.end,
        origAvailId: win.id,
        duration: win.end - currentPointer,
        isSplit: true,
        cutByAssignId: overlapping[overlapping.length - 1].id
      });
    }
  }

  return remaining;
}
