import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Extend dayjs with plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

// Set default timezone (you can change this to your preferred timezone)
// For India: 'Asia/Kolkata'
const DEFAULT_TIMEZONE = 'Asia/Kolkata'

/**
 * Get dayjs instance with UTC support
 */
export function getDayjs(date?: string | number | Date | dayjs.Dayjs) {
  return dayjs(date)
}

/**
 * Format date in UTC
 */
export function formatUTC(
  date: string | number | Date,
  format: string = 'YYYY-MM-DD'
): string {
  return dayjs.utc(date).format(format)
}

/**
 * Format date in local timezone
 */
export function formatLocal(
  date: string | number | Date,
  format: string = 'YYYY-MM-DD',
  timezone: string = DEFAULT_TIMEZONE
): string {
  return dayjs.utc(date).tz(timezone).format(format)
}

/**
 * Get start of day in UTC
 */
export function startOfDayUTC(date?: string | number | Date): dayjs.Dayjs {
  const d = date ? dayjs.utc(date) : dayjs.utc()
  return d.startOf('day')
}

/**
 * Get end of day in UTC
 */
export function endOfDayUTC(date?: string | number | Date): dayjs.Dayjs {
  const d = date ? dayjs.utc(date) : dayjs.utc()
  return d.endOf('day')
}

/**
 * Get start of month in UTC
 */
export function startOfMonthUTC(date?: string | number | Date): dayjs.Dayjs {
  const d = date ? dayjs.utc(date) : dayjs.utc()
  return d.startOf('month')
}

/**
 * Get end of month in UTC
 */
export function endOfMonthUTC(date?: string | number | Date): dayjs.Dayjs {
  const d = date ? dayjs.utc(date) : dayjs.utc()
  return d.endOf('month')
}

/**
 * Parse date string and convert to UTC ISO string
 */
export function parseToUTC(dateString: string, format?: string): string {
  if (format) {
    return dayjs(dateString, format).utc().toISOString()
  }
  return dayjs.utc(dateString).toISOString()
}

/**
 * Format date for display (localized)
 */
export function formatDateDisplay(
  date: string | number | Date,
  format: string = 'DD/MM/YYYY',
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatLocal(date, format, timezone)
}

/**
 * Format date and time for display (localized)
 */
export function formatDateTimeDisplay(
  date: string | number | Date,
  format: string = 'DD/MM/YYYY HH:mm:ss',
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatLocal(date, format, timezone)
}

/**
 * Get current date in UTC ISO string
 */
export function getCurrentUTCISO(): string {
  return dayjs.utc().toISOString()
}

/**
 * Get current date formatted for filename
 */
export function getCurrentDateForFilename(): string {
  return dayjs.utc().format('YYYY-MM-DD')
}

export default dayjs









