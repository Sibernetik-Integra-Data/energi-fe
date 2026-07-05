<template>
  <div class="relative" ref="rootRef">
    <!-- Trigger button -->
    <button
      @click="toggle"
      class="flex items-center gap-2 py-2 px-3.5 rounded-lg border border-(--border) bg-(--surface) text-(--text) text-sm font-medium hover:bg-(--surface-muted) transition-colors cursor-pointer"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-(--text-muted) shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
      </svg>
      <span class="text-(--text-muted) font-semibold">Date:</span>
      <span v-if="modelValue.start && modelValue.end" class="text-(--text)">
        {{ formatDate(modelValue.start) }} – {{ formatDate(modelValue.end) }}
      </span>
      <span v-else class="text-(--text-muted) italic">Pilih rentang tanggal</span>
    </button>

    <!-- Popover -->
    <Transition name="dp-pop">
      <div
        v-if="open"
        class="absolute z-50 mt-2 bg-(--surface) border border-(--border) rounded-2xl shadow-2xl overflow-hidden"
        style="width: 320px; left: 0; top: 100%"
      >
        <!-- Month header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-(--border)">
          <button
            @click="prevMonth"
            class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--surface-muted) text-(--text) cursor-pointer border-0 bg-transparent transition-colors"
            aria-label="Bulan sebelumnya"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-sm font-bold text-(--text)">{{ monthLabel }}</span>
          <button
            @click="nextMonth"
            class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-(--surface-muted) text-(--text) cursor-pointer border-0 bg-transparent transition-colors"
            aria-label="Bulan berikutnya"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Day of week headers -->
        <div class="grid grid-cols-7 px-3 pt-3 pb-1">
          <div
            v-for="d in DOW"
            :key="d"
            class="flex items-center justify-center text-xs font-semibold text-(--text-muted) h-8"
          >{{ d }}</div>
        </div>

        <!-- Date grid -->
        <div class="grid grid-cols-7 px-3 pb-4 gap-y-0.5">
          <!-- Empty leading cells -->
          <div v-for="n in leadingBlanks" :key="'b' + n"></div>

          <!-- Day cells -->
          <div
            v-for="cell in dayCells"
            :key="cell.iso"
            @click="selectDay(cell)"
            @mouseenter="hoverDay(cell)"
            :class="cellClass(cell)"
            class="relative h-9 flex items-center justify-center cursor-pointer select-none"
          >
            <!-- Range fill background (behind the number) -->
            <div
              v-if="cell.inRange || cell.isStart || cell.isEnd"
              :class="rangeFillClass(cell)"
              class="absolute inset-y-1 pointer-events-none"
            ></div>

            <!-- Circle for start/end -->
            <span
              :class="[
                'relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-colors',
                cell.isStart || cell.isEnd
                  ? 'bg-blue-500 text-white'
                  : cell.isToday
                    ? 'text-blue-500 font-bold'
                    : cell.inRange
                      ? 'text-white'
                      : 'text-(--text) hover:bg-(--surface-muted)'
              ]"
            >{{ cell.day }}</span>
          </div>
        </div>

        <!-- Footer: max warning + clear -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-(--border) bg-(--surface-muted)">
          <span class="text-xs text-(--text-muted)">Min. 7 hari · Maks. 28 hari</span>
          <button
            @click="clearRange"
            class="text-xs font-semibold text-(--text-muted) hover:text-red-500 cursor-pointer border-0 bg-transparent transition-colors"
          >Reset</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useToast } from '../../../utils/toast'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null })
  }
})
const emit = defineEmits(['update:modelValue'])

const MAX_DAYS = 28
const MIN_DAYS = 7

const { show: showToast } = useToast()
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const open = ref(false)
const rootRef = ref(null)

// Calendar view month
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth()) // 0-indexed

// Hover state for range preview
const hoverIso = ref(null)

// Internal selection state (stage: picking start or end)
const picking = ref('start') // 'start' | 'end'
const tempStart = ref(props.modelValue.start || null)

function toggle() {
  open.value = !open.value
  if (open.value) {
    // Jump calendar to the start date if already set
    const d = props.modelValue.start ? new Date(props.modelValue.start) : new Date()
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
    picking.value = 'start'
    tempStart.value = null
    hoverIso.value = null
  }
}

