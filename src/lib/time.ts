import { format, isValid, parse, set } from "date-fns";

/** Normalize user input to canonical slot format, e.g. "12:00 AM". */
export function normalizeSlotTimeInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase().replace(/\s+/g, " ");

  const match12 = upper.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    const hour = Number(match12[1]);
    const minute = Number(match12[2]);
    const period = match12[3];
    if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
      return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${period}`;
    }
    return null;
  }

  const match24 = upper.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = Number(match24[1]);
    const minute = Number(match24[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      const date = set(new Date(), { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
      return format(date, "hh:mm a");
    }
  }

  return null;
}

/** Convert slot time (12-hour) to value for `<input type="time">` (24-hour HH:mm). */
export function slotTimeToTimeInputValue(slotTime: string): string {
  const normalized = normalizeSlotTimeInput(slotTime);
  if (!normalized) return "10:00";

  const parsed = parse(normalized, "hh:mm a", new Date());
  if (!isValid(parsed)) return "10:00";

  return format(parsed, "HH:mm");
}

/** Convert `<input type="time">` value to canonical slot time. */
export function timeInputValueToSlotTime(value: string): string | null {
  return normalizeSlotTimeInput(value);
}

/** Parse a slot date + start time into a single Date. */
export function parseSlotDateTime(dateStr: string, timeStr: string): Date | null {
  const dateRef = parse(dateStr, "yyyy-MM-dd", new Date());
  if (!isValid(dateRef)) return null;

  const normalized = normalizeSlotTimeInput(timeStr);
  if (!normalized) return null;

  const result = parse(normalized, "hh:mm a", dateRef);
  return isValid(result) ? result : null;
}
