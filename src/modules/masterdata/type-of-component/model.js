import { signedApiFetch } from '../../../api/fetch'

const BASE = '/type_of_component'

export async function listTypeOfComponent() {
  const resp = await signedApiFetch(BASE, { method: 'GET' })
  return resp.data || []
}

export async function getTypeOfComponent(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
  return resp.data || null
}

export async function createTypeOfComponent(payload) {
  const resp = await signedApiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function updateTypeOfComponent(id, payload) {
  const resp = await signedApiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function deleteTypeOfComponent(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
  return resp
}
