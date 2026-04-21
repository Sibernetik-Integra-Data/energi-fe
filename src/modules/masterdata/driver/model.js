import { signedApiFetch } from '../../../api/fetch'

const BASE = '/driver'

export async function listDrivers() {
	const resp = await signedApiFetch(BASE, { method: 'GET' })
	return resp.data || []
}

export async function getDriver(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
	return resp.data || null
}

export async function createDriver(payload) {
	const resp = await signedApiFetch(BASE, {
		method: 'POST',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function updateDriver(id, payload) {
	const resp = await signedApiFetch(`${BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function deleteDriver(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
	return resp
}

export async function listVehicles() {
	const resp = await signedApiFetch('/vehicle', { method: 'GET' })
	return resp.data || []
}
