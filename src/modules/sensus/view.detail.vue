<template>
  <div class="h-screen flex bg-transparent max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />

    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <BaseHeader
        eyebrow="Sensus"
        title="Sensus Detail"
        :notifications="0"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />

      <main class="flex-1 min-w-0 p-6 max-[920px]:p-4.5 overflow-y-auto">

        <!-- Back link -->
        <RouterLink
          to="/sensus"
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors mb-5 no-underline"
        >
          <span aria-hidden="true">←</span>
          Kembali ke Sensus list
        </RouterLink>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center py-24 text-sm text-(--text-muted)">
          Memuat data&hellip;
        </div>

        <!-- Error -->
        <div
          v-else-if="error"
          class="flex flex-col items-center justify-center py-24 gap-3 text-sm text-red-600"
        >
          <span class="text-3xl">⚠️</span>
          {{ error }}
        </div>

        <template v-else>
          <!-- Sensus info card -->
          <SensusDetailInfo
            :sensus-id="sensus.id_sensus"
            :date="sensus.sensus_date"
            :reporter="sensus.created_by"
            :status="sensus.status || 'Open'"
            class="mb-5"
          />

          <!-- Tabs -->
          <div
            class="flex gap-2 bg-(--surface-muted) border border-(--border) p-1.5 rounded-full items-center mb-6 w-fit"
            role="tablist"
            aria-label="Sensus detail tabs"
          >
            <button
              v-for="tab in TABS"
              :key="tab.key"
              role="tab"
              :aria-selected="activeTab === tab.key"
              @click="activeTab = tab.key"
              :class="[
                'flex items-center gap-2 py-2 px-4 rounded-full text-sm font-semibold transition-colors cursor-pointer',
                activeTab === tab.key
                  ? 'bg-(--surface) text-(--text) shadow-sm border border-(--border)'
                  : 'bg-transparent border-0 text-(--text-muted) hover:text-(--text)'
              ]"
            >
              <span aria-hidden="true">{{ tab.icon }}</span>
              {{ tab.label }}
            </button>
          </div>

          <!-- Tab: List Pekerjaan -->
          <div v-show="activeTab === 'pekerjaan'" role="tabpanel">
            <!-- Empty state -->
            <div
              v-if="items.length === 0"
              class="flex flex-col items-center justify-center py-20 gap-3 text-(--text-muted)"
            >
              <span class="text-4xl">📋</span>
              <p class="text-sm font-medium">Tidak ada pekerjaan ditemukan untuk sensus ini.</p>
            </div>

            <!-- Card grid -->
            <div
              v-else
              class="grid gap-4"
              style="grid-template-columns: repeat(auto-fill, minmax(360px, 1fr))"
            >
              <SensusJobCard
                v-for="item in items"
                :key="item.id"
                :job-type="item.jobType"
                :date="item.date"
                :sensus-ref="'Sensus ' + item.sensusId"
                :blocks="item.blocks"
                :photo="item.photo"
                :extra-photos="item.extraPhotos"
                :progress-status="item.progressStatus"
                @view="handleView(item)"
                @plan="handlePlan(item)"
              />
            </div>
          </div>

          <!-- Tab: Perencanaan -->
          <div v-show="activeTab === 'perencanaan'" role="tabpanel">
            <div class="flex flex-col items-center justify-center py-20 gap-3 text-(--text-muted)">
              <span class="text-4xl">📅</span>
              <p class="text-sm font-medium">Fitur perencanaan akan segera tersedia.</p>
            </div>
          </div>
        </template>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import SensusDetailInfo from './components/SensusDetailInfo.vue'
import SensusJobCard from './components/SensusJobCard.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'

const props = defineProps({
  controller: { type: Object, required: true },
  id: { type: [String, Number], default: null }
})

const appStore = useAppStore()
const navigation = computed(() => props.controller.getNavigation())
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())

const loading = ref(false)
const error = ref(null)
const sensus = ref({})
const items = ref([])
const activeTab = ref('pekerjaan')

const TABS = [
  { key: 'pekerjaan',   label: 'List Pekerjaan', icon: '📋' },
  { key: 'perencanaan', label: 'Perencanaan',     icon: '📅' }
]

onMounted(async () => {
  if (!props.id) {
    error.value = 'ID sensus tidak ditemukan.'
    return
  }
  loading.value = true
  error.value = null
  try {
    const result = await props.controller.loadSensusDetail(props.id)
    sensus.value = result.sensus || {}
    items.value  = result.items  || []
  } catch (err) {
    console.error('[SensusDetail] load error:', err)
    error.value = err?.message || 'Gagal memuat data sensus.'
  } finally {
    loading.value = false
  }
})

function handleView(item) {
  // Future: navigate to item detail
  console.log('[SensusDetail] view item', item.id)
}

function handlePlan(item) {
  // Future: add to planning workflow
  console.log('[SensusDetail] plan item', item.id)
}
</script>
