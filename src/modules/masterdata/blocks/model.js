import { signedApiFetch } from '../../../api/fetch'

const BASE = '/block'

export async function listBlocks() {
  const resp = await signedApiFetch(BASE, { method: 'GET' })
  return resp.data || []
}

export async function getBlock(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
  return resp.data || null
}

export async function createBlock(payload) {
  const resp = await signedApiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function updateBlock(id, payload) {
  const resp = await signedApiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function deleteBlock(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
  return resp
}
