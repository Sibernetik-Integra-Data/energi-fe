import { buildSignatureHeaders, signedApiFetch } from '../api/fetch'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenMemory'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ID_TOKEN_KEY = 'energi.id_token'
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api'

// Keycloak OAuth2 config (Authorization Code flow)
const KEYCLOAK_AUTH_URL = import.meta.env.VITE_KEYCLOAK_AUTH_URL
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID
const KEYCLOAK_REDIRECT_URI = import.meta.env.VITE_KEYCLOAK_REDIRECT_URI || 'http://mylinux:10001/dashboard'
const KEYCLOAK_LOGOUT_REDIRECT_URI = import.meta.env.VITE_KEYCLOAK_LOGOUT_REDIRECT_URI || `${globalThis.location?.origin ?? ''}/`
const KEYCLOAK_SCOPE = import.meta.env.VITE_KEYCLOAK_SCOPE || 'openid energi_profile email'

// ---------------------------------------------------------------------------
// Pinia app store reference (injected lazily to avoid circular deps)
// ---------------------------------------------------------------------------
let appStoreInstance = null

export function setAppStore(store) {
  appStoreInstance = store || null
}

// ---------------------------------------------------------------------------
// ID-token helpers (used only as logout hint; not sensitive enough to avoid LS)
// ---------------------------------------------------------------------------
export function getIdToken() {
  return globalThis.localStorage?.getItem(ID_TOKEN_KEY) || ''
}

export function setIdToken(idToken = '') {
  if (idToken && globalThis.localStorage) {
    globalThis.localStorage.setItem(ID_TOKEN_KEY, idToken)
  }
}

// ---------------------------------------------------------------------------
// Token accessors (delegate to tokenMemory to avoid circular dep with fetch.js)
// ---------------------------------------------------------------------------
export { getAccessToken }

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

// ---------------------------------------------------------------------------
// In-memory token state (not exported — managed through setTokenFromServer)
// ---------------------------------------------------------------------------
let _expiresInMs = 0     // how long access token is valid (ms)
let _clientPerfNow = 0   // performance.now() snapshot at the moment token was set
let _refreshTimer = null // single pending setTimeout id
let _refreshInFlight = false  // guard against concurrent refresh calls
let _restorePromise = null    // dedup concurrent tryRestoreSession calls

// ---------------------------------------------------------------------------
// BroadcastChannel — shares fresh tokens across same-origin tabs
// ---------------------------------------------------------------------------
let _bc = null

function getBroadcastChannel() {
  if (!_bc && typeof BroadcastChannel !== 'undefined') {
    _bc = new BroadcastChannel('energi_auth')
    _bc.onmessage = (ev) => {
      if (ev.data?.type === 'token_refreshed') {
        // Another tab refreshed — adopt its token without triggering another broadcast
        _applyToken(ev.data.payload, false)
      } else if (ev.data?.type === 'logout') {
        _clearToken()
        if (appStoreInstance) appStoreInstance.clearProfile()
      }
    }
  }
  return _bc
}

// ---------------------------------------------------------------------------
// Core token lifecycle helpers (private)
// ---------------------------------------------------------------------------

/**
 * Computes remaining validity time in ms using a monotonic clock delta.
 * Uses performance.now() so it is unaffected by system clock changes.
 */
export function remainingMs() {
  if (!_expiresInMs || !_clientPerfNow) return 0
  return Math.max(0, _expiresInMs - (performance.now() - _clientPerfNow))
}

/**
 * Schedule a single timer that fires 30 s before the token expires.
 * Always cancels any previous timer first.
 */
function _scheduleRefresh() {
  if (_refreshTimer !== null) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }
  const rem = remainingMs()
  const delay = Math.max(0, rem - 30_000) // 30-second warning window
  if (delay === 0) {
    // Token already within the 30-second window (or expired) — refresh immediately
    void _doRefresh()
    return
  }
  _refreshTimer = setTimeout(() => { void _doRefresh() }, delay)
}

/**
 * Apply a token payload to in-memory state and optionally broadcast to other tabs.
 */
function _applyToken({ access_token, expires_in, server_time, id_token } = {}, broadcast = true) {
  setAccessToken(access_token || '')
  _expiresInMs = (expires_in || 0) * 1000
  _clientPerfNow = performance.now()
  // server_time is informational — used only for debugging; timing anchor is _clientPerfNow
  void server_time

  if (id_token) setIdToken(id_token)

  _scheduleRefresh()

  // Debug: log refresh event (do not print raw tokens)
  try {
    const expiresSec = Math.round((_expiresInMs || 0) / 1000)
    const rem = remainingMs()
    console.log(`[keycloak] token refreshed${broadcast ? '' : ' (from other tab)'} — expires_in=${expiresSec}s, remainingMs=${Math.round(rem)}`)
  } catch (e) {
    // swallow logging errors in environments without console
  }

  if (broadcast) {
    getBroadcastChannel()?.postMessage({
      type: 'token_refreshed',
      payload: { access_token, expires_in, server_time }
    })
  }
}

