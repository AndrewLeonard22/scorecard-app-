import { startOfWeek, addDays, format, parseISO, isAfter, isBefore, setHours, setMinutes, setSeconds } from 'date-fns'

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 }) // Monday
}

export function getWeekStartString(date: Date = new Date()): string {
  return format(getWeekStart(date), 'yyyy-MM-dd')
}

// Returns the Monday of the most recently completed week
// (i.e., the week you can submit for on or after the following Monday)
export function getCurrentSubmissionWeek(): Date {
  const now = new Date()
  const thisWeekMonday = getWeekStart(now)
  // If today is Monday, the submittable week is last week's Monday
  const dayOfWeek = now.getDay() // 0=Sun, 1=Mon, ...
  if (dayOfWeek === 1) {
    return addDays(thisWeekMonday, -7)
  }
  return thisWeekMonday
}

export function isSubmitWindowOpen(weekStart: Date): boolean {
  const now = new Date()
  const weekMonday = getWeekStart(weekStart)
  // Window opens the following Monday (weekStart + 7 days) at midnight
  const windowOpen = addDays(weekMonday, 7)
  // Window closes Wednesday 11:59 PM of the week after
  const windowClose = setSeconds(setMinutes(setHours(addDays(weekMonday, 10), 23), 59), 59)
  return isAfter(now, windowOpen) && isBefore(now, windowClose)
}

export function formatWeekLabel(weekStartStr: string): string {
  const d = parseISO(weekStartStr)
  const end = addDays(d, 6)
  return `${format(d, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
}

export function getWeeksBack(n: number): string[] {
  const weeks: string[] = []
  const now = new Date()
  for (let i = n; i >= 1; i--) {
    const d = addDays(getWeekStart(now), -7 * i)
    weeks.push(format(d, 'yyyy-MM-dd'))
  }
  return weeks
}
