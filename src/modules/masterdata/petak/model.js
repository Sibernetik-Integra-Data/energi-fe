import { signedApiFetch } from '../../../api/fetch'

// Petak = tabel data.block (mis. 113a). Blok induknya = data.block_group.
const BASE = '/block'

export async function listPetak() {
  const resp = await signedApiFetch(BASE, { method: 'GET' })
  return resp.data || []
}

export async function createPetak(payload) {
  const resp = await signedApiFetch(BASE, { method: 'POST', body: JSON.stringify(payload) })
  return resp.data || null
}

export async function updatePetak(id, payload) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  return resp.data || null
}

export async function deletePetak(id) {
  return signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}

export async function listBlok() {
  const resp = await signedApiFetch('/block_group', { method: 'GET' })
  return resp.data || []
}
