import { signedApiFetch } from '../../../api/fetch'

// TPH per petak (DT-06): jenis PERAWATAN/PANEN, sisi U/S/US, nomor jalur, jumlah pohon.
const BASE = '/tph'

export async function listTph() {
  const resp = await signedApiFetch(BASE, { method: 'GET' })
  return resp.data || []
}

export async function createTph(payload) {
  const resp = await signedApiFetch(BASE, { method: 'POST', body: JSON.stringify(payload) })
  return resp.data || null
}

export async function updateTph(id, payload) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  return resp.data || null
}

export async function deleteTph(id) {
  return signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}

/** Petak untuk dropdown (Master Data → Nomor Petak). */
export async function listPetakOptions() {
  const resp = await signedApiFetch('/block', { method: 'GET' })
  return resp.data || []
}