// ─── Month navigation ──────────────────────────────────────────────────────
const monthLabel = computed(() => {
  return new Date(viewYear.value, viewMonth.value, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value-- }
  else viewMonth.value--
}
function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++ }
  else viewMonth.value++
}

// ─── Calendar grid ─────────────────────────────────────────────────────────
const daysInMonth = computed(() =>
  new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
)

// How many blank cells before the 1st (0=Sun,1=Mon,...,6=Sat)
const leadingBlanks = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).getDay()
)

const todayIso = new Date().toISOString().slice(0, 10)

const dayCells = computed(() => {
  const cells = []
  const activeStart = tempStart.value
  const activeEnd = hoverIso.value

  for (let d = 1; d <= daysInMonth.value; d++) {
    const iso = isoOf(viewYear.value, viewMonth.value, d)

    let isStart = false
    let isEnd = false
    let inRange = false

    if (picking.value === 'end' && activeStart) {
      // Preview range while hovering
      const s = activeStart
      const e = activeEnd || s
      const lo = s <= e ? s : e
      const hi = s <= e ? e : s
      isStart = iso === lo
      isEnd = iso === hi
      inRange = iso > lo && iso < hi
    } else if (props.modelValue.start && props.modelValue.end) {
      isStart = iso === props.modelValue.start
      isEnd = iso === props.modelValue.end
      inRange = iso > props.modelValue.start && iso < props.modelValue.end
    }

    cells.push({
      iso,
      day: d,
      isToday: iso === todayIso,
      isStart,
      isEnd,
      inRange
    })
  }
  return cells
})

// ─── Selection logic ───────────────────────────────────────────────────────
function selectDay(cell) {
  if (picking.value === 'start') {
    tempStart.value = cell.iso
    picking.value = 'end'
    hoverIso.value = null
  } else {
    // picking end
    const s = tempStart.value
    const e = cell.iso
    const lo = s <= e ? s : e
    const hi = s <= e ? e : s

    const diff = daysBetween(lo, hi) // inclusive diff (e.g. 5→12 = 7 days = diff 7)
    const days = diff + 1

    if (days < MIN_DAYS) {
      showToast(`Rentang minimal ${MIN_DAYS} hari. Pilih rentang yang lebih panjang.`, 'error')
      // reset to re-pick start
      picking.value = 'start'
      tempStart.value = null
      hoverIso.value = null
      return
    }
    if (days > MAX_DAYS) {
      showToast(`Rentang maksimal ${MAX_DAYS} hari. Silakan kurangi rentang tanggal.`, 'error')
      // reset to re-pick start
      picking.value = 'start'
      tempStart.value = null
      hoverIso.value = null
      return
    }

    emit('update:modelValue', { start: lo, end: hi })
    open.value = false
    picking.value = 'start'
    tempStart.value = null
    hoverIso.value = null
  }
}

function hoverDay(cell) {
  if (picking.value === 'end') {
    hoverIso.value = cell.iso
  }
}

function clearRange() {
  emit('update:modelValue', { start: null, end: null })
  open.value = false
  picking.value = 'start'
  tempStart.value = null
  hoverIso.value = null
}

// ─── Cell styling ──────────────────────────────────────────────────────────
function cellClass(cell) {
  return []
}

function rangeFillClass(cell) {
  const base = 'absolute inset-y-1 bg-blue-500/20'
  if (cell.isStart && cell.isEnd) return base + ' inset-x-1 rounded-full'
  if (cell.isStart) return base + ' left-1 right-0 rounded-l-full'
  if (cell.isEnd) return base + ' left-0 right-1 rounded-r-full'
  return base + ' left-0 right-0'
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function isoOf(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000)
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Close on outside click ────────────────────────────────────────────────
function onOutsideClick(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) {
    open.value = false
    picking.value = 'start'
    tempStart.value = null
    hoverIso.value = null
  }
}

onMounted(() => document.addEventListener('mousedown', onOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', onOutsideClick))
</script>

<style scoped>
.dp-pop-enter-active,
.dp-pop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dp-pop-enter-from,
.dp-pop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
