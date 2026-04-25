<template>
  <div class="flex flex-col gap-4">
    <!-- Toolbar -->
    <div class="flex items-center gap-3">
      <DateRangePicker v-model="dateRange" />
    </div>

    <!-- Main panel -->
    <div class="bg-(--surface) border border-(--border) rounded-xl overflow-hidden shadow-sm">
      <div class="flex min-h-105">

        <!-- Left: Job Types list -->
        <div class="shrink-0 border-r border-(--border)" style="width: 256px">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 border-b border-(--border)" style="height: 68px">
            <span class="text-xs font-extrabold text-(--text-muted) uppercase tracking-widest">Job Types</span>
          </div>

          <!-- Add plan button -->
          <div class="px-4 py-3 border-b border-(--border)">
            <button
              @click="$emit('add-plan')"
              class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-(--text) text-(--surface) text-sm font-semibold hover:opacity-80 transition-opacity cursor-pointer border-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Rencana
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="plans.length === 0" class="flex flex-col items-center justify-center py-16 px-4 gap-2 text-(--text-muted)">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-xs text-center font-medium">Belum ada rencana.<br>Tekan "+ Tambah Rencana"</p>
          </div>

          <!-- Plan rows -->
          <div v-else class="divide-y divide-(--border)">
            <div
              v-for="plan in plans"
              :key="plan.id"
              class="flex items-center px-4 gap-3 group"
              style="height: 70px"
            >
              <!-- Color bar -->
              <div class="shrink-0 w-1 rounded-full self-stretch my-3" :style="{ backgroundColor: jobColor(plan.jobType).bar }"></div>
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-(--text) truncate">{{ plan.jobType }}</div>
                <div class="flex flex-wrap gap-1 mt-1">
                  <template v-if="plan.blocks.slice(0, 3).length">
                    <span
                      v-for="b in plan.blocks.slice(0, 3)"
                      :key="b"
                      class="inline-block text-xs rounded px-1.5 py-0.5 font-medium"
                      :style="{ backgroundColor: jobColor(plan.jobType).chipBg, color: jobColor(plan.jobType).chipText }"
                    >{{ b }}</span>
                    <span
                      v-if="plan.blocks.length > 3"
                      class="inline-block text-xs rounded px-1.5 py-0.5 font-medium text-(--text-muted) bg-(--surface-muted)"
                    >+{{ plan.blocks.length - 3 }} more</span>
                  </template>
                </div>
              </div>
              <!-- Delete -->
              <button
                @click="$emit('remove-plan', plan.id)"
                class="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded text-(--text-muted) hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer border-0 bg-transparent"
                aria-label="Hapus rencana"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Gantt calendar -->
        <div class="flex-1 min-w-0 overflow-x-auto" ref="ganttScroll">
          <div :style="{ width: ganttWidth + 'px', minWidth: '100%' }">

            <!-- Date header -->
            <div class="flex border-b border-(--border) sticky top-0 z-10 bg-(--surface)" style="height: 68px">
              <div
                v-for="day in visibleDays"
                :key="day.iso"
                class="shrink-0 flex flex-col items-center justify-center text-xs font-semibold gap-0.5"
                :class="day.isToday ? 'text-blue-500' : 'text-(--text-muted)'"
                style="width: 48px"
              >
                <span class="text-sm font-bold" :class="day.isToday ? 'text-blue-600' : 'text-(--text)'">{{ day.num }}</span>
                <span class="text-[10px] uppercase tracking-wide">{{ day.dow }}</span>
              </div>
            </div>

            <!-- Empty gantt rows placeholder or plan bars -->
            <div class="relative">

            <!-- Persistent column separator lines + today highlight (always visible) -->
            <div class="absolute inset-0 pointer-events-none flex">
              <div
                v-for="day in visibleDays"
                :key="'col-' + day.iso"
                class="shrink-0 border-r border-(--border)"
                :class="day.isWeekend ? 'bg-(--surface-muted) opacity-60' : ''"
                style="width: 48px"
              ></div>
            </div>

            <!-- Today vertical highlight -->
            <div
              v-if="todayOffset >= 0"
              class="absolute top-0 bottom-0 z-10 pointer-events-none"
              :style="{ left: todayOffset + 'px', width: '48px', background: 'rgba(59,130,246,0.06)' }"
            ></div>
            <div
              v-if="todayOffset >= 0"
              class="absolute top-0 bottom-0 z-10 pointer-events-none"
              :style="{ left: todayOffset + 23 + 'px', width: '2px', background: 'rgba(59,130,246,0.5)' }"
            ></div>

            <!-- Empty state message (no plans) -->
            <div
              v-if="plans.length === 0"
              class="relative flex items-center justify-center z-20"
              style="height: 200px"
            >
              <p class="text-xs text-(--text-muted)">Belum ada rencana.</p>
            </div>

            <!-- Plan bars -->
            <template v-else>
              <div
                v-for="plan in plans"
                :key="'bar-' + plan.id"
                class="relative z-20"
                style="height: 70px"
              >
                <!-- Bar -->
                <div
                  v-if="barStyle(plan)"
                  class="absolute top-1/2 -translate-y-1/2 rounded-lg flex items-center px-3 text-xs font-semibold truncate shadow-sm"
                  style="height: 38px"
                  :style="[barStyle(plan), { backgroundColor: jobColor(plan.jobType).bar, color: '#fff' }]"
                >
                  {{ plan.jobType }} &nbsp;·&nbsp; {{ plan.blocks.length }} block{{ plan.blocks.length !== 1 ? 's' : '' }}
                </div>
              </div>
            </template>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import DateRangePicker from './DateRangePicker.vue'

