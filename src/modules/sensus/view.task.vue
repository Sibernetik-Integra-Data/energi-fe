<template>
  <div class="h-screen flex bg-transparent max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex-1 min-w-0 flex flex-col overflow-hidden">
      <BaseHeader eyebrow="Sensus" title="Sensus" :notifications="0" :user="user" :on-logout="logoutFromKeycloak" />

      <main class="flex-1 min-w-0 p-5 max-[920px]:p-4 overflow-y-auto">
        <div class="mb-4">
          <h1 class="text-2xl font-semibold leading-8 tracking-tight text-(--text) m-0">Detail Penugasan</h1>
          <RouterLink :to="`/sensus/${id}/record`" class="inline-flex items-center gap-2 mt-1 text-sm text-orange-500 hover:text-orange-600 transition-colors">
            <span aria-hidden="true">←</span>
            Kembali ke halaman sebelumnya
          </RouterLink>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-20 text-sm text-(--text-muted)">Memuat detail&hellip;</div>
        <div v-else-if="error" class="flex justify-center items-center py-20 text-sm text-red-500">{{ error }}</div>

        <template v-else-if="plan">
          <section class="bg-(--surface) rounded-xl p-4 mb-4">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex items-center justify-between gap-3 min-w-0 w-full">
                <div class="min-w-0">
                  <h2 class="text-xl font-bold text-(--text) leading-6 m-0 truncate">{{ plan.jobType || 'Pekerjaan' }}</h2>
                  <p class="text-sm text-(--text-muted) m-0">Sensus {{ plan.sensusId || '—' }}</p>
                </div>
                <img :src="workIcon" :alt="`Ikon ${plan.groupOfWork || plan.jobType}`" class="w-46px h-46px shrink-0" />
              </div>
            </div>

            <div class="flex flex-wrap gap-x-8 gap-y-2 text-xs mb-4">
              <div class="flex items-center gap-3"><span class="text-(--text-muted)">Tanggal Sensus</span><strong class="text-(--text)">{{ plan.sensusDate || '—' }}</strong></div>
            </div>
            <div v-if="plan.blocks?.length" class="flex items-start gap-3">
              <p class="text-xs text-(--text-muted) m-0 pt-1 shrink-0">Nomor Petak</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="(block, index) in plan.blocks" :key="index" class="bg-(--surface-muted) border border-(--border) text-(--text) py-1 px-2.5 rounded-full text-xs">{{ block }}</span>
              </div>
            </div>
            <div v-if="plan.startDate || plan.endDate" class="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg bg-[#cce9ff] border border-[#18a0fb] text-[#123b5d]">
              <img :src="infoIcon" alt="" aria-hidden="true" class="w-6 h-6 shrink-0" />
              <p class="text-xs m-0">Rencana Pengerjaan : <strong>{{ plan.startDate || '—' }} s.d. {{ plan.endDate || '—' }}</strong></p>
            </div>
          </section>

          <section>
            <div class="mb-3">
              <h2 class="text-lg font-bold text-(--text) m-0">Realisasi</h2>
              <p class="text-sm text-(--text-muted) m-0 mt-1">Absensi dan laporan dari pekerja untuk setiap kerja.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div v-for="metric in [{ label: 'Total Pekerja Terdaftar', value: effectiveLabors.length, icon: '♧' }, { label: 'Total Hari Pengerjaan', value: workDays, icon: '▣' }, { label: 'Total Mandays', value: mandays, icon: '▤' }]" :key="metric.label" class="bg-(--surface) border border-(--border) rounded-xl p-4 flex items-start justify-between">
                <div><p class="text-xs text-(--text-muted) m-0">{{ metric.label }}</p><p class="text-2xl font-bold text-(--text) m-0 mt-2">{{ metric.value }}</p></div>
                <span class="w-10 h-10 rounded-full bg-(--border-strong) text-(--text-muted) flex items-center justify-center text-xl">{{ metric.icon }}</span>
              </div>
            </div>

            <div v-if="laborGroups.length === 0" class="flex flex-col items-center justify-center py-16 gap-3 text-(--text-muted) border border-(--border) rounded-xl bg-(--surface)">
              <p class="text-sm font-semibold m-0">Belum ada pekerja ditugaskan.</p>
            </div>
            <div v-else class="flex flex-col gap-3">
              <section v-for="group in laborGroups" :key="group.key" class="bg-(--surface) rounded-xl overflow-hidden">
                <button type="button" class="w-full px-4 py-3 flex items-center gap-3 text-left bg-transparent border-0 cursor-pointer hover:bg-(--surface-muted) transition-colors" @click="toggleGroup(group.key)">
                  <div class="min-w-0">
                    <p class="text-base font-bold text-(--text) m-0">{{ group.label }}</p>
                    <p class="text-xs text-(--text-muted) m-0">Sensus {{ plan.sensusId || '—' }}</p>
                  </div>
                  <div class="ml-auto flex items-center gap-2 shrink-0">
                    <span class="inline-flex items-center text-xs px-2 py-1 rounded-full bg-(--status-done-bg) text-(--status-done-text)">{{ group.labors.length }} Submitted</span>
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-(--border) text-(--text-muted)" :class="{ 'rotate-180': expandedGroupKeys.has(group.key) }">⌃</span>
                  </div>
                </button>
                <div v-if="expandedGroupKeys.has(group.key)" class="px-4 pb-4 pt-1 border-t border-(--border)">
                  <div class="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <LaborCard v-for="labor in group.labors" :key="`${group.key}-${labor.id}`" :labor="labor" :plan-id="labor.planId || group.planId" :plan="plan" :work-date="group.rawDate" />
                  </div>
                </div>
              </section>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import LaborCard from '../panen/components/LaborCard.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import cleaningIcon from '@/assets/icons/pembersihan.svg'
