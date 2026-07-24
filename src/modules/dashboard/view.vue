<template>
  <div class="dashboard-shell">
    <BaseSidebar :items="navigation" :user="user" />

    <div class="dashboard-main">
      <BaseHeader
        eyebrow="Dashboard"
        :title="header.title"
        :notifications="header.notifications"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />

      <main class="dashboard-content">
        <section class="dashboard-intro">
          <div>
            <p class="dashboard-kicker">POV Kepala Kebun</p>
            <h1>{{ intro.title }}</h1>
          </div>
          <p class="dashboard-description">{{ intro.description }}</p>
        </section>

        <!-- Metrics filter + cards section -->
        <section aria-label="Filter & ringkasan aktivitas">
          <div class="dashboard-metrics-header">
            <DashboardMetricsFilter @change="onFilterChange" />
          </div>
          <div class="dashboard-metrics">
            <DashboardMetricCard
              v-for="metric in metrics"
              :key="metric.title"
              :metric="metric"
            />
          </div>
        </section>

        <section class="dashboard-grid">
          <PendingVerificationsSection :section="pendingVerification" />
          <RecentVerifiedSection :section="recentVerified" />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseHeader from '../shared/header'
import DashboardMetricCard from './components/DashboardMetricCard.vue'
import DashboardMetricsFilter from './components/DashboardMetricsFilter.vue'
import BaseSidebar from '../shared/sidebar'
import PendingVerificationsSection from './components/PendingVerificationsSection.vue'
import RecentVerifiedSection from './components/RecentVerifiedSection.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'

const props = defineProps({
  controller: {
    type: Object,
    required: true
  }
})

const appStore = useAppStore()

// Current filter state — default to current month/year
const now = new Date()
const activeFilter = ref({
  mode: 'monthly',
  year: now.getFullYear(),
  month: now.getMonth() + 1
})

const metricsData = ref(null)
const metricsLoading = ref(false)

const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const intro = computed(() => props.controller.getIntro())
const pendingVerification = computed(() => props.controller.getPendingVerification())
const recentVerified = computed(() => props.controller.getRecentVerified())
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())

const metrics = computed(() => {
  if (metricsData.value) {
    return metricsData.value
  }
  return props.controller.getMetrics(activeFilter.value)
})

async function loadMetricsForFilter(filter) {
  metricsLoading.value = true
  metricsData.value = null // clear to show placeholders while loading
  try {
    const loaded = await props.controller.loadMetrics(filter)
    metricsData.value = loaded
  } catch (error) {
    console.error('[Dashboard] Failed to load metrics:', error)
  } finally {
    metricsLoading.value = false
  }
}

function onFilterChange(filter) {
  activeFilter.value = filter
  if (appStore.ready) {
    loadMetricsForFilter(filter)
  }
}

// Load on ready
watch(
  () => appStore.ready,
  async (ready) => {
    if (!ready || metricsLoading.value) return
    loadMetricsForFilter(activeFilter.value)
  },
  { immediate: true }
)
</script>

<style scoped>
.dashboard-shell {
  height: 100vh;
  display: flex;
  background: transparent;
}

.dashboard-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-content {
  flex: 1;
  min-width: 0;
  padding: 24px;
  display: grid;
  gap: 24px;
  overflow: auto;
}

.dashboard-intro {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: end;
}

.dashboard-kicker {
  margin: 0 0 8px;
  color: var(--brand);
  font-size: 12px;
  line-height: 16px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.dashboard-intro h1 {
  margin: 0;
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.dashboard-description {
  max-width: 560px;
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 22px;
}

.dashboard-metrics-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.dashboard-grid {
  display: grid;
  gap: 20px;
}

@media (max-width: 1180px) {
  .dashboard-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .dashboard-shell {
    flex-direction: column;
  }

  .dashboard-content {
    padding: 18px;
  }

  .dashboard-intro {
    flex-direction: column;
    align-items: start;
  }

  .dashboard-metrics {
    grid-template-columns: 1fr;
  }
}
</style>