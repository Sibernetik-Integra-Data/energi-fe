const API_PREFIX = import.meta.env.VITE_API_PREFIX || ''
const SIGNING_SECRET = import.meta.env.VITE_SIGNING_SECRET || ''
const ACCESS_TOKEN_KEY = 'energi.access_token'
const textEncoder = new TextEncoder()

let signingKeyPromise = null

function getAccessToken() {
  return globalThis.localStorage?.getItem(ACCESS_TOKEN_KEY) || ''
}

function base64UrlEncode(bytes) {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte)
  }
  return globalThis.btoa(binary).replaceAll('=', '').replaceAll('+', '-').replaceAll('/', '_')
}

function makeSigningString(method, url, timestamp, uuid) {
  const parts = [method.toUpperCase(), url, timestamp]
  if (uuid) parts.push(uuid)
  return parts.join('|')
}

function extractPath(url) {
  if (!url) return url

  try {
    if (/^https?:\/\//i.test(url)) {
      const parsed = new URL(url)
      return `${parsed.pathname}${parsed.search}`
    }
  } catch (err) {
    console.warn('Failed to normalize signature path', err)
  }

  return url.startsWith('/') ? url : `/${url}`
}

export async function createSignature(url, method, timestamp = Date.now()) {
  if (!SIGNING_SECRET) {
    throw new Error('VITE_SIGNING_SECRET is not configured')
  }

  if (!signingKeyPromise) {
    signingKeyPromise = globalThis.crypto.subtle.importKey(
      'raw',
      textEncoder.encode(SIGNING_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
  }

  const uuid = typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${timestamp}-${Math.random().toString(16).slice(2)}`
  const signingString = makeSigningString(method, url, timestamp, uuid)
  const key = await signingKeyPromise
  const signatureBuffer = await globalThis.crypto.subtle.sign('HMAC', key, textEncoder.encode(signingString))
  const signatureBytes = new Uint8Array(signatureBuffer)
  const signature = base64UrlEncode(signatureBytes)

  return { signature, timestamp, uuid }
}

export async function buildSignatureHeaders(path, method) {
  const signature = await createSignature(path, method)
  return {
    'X-Signature': signature.signature,
    'X-Signature-Timestamp': String(signature.timestamp),
    'X-Signature-UUID': signature.uuid
  }
}

function resolveRequestUrl(path) {
  return `${API_PREFIX}${path}`
}

export async function apiFetch(path, opts = {}) {
  const url = resolveRequestUrl(path)
  const headers = { 'Content-Type': 'application/json' }
  if (opts.headers) {
    Object.assign(headers, opts.headers)
  }
  const token = getAccessToken()
  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(url, {
    cache: 'no-store',
    headers,
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

export async function signedApiFetch(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase()
  const url = resolveRequestUrl(path)
  const signature = await createSignature(extractPath(`${API_PREFIX}${path}`), method)
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAccessToken()}`,
    'X-Signature': signature.signature,
    'X-Signature-Timestamp': String(signature.timestamp),
    'X-Signature-UUID': signature.uuid
  }

  if (opts.headers) {
    Object.assign(headers, opts.headers)
  }

  const res = await fetch(url, {
    ...opts,
    method,
    cache: 'no-store',
    headers
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
