<template>
  <div class="h-screen flex bg-transparent max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />

    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <BaseHeader
        eyebrow="Planning"
        :title="header.title"
        :notifications="header.notifications"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />

      <main class="flex-1 min-w-0 p-6 max-[920px]:p-4.5 overflow-y-auto flex flex-col gap-5">
        <!-- Page intro -->
        <section class="flex justify-between gap-6 items-end max-[920px]:flex-col max-[920px]:items-start shrink-0">
          <div>
            <p class="text-[12px] font-bold uppercase tracking-[0.16em] text-(--brand) mb-2">Perencanaan Kebun</p>
            <h1 class="m-0 text-[clamp(24px,2.5vw,36px)] font-extrabold leading-tight tracking-[-0.04em]">{{ intro.title }}</h1>
          </div>
          <p class="max-w-130 m-0 text-(--text-muted) text-sm leading-relaxed">{{ intro.description }}</p>
        </section>

        <!-- Error banner -->
        <div v-if="fetchError" class="px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
          {{ fetchError }}
        </div>

        <!-- Perencanaan Gantt Chart -->
        <div class="flex-1 min-h-0">
          <PlanningGanttChart
            v-model:filterSensusId="filterSensusId"
            :sensus-options="sensusOptions"
            :items="plannings"
            @add="openDrawer(null)"
            @editItem="openDrawer"
            @remove-plan="handleRemove"
          />
        </div>
      </main>
    </div>

    <!-- Slide-over drawer for add/edit -->
    <PlanningDrawer
      v-model="drawerOpen"
      :title="drawerTitle"
      :edit-item="drawerItem"
      :sensus-options="sensusOptions"
      :prefill-sensus-id="prefillSensusId"
      :prefill-sensus-detail-id="prefillSensusDetailId"
      :prefill-start-date="prefillStartDate"
      :prefill-end-date="prefillEndDate"
      :on-fetch-sensus-details="handleFetchSensusDetails"
      :on-save="handleSave"
      @saved="refreshPlannings"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import PlanningGanttChart from './components/PlanningGanttChart.vue'
import PlanningDrawer from './components/PlanningDrawer.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { useToast } from '../../utils/toast'

const props = defineProps({
  controller: { type: Object, required: true }
})

const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const { show: showToast } = useToast()
const route = useRoute()
const router = useRouter()
const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const intro = computed(() => props.controller.getIntro())

const plannings = ref([])
const sensusOptions = ref([])
const fetchError = ref(null)
const filterSensusId = ref('')

// Drawer state
const drawerOpen = ref(false)
const drawerItem = ref(null)
const drawerTitle = computed(() => drawerItem.value ? 'Edit Rencana' : 'Rencana Baru')
const prefillSensusId = ref('')
const prefillSensusDetailId = ref(null)
const prefillStartDate = ref('')
const prefillEndDate = ref('')

async function refreshPlannings() {
  try {
    plannings.value = await props.controller.fetchPlannings(
      filterSensusId.value ? { idSensus: filterSensusId.value } : {}
    )
  } catch (err) {
    console.error('[Planning] Failed to load plannings:', err)
    fetchError.value = err?.message || 'Gagal memuat data perencanaan.'
  }
}

watch(filterSensusId, () => refreshPlannings())

onMounted(async () => {
  fetchError.value = null
  try {
    const [plans, sensus] = await Promise.all([
      props.controller.fetchPlannings(filterSensusId.value ? { idSensus: filterSensusId.value } : {}),
      props.controller.fetchSensusOptions()
    ])
    plannings.value = plans
    sensusOptions.value = sensus
  } catch (err) {
    console.error('[Planning] Failed to initialise:', err)
    fetchError.value = err?.message || 'Gagal memuat data.'
  }

  // Auto-open drawer if navigated from Sensus Detail or from Pembersihan/Pemupukan
  if (route.query.openDrawer === '1' && route.query.sensusId) {
    prefillSensusId.value = String(route.query.sensusId)
    prefillSensusDetailId.value = route.query.sensusDetailId ? Number(route.query.sensusDetailId) : null
    prefillStartDate.value = route.query.startDate ? String(route.query.startDate) : ''
    prefillEndDate.value = route.query.endDate ? String(route.query.endDate) : ''
    if (route.query.sensusId) filterSensusId.value = String(route.query.sensusId)
    openDrawer(null)
    // Clear query params from URL without re-navigation
    router.replace({ path: route.path })
  }
})

function openDrawer(item) {
  drawerItem.value = item ?? null
  drawerOpen.value = true
}

watch(drawerOpen, (open) => {
  if (!open) {
    prefillSensusId.value = ''
    prefillSensusDetailId.value = null
    prefillStartDate.value = ''
    prefillEndDate.value = ''
  }
})

async function handleFetchSensusDetails(idSensus) {
  return props.controller.fetchSensusDetails(idSensus)
}

async function handleSave(id, payload) {
  if (id) {
    await props.controller.editPlanning(id, payload)
    showToast('Rencana berhasil diperbarui.')
  } else {
    await props.controller.savePlanning(payload)
    showToast('Rencana berhasil dibuat.')
  }
  // errors propagate up — drawer will display inline and we add a toast too
}

async function handleRemove(id) {
  try {
    await props.controller.removePlanning(id)
    await refreshPlannings()
    showToast('Rencana berhasil dihapus.')
  } catch (err) {
    console.error('[Planning] Failed to remove planning:', err)
    showToast(err?.message || 'Gagal menghapus rencana.', 'error')
  }
}
</script>