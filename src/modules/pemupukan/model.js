import { signedApiFetch } from '../../api/fetch'
import { navigation as sharedNavigation } from '../shared/navigation'
import { loadPaginatedAssignmentList } from '../shared/assignmentListLoader'

function cloneNavigation(items) {
  return items.map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? cloneNavigation(item.children) : undefined
  }))
}

function toDateOnlyString(value) {
  if (!value) return ''
  if (value instanceof Date) {
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const raw = String(value)
  const direct = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (direct) return `${direct[1]}-${direct[2]}-${direct[3]}`
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const d = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDate(raw) {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function normalizeBlockNames(rawBlocks) {
  if (!Array.isArray(rawBlocks)) return []
  const names = rawBlocks
    .map((block) => {
      if (typeof block === 'string') return block
      if (typeof block === 'number' && Number.isFinite(block)) return `Blok ${block}`
      if (!block || typeof block !== 'object') return ''
      if (block.name) return String(block.name)
      if (block.block_name) return String(block.block_name)
      if (Number.isFinite(block.id)) return `Blok ${block.id}`
      return ''
    })
    .filter(Boolean)
  return [...new Set(names)]
}

function toIsoDateOrEmpty(value) {
  return toDateOnlyString(value || '')
}

function mapSensusDetailItem(sensus, detail) {
  const rawBlocks = Array.isArray(detail?.blocks) ? detail.blocks : []
  const status = detail?.progress_status || sensus?.status || 'draft'
  const sensusDate = toDateOnlyString(sensus?.sensus_date)

  return {
    id: sensus?.id,
    detailId: detail?.id || null,
    sensusDetailId: detail?.id || null,
    sensusId: sensus?.id_sensus || '',
    jobType: detail?.type_of_work?.name || detail?.description || 'Pemupukan',
    groupOfWork: detail?.type_of_work?.group_of_work_name || '',
    blocks: normalizeBlockNames(rawBlocks),
    photo: detail?.photo1 || '',
    startDate: sensusDate,
    endDate: sensusDate,
    startDateFormatted: formatDate(sensusDate),
    endDateFormatted: formatDate(sensusDate),
    actualStartDate: '',
    actualEndDate: '',
    status,
    notes: detail?.description || sensus?.description || '',
    sensusDate,
    sensusDateFormatted: formatDate(sensusDate),
    createdBy: sensus?.created_by || '',
    createdAt: sensus?.created_at || '',
    labors: []
  }
}

function mapSensusToListItems(sensus) {
  const details = Array.isArray(sensus?.details) ? sensus.details : []
  if (details.length === 0) {
    return [
      {
        id: sensus?.id,
        detailId: null,
        sensusDetailId: null,
        sensusId: sensus?.id_sensus || '',
        jobType: 'Pemupukan',
        groupOfWork: 'Pemupukan',
        blocks: [],
        photo: '',
        startDate: toDateOnlyString(sensus?.sensus_date),
        endDate: toDateOnlyString(sensus?.sensus_date),
        startDateFormatted: formatDate(sensus?.sensus_date),
        endDateFormatted: formatDate(sensus?.sensus_date),
        actualStartDate: '',
        actualEndDate: '',
        status: sensus?.status || 'draft',
        notes: sensus?.description || '',
        sensusDate: toDateOnlyString(sensus?.sensus_date),
        sensusDateFormatted: formatDate(sensus?.sensus_date),
        createdBy: sensus?.created_by || '',
        createdAt: sensus?.created_at || '',
        labors: []
      }
    ]
  }

  return details.map((detail) => mapSensusDetailItem(sensus, detail))
}

function pickDateRangeFromPlans(plans = []) {
  const starts = plans.map((item) => toIsoDateOrEmpty(item?.start_date)).filter(Boolean).sort()
  const ends = plans.map((item) => toIsoDateOrEmpty(item?.end_date)).filter(Boolean).sort()
  return {
    startDate: starts[0] || '',
    endDate: ends.length ? ends[ends.length - 1] : ''
  }
}

async function loadPlanningRowsBySensusDetail(sensusId, detailId) {
  const params = new URLSearchParams()
  params.set('idSensus', sensusId)
  if (detailId) params.set('sensusDetailId', String(detailId))
  params.set('limit', '200')

  const query = params.toString() ? `?${params.toString()}` : ''
  const resp = await signedApiFetch(`/planning${query}`, { method: 'GET' })
  const rows = Array.isArray(resp.data) ? resp.data : []

  return rows.filter((row) => {
    const sameSensus = String(row?.id_sensus || '') === String(sensusId || '')
    const sameDetail = detailId ? Number(row?.sensus_detail_id) === Number(detailId) : true
    return sameSensus && sameDetail
  })
}

async function loadLaborsByPlanIds(planIds = []) {
  const uniquePlanIds = [...new Set(planIds.map(Number).filter((id) => Number.isInteger(id)))]
  if (uniquePlanIds.length === 0) return []

  const responses = await Promise.all(
    uniquePlanIds.map(async (planId) => {
      const resp = await signedApiFetch(`/labor?plan_id=${planId}&limit=200`, { method: 'GET' })
      return Array.isArray(resp.data) ? resp.data : []
    })
  )

  return responses.flat()
}

function mapLaborItem(laborRow, plansById) {
  const planId = Number(laborRow?.plan_id)
  const planning = laborRow?.planning || plansById.get(planId) || null

  return {
    id: laborRow?.id,
    planId: Number.isInteger(planId) ? planId : null,
    userId: laborRow?.user_id || '',
    avatar_uri: laborRow?.avatar_uri || '',
    username: laborRow?.user_id || '',
    firstName: laborRow?.first_name || '',
    lastName: laborRow?.last_name || '',
    notes: laborRow?.notes || '',
    workDate: toIsoDateOrEmpty(laborRow?.point_date),
    pointDate: toIsoDateOrEmpty(laborRow?.point_date),
    status: Number(laborRow?.is_selected) === 0 ? 'pending' : 'submitted',
    planningStartDate: toIsoDateOrEmpty(planning?.start_date),
    planningEndDate: toIsoDateOrEmpty(planning?.end_date)
  }
}

export function createPemupukanModel() {
  return {
    getNavigation() {
      return cloneNavigation(sharedNavigation)
    },

    getHeader() {
      return {
        title: 'Pemupukan',
        notifications: 0
      }
    },

    getIntro() {
      return {
        title: 'Penugasan Pemupukan',
        description: 'Daftar sensus pemupukan kebun berdasarkan data lapangan.'
      }
    }
  }
}

export async function loadPemupukanList(filters = {}) {
  const result = await loadPaginatedAssignmentList({
    groupOfWork: 3,
    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    sort: filters.sort,
    search: filters.search,
    mapSensusToListItems,
  })

  // Load labor data for each item to display worker count
  result.items = await Promise.all(
    result.items.map(async (item) => {
      try {
        const planningRows = await loadPlanningRowsBySensusDetail(item.sensusId, item.sensusDetailId)
        // Use the same labor endpoint as the detail page so the table count matches it.
        const laborRows = await loadLaborsByPlanIds(planningRows.map((plan) => plan.id))
        const allLabors = laborRows.length
          ? laborRows
          : planningRows.flatMap((plan) => Array.isArray(plan.labors) ? plan.labors : [])
        return { ...item, labors: allLabors }
      } catch (error) {
        console.error(`Failed to load labors for item ${item.sensusId}:`, error)
        return item
      }
    })
  )

  return result
}

export async function loadPemupukanDetail(sensusId, detailId = null) {
  const resp = await signedApiFetch(`/sensus/${sensusId}`, { method: 'GET' })
  if (!resp.data) return null
  const details = Array.isArray(resp.data.details) ? resp.data.details : []
  if (details.length === 0) {
    const fallback = mapSensusToListItems(resp.data)
    return fallback[0] || null
  }

  const selectedDetail = detailId
    ? details.find((detail) => Number(detail.id) === Number(detailId)) || details[0]
    : details[0]

  const baseItem = mapSensusDetailItem(resp.data, selectedDetail)
  const planningRows = await loadPlanningRowsBySensusDetail(baseItem.sensusId, selectedDetail?.id)
  const plansById = new Map(planningRows.map((row) => [Number(row.id), row]))
  const laborRows = await loadLaborsByPlanIds(planningRows.map((row) => row.id))
  const planningLaborsById = new Map(
    planningRows
      .flatMap((row) => Array.isArray(row?.labors) ? row.labors : [])
      .map((labor) => [Number(labor?.id), labor])
  )
  const dateRange = pickDateRangeFromPlans(planningRows)

  return {
    ...baseItem,
    startDate: dateRange.startDate || baseItem.startDate,
    endDate: dateRange.endDate || baseItem.endDate,
    startDateFormatted: formatDate(dateRange.startDate || baseItem.startDate),
    endDateFormatted: formatDate(dateRange.endDate || baseItem.endDate),
    plans: planningRows,
    labors: laborRows.map((row) => mapLaborItem({
      ...row,
      avatar_uri: row?.avatar_uri || planningLaborsById.get(Number(row?.id))?.avatar_uri || ''
    }, plansById))
  }
}


