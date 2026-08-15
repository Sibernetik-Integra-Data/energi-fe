import { signedApiFetch } from '../../../api/fetch'

const BASE = '/fullfil_params'

export async function listFullfilParams({ page = 1, limit = 100 } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  const response = await signedApiFetch(`${BASE}?${query}`, { method: 'GET' })
  return { data: response.data || [], meta: response.meta || {} }
}

export async function listFullfilMappings() {
  const response = await signedApiFetch('/fullfil_mapping', { method: 'GET' })
  return response.data || []
}

export async function listTypeOfUnits() {
  const response = await signedApiFetch('/type_of_unit', { method: 'GET' })
  return response.data || []
}

export async function createFullfilParams(payload) {
  const response = await signedApiFetch(BASE, { method: 'POST', body: JSON.stringify(payload) })
  return response.data || null
}

export async function updateFullfilParams(id, payload) {
  const response = await signedApiFetch(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  return response.data || null
}

export function deleteFullfilParams(id) {
  return signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
}
