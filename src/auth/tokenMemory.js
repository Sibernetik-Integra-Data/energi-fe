/**
 * tokenMemory.js
 *
 * Pure in-memory access token store with NO external dependencies.
 * Both keycloak.js and fetch.js import from here, which prevents circular imports.
 *
 * The access token is NEVER written to localStorage or sessionStorage.
 * It lives only in this module-level variable and is lost on page reload —
 * recovery is handled by tryRestoreSession() in keycloak.js (via httpOnly cookie).
 */

let _accessToken = ''

/**
 * Returns the current in-memory access token, or '' if not set.
 */
export function getAccessToken() {
  return _accessToken
}

/**
 * Stores a new access token in memory.
 * @param {string} token
 */
export function setAccessToken(token) {
  _accessToken = typeof token === 'string' ? token : ''
}

/**
 * Clears the in-memory access token.
 */
export function clearAccessToken() {
  _accessToken = ''
}
