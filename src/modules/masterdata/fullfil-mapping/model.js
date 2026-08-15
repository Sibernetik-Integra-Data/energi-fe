import { signedApiFetch } from '../../../api/fetch'

const BASE = '/fullfil_mapping'

export async function listFullfil({ page = 1, limit = 100 } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  const response = await signedApiFetch(`${BASE}?${query}`, { method: 'GET' })
  return { data: response.data || [], meta: response.meta || {} }
}

export async function listTypeOfWork() {
  const response = await signedApiFetch('/type_of_work', { method: 'GET' })
  return response.data || []
}

export async function listTypeOfNeed() {
  const response = await signedApiFetch('/type_of_need', { method: 'GET' })
  return response.data || []
}

export async function createFullfil(payload) {
  const response = await signedApiFetch(BASE, { method: 'POST', body: JSON.stringify(payload) })
  return response.data || null
}

export async function updateFullfil(id, payload) {
  const response = await signedApiFetch(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  return response.data || null
}

export function deleteFullfil(id) {
  return signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}
