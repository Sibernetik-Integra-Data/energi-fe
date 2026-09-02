import { signedApiFetch } from '../../../api/fetch'

const PREFIX = '/user-management'
const unwrap = (body) => body?.data ?? body

export const userManagementErrorMessage = (error, fallback) => error?.message || error?.error || fallback

export const userManagementService = {
  async verifyOwnerAccess() {
    return unwrap(await signedApiFetch(`${PREFIX}/access`, { method: 'GET' }))
  },
  async listUsers() {
    return unwrap(await signedApiFetch(`${PREFIX}/users?max=1000`, { method: 'GET' }))
  },
  async getConfiguration() {
    return unwrap(await signedApiFetch(`${PREFIX}/configuration`, { method: 'GET' }))
  },
  async createUser(payload) {
    return unwrap(await signedApiFetch(`${PREFIX}/users`, { method: 'POST', body: JSON.stringify(payload) }))?.user
  },
  async updateUser(userId, payload) {
    return unwrap(await signedApiFetch(`${PREFIX}/users/${encodeURIComponent(userId)}`, { method: 'PUT', body: JSON.stringify(payload) }))?.user
  },
  async updateStatus(userId, enabled) {
    return unwrap(await signedApiFetch(`${PREFIX}/users/${encodeURIComponent(userId)}/status`, { method: 'PUT', body: JSON.stringify({ enabled }) }))
  },
  async updateRoleMappings(userId, directClientRoles) {
    return unwrap(await signedApiFetch(`${PREFIX}/users/${encodeURIComponent(userId)}/role-mappings`, { method: 'PUT', body: JSON.stringify({ directClientRoles }) }))?.user
  },
  async resetPassword(userId, encryptedPassword) {
    return unwrap(await signedApiFetch(`${PREFIX}/users/${encodeURIComponent(userId)}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ encryptedPassword, temporary: false })
    }))
  },
  async deleteUser(userId) {
    return unwrap(await signedApiFetch(`${PREFIX}/users/${encodeURIComponent(userId)}`, { method: 'DELETE' }))
  }
}

export default userManagementService
