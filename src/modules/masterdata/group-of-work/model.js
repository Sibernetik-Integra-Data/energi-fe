import { signedApiFetch } from '../../../api/fetch'

const BASE = '/group_of_work'

export async function listGroupOfWork() {
	const resp = await signedApiFetch(BASE, { method: 'GET' })
	return resp.data || []
}

export async function getGroupOfWork(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
	return resp.data || null
}

export async function createGroupOfWork(payload) {
	const resp = await signedApiFetch(BASE, {
		method: 'POST',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function updateGroupOfWork(id, payload) {
	const resp = await signedApiFetch(`${BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function deleteGroupOfWork(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
	return resp
}
