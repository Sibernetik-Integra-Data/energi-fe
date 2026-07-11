import { signedApiFetch } from '../../../api/fetch'

const BASE = '/type_of_accept'

export async function listTypeOfAccept() {
  const resp = await signedApiFetch(BASE, { method: 'GET' })
  return resp.data || []
}

export async function getTypeOfAccept(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
  return resp.data || null
}

export async function createTypeOfAccept(payload) {
  const resp = await signedApiFetch(BASE, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function updateTypeOfAccept(id, payload) {
  const resp = await signedApiFetch(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
  return resp.data || null
}

export async function deleteTypeOfAccept(id) {
  const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
  return resp
}
