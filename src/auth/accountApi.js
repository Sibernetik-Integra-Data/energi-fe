import { signedApiFetch } from '../api/fetch'

const unwrap = (body) => body?.data ?? body

export async function updateOwnProfile(payload) {
  return unwrap(await signedApiFetch('/account/update', { method: 'PUT', body: JSON.stringify(payload) }))
}

export async function getPasswordEncryptionKey() {
  return unwrap(await signedApiFetch('/account/password-encryption-key', { method: 'GET' }))
}

export async function resetOwnPassword(encryptedPassword) {
  return unwrap(await signedApiFetch('/account/reset-password', {
    method: 'PUT',
    body: JSON.stringify({ encryptedPassword, temporary: false })
  }))
}
