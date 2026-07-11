<template>
  <router-view v-if="!authError" />

  <main v-else class="auth-error-shell">
    <section class="auth-error-card">
      <p class="auth-error-kicker">Login failed</p>
      <h1>We could not sign you in</h1>
      <p class="auth-error-copy">{{ authError }}</p>
      <button class="auth-error-action" type="button" @click="retryLogin">
        Try again
      </button>
    </section>
  </main>
  <AppToast />
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clearSessionTokens, exchangeAuthorizationCode, fetchUserProfile, redirectToKeycloakLogin, isAuthenticated, setAppStore, tryRestoreSession } from './auth/keycloak'
import { useAppStore } from './stores'
import AppToast from './components/AppToast.vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const LOGIN_RETRY_KEY = 'energi.login_retry_attempted'
const TAB_ID_KEY = 'energi.tab_id'
const authError = ref('')

setAppStore(appStore)

let exchangeInFlight = false

function getTabId() {
  const existingTabId = globalThis.sessionStorage?.getItem(TAB_ID_KEY)
  if (existingTabId) return existingTabId

  const newTabId = globalThis.crypto?.randomUUID?.() || `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`
  globalThis.sessionStorage?.setItem(TAB_ID_KEY, newTabId)
  return newTabId
}

function getRetryStorageKey() {
  return `${LOGIN_RETRY_KEY}.${getTabId()}`
}

function hasRetriedLogin() {
  return globalThis.localStorage?.getItem(getRetryStorageKey()) === '1'
}

function markLoginRetried() {
  globalThis.localStorage?.setItem(getRetryStorageKey(), '1')
}

function clearLoginRetried() {
  globalThis.localStorage?.removeItem(getRetryStorageKey())
}

function clearAllLoginRetryFlags() {
  const storage = globalThis.localStorage
  if (!storage) return

  const keysToRemove = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key && key.startsWith(`${LOGIN_RETRY_KEY}.`)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key))
}

function retryLogin() {
  authError.value = ''
  clearLoginRetried()
  redirectToKeycloakLogin()
}

async function syncUserProfile() {
  if (!isAuthenticated()) {
    appStore.clearProfile()
    appStore.setReady(false)
    return
  }

  try {
    const profile = await fetchUserProfile()
    appStore.setProfile(profile)
    appStore.setReady(true)
  } catch (err) {
    console.warn('Failed to load user profile', err)
    appStore.clearProfile()
    appStore.setReady(true)
  }
}

async function handleAuthCode() {
  const code = typeof route.query.code === 'string' ? route.query.code : ''
  if (!code || exchangeInFlight || isAuthenticated() || authError.value) return

  exchangeInFlight = true
  try {
    await exchangeAuthorizationCode(code)
    clearAllLoginRetryFlags()
    clearLoginRetried()
    await syncUserProfile()
    const nextQuery = { ...route.query }
    delete nextQuery.code
    delete nextQuery.state
    delete nextQuery.session_state
    delete nextQuery.iss
    await router.replace({ path: route.path, query: nextQuery, hash: route.hash })
  } catch (err) {
    console.error('Keycloak login exchange failed', err)
    exchangeInFlight = false

    if (!hasRetriedLogin()) {
      markLoginRetried()
      redirectToKeycloakLogin()
      return
    }

    clearLoginRetried()
    clearSessionTokens()
    appStore.clearProfile()
    authError.value = err?.message || 'Keycloak login exchange failed'
    return
  }

  exchangeInFlight = false
}

watch(
  () => route.fullPath,
  () => {
    void handleAuthCode()
  },
  { immediate: true }
)

onMounted(async () => {
  // OAuth callback: handleAuthCode owns login — don't race refresh before the
  // httpOnly cookie exists (would 401 "No refresh token cookie present").
  const hasAuthCode = typeof route.query.code === 'string' && route.query.code
  if (hasAuthCode || exchangeInFlight) return

  if (!isAuthenticated()) {
    await tryRestoreSession()
  }
  await syncUserProfile()
})
</script>

<style scoped>
.auth-error-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(251, 140, 0, 0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
}

.auth-error-card {
  width: min(720px, 100%);
  border: 1px solid var(--border);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow);
  padding: clamp(28px, 5vw, 56px);
}

.auth-error-kicker {
  margin: 0 0 12px;
  color: var(--brand);
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.auth-error-card h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1;
  letter-spacing: -0.05em;
}

.auth-error-copy {
  margin: 16px 0 0;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 28px;
}

.auth-error-action {
  margin-top: 24px;
  min-height: 48px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: var(--brand);
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 14px 24px rgba(251, 140, 0, 0.22);
}
</style>
