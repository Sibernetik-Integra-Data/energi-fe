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
            <h1>{{ intro.title }}</h1>
            <p class="dashboard-description">{{ intro.description }}</p>
          </div>
          <!-- Quick links from the CMS (Dashboard Setting -> quickLinks) -->
          <nav v-if="quickLinks.length" class="dashboard-quick-links" aria-label="Tautan cepat">
            <template v-for="link in quickLinks" :key="`${link.label}-${link.url}`">
              <RouterLink v-if="link.isInternal" :to="link.url" class="dashboard-quick-link" :title="link.description || undefined">
                {{ link.label }}
              </RouterLink>
              <a v-else :href="link.url" target="_blank" rel="noopener noreferrer" class="dashboard-quick-link"
                :title="link.description || undefined">{{ link.label }} ↗</a>
            </template>
          </nav>
        </section>

        <!-- Metrics filter + cards section -->
        <section v-if="metrics.length" aria-label="Filter & ringkasan aktivitas">
          <div class="dashboard-metrics-header">
            <DashboardMetricsFilter @change="onFilterChange" />
          </div>
          <div class="dashboard-metrics" :style="{ '--metric-columns': Math.min(metrics.length, 4) }">
            <DashboardMetricCard
              v-for="metric in metrics"
              :key="metric.key || metric.title"
              :metric="metric"
            />
          </div>
        </section>

        <section v-if="showPending || showRecent" class="dashboard-grid">
          <PendingVerificationsSection v-if="showPending" :section="pendingVerification" />
          <RecentVerifiedSection v-if="showRecent" :section="recentVerified" />
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
import { applyMetricSettings, useDashboardSettings } from './dashboardSettings'

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

// Presentation from the CMS (Dashboard Setting); null keeps the built-in dashboard.
const cms = useDashboardSettings()

// CMS text wins when set; otherwise the built-in text from the model.
function withCmsText(base, override) {
  return {
    ...base,
    title: override?.title || base.title,
    ...('subtitle' in base ? { subtitle: override?.subtitle || base.subtitle } : {}),
    ...('description' in base ? { description: override?.description || base.description } : {})
  }
}

const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const intro = computed(() => withCmsText(props.controller.getIntro(), cms.value?.intro))
const pendingVerification = computed(() => withCmsText(props.controller.getPendingVerification(), cms.value?.pending))
const recentVerified = computed(() => withCmsText(props.controller.getRecentVerified(), cms.value?.recent))
const showPending = computed(() => cms.value?.pending?.isVisible !== false)
const showRecent = computed(() => cms.value?.recent?.isVisible !== false)
const quickLinks = computed(() => cms.value?.quickLinks || [])
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())

const metrics = computed(() => {
  const base = metricsData.value || props.controller.getMetrics(activeFilter.value)
  return applyMetricSettings(base, cms.value?.metrics)
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
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
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
  margin: 6px 0 0;
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
  /* Number of visible cards (max 4), set from the CMS settings. */
  grid-template-columns: repeat(var(--metric-columns, 4), minmax(0, 1fr));
  gap: 16px;
}

.dashboard-quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.dashboard-quick-link {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 150ms ease, color 150ms ease;
}

.dashboard-quick-link:hover,
.dashboard-quick-link:focus-visible {
  border-color: var(--brand);
  color: var(--brand);
  outline: none;
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

  .dashboard-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
