function pemToArrayBuffer(pem) {
  const base64 = String(pem || '')
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '')
  if (!base64) throw new Error('Password encryption public key is empty')
  const binary = atob(base64)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0)).buffer
}

function arrayBufferToBase64(value) {
  const bytes = new Uint8Array(value)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

export async function encryptPassword(password, publicKey) {
  if (!globalThis.crypto?.subtle) throw new Error('Web Crypto API is unavailable')
  const key = await globalThis.crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(publicKey),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    key,
    new TextEncoder().encode(String(password || ''))
  )
  return arrayBufferToBase64(encrypted)
}
