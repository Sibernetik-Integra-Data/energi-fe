import { signedApiFetch } from '../../../api/fetch'

const BASE = '/type_of_unit'

export async function listTypeOfUnit() {
  const resp = await signedApiFetch(BASE, { method: 'GET' })
  return resp.data || []
}

export async function getTypeOfUnit(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
  return resp.data || null
}

export async function createTypeOfUnit(payload) {
  const resp = await signedApiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function updateTypeOfUnit(id, payload) {
  const resp = await signedApiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function deleteTypeOfUnit(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
  return resp
}
