import { signedApiFetch } from '../../../api/fetch'

const BASE = '/type_of_work'

export async function listTypeOfWork() {
	const resp = await signedApiFetch(BASE, { method: 'GET' })
	return resp.data || []
}

export async function getTypeOfWork(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
	return resp.data || null
}

export async function createTypeOfWork(payload) {
	const resp = await signedApiFetch(BASE, {
		method: 'POST',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function updateTypeOfWork(id, payload) {
	const resp = await signedApiFetch(`${BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function deleteTypeOfWork(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
	return resp
}

export async function listGroupOfWork() {
	const resp = await signedApiFetch('/group_of_work', { method: 'GET' })
	return resp.data || []
}
