const { format } = require('date-fns');
const { fromZonedTime, toZonedTime } = require('date-fns-tz');

function dateInputToUtc(dateStr, timezone) {
  if (!dateStr) return '';
  const utcDate = fromZonedTime(dateStr + 'T00:00:00', timezone);
  return utcDate.toISOString();
}

function utcToDateInput(iso, timezone, dateFormat = 'yyyy-MM-dd') {
  if (!iso) return '';
  const zoned = toZonedTime(iso, timezone);
  return format(zoned, dateFormat);
}

module.exports = { dateInputToUtc, utcToDateInput };
