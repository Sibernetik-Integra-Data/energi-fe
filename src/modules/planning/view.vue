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

        <!-- Tabs (pill/toggle style matching Sensus Detail) -->
        <div
          class="flex gap-2 bg-(--surface-muted) border border-(--border) p-1.5 rounded-full items-center w-full"
          role="tablist"
          aria-label="Planning tabs"
        >
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.key"
            @click="activeTab = tab.key"
            :class="[
              'flex-1 flex items-center justify-center gap-2 py-2 px-5 rounded-full text-sm font-semibold transition-colors cursor-pointer',
              activeTab === tab.key
                ? 'bg-(--surface) text-(--text) shadow-sm border border-(--border)'
                : 'bg-transparent border-0 text-(--text-muted) hover:text-(--text)'
            ]"
          >
            <span aria-hidden="true">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <!-- Perencanaan tab -->
        <div v-if="activeTab === 'perencanaan'" class="flex-1 min-h-0">
          <PlanningGanttChart
            :items="plannings"
            @add="openDrawer(null)"
            @editItem="openDrawer"
          />
        </div>

        <!-- Realisasi tab placeholder -->
        <div
          v-else
          class="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 border border-(--border) rounded-xl bg-(--surface) text-(--text-muted)"
        >
          <span class="text-4xl">📋</span>
          <p class="text-sm font-medium m-0">Fitur Realisasi segera hadir.</p>
        </div>
      </main>
    </div>

    <!-- Slide-over drawer for add/edit -->
    <PlanningDrawer
      v-model="drawerOpen"
      :title="drawerTitle"
      :edit-item="drawerItem"
      :sensus-options="sensusOptions"
      :aktifitas-options="aktifitasOptions"
      :block-options="blockOptions"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import PlanningGanttChart from './components/PlanningGanttChart.vue'
import PlanningDrawer from './components/PlanningDrawer.vue'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'

const props = defineProps({
  controller: { type: Object, required: true }
})

const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = computed(() => props.controller.getNavigation())
const header = computed(() => props.controller.getHeader())
const intro = computed(() => props.controller.getIntro())
const plannings = computed(() => props.controller.getPlannings())
const sensusOptions = computed(() => props.controller.getSensusOptions())
const aktifitasOptions = computed(() => props.controller.getAktifitasOptions())
const blockOptions = computed(() => props.controller.getBlockOptions())

const TABS = [
  { key: 'perencanaan', label: 'Perencanaan', icon: '📅' },
  { key: 'realisasi',   label: 'Realisasi',   icon: '📋' }
]

const activeTab = ref('perencanaan')

// Drawer state
const drawerOpen = ref(false)
const drawerItem = ref(null)
const drawerTitle = computed(() => drawerItem.value ? 'Edit Rencana' : 'Rencana Baru')

function openDrawer(item) {
  drawerItem.value = item ?? null
  drawerOpen.value = true
}

function handleSave(formData) {
  // TODO: integrate with API
  console.info('Saved planning:', formData)
}
</script>
