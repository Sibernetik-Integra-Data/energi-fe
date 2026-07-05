import { signedApiFetch } from '../../../api/fetch'

const BASE = '/vehicle'

export async function listVehicles() {
	const resp = await signedApiFetch(BASE, { method: 'GET' })
	return resp.data || []
}

export async function getVehicle(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
	return resp.data || null
}

export async function createVehicle(payload) {
	const resp = await signedApiFetch(BASE, {
		method: 'POST',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function updateVehicle(id, payload) {
	const resp = await signedApiFetch(`${BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function deleteVehicle(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
	return resp
}
