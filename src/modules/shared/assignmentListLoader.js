import { signedApiFetch } from '../../api/fetch'

function parseListMeta(meta, fallback = {}) {
  if (!meta || typeof meta !== 'object') return fallback
  return {
    total: Number(meta.total) || 0,
    page: Number(meta.page) || fallback.page || 1,
    limit: Number(meta.limit) || fallback.limit || 10,
  }
}

export async function loadPaginatedAssignmentList({
  groupOfWork,
  page = 1,
  limit = 10,
  status = 'all',
  sort = 'newest',
  search = '',
  mapSensusToListItems,
}) {
  const params = new URLSearchParams()
  params.set('group_of_work', String(groupOfWork))
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (status && status !== 'all') params.set('progress_status', status)
  if (sort) params.set('sort', sort)
  if (String(search || '').trim()) params.set('q', String(search).trim())

  const resp = await signedApiFetch(`/sensus/detail?${params.toString()}`, { method: 'GET' })
  const rows = Array.isArray(resp.data) ? resp.data : []
  const items = rows.flatMap((sensus) => mapSensusToListItems(sensus))
  const meta = parseListMeta(resp.meta, { page, limit })

  return {
    items,
    total: meta.total,
    page: meta.page,
    limit: meta.limit,
  }
}
