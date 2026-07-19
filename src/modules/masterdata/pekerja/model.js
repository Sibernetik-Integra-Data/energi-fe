import { signedApiFetch } from '../../../api/fetch'

/**
 * Fetch all labor records from /labor endpoint.
 * Returns an object { data: [], total: number }.
 */
export async function listPekerja() {
  const resp = await signedApiFetch('/labor', { method: 'GET' })
  return {
    data: resp.data || [],
    total: resp.meta?.total ?? (resp.data?.length ?? 0)
  }
}
