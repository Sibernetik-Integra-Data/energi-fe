export function normalizeAccess(source) {
  const raw = source?.access ?? source?.jobs ?? source?.jobTitle ?? ''
  if (Array.isArray(raw)) return String(raw[0] || '').trim()
  return String(raw || '').trim()
}

export function isOwnerAccess(source) {
  return normalizeAccess(source).toLowerCase() === 'owner'
}

export function canViewAuditLog(source) {
  const values = [source?.access, source?.jobs, source?.jobTitle]
    .flatMap(raw => Array.isArray(raw) ? raw : String(raw || '').split(','))
    .map(value => String(value || '').trim().toLowerCase())
  return values.some(value => value === 'owner' || value === 'admin')
}