/**
 * Clear all token state and cancel any pending timer.
 */
function _clearToken() {
  clearAccessToken()
  _expiresInMs = 0
  _clientPerfNow = 0
  if (_refreshTimer !== null) {
    clearTimeout(_refreshTimer)
    _refreshTimer = null
  }
}

// ---------------------------------------------------------------------------
// Refresh — called by timer, visibility/focus events, or on demand
// ---------------------------------------------------------------------------

/**
 * Calls POST /api/account/refresh using the httpOnly cookie.
 * No Authorization header is sent (we are obtaining a new token).
 * On success: rotates in-memory token + schedules next refresh.
 * On failure: clears token + redirects to Keycloak login.
 */
async function _doRefresh() {
  if (_refreshInFlight) return
  _refreshInFlight = true
  try {
    const response = await fetch(`${API_PREFIX}/account/refresh`, {
      method: 'POST',
      credentials: 'include', // send httpOnly cookie
      headers: { 'Content-Type': 'application/json' }
    })
    if (!response.ok) {
      // Refresh token expired/revoked — force re-login
      _clearToken()
      if (appStoreInstance) appStoreInstance.clearProfile()
      redirectToKeycloakLogin()
      return
    }
    const body = await response.json()
    const data = body?.data ?? body
    _applyToken({
      access_token: data.access_token || '',
      expires_in: data.expires_in || 0,
      server_time: data.server_time || 0,
      id_token: data.id_token || ''
    })
  } catch (err) {
    console.warn('[keycloak] Token refresh failed:', err)
    _clearToken()
  } finally {
    _refreshInFlight = false
  }
}

// ---------------------------------------------------------------------------
// Visibility / focus handlers — re-evaluate timer when tab becomes active
// ---------------------------------------------------------------------------
if (typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('visibilitychange', () => {
    if (globalThis.document?.visibilityState === 'visible' && isAuthenticated() && remainingMs() <= 30_000) {
      void _doRefresh()
    }
  })
  globalThis.addEventListener('focus', () => {
    if (isAuthenticated() && remainingMs() <= 30_000) {
      void _doRefresh()
    }
  })
}

// ---------------------------------------------------------------------------
// Public: restore session on page load using httpOnly cookie
// ---------------------------------------------------------------------------

/**
 * Attempts to obtain a fresh access token using the httpOnly refresh-token cookie.
 * Call this once on app startup (e.g., in router.beforeEach or App.vue onMounted).
 * Deduplicates concurrent calls — only one in-flight attempt at a time.
 *
 * @returns {Promise<boolean>} true if a new token was obtained, false otherwise.
 */
