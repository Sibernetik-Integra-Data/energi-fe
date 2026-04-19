import { getAuthenticatedUser, getAccessToken } from '../../auth/keycloak'
import { navigation as sharedNavigation } from '../shared/navigation'
import { apiFetch } from '../../api/fetch'

function cloneNavigation(items) {
  return items.map((item) => ({
    ...item,
    children: Array.isArray(item.children) ? cloneNavigation(item.children) : undefined
  }))
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

  return {
    getNavigation() { return cloneNavigation(navigation) },
    getHeader() { return { ...header, user: { ...getAuthenticatedUser() } } },
    getList() { return { ...list } },
    getStats() { return { ...stats } },
    loadRows
  }
}
