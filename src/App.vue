<template>
  <router-view />
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { exchangeAuthorizationCode, fetchUserProfile, redirectToKeycloakLogin, isAuthenticated, setAppStore } from './auth/keycloak'
import { useAppStore } from './stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

setAppStore(appStore)

let exchangeInFlight = false

async function syncUserProfile() {
  if (!isAuthenticated()) {
    appStore.clearProfile()
    return
  }

  try {
    const profile = await fetchUserProfile()
    appStore.setProfile(profile)
  } catch (err) {
    console.warn('Failed to load user profile', err)
    appStore.clearProfile()
  }
}

async function handleAuthCode() {
  const code = typeof route.query.code === 'string' ? route.query.code : ''
  if (!code || exchangeInFlight || isAuthenticated()) return

  exchangeInFlight = true
  try {
    await exchangeAuthorizationCode(code)
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
    redirectToKeycloakLogin()
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

onMounted(() => {
  void syncUserProfile()
})
</script>
