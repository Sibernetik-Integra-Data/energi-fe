import { signedApiFetch } from '../../../api/fetch'

/**
 * Fetch all labor records from /labor endpoint.
 * Returns an object { data: [], total: number }.
 */
export async function listPekerja() {
  const resp = await signedApiFetch('/users/access', { method: 'GET' })
  const data = (Array.isArray(resp.data) ? resp.data : []).map((user) => ({
    user_id: user?.sub || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    jabatan: user?.access || ''
  }))

  return {
    data,
    total: resp.meta?.total ?? data.length
  }
}
