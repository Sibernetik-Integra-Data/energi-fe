import { signedApiFetch } from '../../../api/fetch'

const BASE = '/type_of_need'

export async function listTypeOfNeed() {
  const resp = await signedApiFetch(BASE, { method: 'GET' })
  return resp.data || []
}

export async function getTypeOfNeed(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
  return resp.data || null
}

export async function createTypeOfNeed(payload) {
  const resp = await signedApiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function updateTypeOfNeed(id, payload) {
  const resp = await signedApiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function deleteTypeOfNeed(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
  return resp
}
