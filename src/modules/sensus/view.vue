<template>
  <div class="h-screen flex bg-transparent max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <BaseHeader
        eyebrow="Sensus"
        :title="header.title"
        :notifications="header.notifications"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />
      <main class="flex-1 min-w-0 p-6 max-[920px]:p-4.5 overflow-y-auto">
        <SensusList :rows="rows" :title="list.title" :subtitle="list.subtitle" :loading="loading" :error="fetchError" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)

onMounted(async () => {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await props.controller.loadRows()
  } catch (err) {
    console.error('[Sensus] Failed to load rows:', err)
    fetchError.value = err?.message || 'Gagal memuat data sensus.'
  } finally {
    loading.value = false
  }
})
</script>
