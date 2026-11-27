import { signedApiFetch } from '../../../api/fetch'

// Blok = data.block_group (mis. 113), pengelompokan petak (113a–113d).
// Petak dikelola di Master Data → Nomor Petak.
const BASE = '/block_group'

export async function listBlocks() {
  const resp = await signedApiFetch(BASE, { method: 'GET' })
  return resp.data || []
}

export async function createBlock(payload) {
  const resp = await signedApiFetch(BASE, { method: 'POST', body: JSON.stringify(payload) })
  return resp.data || null
}

export async function updateBlock(id, payload) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  return resp.data || null
}

export async function deleteBlock(id) {
  return signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}
