import { signedApiFetch } from '../../api/fetch'
import { navigation as sharedNavigation } from '../shared/navigation'
import { resolveUsernames } from '../../utils/userCache'

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

function isPemupukan(item) {
  const typeOfWork = item?.sensus_detail?.type_of_work
  const groupOfWorkName = (typeOfWork?.group_of_work_name || '').toLowerCase()
  const typeOfWorkName = (typeOfWork?.name || '').toLowerCase()
  return (
    groupOfWorkName.includes('pemupuk') ||
    groupOfWorkName.includes('pupuk') ||
    groupOfWorkName.includes('fertiliz') ||
    typeOfWorkName.includes('pemupuk') ||
    typeOfWorkName.includes('pupuk') ||
    typeOfWorkName.includes('fertiliz')
  )
}

function mapPlanItem(p) {
  const rawBlocks = Array.isArray(p.blocks) ? p.blocks : p.sensus_detail?.blocks
  return {
    id: p.id,
    sensusDetailId: p.sensus_detail_id,
    sensusId: p.id_sensus || '',
    jobType: p.sensus_detail?.type_of_work?.name || 'Pemupukan',
    groupOfWork: p.sensus_detail?.type_of_work?.group_of_work_name || '',
    blocks: normalizeBlockNames(rawBlocks),
    startDate: toDateOnlyString(p.start_date),
    endDate: toDateOnlyString(p.end_date),
    startDateFormatted: formatDate(p.start_date),
    endDateFormatted: formatDate(p.end_date),
    actualStartDate: toDateOnlyString(p.actual_start_date),
    actualEndDate: toDateOnlyString(p.actual_end_date),
    status: p.status || 'draft',
    notes: p.notes || '',
    sensusDate: toDateOnlyString(p.sensus_detail?.created_at),
    sensusDateFormatted: formatDate(p.sensus_detail?.created_at),
    createdBy: p.created_by || '',
    createdAt: p.created_at || '',
    labors: Array.isArray(p.labors)
      ? p.labors.map((l) => ({
          id: l.id,
          planId: l.plan_id,
          userId: l.user_id || '',
          notes: l.notes || '',
          username: ''
        }))
      : []
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
        description: 'Daftar penugasan pemupukan kebun berdasarkan data perencanaan.'
      }
    }
  }
}

export async function loadPemupukanList(filters = {}) {
  const params = new URLSearchParams()
  if (filters.idSensus) params.set('idSensus', filters.idSensus)
  params.set('limit', '200')
  const query = params.toString() ? `?${params.toString()}` : ''
  const resp = await signedApiFetch(`/planning${query}`, { method: 'GET' })
  const rows = Array.isArray(resp.data) ? resp.data : []
  const allItems = rows.map(mapPlanItem)

  // Filter to only pemupukan items (client-side)
  const filtered = allItems.filter((item) => {
    const rawRow = rows.find((r) => r.id === item.id)
    return isPemupukan(rawRow)
  })

  // Resolve usernames for all labors
  const allUserIds = filtered.flatMap((item) => item.labors.map((l) => l.userId)).filter(Boolean)
  const usernameMap = await resolveUsernames(allUserIds)

  return filtered.map((item) => ({
    ...item,
    labors: item.labors.map((l) => ({
      ...l,
      username: usernameMap.get(l.userId) || l.userId || ''
    }))
  }))
}

export async function loadPemupukanDetail(planId) {
  const resp = await signedApiFetch(`/planning/${planId}`, { method: 'GET' })
  if (!resp.data) return null
  const item = mapPlanItem({ ...resp.data, labors: resp.data.labors || [] })

  // Resolve usernames
  const userIds = item.labors.map((l) => l.userId).filter(Boolean)
  const usernameMap = await resolveUsernames(userIds)

  return {
    ...item,
    labors: item.labors.map((l) => ({
      ...l,
      username: usernameMap.get(l.userId) || l.userId || ''
    }))
  }
}


