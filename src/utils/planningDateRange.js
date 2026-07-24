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

export function getCurrentPlanningMonth(todayIso = getTodayInJakarta()) {
  return String(todayIso).slice(0, 7)
}

/** Returns the complete calendar month for a YYYY-MM value. */
export function createPlanningMonthDateRange(monthIso = getCurrentPlanningMonth()) {
  const [year, month] = String(monthIso).split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return createPlanningMonthDateRange(getCurrentPlanningMonth())
  }

  const lastDay = new Date(year, month, 0).getDate()
  return {
    start: `${year}-${String(month).padStart(2, '0')}-01`,
    end: `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  }
}

/** Default Gantt / date-filter window: the complete current month in Jakarta time. */
export function createDefaultPlanningDateRange() {
  return createPlanningMonthDateRange(getCurrentPlanningMonth())
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
