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
function mapDetailItem(d) {
  const sensusData = d.sensus || {}
  return {
    id: d.id,
    sensusId: d.id_sensus || sensusData.id_sensus || '',
    jobType: sensusData.type_of_work?.name || sensusData.description || '',
    date: sensusData.sensus_date || '',
    blocks: (sensusData.blocks || d.blocks || []).map(b => b.name || `Block ${b.id}`),
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
  return {
    id: r.id_sensus || '',
    numericId: r.id || null,
    worker: r.created_by || '',
    block: (r.blocks && r.blocks[0] && r.blocks[0].name) || '',
    date: r.sensus_date || '',
    time,
    jobTypes: r.type_of_work ? [r.type_of_work.name] : [],
    status: r.status || 'Open'
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

    // 2. Fetch all detail items linked to this sensus (using id_sensus string key)
    const idSensus = sensusData.id_sensus
    let items = []
    if (idSensus) {
      const detailResp = await signedGet(`/sensus/detail?id_sensus=${encodeURIComponent(idSensus)}`)
      items = (detailResp.data || []).map(mapDetailItem)
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
