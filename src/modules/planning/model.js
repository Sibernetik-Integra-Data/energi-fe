import { signedApiFetch } from '../../api/fetch'
import { navigation as sharedNavigation } from '../shared/navigation'

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

// Map a planning API row to the shape expected by the Gantt chart
function mapPlanningItem(p) {
  const rawBlocks = Array.isArray(p.blocks) ? p.blocks : p.sensus_detail?.blocks

  return {
    id: p.id,
    sensusDetailId: p.sensus_detail_id,
    sensusId: p.id_sensus || '',
    jobType: p.sensus_detail?.type_of_work?.name || '',
    groupOfWork: p.sensus_detail?.type_of_work?.group_of_work_name || '',
    blocks: normalizeBlockNames(rawBlocks),
    startDate: toDateOnlyString(p.start_date),
    endDate: toDateOnlyString(p.end_date),
    actualStartDate: toDateOnlyString(p.actual_start_date),
    actualEndDate: toDateOnlyString(p.actual_end_date),
    status: p.status || '',
    notes: p.notes || ''
  }
}

export async function loadPlannings(filters = {}) {
  const params = new URLSearchParams()
  if (filters.idSensus) params.set('idSensus', filters.idSensus)
  if (filters.page) params.set('page', filters.page)
  if (filters.limit) params.set('limit', filters.limit)
  const query = params.toString() ? `?${params.toString()}` : ''
  const resp = await signedApiFetch(`/planning${query}`, { method: 'GET' })
  const rows = Array.isArray(resp.data) ? resp.data : []
  return rows.map(mapPlanningItem)
}

export async function createPlanning(payload) {
  const resp = await signedApiFetch('/planning', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return resp.data ? mapPlanningItem(resp.data) : null
}

export async function updatePlanning(id, payload) {
  const resp = await signedApiFetch(`/planning/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return resp.data ? mapPlanningItem(resp.data) : null
}

export async function deletePlanning(id) {
  return signedApiFetch(`/planning/${id}`, { method: 'DELETE' })
}

export async function loadSensusOptions() {
  const resp = await signedApiFetch('/sensus', { method: 'GET' })
  const rows = Array.isArray(resp.data) ? resp.data : []
  return rows.map(r => ({
    value: r.id_sensus,
    label: r.id_sensus
  }))
}

export async function loadSensusDetails(idSensus) {
  const params = new URLSearchParams({ id_sensus: idSensus })
  const resp = await signedApiFetch(`/sensus/detail?${params.toString()}`, { method: 'GET' })
  // Response is grouped by sensus: [{id_sensus, details: [{id, type_of_work, description, ...}]}]
  const groups = Array.isArray(resp.data) ? resp.data : []
  const options = []
  for (const group of groups) {
    const details = Array.isArray(group.details) ? group.details : []
    for (const d of details) {
      const activity = d.type_of_work?.name || ''
      const desc = d.description || ''
      const blocks = normalizeBlockNames(d.blocks)
      const label = activity && desc
        ? `${activity} — ${desc}`
        : activity || desc || `Detail #${d.id}`
      options.push({ value: d.id, label, blocks })
    }
  }
  return options
}

export async function loadAktifitasOptions() {
  const resp = await signedApiFetch('/type_of_work', { method: 'GET' })
  const rows = Array.isArray(resp.data) ? resp.data : []
  return rows.map(r => ({ value: r.id, label: r.name }))
}

export function createPlanningModel() {
  const navigation = cloneNavigation(sharedNavigation)

  const header = {
    title: 'Perencanaan',
    eyebrow: 'Planning',
    notifications: 3
  }

  const intro = {
    title: 'Perencanaan',
    description: 'Rencanakan dan pantau jadwal aktivitas kebun secara visual menggunakan tampilan Gantt.'
  }

  return {
    getNavigation() {
      return cloneNavigation(navigation)
    },
    getHeader() {
      return { ...header }
    },
    getIntro() {
      return { ...intro }
    }
  }
}
