import { format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function dateInputToUtc(dateStr, timezone) {
  if (!dateStr) return '';
  const utcDate = fromZonedTime(dateStr + 'T00:00:00', timezone);
  return utcDate.toISOString();
}

export function utcToDateInput(iso, timezone, dateFormat = 'yyyy-MM-dd') {
  if (!iso) return '';
  const zoned = toZonedTime(iso, timezone);
  return format(zoned, dateFormat);
}
