import { getAccessToken } from '../auth/tokenMemory'

const API_PREFIX = import.meta.env.VITE_API_PREFIX || ''
const SIGNING_SECRET = import.meta.env.VITE_SIGNING_SECRET || ''
const textEncoder = new TextEncoder()

const SHA256_K = Uint32Array.from([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
])

const SHA256_H = [
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19
]

let signingKeyPromise = null

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

function rotr(value, bits) {
  return (value >>> bits) | (value << (32 - bits))
}

function sha256(bytes) {
  const messageLength = bytes.length
  const paddedLength = (((messageLength + 9 + 63) >> 6) << 6)
  const data = new Uint8Array(paddedLength)
  data.set(bytes)
  data[messageLength] = 0x80

  const bitLength = messageLength * 8
  const view = new DataView(data.buffer)
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false)
  view.setUint32(paddedLength - 4, bitLength >>> 0, false)

  let h0 = SHA256_H[0]
  let h1 = SHA256_H[1]
  let h2 = SHA256_H[2]
  let h3 = SHA256_H[3]
  let h4 = SHA256_H[4]
  let h5 = SHA256_H[5]
  let h6 = SHA256_H[6]
  let h7 = SHA256_H[7]

  const words = new Uint32Array(64)

  for (let offset = 0; offset < data.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false)
    }

    for (let index = 16; index < 64; index += 1) {
      const s0 = rotr(words[index - 15], 7) ^ rotr(words[index - 15], 18) ^ (words[index - 15] >>> 3)
      const s1 = rotr(words[index - 2], 17) ^ rotr(words[index - 2], 19) ^ (words[index - 2] >>> 10)
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4
    let f = h5
    let g = h6
    let h = h7

    for (let index = 0; index < 64; index += 1) {
      const sum1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
      const choose = (e & f) ^ (~e & g)
      const temp1 = (h + sum1 + choose + SHA256_K[index] + words[index]) >>> 0
      const sum0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
      const majority = (a & b) ^ (a & c) ^ (b & c)
      const temp2 = (sum0 + majority) >>> 0

      h = g
      g = f
      f = e
      e = (d + temp1) >>> 0
      d = c
      c = b
      b = a
      a = (temp1 + temp2) >>> 0
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
    h5 = (h5 + f) >>> 0
    h6 = (h6 + g) >>> 0
    h7 = (h7 + h) >>> 0
  }

  const digest = new Uint8Array(32)
  const output = [h0, h1, h2, h3, h4, h5, h6, h7]

  for (let index = 0; index < output.length; index += 1) {
    const value = output[index]
    digest[index * 4] = (value >>> 24) & 0xff
    digest[index * 4 + 1] = (value >>> 16) & 0xff
    digest[index * 4 + 2] = (value >>> 8) & 0xff
    digest[index * 4 + 3] = value & 0xff
  }

  return digest
}

function hmacSha256(messageBytes, keyBytes) {
  const blockSize = 64
  let normalizedKey = keyBytes

  if (normalizedKey.length > blockSize) {
    normalizedKey = sha256(normalizedKey)
  }

  const innerPad = new Uint8Array(blockSize)
  const outerPad = new Uint8Array(blockSize)

  for (let index = 0; index < blockSize; index += 1) {
    const keyByte = normalizedKey[index] || 0
    innerPad[index] = keyByte ^ 0x36
    outerPad[index] = keyByte ^ 0x5c
  }

  const innerMessage = new Uint8Array(blockSize + messageBytes.length)
  innerMessage.set(innerPad)
  innerMessage.set(messageBytes, blockSize)
  const innerHash = sha256(innerMessage)

  const outerMessage = new Uint8Array(blockSize + innerHash.length)
  outerMessage.set(outerPad)
  outerMessage.set(innerHash, blockSize)
  return sha256(outerMessage)
}

export async function createSignature(url, method, timestamp = Date.now()) {
  if (!SIGNING_SECRET) {
    throw new Error('VITE_SIGNING_SECRET is not configured')
  }

  const uuid = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `${timestamp}-${Math.random().toString(16).slice(2)}`
  const signingString = makeSigningString(method, url, timestamp, uuid)

  const subtleCrypto = globalThis.crypto?.subtle
  if (subtleCrypto?.importKey && subtleCrypto?.sign) {
    if (!signingKeyPromise) {
      signingKeyPromise = subtleCrypto.importKey(
        'raw',
        textEncoder.encode(SIGNING_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
    }

    const key = await signingKeyPromise
    const signatureBuffer = await subtleCrypto.sign('HMAC', key, textEncoder.encode(signingString))
    const signatureBytes = new Uint8Array(signatureBuffer)
    const signature = base64UrlEncode(signatureBytes)

    return { signature, timestamp, uuid }
  }

  const signatureBytes = hmacSha256(textEncoder.encode(signingString), textEncoder.encode(SIGNING_SECRET))
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
    credentials: 'include',
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
    credentials: 'include',
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

// Same authenticated/signed request as signedApiFetch, but preserves binary
// responses such as images instead of attempting to decode them as text.
export async function signedApiFetchBlob(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase()
  const url = resolveRequestUrl(path)
  const signature = await createSignature(extractPath(`${API_PREFIX}${path}`), method)
  const headers = {
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
    credentials: 'include',
    headers
  })

  if (!res.ok) {
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const body = await res.json()
      throw body
    }
    throw new Error(res.statusText || `Request failed with status ${res.status}`)
  }

  return res.blob()
}
