import { buildSignatureHeaders, signedApiFetch } from '../api/fetch'

const ACCESS_TOKEN_KEY = 'energi.access_token'
const REFRESH_TOKEN_KEY = 'energi.refresh_token'
const ID_TOKEN_KEY = 'energi.id_token'
const API_PREFIX = import.meta.env.VITE_API_PREFIX || ''

let appStoreInstance = null

const KEYCLOAK_AUTH_URL = import.meta.env.VITE_KEYCLOAK_AUTH_URL
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID
const KEYCLOAK_REDIRECT_URI = import.meta.env.VITE_KEYCLOAK_REDIRECT_URI || 'http://mylinux:10001/dashboard'
const KEYCLOAK_LOGOUT_REDIRECT_URI = import.meta.env.VITE_KEYCLOAK_LOGOUT_REDIRECT_URI || `${globalThis.location.origin}/`
const KEYCLOAK_SCOPE = import.meta.env.VITE_KEYCLOAK_SCOPE || 'openid energi_profile email'

export function getAccessToken() {
  return globalThis.localStorage?.getItem(ACCESS_TOKEN_KEY) || ''
}

export function setSessionTokens({ accessToken = '', refreshToken = '' } = {}) {
  const storage = globalThis.localStorage
  if (!storage) return
  if (accessToken) storage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken) storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function getIdToken() {
  return globalThis.localStorage?.getItem(ID_TOKEN_KEY) || ''
}

export function setIdToken(idToken = '') {
  const storage = globalThis.localStorage
  if (!storage) return
  if (idToken) storage.setItem(ID_TOKEN_KEY, idToken)
}

export function clearSessionTokens() {
  const storage = globalThis.localStorage
  if (!storage) return
  storage.removeItem(ACCESS_TOKEN_KEY)
  storage.removeItem(REFRESH_TOKEN_KEY)
  storage.removeItem(ID_TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

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
    const payload = decodeBase64Url(parts[1])
    return JSON.parse(payload)
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
  const realmRoles = Array.isArray(claims?.realm_access?.roles) ? claims.realm_access.roles : []
  const clientRoles = claims?.resource_access && typeof claims.resource_access === 'object'
    ? Object.values(claims.resource_access).flatMap((resource) => Array.isArray(resource?.roles) ? resource.roles : [])
    : []
  const role = realmRoles[0] || clientRoles[0] || ''
  return typeof role === 'string' && role.length ? role : 'Authenticated user'
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
    if (profileUser) {
      return profileUser
    }
  }

  const claims = getTokenClaims()
  const name = getDisplayNameFromClaims(claims)
  const role = getRoleFromClaims(claims)
  const email = typeof claims?.email === 'string' ? claims.email.trim() : ''
  const initials = getInitialsFromName(name)

  return {
    name,
    role,
    email,
    jobs: '',
    initials,
    userId: '',
    avatarUrl: ''
  }
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
  const role = getRoleFromClaims(profile)
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

  return {
    name,
    role,
    email,
    jobs,
    initials,
    userId,
    avatarUrl
  }
}

export async function fetchUserProfile() {
  console.log('Fetching account profile from backend')
  const body = await signedApiFetch('/account/profile', { method: 'GET' })
  const profile = body && typeof body === 'object' ? body.data || body : body
  console.log('Account profile fetch succeeded', profile)
  return profile
}

export function setAppStore(store) {
  appStoreInstance = store || null
}
export function buildKeycloakLoginUrl() {
  const url = new URL(KEYCLOAK_AUTH_URL)
  url.searchParams.set('client_id', KEYCLOAK_CLIENT_ID)
  url.searchParams.set('redirect_uri', KEYCLOAK_REDIRECT_URI)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', KEYCLOAK_SCOPE)
  return url.toString()
}

export function redirectToKeycloakLogin() {
  globalThis.location.replace(buildKeycloakLoginUrl())
}

export async function exchangeAuthorizationCode(code) {
  const signatureHeaders = await buildSignatureHeaders(`${API_PREFIX}/account/login`, 'POST')
  const response = await fetch(`${API_PREFIX}/account/login`, {
    method: 'POST',
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

  const data = body && typeof body === 'object' ? body.data || body : body
  setSessionTokens({
    accessToken: data.access_token || data.accessToken || '',
    refreshToken: data.refresh_token || data.refreshToken || ''
  })
  setIdToken(data.id_token || data.idToken || '')

  return data
}

async function requestKeycloakLogoutUrl() {
  const signatureHeaders = await buildSignatureHeaders(`${API_PREFIX}/account/logout`, 'POST')
  const response = await fetch(`${API_PREFIX}/account/logout`, {
    method: 'POST',
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

  const data = body && typeof body === 'object' ? body.data || body : body
  return data?.logoutUrl || data?.logout_url || ''
}

export async function logoutFromKeycloak() {
  const logoutUrl = await requestKeycloakLogoutUrl()
  if (appStoreInstance) {
    appStoreInstance.clearProfile()
  }
  clearSessionTokens()
  if (logoutUrl) {
    globalThis.location.href = logoutUrl
  }
}

export const keycloakConfig = {
  authUrl: KEYCLOAK_AUTH_URL,
  clientId: KEYCLOAK_CLIENT_ID,
  redirectUri: KEYCLOAK_REDIRECT_URI
}