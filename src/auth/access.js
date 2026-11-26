export function normalizeAccess(source) {
  const raw = source?.access ?? source?.jobs ?? source?.jobTitle ?? ''
  if (Array.isArray(raw)) return String(raw[0] || '').trim()
  return String(raw || '').trim()
}

// Roles allowed to receive a harvest shipment or cancel a receipt. This only
// decides what the screen offers; the server checks the role on every request.
const HARVEST_RECEIVER_ACCESS = ['admin', 'kepala kebun', 'owner']

export function canReceiveHarvest(source) {
  return HARVEST_RECEIVER_ACCESS.includes(normalizeAccess(source).toLowerCase())
}

// Roles allowed to create, edit or delete a planning (DEP-01, 26 Nov 2026).
// Matches ROLE_PLANNING_WRITE on the server, which still checks every request.
const PLANNING_WRITER_ACCESS = ['owner', 'admin', 'kepala kebun', 'asisten kebun', 'assisten kebun']

export function canManagePlanning(source) {
  return PLANNING_WRITER_ACCESS.includes(normalizeAccess(source).toLowerCase())
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