const props = defineProps({
  plans: { type: Array, default: () => [] }
})

const emit = defineEmits(['add-plan', 'remove-plan'])

// ─── Date range filter ────────────────────────────────────────────────────
const dateRange = ref({ start: null, end: null })

// ─── Window management ────────────────────────────────────────────────────
const DAYS_VISIBLE = 28
const DAY_W = 48

const windowOffset = ref(0)

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// When a date range is selected, jump the window to that start date
watch(() => dateRange.value.start, (iso) => {
  if (iso) {
    const s = startOfWeek(new Date(iso))
    const thisWeek = startOfWeek(new Date())
    const diffDays = Math.round((s - thisWeek) / 86400000)
    windowOffset.value = Math.round(diffDays / 7)
  }
})

// ─── Dynamic visible days (matches range exactly, else default 28) ────────
const daysVisible = computed(() => {
  if (dateRange.value.start && dateRange.value.end) {
    const diff = Math.round(
      (new Date(dateRange.value.end) - new Date(dateRange.value.start)) / 86400000
    )
    return Math.max(1, diff + 1) // inclusive
  }
  return DAYS_VISIBLE
})

const windowStart = computed(() => {
  // If a date range is selected, start exactly on that date — no week snapping
  if (dateRange.value.start) {
    const d = new Date(dateRange.value.start)
    d.setHours(0, 0, 0, 0)
    return d
  }
  const s = startOfWeek(new Date())
  s.setDate(s.getDate() + windowOffset.value * 7)
  return s
})

const visibleDays = computed(() => {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < daysVisible.value; i++) {
    const d = new Date(windowStart.value)
    d.setDate(d.getDate() + i)
    const dow = d.toLocaleDateString('en-US', { weekday: 'short' })
    const isToday = d.getTime() === today.getTime()
    const isWeekend = d.getDay() === 0 || d.getDay() === 6
    days.push({
      iso: d.toISOString().slice(0, 10),
      num: d.getDate(),
      dow,
      isToday,
      isWeekend,
      colIndex: i
    })
  }
  return days
})

const ganttWidth = computed(() => daysVisible.value * DAY_W)

const windowLabel = computed(() => {
  const start = visibleDays.value[0]
  const end = visibleDays.value[daysVisible.value - 1]
  if (!start || !end) return ''
  const s = new Date(start.iso)
  const e = new Date(end.iso)
  const fmt = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt(s)} – ${fmt(e)}`
})

const todayOffset = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const idx = visibleDays.value.findIndex(d => d.iso === today.toISOString().slice(0, 10))
  return idx >= 0 ? idx * DAY_W : -1
})

function shiftWeeks(n) {
  windowOffset.value += n
}

function goToToday() {
  windowOffset.value = 0
}

// ─── Bar positioning ───────────────────────────────────────────────────────
function barStyle(plan) {
  const winStart = windowStart.value
  const winEnd = new Date(winStart)
  winEnd.setDate(winEnd.getDate() + daysVisible.value)

  const start = new Date(plan.startDate)
  const end = new Date(plan.endDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  if (end < winStart || start >= winEnd) return null // out of view

  const clampedStart = start < winStart ? winStart : start
  const clampedEnd = end >= winEnd ? new Date(winEnd.getTime() - 86400000) : end

  const daysDiff = (d1, d2) => Math.round((d2 - d1) / 86400000)

  const left = daysDiff(winStart, clampedStart) * DAY_W + 4
  const width = (daysDiff(clampedStart, clampedEnd) + 1) * DAY_W - 8

  return { left: left + 'px', width: Math.max(width, 16) + 'px', position: 'absolute' }
}

// ─── Job type color palette ────────────────────────────────────────────────
const PALETTE = [
  { bar: '#5b7fa6', chipBg: 'rgba(91,127,166,0.15)', chipText: '#3a5a80' },
  { bar: '#5f9e72', chipBg: 'rgba(95,158,114,0.15)', chipText: '#2e6641' },
  { bar: '#c97c44', chipBg: 'rgba(201,124,68,0.15)',  chipText: '#8b4a15' },
  { bar: '#8b6bca', chipBg: 'rgba(139,107,202,0.15)', chipText: '#5a2d90' },
  { bar: '#ca9a3a', chipBg: 'rgba(202,154,58,0.15)',  chipText: '#8a5e10' },
  { bar: '#4fa8a0', chipBg: 'rgba(79,168,160,0.15)',  chipText: '#1e5e5a' },
]

const colorMap = {}
let colorIdx = 0

function jobColor(jobType) {
  if (!colorMap[jobType]) {
    colorMap[jobType] = PALETTE[colorIdx % PALETTE.length]
    colorIdx++
  }
  return colorMap[jobType]
}
</script>
