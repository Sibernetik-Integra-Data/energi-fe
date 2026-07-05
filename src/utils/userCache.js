/**
 * userCache.js
 *
 * Resolves Keycloak user IDs → display usernames by calling the backend
 * GET /api/account/user/:userId endpoint, which in turn queries the Keycloak
 * Admin API.
 *
 * Results are cached in memory for the lifetime of the page tab so repeated
 * renders of the same user ID do not trigger extra HTTP requests.
 *
 * Fallback: if the user ID cannot be resolved for any reason (network error,
 * admin credentials not configured, user not found), an empty string is
 * returned and cached so subsequent calls are instant.
 */

import { signedApiFetch } from '../api/fetch'

/** @type {Map<string, string>} userId → username */
const _cache = new Map()

/** @type {Map<string, Promise<string>>} deduplicate in-flight requests */
const _inflight = new Map()

/**
 * Resolve a single Keycloak user ID to a display username.
 * Returns '' on any error or if the user cannot be found.
 *
 * @param {string} userId
 * @returns {Promise<string>}
 */
export async function resolveUsername(userId) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) return ''

  const uid = userId.trim()

  if (_cache.has(uid)) return _cache.get(uid)
  if (_inflight.has(uid)) return _inflight.get(uid)

  const promise = signedApiFetch(`/account/user/${encodeURIComponent(uid)}`, { method: 'GET' })
    .then((resp) => {
      const username = resp?.data?.username || ''
      _cache.set(uid, username)
      _inflight.delete(uid)
      return username
    })
    .catch(() => {
      _cache.set(uid, '')
      _inflight.delete(uid)
      return ''
    })

  _inflight.set(uid, promise)
  return promise
}

/**
 * Resolve multiple user IDs at once, deduplicating automatically.
 * Returns a Map<userId, username>.
 *
 * @param {string[]} userIds
 * @returns {Promise<Map<string, string>>}
 */
export async function resolveUsernames(userIds) {
  const unique = [...new Set((userIds || []).filter(Boolean))]
  const results = await Promise.all(unique.map((id) => resolveUsername(id)))
  const map = new Map()
  unique.forEach((id, i) => map.set(id, results[i]))
  return map
}
