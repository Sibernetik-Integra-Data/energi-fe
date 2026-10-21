import { signedApiFetch } from '../../api/fetch'

export const AUDIT_PAGE_SIZES = [5, 10, 20]

export async function getAuditEvents({ limit = 10, cursor, filters = {} } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) params.set(key, String(value).trim())
  })
  const response = await signedApiFetch(`/audit-events?${params.toString()}`, { method: 'GET' })
  return {
    rows: Array.isArray(response.data) ? response.data : [],
    meta: response.meta || {}
  }
}

export async function getAuditEvent(id, createdAt) {
  const params = new URLSearchParams({ created_at: createdAt })
  const response = await signedApiFetch(`/audit-events/${encodeURIComponent(id)}?${params.toString()}`, { method: 'GET' })
  return response.data || null
}

export function filterAuditEvents(rows, search, sortOrder) {
  const needle = String(search || '').trim().toLocaleLowerCase('id-ID')
  return [...rows]
    .filter((row) => !needle || [
      row.module, row.action, row.entity_type, row.entity_id, row.actor_id,
      row.outcome, row.reason_code, row.source, row.request_id, row.correlation_id, row.operation_id
    ].some((value) => String(value || '').toLocaleLowerCase('id-ID').includes(needle)))
    .sort((a, b) => {
      const compared = String(a.created_at || '').localeCompare(String(b.created_at || ''))
      return sortOrder === 'oldest' ? compared : -compared
    })
}

export function formatAuditDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Jakarta'
  }).format(date)
}

export function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
