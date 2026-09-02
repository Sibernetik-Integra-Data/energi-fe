export function normalizeAccess(source) {
  const raw = source?.access ?? source?.jobs ?? source?.jobTitle ?? ''
  if (Array.isArray(raw)) return String(raw[0] || '').trim()
  return String(raw || '').trim()
}

export function isOwnerAccess(source) {
  return normalizeAccess(source).toLowerCase() === 'owner'
}