import fertilizeIcon from '@/assets/icons/pemupukan.svg'
import harvestIcon from '@/assets/icons/panen.svg'
import infoIcon from '@/assets/icons/info-square-rounded-filled.svg'

const props = defineProps({
  controller: { type: Object, required: true },
  id: { type: [String, Number], default: null },
  detailId: { type: [String, Number], default: null }
})

const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = computed(() => props.controller.getNavigation())
const plan = ref(null)
const loading = ref(false)
const error = ref(null)
const expandedGroupKeys = ref(new Set())

const effectiveLabors = computed(() => Array.isArray(plan.value?.labors) ? plan.value.labors : [])
const workDays = computed(() => new Set(effectiveLabors.value.map((labor) => labor.workDate || labor.pointDate).filter(Boolean)).size || (plan.value ? 1 : 0))
const mandays = computed(() => effectiveLabors.value.length)
const workIcon = computed(() => {
  const group = String(
    plan.value?.groupOfWork ||
    plan.value?.group_of_work_name ||
    plan.value?.type_of_work?.group_of_work_name ||
    ''
  ).toLowerCase()
  const job = String(plan.value?.jobType || plan.value?.type_of_work?.name || '').toLowerCase()
  const key = `${group} ${job}`
  if (key.includes('panen') || key.includes('harvest')) return harvestIcon
  if (key.includes('pemupukan') || key.includes('pupuk') || key.includes('fertiliz')) return fertilizeIcon
  return cleaningIcon
})

const laborGroups = computed(() => {
  const grouped = new Map()
  for (const labor of effectiveLabors.value) {
    const date = labor.workDate || labor.pointDate || plan.value?.startDate || ''
    const planId = labor.planId || labor.plan_id || null
    const key = `${planId || 'no-plan'}::${date || 'unknown'}`
    if (!grouped.has(key)) grouped.set(key, { key, planId, rawDate: date, label: formatDateLabel(date), labors: [] })
    grouped.get(key).labors.push(labor)
  }
  return [...grouped.values()].sort((a, b) => b.rawDate.localeCompare(a.rawDate))
})

watch(laborGroups, (groups) => {
  if (!groups.length) return
  const valid = new Set([...expandedGroupKeys.value].filter((key) => groups.some((group) => group.key === key)))
  if (!valid.size) valid.add(groups[0].key)
  expandedGroupKeys.value = valid
}, { immediate: true })

function toggleGroup(key) {
  const next = new Set(expandedGroupKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedGroupKeys.value = next
}

function formatDateLabel(value) {
  const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return match ? `${match[1]} - ${match[2]} - ${match[3]}` : (value || 'Tanggal belum ditentukan')
}

onMounted(async () => {
  if (!props.id || !props.detailId) {
    error.value = 'Detail penugasan tidak ditemukan.'
    return
  }
  loading.value = true
  try {
    plan.value = await props.controller.loadSensusTaskDetail(props.id, props.detailId)
  } catch (err) {
    error.value = err?.message || 'Gagal memuat detail penugasan.'
  } finally {
    loading.value = false
  }
})
</script>
