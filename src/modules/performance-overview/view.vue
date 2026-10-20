<template>
  <div class="flex h-screen bg-(--bg) text-(--text) max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader eyebrow="Management" title="Performance Overview" :notifications="0" :user="user" :on-logout="logoutFromKeycloak" />
      <main class="min-w-0 flex-1 overflow-y-auto bg-(--surface-muted) p-6 max-[920px]:p-4">
        <div class="mb-6">
          <h1 class="m-0 text-2xl font-semibold leading-8">Performance Overview</h1>
          <p class="m-0 mt-1 text-sm text-(--text-muted)">Monitor your plantation operations and activities</p>
        </div>

        <div class="mb-6 flex flex-col gap-6 rounded-2xl bg-(--surface) p-4">
          <PerformanceFilters v-model:month="month" v-model:year="year" :years="years" />
          <div class="grid grid-cols-4 gap-4 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">
            <div class="performance-stat">
              <div>
                <p>Total Pekerja</p>
                <strong>{{ totalWorkers }}</strong>
              </div>
              <span><BaseIcon name="users" :size="30" /></span>
            </div>
            <div class="performance-stat">
              <div>
                <p>Total hari kerja</p>
                <strong>{{ totalWorkDays }}</strong>
              </div>
              <span><BaseIcon name="calendar" :size="30" /></span>
            </div>
          </div>
        </div>

        <div v-if="loading" class="rounded-xl bg-(--surface) px-4 py-12 text-center text-sm text-(--text-muted)">Memuat data performa…</div>
        <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{{ error }}</div>
        <PerformanceOverviewTable v-else :rows="visibleRows" :can-view-profiles="canViewProfiles" @view="openWorker" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import BaseIcon from '../shared/icon'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { navigation as sharedNavigation } from '../shared/navigation'
import userManagementService from '../user-management/services/userManagementService'
import PerformanceFilters from './components/PerformanceFilters.vue'
import PerformanceOverviewTable from './components/PerformanceOverviewTable.vue'
import { buildWorkerPerformanceRows, getDefaultPerformancePeriod } from './model'

const props = defineProps({ controller: { type: Object, required: true } })
const appStore = useAppStore()
const router = useRouter()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation
const initialPeriod = getDefaultPerformancePeriod()
const month = ref(initialPeriod.month)
const year = ref(initialPeriod.year)
const loading = ref(false)
const error = ref('')
const workers = ref([])
const laborRows = ref([])
const canViewProfiles = ref(false)
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, index) => currentYear - index)
})
const allRows = computed(() => buildWorkerPerformanceRows(workers.value, laborRows.value, month.value, year.value))
const visibleRows = computed(() => allRows.value.filter((row) => row.workDays > 0))
const totalWorkers = computed(() => visibleRows.value.length)
const totalWorkDays = computed(() => visibleRows.value.reduce((total, row) => total + row.workDays, 0))

onMounted(async () => {
  loading.value = true
  error.value = ''
  const [dataResult, accessResult] = await Promise.allSettled([
    props.controller.fetchOverview(),
    userManagementService.verifyWorkerProfileAccess()
  ])
  if (dataResult.status === 'fulfilled') {
    workers.value = dataResult.value.workers || []
    laborRows.value = dataResult.value.laborRows || []
  } else {
    error.value = dataResult.reason?.message || 'Gagal memuat data performa.'
  }
  canViewProfiles.value = accessResult.status === 'fulfilled' && accessResult.value?.canViewWorkerProfiles === true
  loading.value = false
})

function openWorker(row) {
  if (!canViewProfiles.value || !row?.user_id) return
  router.push({
    path: `/master-data/pekerja/${encodeURIComponent(row.user_id)}`,
    query: { tab: 'performance' }
  })
}
</script>

<style scoped>
.performance-stat {
  display: flex;
  min-height: 142px;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  padding: 24px;
}

.performance-stat p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.performance-stat strong {
  display: block;
  margin-top: 30px;
  color: var(--text);
  font-size: 28px;
  line-height: 1.2;
}

.performance-stat > span {
  display: flex;
  width: 56px;
  height: 56px;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: #b8a44c;
  color: #fff;
}
</style>
