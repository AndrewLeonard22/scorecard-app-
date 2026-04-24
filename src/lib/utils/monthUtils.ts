import { format, startOfMonth, endOfMonth, getDaysInMonth as dfnsDaysInMonth, parseISO, differenceInDays } from 'date-fns'

export function getCurrentMonth(): string {
  return format(startOfMonth(new Date()), 'yyyy-MM')
}

export function getMonthLabel(month: string): string {
  return format(parseISO(month + '-01'), 'MMMM yyyy')
}

export function getMonthShortLabel(month: string): string {
  return format(parseISO(month + '-01'), 'MMM yyyy')
}

export function prevMonth(month: string): string {
  const d = parseISO(month + '-01')
  d.setMonth(d.getMonth() - 1)
  return format(d, 'yyyy-MM')
}

export function nextMonth(month: string): string {
  const d = parseISO(month + '-01')
  d.setMonth(d.getMonth() + 1)
  return format(d, 'yyyy-MM')
}

export function isMonthLocked(month: string): boolean {
  const now = new Date()
  const monthDate = parseISO(month + '-01')
  const lockDate = new Date(
    endOfMonth(monthDate).getFullYear(),
    endOfMonth(monthDate).getMonth() + 1,
    5
  )
  return now >= lockDate
}

export function isCurrentMonth(month: string): boolean {
  return month === getCurrentMonth()
}

export function isFutureMonth(month: string): boolean {
  return month > getCurrentMonth()
}

export function getDaysElapsed(month: string): number {
  if (!isCurrentMonth(month)) {
    return getDaysInMonth(month)
  }
  const now = new Date()
  const start = startOfMonth(now)
  return differenceInDays(now, start) + 1
}

export function getDaysInMonth(month: string): number {
  return dfnsDaysInMonth(parseISO(month + '-01'))
}

export function getMonthRange(month: string): { start: string; end: string } {
  const d = parseISO(month + '-01')
  return {
    start: format(startOfMonth(d), 'yyyy-MM-dd'),
    end: format(endOfMonth(d), 'yyyy-MM-dd'),
  }
}

export function getRecentMonths(count: number): string[] {
  const months: string[] = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    months.push(format(startOfMonth(d), 'yyyy-MM'))
    d.setMonth(d.getMonth() - 1)
  }
  return months
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

export function getStalenessColor(lastSavedAt: string | null): string | null {
  if (!lastSavedAt) return '#DC2626' // never saved = red
  const diffDays = Math.floor((Date.now() - new Date(lastSavedAt).getTime()) / 86400000)
  if (diffDays <= 7) return null // normal, use default muted color
  if (diffDays <= 14) return '#EAB308' // yellow
  return '#DC2626' // red
}

export function getStalenessLabel(lastSavedAt: string | null): string {
  if (!lastSavedAt) return 'Never updated'
  const diffDays = Math.floor((Date.now() - new Date(lastSavedAt).getTime()) / 86400000)
  if (diffDays === 0) return 'Updated today'
  if (diffDays === 1) return 'Updated yesterday'
  return `Last updated ${diffDays} days ago`
}
