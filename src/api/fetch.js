const API_BASE = import.meta.env.VITE_API_BASE || ''

export async function apiFetch(path, opts = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts
  })

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const body = await res.json()
    if (!res.ok) throw body
    return body
  }

  if (!res.ok) throw new Error(res.statusText)
  return res.text()
}
