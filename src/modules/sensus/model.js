import { getAuthenticatedUser, getAccessToken } from '../../auth/keycloak'
import { navigation as sharedNavigation } from '../shared/navigation'
import { apiFetch } from '../../api/fetch'

// ─── signed GET helper (mirrors the pattern used in loadRows) ───────────────
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

// ─── Map a t_sensus_detail row to a UI-friendly shape ──────────────────────
function mapDetailItem(d, parentSensus = {}) {
  const sensusData = d.sensus || parentSensus || {}
  return {
    id: d.id,
    sensusId: d.id_sensus || sensusData.id_sensus || '',
    jobType: d.type_of_work?.name || sensusData.type_of_work?.name || sensusData.description || '',
    date: d.sensus_date || sensusData.sensus_date || '',
    blocks: (d.blocks || sensusData.blocks || []).map(b => b.name || `Block ${b.id}`),
    photo: d.photo1 || '',
    extraPhotos: 0,
    progressStatus: d.progress_status || '',
    description: d.description || '',
    rowsNo: d.rows_no || null,
    locationId: d.id_location || null
  }
}

function mapRow(r) {
  let time = ''
  if (r.created_at) {
    const d = new Date(r.created_at)
    if (!Number.isNaN(d.getTime())) {
      time = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
  }
  const firstDetail = Array.isArray(r.details) && r.details.length > 0 ? r.details[0] : null
  return {
    id: r.id_sensus || '',
    numericId: r.id || null,
    worker: r.created_by || '',
    block: (firstDetail && firstDetail.blocks && firstDetail.blocks[0] && firstDetail.blocks[0].name) || '',
    date: r.sensus_date || (firstDetail && firstDetail.sensus_date) || '',
    time,
    jobTypes: firstDetail && firstDetail.type_of_work ? [firstDetail.type_of_work.name] : [],
    status: (firstDetail && firstDetail.progress_status) || r.status || 'Open'
  }
}

export function createSensusModel() {
  const navigation = cloneNavigation(sharedNavigation)

  const header = { title: 'Sensus', notifications: 0 }

  const list = {
    title: 'Daftar Sensus',
    subtitle: 'Laporan terbaru'
  }

  const stats = { total: 0, today: 0, pending: 0 }

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
    return (resp.data || []).map(mapRow)
  }

  async function loadSensusDetail(numericId) {
    // 1. Fetch the sensus header by numeric row ID
    const sensusResp = await signedGet(`/sensus/${numericId}`)
    const sensusData = sensusResp.data || {}

    // Prefer details embedded in the sensus payload (new backend shape)
    let items = []
    if (Array.isArray(sensusData.details) && sensusData.details.length > 0) {
      items = sensusData.details.map((d) => mapDetailItem(d, sensusData))
    } else {
      // Fallback: request detail endpoint (older response shapes)
      const idSensus = sensusData.id_sensus
      if (idSensus) {
        const detailResp = await signedGet(`/sensus/detail?id_sensus=${encodeURIComponent(idSensus)}`)
        const groups = detailResp.data || []
        if (Array.isArray(groups) && groups.length > 0 && Array.isArray(groups[0].details)) {
          items = groups[0].details.map((d) => mapDetailItem(d, groups[0]))
        } else {
          items = (detailResp.data || []).map((d) => mapDetailItem(d))
        }
      }
    }

    return { sensus: sensusData, items }
  }

  return {
    getNavigation() { return cloneNavigation(navigation) },
    getHeader() { return { ...header, user: { ...getAuthenticatedUser() } } },
    getList() { return { ...list } },
    getStats() { return { ...stats } },
    loadRows,
    loadSensusDetail
  }
}
