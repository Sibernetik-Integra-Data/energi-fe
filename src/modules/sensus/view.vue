<template>
  <div class="sensus-shell">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="sensus-main">
      <BaseHeader
        eyebrow="Sensus"
        :title="header.title"
        :notifications="header.notifications"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />
      <main class="sensus-content">
        <SensusList :rows="list.rows" :title="list.title" :subtitle="list.subtitle" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import SensusList from './components/SensusList.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'

const props = defineProps({ controller: { type: Object, required: true } })

const appStore = useAppStore()

const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const list = computed(() => props.controller.getList())
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
</script>

<style scoped>
.sensus-shell {
  min-height: 100vh;
  display: flex;
  background: transparent;
}

.sensus-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.sensus-content {
  flex: 1;
  min-width: 0;
  padding: 24px;
}

@media (max-width: 920px) {
  .sensus-shell {
    flex-direction: column;
  }

  .sensus-content {
    padding: 18px;
  }
}
</style>