export async function tryRestoreSession() {
  if (isAuthenticated()) return true
  if (_restorePromise) return _restorePromise

  _restorePromise = (async () => {
    try {
      const response = await fetch(`${API_PREFIX}/account/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) return false
      const body = await response.json()
      const data = body?.data ?? body
      if (!data?.access_token) return false
      _applyToken({
        access_token: data.access_token,
        expires_in: data.expires_in || 0,
        server_time: data.server_time || 0,
            id_token: data.id_token || ''
      })
          // After restoring token, attempt to populate app store profile so UI shows user info
          if (appStoreInstance) {
            try {
              const fetched = await fetchUserProfile()
              appStoreInstance.setProfile(fetched)
            } catch (e) {
              // ignore profile fetch errors during restore
            }
            appStoreInstance.setReady(true)
          }
      return true
    } catch {
      return false
    } finally {
      _restorePromise = null
    }
  })()

  return _restorePromise
}

// ---------------------------------------------------------------------------
// Session token management (public API kept for backward compatibility)
// ---------------------------------------------------------------------------

/**
 * @deprecated Tokens are now managed in memory via _applyToken.
 * Kept for backward compatibility only — does nothing.
 */
export function setSessionTokens() {
  // no-op: access token is stored in tokenMemory; refresh token lives as httpOnly cookie
}

/**
 * Clears all auth state: in-memory token, timer, id_token from localStorage.
 * Broadcasts logout to other tabs.
 */
export function clearSessionTokens() {
  _clearToken()
  // Clean up legacy localStorage keys that may still be present from old sessions
  const storage = globalThis.localStorage
  if (storage) {
    storage.removeItem(ID_TOKEN_KEY)
    storage.removeItem('energi.access_token')
    storage.removeItem('energi.refresh_token')
  }
  getBroadcastChannel()?.postMessage({ type: 'logout' })
}

// ---------------------------------------------------------------------------
// JWT claim helpers
// ---------------------------------------------------------------------------

function decodeBase64Url(value) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return globalThis.atob(padded)
}

function getNameField(source, keys) {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

export function getTokenClaims(token = getAccessToken()) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    return JSON.parse(decodeBase64Url(parts[1]))
  } catch (err) {
    console.warn('Failed to decode Keycloak token claims', err)
    return null
  }
}

function getDisplayNameFromClaims(claims) {
  const firstName = getNameField(claims, ['given_name', 'givenName', 'givenname', 'firstName', 'first_name', 'firstname'])
  const lastName = typeof claims?.family_name === 'string' ? claims.family_name.trim() : ''
  const fullName = typeof claims?.name === 'string' ? claims.name.trim() : ''
  const preferredUsername = typeof claims?.preferred_username === 'string' ? claims.preferred_username.trim() : ''
  const email = typeof claims?.email === 'string' ? claims.email.trim() : ''
  if (firstName) return firstName
  if (lastName) return lastName
  if (fullName) return fullName
  if (preferredUsername) return preferredUsername
  if (email) return email
  return 'Keycloak User'
}

function getRoleFromClaims(claims) {
  if (!claims || typeof claims !== 'object') return 'Authenticated user'

  // Prefer realm roles if present
  const realmRoles = Array.isArray(claims?.realm_access?.roles) ? claims.realm_access.roles : []

  // Determine client name: explicit config -> token 'azp' -> fallback 'mobile'
  const clientName = (KEYCLOAK_CLIENT_ID && KEYCLOAK_CLIENT_ID.length) ? KEYCLOAK_CLIENT_ID : (typeof claims?.azp === 'string' && claims.azp) ? claims.azp : 'mobile'

  // Roles for the primary client (most relevant for app-level roles)
  const clientRolesForClient = Array.isArray(claims?.resource_access?.[clientName]?.roles)
    ? claims.resource_access[clientName].roles
    : []

  // Other client roles (flatten)
  const otherClientRoles = claims?.resource_access && typeof claims.resource_access === 'object'
    ? Object.entries(claims.resource_access).flatMap(([k, v]) => (k === clientName ? [] : (Array.isArray(v?.roles) ? v.roles : [])))
    : []

  // Choose best available set in order: client-specific roles, realm roles, other client roles
  const chosen = clientRolesForClient.length ? clientRolesForClient : (realmRoles.length ? realmRoles : otherClientRoles)
  if (chosen && chosen.length) {
    // Return joined roles as human-readable string (preserve order)
    return chosen.join(', ')
  }

  return 'Authenticated user'
}

function getInitialsFromName(name) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function getAuthenticatedUser() {
  if (appStoreInstance?.profile) {
    const profileUser = profileToUser(appStoreInstance.profile)
    if (profileUser) return profileUser
  }
  const claims = getTokenClaims()
  const name = getDisplayNameFromClaims(claims)
  const role = getRoleFromClaims(claims)
  const email = typeof claims?.email === 'string' ? claims.email.trim() : ''
  const initials = getInitialsFromName(name)
  return { name, role, email, jobs: '', initials, userId: '', avatarUrl: '' }
}

function getProfileName(profile) {
  const firstName = getNameField(profile, ['given_name', 'givenName', 'givenname', 'firstName', 'first_name', 'firstname'])
  const lastName = typeof profile?.family_name === 'string' ? profile.family_name.trim() : ''
  const fullName = typeof profile?.name === 'string' ? profile.name.trim() : ''
  const preferredUsername = typeof profile?.preferred_username === 'string' ? profile.preferred_username.trim() : ''
  const email = typeof profile?.email === 'string' ? profile.email.trim() : ''
  if (firstName) return firstName
  if (lastName) return lastName
  if (fullName) return fullName
  if (preferredUsername) return preferredUsername
  if (email) return email
  return 'Keycloak User'
}

export function profileToUser(profile) {
  if (!profile) return null
  const name = getProfileName(profile)
  // Prefer explicit role in profile when present; otherwise fallback to token claims
  let role = getRoleFromClaims(profile)
  if ((!role || role === 'Authenticated user') && typeof getAccessToken === 'function') {
    const tokenClaims = getTokenClaims()
    const tokenRole = getRoleFromClaims(tokenClaims)
    if (tokenRole && tokenRole !== 'Authenticated user') role = tokenRole
  }
  const email = typeof profile?.email === 'string' ? profile.email.trim() : ''
  const jobs = typeof profile?.jobTitle === 'string' && profile.jobTitle.trim()
    ? profile.jobTitle.trim()
    : typeof profile?.jobs === 'string'
      ? profile.jobs.trim()
      : Array.isArray(profile?.jobs)
        ? profile.jobs.filter(Boolean).join(', ')
        : ''
  const initials = getInitialsFromName(name)
  const userId = typeof profile?.id === 'string' ? profile.id : ''
  const avatarUrl = typeof profile?.avatarUrl === 'string' ? profile.avatarUrl : ''
  return { name, role, email, jobs, initials, userId, avatarUrl }
}

// ---------------------------------------------------------------------------
// Profile fetch (uses authenticated signed request)
// ---------------------------------------------------------------------------
export async function fetchUserProfile() {
  console.log('Fetching account profile from backend')
  const body = await signedApiFetch('/account/profile', { method: 'GET' })
  const profile = body && typeof body === 'object' ? body.data || body : body
  console.log('Account profile fetch succeeded', profile)
  return profile
}

// ---------------------------------------------------------------------------
// Login / logout
// ---------------------------------------------------------------------------

export function buildKeycloakLoginUrl() {
  const url = new URL(KEYCLOAK_AUTH_URL)
  url.searchParams.set('client_id', KEYCLOAK_CLIENT_ID)
  url.searchParams.set('redirect_uri', KEYCLOAK_REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', KEYCLOAK_SCOPE)
  return url.toString()
}

export function redirectToKeycloakLogin() {
  globalThis.location?.replace(buildKeycloakLoginUrl())
}

/**
 * Exchanges the OAuth2 authorization code for tokens.
 * The refresh_token is stored by the server as an httpOnly cookie — it is
 * NOT returned in the response body. The access_token and expires_in are
 * stored in memory via _applyToken.
 */
export async function exchangeAuthorizationCode(code) {
  const signatureHeaders = await buildSignatureHeaders(`${API_PREFIX}/account/login`, 'POST')
  const response = await fetch(`${API_PREFIX}/account/login`, {
    method: 'POST',
    credentials: 'include', // receive the httpOnly refresh-token cookie from BE
    headers: {
      'Content-Type': 'application/json',
      ...signatureHeaders
    },
    body: JSON.stringify({ code, redirect_uri: KEYCLOAK_REDIRECT_URI })
  })

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = body && typeof body === 'object' && (body.message || body.error_description || body.error)
      ? (body.message || body.error_description || body.error)
      : 'Keycloak code exchange failed'
    const error = new Error(message)
    error.body = body
    throw error
  }

  const data = body && typeof body === 'object' ? body.data ?? body : body

  // Store tokens in memory (refresh token is handled server-side as httpOnly cookie)
  _applyToken({
    access_token: data.access_token || data.accessToken || '',
    expires_in: data.expires_in || 0,
    server_time: data.server_time || 0,
    id_token: data.id_token || data.idToken || ''
  })

  return data
}

async function _requestKeycloakLogoutUrl() {
  const signatureHeaders = await buildSignatureHeaders(`${API_PREFIX}/account/logout`, 'POST')
  const response = await fetch(`${API_PREFIX}/account/logout`, {
    method: 'POST',
    credentials: 'include', // send refresh-token cookie so BE can revoke it
    headers: {
      'Content-Type': 'application/json',
      ...signatureHeaders
    },
    body: JSON.stringify({
      id_token_hint: getIdToken(),
      post_logout_redirect_uri: KEYCLOAK_LOGOUT_REDIRECT_URI
    })
  })

  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : await response.text()

  if (!response.ok) {
    const message = body && typeof body === 'object' && (body.message || body.error_description || body.error)
      ? (body.message || body.error_description || body.error)
      : 'Keycloak logout failed'
    const error = new Error(message)
    error.body = body
    throw error
  }

  const data = body && typeof body === 'object' ? body.data ?? body : body
  return data?.logoutUrl || data?.logout_url || ''
}

export async function logoutFromKeycloak() {
  const logoutUrl = await _requestKeycloakLogoutUrl()
  if (appStoreInstance) appStoreInstance.clearProfile()
  clearSessionTokens()
  if (logoutUrl) {
    globalThis.location.href = logoutUrl
  }
}

// ---------------------------------------------------------------------------
// Config export (for debugging / informational use)
// ---------------------------------------------------------------------------
export const keycloakConfig = {
  authUrl: KEYCLOAK_AUTH_URL,
  clientId: KEYCLOAK_CLIENT_ID,
  redirectUri: KEYCLOAK_REDIRECT_URI
}