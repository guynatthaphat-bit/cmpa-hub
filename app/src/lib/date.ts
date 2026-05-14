import { format, formatDistance, parseISO } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

export const TZ = 'Asia/Bangkok'
export const BE_OFFSET = 543

export type DateSystem = 'BE' | 'CE'
export type Locale = 'th-TH' | 'en-US'

/** Convert a Date to Bangkok timezone (does not change the absolute moment). */
export function toBangkok(date: Date | string): Date {
  return toZonedTime(typeof date === 'string' ? parseISO(date) : date, TZ)
}

/** Format date for Thai display — e.g. "13 พ.ค. 2569" */
export function formatThaiDate(
  date: Date | string,
  opts: { system?: DateSystem; format?: 'short' | 'medium' | 'long' } = {},
): string {
  const { system = 'BE', format: fmt = 'medium' } = opts
  const d = typeof date === 'string' ? parseISO(date) : date

  const yearAdjustment = system === 'BE' ? BE_OFFSET : 0
  const adjustedDate = new Date(d)
  adjustedDate.setFullYear(d.getFullYear() + yearAdjustment)

  const pattern =
    fmt === 'long' ? 'd MMMM yyyy' : fmt === 'short' ? 'd/M/yy' : 'd MMM yyyy'

  return formatInTimeZone(adjustedDate, TZ, pattern, { locale: th })
}

/** Format date for English display */
export function formatEnDate(
  date: Date | string,
  fmt: 'short' | 'medium' | 'long' = 'medium',
): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const pattern =
    fmt === 'long' ? 'd MMMM yyyy' : fmt === 'short' ? 'd/M/yy' : 'd MMM yyyy'
  return formatInTimeZone(d, TZ, pattern, { locale: enUS })
}

export function formatDate(
  date: Date | string,
  opts: { locale?: Locale; system?: DateSystem; format?: 'short' | 'medium' | 'long' } = {},
): string {
  const { locale = 'th-TH', system = 'BE', format: fmt = 'medium' } = opts
  return locale === 'th-TH'
    ? formatThaiDate(date, { system, format: fmt })
    : formatEnDate(date, fmt)
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatInTimeZone(d, TZ, 'HH:mm')
}

export function formatDateTime(
  date: Date | string,
  opts: { locale?: Locale; system?: DateSystem } = {},
): string {
  return `${formatDate(date, opts)} · ${formatTime(date)}`
}

export function formatRelative(date: Date | string, locale: Locale = 'th-TH'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistance(d, new Date(), {
    addSuffix: true,
    locale: locale === 'th-TH' ? th : enUS,
  })
}

/** Current year as a Buddhist Era number */
export function currentBEYear(): number {
  return new Date().getFullYear() + BE_OFFSET
}

/** Quarter label like "2569-Q2" */
export function quarterLabel(date: Date = new Date(), system: DateSystem = 'BE'): string {
  const year = date.getFullYear() + (system === 'BE' ? BE_OFFSET : 0)
  const q = Math.floor(date.getMonth() / 3) + 1
  return `${year}-Q${q}`
}

/** Month label like "2569-05" */
export function monthLabel(date: Date = new Date(), system: DateSystem = 'BE'): string {
  const year = date.getFullYear() + (system === 'BE' ? BE_OFFSET : 0)
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${m}`
}
