export const PLANNING_DEFAULT_DAYS_COUNT = 31
export const PLANNING_DEFAULT_DAYS_BACK = 10

export function getTodayInJakarta() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

export function toDateOnly(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export function isoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysToIso(iso, n) {
  return isoDate(addDays(toDateOnly(iso), n))
}

/** Default Gantt / date-filter window: N days back from today (Jakarta), total 31 days inclusive. */
export function createDefaultPlanningDateRange({
  daysBack = PLANNING_DEFAULT_DAYS_BACK,
  totalDays = PLANNING_DEFAULT_DAYS_COUNT,
  todayIso = getTodayInJakarta()
} = {}) {
  const start = addDaysToIso(todayIso, -daysBack)
  const end = addDaysToIso(start, totalDays - 1)
  return { start, end }
}

export function isSamePlanningDateRange(a, b) {
  if (!a || !b) return false
  return a.start === b.start && a.end === b.end
}

export function planOverlapsDateRange(plan, rangeStart, rangeEnd) {
  if (!rangeStart || !rangeEnd) return true
  if (!plan?.startDate || !plan?.endDate) return false
  return plan.startDate <= rangeEnd && plan.endDate >= rangeStart
}
