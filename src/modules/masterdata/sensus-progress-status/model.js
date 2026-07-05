import { signedApiFetch } from '../../../api/fetch'

const BASE = '/sensus_progress_status'

export async function listSensusProgressStatus() {
	const resp = await signedApiFetch(BASE, { method: 'GET' })
	return resp.data || []
}

export async function getSensusProgressStatus(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
	return resp.data || null
}

export async function createSensusProgressStatus(payload) {
	const resp = await signedApiFetch(BASE, {
		method: 'POST',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function updateSensusProgressStatus(id, payload) {
	const resp = await signedApiFetch(`${BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function deleteSensusProgressStatus(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
	return resp
}
