import { getAuthenticatedUser, getAccessToken } from '../../auth/keycloak'
import { navigation as sharedNavigation } from '../shared/navigation'
import { apiFetch, signedApiFetch } from '../../api/fetch'
import { resolveUsernames } from '../../utils/userCache'
import { loadPanenDetail } from '../panen/model'

// ─── signed GET helper ────────────────────────────────────────────────────────
async function signedGet(path) {
  const sigResp = await apiFetch('/signature/create', {
    method: 'POST',
    body: JSON.stringify({ url: `/api${path}`, method: 'GET' })
  })
  const { signature, uuid, timestamp } = sigResp.data
  const token = getAccessToken()
  const headers = {
    'X-Signature': signature,
    'X-Signature-Timestamp': String(timestamp),
    'X-Signature-UUID': uuid,
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
  return apiFetch(path, { method: 'GET', headers })
}

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

// ─── Friendly date formatter (YYYY-MM-DD or ISO → "13 Apr 2026") ─────────────
function formatDate(raw) {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Map a progress_status value to a normalised UI status ───────────────────
// The API returns: "done" | "wip" | "draft" | "submitted"
// The UI uses these same values; we also support legacy "Open" / "Verified"
function normaliseStatus(raw) {
  if (!raw) return 'draft'
  return raw.toLowerCase()
}

// ─── Map a t_sensus_detail row to a UI-friendly shape ────────────────────────
// parentSensus = the wrapping sensus object (has id_sensus, sensus_date, etc.)
function mapDetailItem(d, parentSensus = {}) {
  return {
    id:              d.id,
    sensusId:        parentSensus.id_sensus || '',
    jobType:         d.type_of_work?.name || '',
    jobTypeDetail:   d.type_of_work?.detail || '',
    groupOfWork:     d.type_of_work?.group_of_work_name || '',
    date:            toDateOnlyString(parentSensus.sensus_date || ''),
    blocks:          (d.blocks || []).map(b => {
      const name = b.name || `Blok ${b.id}`
      return String(name).replace(/^Block\b/i, 'Blok')
    }),
    blocksRaw:       d.blocks || [],
    photo:           d.photo1 || '',
    extraPhotos:     0,
    progressStatus:  normaliseStatus(d.progress_status),
    description:     d.description || '',
    rowsNo:          Array.isArray(d.rows_no) ? d.rows_no : [],
    locationId:      d.id_location || null,
    isUpload:        d.type_of_work?.is_upload ?? 0
  }
}

// ─── Map a sensus list row (GET /sensus) to a table-row shape ────────────────
// A sensus can have multiple details with different job types — we collect all.
function mapRow(r) {
  let time = ''
  if (r.created_at) {
    const d = new Date(r.created_at)
    if (!Number.isNaN(d.getTime())) {
      time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
  }

  const details = Array.isArray(r.details) ? r.details : []

  // Collect ALL unique job-type names across every detail
  const jobTypes = [
    ...new Set(
      details
        .map(d => d.type_of_work?.name)
        .filter(Boolean)
    )
  ]

  // Collect all unique block names across every detail
  const blockNames = [
    ...new Set(
      details.flatMap(d => (d.blocks || []).map(b => b.name || `Block ${b.id}`))
    )
  ]

  // Overall status: derive from the first detail that has one, otherwise 'draft'
  const firstDetailStatus = details.length > 0 ? details[0].progress_status : null
  const status = normaliseStatus(firstDetailStatus)

  return {
    id:         r.id_sensus || '',
    numericId:  r.id || null,
    worker:     r.created_by || '',
    block:      blockNames[0] || '',
    blocks:     blockNames,
    date:       formatDate(r.sensus_date),
    time,
    jobTypes,
    status,
    description: r.description || '',
    detailCount: details.length
  }
}

// ─── Map a planning API row to the shape expected by SensusPlanning ─────────
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

  async function loadSensusPlanning(idSensus) {
  const params = new URLSearchParams()
  if (idSensus) params.set('idSensus', idSensus)
  const query = params.toString() ? `?${params.toString()}` : ''
  const resp = await signedApiFetch(`/planning${query}`, { method: 'GET' })
  const rows = Array.isArray(resp.data) ? resp.data : []
  return rows.map(mapPlanningItem)
}

async function saveSensusPlanning(payload) {
  const resp = await signedApiFetch('/planning', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return resp.data ? mapPlanningItem(resp.data) : null
}

export function createSensusModel() {
  const navigation = cloneNavigation(sharedNavigation)

  const header = { title: 'Sensus', notifications: 0 }

  const list = {
    title: 'Sensus',
    subtitle: 'Meninjau dan memverifikasi laporan lapangan pekerja'
  }

  async function loadSensusRecord(numericId) {
    const resp = await signedGet(`/sensus/${numericId}`)
    const sensusData = resp.data || {}
    let reporter = ''

    try {
      if (sensusData.created_by) {
        const usernameMap = await resolveUsernames([sensusData.created_by])
        reporter = usernameMap.get(sensusData.created_by) || ''
      }
    } catch {
      reporter = ''
    }

    return { ...sensusData, reporter }
  }

  async function loadSensusTaskDetail(sensusId, detailId) {
    return loadPanenDetail(sensusId, detailId)
  }

  const stats = { total: 0, today: 0, pending: 0 }

  // ─── Load the sensus list ───────────────────────────────────────────────────
  async function loadRows() {
    const path = '/sensus?page=1&limit=50'
    const sigResp = await apiFetch('/signature/create', {
      method: 'POST',
      body: JSON.stringify({ url: `/api${path}`, method: 'GET' })
    })
    const { signature, uuid, timestamp } = sigResp.data
    const token = getAccessToken()
    const headers = {
      'X-Signature': signature,
      'X-Signature-Timestamp': String(timestamp),
      'X-Signature-UUID': uuid,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const resp = await apiFetch(path, { method: 'GET', headers })
    const rows = (resp.data || []).map(mapRow)

    // Resolve Keycloak user IDs → display usernames
    try {
      const userIds = rows.map(r => r.worker).filter(Boolean)
      const usernameMap = await resolveUsernames(userIds)
      rows.forEach(r => {
        if (r.worker) r.worker = usernameMap.get(r.worker) || ''
      })
    } catch {
      // Ignore resolution errors — leave worker as-is (raw ID), UI will show empty via fallback
      rows.forEach(r => { if (r.worker) r.worker = '' })
    }

    return rows
  }

  // ─── Load sensus detail ─────────────────────────────────────────────────────
  // The route passes the numeric id (e.g. /sensus/27).
  // New API: GET /sensus/detail?created_by=<user_id>
  //   → returns array of sensus objects each with a details[] array
  // We find the matching sensus by its numeric id, then map all detail rows.
  async function loadSensusDetail(numericId) {
    const user = getAuthenticatedUser()
    const createdBy = user?.sub || user?.id || ''

    let sensusData = null
    let items = []
    let loadedFrom = null

    // ── Strategy 1: fetch the detail list filtered by created_by ─────────────
    if (createdBy) {
      try {
        const detailResp = await signedGet(
          `/sensus/detail?created_by=${encodeURIComponent(createdBy)}`
        )
        const groups = Array.isArray(detailResp.data) ? detailResp.data : []

        // Find the sensus entry whose numeric id matches the route param
        const targetId = Number(numericId)
        const matched = groups.find(g => g.id === targetId)

        if (matched) {
          sensusData = matched
          items = (matched.details || []).map(d => mapDetailItem(d, matched))
          loadedFrom = '/sensus/detail (Strategy 1)'
        }
      } catch (e) {
        console.warn('[SensusModel] detail endpoint failed, falling back', e)
      }
    }

    // ── Strategy 2: fall back to fetching single sensus by id ────────────────
    if (!sensusData) {
      try {
        const sensusResp = await signedGet(`/sensus/${numericId}`)
        sensusData = sensusResp.data || {}
        if (Array.isArray(sensusData.details) && sensusData.details.length > 0) {
          items = sensusData.details.map(d => mapDetailItem(d, sensusData))
          loadedFrom = `/sensus/${numericId} (Strategy 2 - Fallback)`
        }
      } catch (e) {
        console.warn('[SensusModel] single sensus fetch failed', e)
        sensusData = {}
      }
    }

    // ── Defensive check: ensure all items have id field ─────────────────────
    items = items.map((item, idx) => {
      if (!item.id || item.id === undefined) {
        console.warn(
          `[SensusModel] Item ${idx} is missing id field. Data:`,
          item,
          'Loaded from:', loadedFrom
        )
        // Fallback: use sensusId + jobType as compound key for debugging
        return {
          ...item,
          id: item.id || null  // Keep as is, but log warning
        }
      }
      return item
    })

    console.log('[SensusModel] loadSensusDetail complete:', {
      numericId,
      loadedFrom,
      itemsCount: items.length,
      firstItemId: items[0]?.id,
      firstItemJobType: items[0]?.jobType,
      allItemsHaveId: items.every(i => i.id)
    })

    // Resolve reporter username (created_by holds a Keycloak user ID)
    let reporterUsername = ''
    try {
      const createdById = sensusData.created_by || ''
      if (createdById) {
        const usernameMap = await resolveUsernames([createdById])
        reporterUsername = usernameMap.get(createdById) || ''
      }
    } catch {
      reporterUsername = ''
    }

    return {
      sensus: {
        ...sensusData,
        // Expose a formatted date at the top level for SensusDetailInfo
        sensus_date_formatted: formatDate(sensusData.sensus_date),
        // Derive an overall status for the info card (first detail wins)
        status: sensusData.details?.length > 0
          ? normaliseStatus(sensusData.details[0].progress_status)
          : 'draft',
        // Resolved display username (empty string if not found)
        reporter: reporterUsername
      },
      items
    }
  }

  return {
    getNavigation()  { return cloneNavigation(navigation) },
    getHeader()      { return { ...header, user: { ...getAuthenticatedUser() } } },
    getList()        { return { ...list } },
    getStats()       { return { ...stats } },
    loadRows,
    loadSensusDetail,
    loadSensusRecord,
    loadSensusTaskDetail,
    loadSensusPlanning,
    saveSensusPlanning
  }
}
