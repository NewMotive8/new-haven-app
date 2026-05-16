/**
 * Convert a Date created in the user's local timezone to a UTC-based Date while preserving
 * the visible time components. A time picked as "19:00" remains "19:00" when sent as an
 * ISO string, avoiding timezone offsets.
 */
export const toUTCDatePreserveTime = (date: Date) =>
  new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds(),
      date.getMilliseconds()
    )
  );

/**
 * Transform an ISO string that represents a UTC timestamp into a Date whose local time
 * matches the UTC components. This keeps the wall-clock value consistent when displayed
 * in controls that operate in the local timezone.
 */
export const fromUTCISOStringToLocalDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();

  return new Date(
    parsed.getUTCFullYear(),
    parsed.getUTCMonth(),
    parsed.getUTCDate(),
    parsed.getUTCHours(),
    parsed.getUTCMinutes(),
    parsed.getUTCSeconds(),
    parsed.getUTCMilliseconds()
  );
};
