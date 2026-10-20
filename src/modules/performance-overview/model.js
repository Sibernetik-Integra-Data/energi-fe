import { signedApiFetch } from '../../api/fetch'
import { listPekerja } from '../masterdata/pekerja/model'

export const PERFORMANCE_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function getDefaultPerformancePeriod() {
  const today = new Date()
  return { month: today.getMonth() + 1, year: today.getFullYear() }
}

function asDateOnly(value) {
  if (!value) return ''
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}-${match[2]}-${match[3]}`
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}

function groupNameOf(labor) {
  const type = labor?.planning?.sensus_detail?.type_of_work || {}
  const group = type.group_of_work
  return String(type.group_of_work_name || (typeof group === 'object' ? group?.name : group) || '').trim()
}

function categoryOf(labor) {
  const type = labor?.planning?.sensus_detail?.type_of_work || {}
  const label = `${groupNameOf(labor)} ${type.name || ''}`.toLowerCase()
  if (label.includes('bersih')) return 'cleaning'
  if (label.includes('pupuk') || label.includes('pemupukan') || label.includes('fertiliz')) return 'fertilizing'
  if (label.includes('panen') || label.includes('harvest')) return 'harvest'
  return 'other'
}

export function mapLaborReport(row, planOverride = null) {
  const plan = row?.planning || planOverride || {}
  const detail = plan?.sensus_detail || {}
  const type = detail?.type_of_work || {}
  const blocks = Array.isArray(detail.blocks) ? detail.blocks : Array.isArray(plan.blocks) ? plan.blocks : []

  return {
    id: row?.id,
    userId: String(row?.user_id || ''),
    firstName: row?.first_name || '',
    lastName: row?.last_name || '',
    avatar_uri: row?.avatar_uri || '',
    date: asDateOnly(row?.point_date || row?.date_plan || plan?.actual_start_date || plan?.start_date),
    workName: type.name || detail.description || '—',
    groupOfWork: groupNameOf(row) || '—',
    category: categoryOf(row),
    sensusId: plan.id_sensus || detail.id_sensus || '—',
    planId: row?.plan_id || plan.id || null,
    status: row?.status || plan.status || '',
    labor: {
      ...row,
      userId: String(row?.user_id || ''),
      firstName: row?.first_name || '',
      lastName: row?.last_name || '',
      avatar_uri: row?.avatar_uri || '',
      pointDate: asDateOnly(row?.point_date),
      workDate: asDateOnly(row?.point_date),
      blocks: blocks.map((block) => typeof block === 'string' ? block : block?.name || block?.block_name || '').filter(Boolean),
      fullfilMappings: Array.isArray(type.fullfil_mappings) ? type.fullfil_mappings : [],
      planningStartDate: asDateOnly(plan.start_date),
      planningEndDate: asDateOnly(plan.end_date),
      laborImages: row?.labor_images || {},
      status: row?.status || plan.status || ''
    },
    plan: {
      ...plan,
      blocks: blocks.map((block) => typeof block === 'string' ? block : block?.name || block?.block_name || '').filter(Boolean),
      fullfilMappings: Array.isArray(type.fullfil_mappings) ? type.fullfil_mappings : [],
      startDate: asDateOnly(plan.start_date),
      endDate: asDateOnly(plan.end_date)
    }
  }
}

async function loadRawLaborRows(userId = '') {
  const allRows = []
  const limit = 500
  let page = 1
  let total = Infinity

  while (allRows.length < total) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (userId) params.set('user_id', userId)
    const response = await signedApiFetch(`/labor?${params.toString()}`, { method: 'GET' })
    const rows = Array.isArray(response.data) ? response.data : []
    allRows.push(...rows)
    const reportedTotal = Number(response.meta?.total)
    total = Number.isFinite(reportedTotal) ? reportedTotal : allRows.length
    if (rows.length < limit || rows.length === 0) break
    page += 1
  }

  return allRows
}

async function loadPlanningRows() {
  const allRows = []
  const limit = 500
  let page = 1
  let total = Infinity

  while (allRows.length < total) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    const response = await signedApiFetch(`/planning?${params.toString()}`, { method: 'GET' })
    const rows = Array.isArray(response.data) ? response.data : []
    allRows.push(...rows)
    const reportedTotal = Number(response.meta?.total)
    total = Number.isFinite(reportedTotal) ? reportedTotal : allRows.length
    if (rows.length < limit || rows.length === 0) break
    page += 1
  }

  return allRows
}

export async function loadPerformanceOverviewData() {
  const [workersResult, plans, laborRecords] = await Promise.all([
    listPekerja(),
    loadPlanningRows(),
    loadRawLaborRows()
  ])
  const workerById = new Map(workersResult.data.map((worker) => [String(worker.user_id), worker]))
  const planById = new Map(plans.map((plan) => [String(plan.id), plan]))
  const laborRows = laborRecords.map((labor) => {
    const plan = planById.get(String(labor.plan_id)) || labor.planning || null
    const worker = workerById.get(String(labor.user_id || '')) || {}
    return mapLaborReport({
      ...labor,
      first_name: labor.first_name || worker.first_name || '',
      last_name: labor.last_name || worker.last_name || '',
      planning: plan
    }, plan)
  }).filter((row) => row.userId)
  return { workers: workersResult.data, laborRows }
}

export async function loadWorkerPerformance(userId) {
  if (!userId) return []
  return (await loadRawLaborRows(String(userId)))
    .map((row) => mapLaborReport(row))
    .filter((row) => row.userId)
}

function matchesPeriod(row, month, year) {
  if (!row.date) return false
  const [rowYear, rowMonth] = row.date.split('-').map(Number)
  return rowYear === Number(year) && rowMonth === Number(month)
}

function countUniqueDays(rows) {
  return new Set(rows.map((row) => row.date).filter(Boolean)).size
}

export function buildWorkerPerformanceRows(workers, laborRows, month, year) {
  const periodRows = laborRows.filter((row) => matchesPeriod(row, month, year))
  const grouped = new Map()
  for (const row of periodRows) {
    if (!grouped.has(row.userId)) grouped.set(row.userId, [])
    grouped.get(row.userId).push(row)
  }

  return workers.map((worker) => {
    const userId = String(worker.user_id || worker.id || '')
    const rows = grouped.get(userId) || []
    const categoryCount = (category) => countUniqueDays(rows.filter((row) => row.category === category))
    return {
      ...worker,
      user_id: userId,
      workDays: countUniqueDays(rows),
      cleaningDays: categoryCount('cleaning'),
      fertilizingDays: categoryCount('fertilizing'),
      harvestDays: categoryCount('harvest'),
      reports: rows
    }
  })
}

export function filterWorkerPerformanceRows(rows, month, year) {
  return rows.filter((row) => matchesPeriod(row, month, year))
}

export function countPerformanceDays(rows) {
  return countUniqueDays(rows)
}

export function formatPerformanceDate(value) {
  const date = asDateOnly(value)
  if (!date) return '—'
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}
