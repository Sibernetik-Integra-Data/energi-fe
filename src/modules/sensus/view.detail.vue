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
            :date="sensus.sensus_date_formatted || sensus.sensus_date"
            :reporter="sensus.reporter"
            :status="sensus.status || 'draft'"
            class="mb-5"
          />

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
                :group-of-work="item.groupOfWork"
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
            <SensusPlanning
              :plans="plans"
              @add-plan="openPlanModal(null)"
              @remove-plan="removePlan"
              @view-plan="openPlanDetail"
            />
          </div>

          <!-- Add Plan Panel: v-if + :key ensure the component remounts fresh on
               every open, so script setup re-runs and form.sensusDetailId is
               initialized from the prop before the first render. -->
          <SensusPlanningModal
            v-if="planItem !== null"
            :key="planOpenKey"
            v-model="showPlanModal"
            :items="items"
            :sensus-id="sensus.id_sensus"
            :prefill-sensus-detail-id="planItem.id ?? null"
            @save="addPlan"
          />

          <!-- Plan Detail Panel -->
          <SensusPlanningDetailPanel
            v-model="showDetailPanel"
            :plan="selectedPlan"
            :plan-index="selectedPlanIndex"
            @edit="handleEditPlan"
          />
        </template>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import SensusDetailInfo from './components/SensusDetailInfo.vue'
import SensusJobCard from './components/SensusJobCard.vue'
import SensusPlanning from './components/SensusPlanning.vue'
import SensusPlanningModal from './components/SensusPlanningModal.vue'
import SensusPlanningDetailPanel from './components/SensusPlanningDetailPanel.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'

import { useToast } from '../../utils/toast'

const props = defineProps({
  controller: { type: Object, required: true },
  id: { type: [String, Number], default: null }
})

const appStore = useAppStore()
const navigation = computed(() => props.controller.getNavigation())
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const { show: showToast } = useToast()

const loading = ref(false)
const error = ref(null)
const sensus = ref({})
const items = ref([])
const activeTab = ref('pekerjaan')
const plans = ref([])
const plansLoading = ref(false)
// planItem holds the item the user clicked; null = modal unmounted.
// planOpenKey increments on every open so :key forces a fresh remount even if
// the same card is clicked twice — ensuring script setup re-runs and form
// initializes with the correct prefillSensusDetailId from props.
const planItem = ref(null)
const planOpenKey = ref(0)
const showPlanModal = ref(false)
const showDetailPanel = ref(false)
const selectedPlan = ref(null)
const selectedPlanIndex = ref(1)

async function loadPlans() {
  const idSensus = sensus.value?.id_sensus
  if (!idSensus) return
  plansLoading.value = true
  try {
    plans.value = await props.controller.loadSensusPlanning(idSensus)
  } catch (err) {
    console.error('[SensusDetail] loadPlans error:', err)
    showToast(err?.message || 'Gagal memuat data perencanaan.', 'error')
  } finally {
    plansLoading.value = false
  }
}

watch(activeTab, (tab) => {
  if (tab === 'perencanaan') loadPlans()
})

async function addPlan(payload) {
  try {
    console.log('[SensusDetail] addPlan payload before send:', payload)
    await props.controller.saveSensusPlanning(payload)
    showToast('Rencana berhasil dibuat.')
    await loadPlans()
  } catch (err) {
    console.error('[SensusDetail] addPlan error:', err)
    showToast(err?.message || 'Gagal membuat rencana.', 'error')
    throw err
  }
}

function removePlan(id) {
  plans.value = plans.value.filter(p => p.id !== id)
}
function openPlanDetail(plan) {
  selectedPlan.value = plan
  selectedPlanIndex.value = plans.value.findIndex(p => p.id === plan.id) + 1
  showDetailPanel.value = true
}

function handleEditPlan(plan) {
  showDetailPanel.value = false
  // Future: pre-fill form with plan data for editing
  console.log('[SensusDetail] edit plan', plan.id)
}

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
  activeTab.value = 'perencanaan'
}

function openPlanModal(item) {
  console.log('[SensusDetail] openPlanModal called:', { item, itemId: item?.id ?? null })
  planItem.value = item ?? {}
  planOpenKey.value++
  showPlanModal.value = true
}

function handlePlan(item) {
  activeTab.value = 'perencanaan'
  openPlanModal(item)
}
</script>
