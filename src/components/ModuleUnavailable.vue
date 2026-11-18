<template>
  <div class="module-unavailable-shell">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="module-unavailable-main">
      <BaseHeader :title="module.label" :eyebrow="statusText.eyebrow" :notifications="0" :user="user"
        :on-logout="logoutFromKeycloak" />
      <main class="module-unavailable-content">
        <section :class="['module-unavailable-card', `module-unavailable-card--${module.status}`]" role="status">
          <span class="module-unavailable-mark" aria-hidden="true">{{ module.status === 'maintenance' ? '!' : '…' }}</span>
          <div>
            <p class="module-unavailable-kicker">{{ statusText.eyebrow }}</p>
            <h2>{{ module.label }}</h2>
            <p class="module-unavailable-message">{{ module.message || statusText.message }}</p>
            <RouterLink v-if="!isOnDashboard" to="/dashboard" class="module-unavailable-action">Kembali ke Dashboard</RouterLink>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseSidebar from '../modules/shared/sidebar'
import BaseHeader from '../modules/shared/header'
import { navigation as defaultNavigation } from '../modules/shared/navigation'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../auth/keycloak'
import { useAppStore } from '../stores'

const props = defineProps({
  module: { type: Object, required: true }
})

const STATUS_TEXT = {
  'coming-soon': {
    eyebrow: 'Segera hadir',
    message: 'Modul ini sedang disiapkan dan belum bisa dipakai.'
  },
  maintenance: {
    eyebrow: 'Sedang dalam perbaikan',
    message: 'Modul ini sedang dalam perbaikan. Silakan coba lagi nanti.'
  }
}

const route = useRoute()
const navigation = defaultNavigation
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const statusText = computed(() => STATUS_TEXT[props.module.status] || STATUS_TEXT['coming-soon'])
const isOnDashboard = computed(() => route.path === '/dashboard' || route.path.startsWith('/dashboard/'))
</script>

<style scoped>
.module-unavailable-shell {
  height: 100vh;
  display: flex;
  background: transparent;
}

.module-unavailable-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.module-unavailable-content {
  flex: 1;
  min-width: 0;
  padding: 24px;
  overflow-y: auto;
}

.module-unavailable-card {
  --tone: var(--info);
  max-width: 760px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 28px;
  color: var(--text);
}

.module-unavailable-card--maintenance {
  --tone: var(--warning);
}

.module-unavailable-mark {
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--tone) 15%, transparent);
  color: var(--tone);
  font-size: 20px;
  font-weight: 800;
}

.module-unavailable-kicker {
  margin: 0 0 4px;
  color: var(--tone);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.module-unavailable-card h2 {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
}

.module-unavailable-message {
  margin: 10px 0 0;
  color: var(--text-muted);
  line-height: 1.6;
  white-space: pre-line;
}

.module-unavailable-action {
  display: inline-flex;
  align-items: center;
  margin-top: 18px;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 999px;
  background: var(--brand);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
}
</style>
