import { signedApiFetch } from '../../../api/fetch'

const BASE = '/location'
const TYPE_OF_LOCATION_BASE = '/type_of_location'

export async function listLocations() {
	const resp = await signedApiFetch(BASE, { method: 'GET' })
	return resp.data || []
}

export async function getLocation(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'GET' })
	return resp.data || null
}

export async function createLocation(payload) {
	const body = { ...payload }
	if (!body.nomor) body.nomor = 1
	const resp = await signedApiFetch(BASE, {
		method: 'POST',
		body: JSON.stringify(body)
	})
	return resp.data || null
}

export async function updateLocation(id, payload) {
	const resp = await signedApiFetch(`${BASE}/${id}`, {
		method: 'PUT',
		body: JSON.stringify(payload)
	})
	return resp.data || null
}

export async function deleteLocation(id) {
	const resp = await signedApiFetch(`${BASE}/${id}`, { method: 'DELETE' })
	return resp
}

export async function listTypeOfLocations() {
	const resp = await signedApiFetch(TYPE_OF_LOCATION_BASE, { method: 'GET' })
	return resp.data || []
}
