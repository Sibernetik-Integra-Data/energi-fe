<template>
  <div class="relative">
    <!-- Title and filters (stacked, filters below subtitle) -->
    <div class="mb-3">
      <div>
        <h2 class="text-2xl font-extrabold tracking-tight text-(--text) m-0 mb-1.5">{{ title }}</h2>
        <p class="text-sm text-(--text-muted) m-0">{{ subtitle }}</p>
      </div>
      <div class="mt-3 flex gap-2 bg-(--surface-muted) border border-(--border) p-1.5 rounded-full items-center shrink-0" role="tablist" aria-label="Sensus filters">
        <button
          @click="setFilter('all')"
          :class="activeFilter === 'all' ? 'bg-(--surface) text-(--text) shadow-sm border border-(--border)' : 'bg-transparent border-0 text-(--text-muted) hover:text-(--text)'"
          class="py-2 px-3.5 rounded-full text-sm font-semibold cursor-pointer transition-colors"
          role="tab" :aria-selected="activeFilter === 'all'"
        >All Reports ({{ rows.length }})</button>
        <button
          @click="setFilter('open')"
          :class="activeFilter === 'open' ? 'bg-(--surface) text-(--text) shadow-sm border border-(--border)' : 'bg-transparent border-0 text-(--text-muted) hover:text-(--text)'"
          class="py-2 px-3.5 rounded-full text-sm font-semibold cursor-pointer transition-colors"
          role="tab" :aria-selected="activeFilter === 'open'"
        >Open ({{ rows.filter(r => (r.status || 'Open') === 'Open').length }})</button>
        <button
          @click="setFilter('verified')"
          :class="activeFilter === 'verified' ? 'bg-(--surface) text-(--text) shadow-sm border border-(--border)' : 'bg-transparent border-0 text-(--text-muted) hover:text-(--text)'"
          class="py-2 px-3.5 rounded-full text-sm font-semibold cursor-pointer transition-colors"
          role="tab" :aria-selected="activeFilter === 'verified'"
        >Verified ({{ rows.filter(r => r.status === 'Verified').length }})</button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">
      Memuat data&hellip;
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex justify-center items-center py-16 text-sm text-red-600">
      {{ error }}
    </div>

    <!-- Table desktop -->
    <template v-else>
    <!-- Floating open badge (right side) -->
    <div v-if="openCount > 0" class="sensus-open-badge">{{ openCount }} Open</div>
    <div class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[920px]:hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-(--border) bg-(--surface-muted)">
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">SENSUS ID</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">REPORTER</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">DATE & TIME</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">JOB TYPES</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">STATUS</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">ACTION</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in paginatedRows" :key="row.id"
            class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors"
          >
            <td class="py-5 px-6 align-middle text-sm font-bold text-(--text)">{{ row.id }}</td>
            <td class="py-5 px-6 align-middle text-sm text-(--text)">{{ row.worker }}</td>
            <td class="py-5 px-6 align-middle text-sm text-(--text)">{{ row.date }}{{ row.time ? ', ' + row.time : '' }}</td>
            <td class="py-5 px-6 align-middle">
              <div class="flex gap-2 flex-wrap">
                <span
                  v-for="(j, idx) in row.jobTypes" :key="idx"
                  class="inline-block bg-(--border-strong) text-(--text) py-1.5 px-3 rounded-full text-xs"
                >{{ j }}</span>
              </div>
            </td>
            <td class="py-5 px-6 align-middle">
              <span :class="statusChipClass(row.status)">{{ row.status || 'Open' }}</span>
            </td>
            <td class="py-5 px-6 align-middle">
              <div class="flex gap-2.5 items-center">
                <button @click="navigateToDetail(row)" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border border-gray-300 hover:bg-(--surface-muted) transition-colors cursor-pointer">View</button>
                <button class="text-sm py-1.5 px-4 rounded-lg border-0 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors cursor-pointer">Verify</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile cards -->
    <div class="hidden gap-3 mt-3 max-[920px]:flex max-[920px]:flex-col">
      <div
        v-for="row in paginatedRows" :key="row.id"
        class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-3"
      >
        <div class="flex justify-between items-start gap-3">
          <div>
            <div class="font-bold text-sm text-(--text)">{{ row.id }}</div>
            <div class="text-xs text-(--text-muted) mt-0.5">{{ row.worker }} • {{ row.date }}{{ row.time ? ', ' + row.time : '' }}</div>
          </div>
          <span :class="statusChipClass(row.status)">{{ row.status || 'Open' }}</span>
        </div>
        <div class="flex gap-2 flex-wrap">
          <span
            v-for="(j, idx) in row.jobTypes" :key="idx"
            class="inline-block bg-(--border-strong) text-(--text) py-1.5 px-3 rounded-full text-xs"
          >{{ j }}</span>
        </div>
        <div class="flex justify-end gap-2">
          <button @click="navigateToDetail(row)" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-gray-300 bg-(--surface) hover:bg-(--surface-muted) transition-colors cursor-pointer">View</button>
          <button class="text-sm py-1.5 px-4 rounded-lg border-0 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors cursor-pointer">Verify</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between mt-5 gap-4 flex-wrap">
      <p class="text-xs text-(--text-muted) font-medium">
        Showing {{ (currentPage - 1) * 10 + 1 }}–{{ Math.min(currentPage * 10, filteredRows.length) }} of {{ filteredRows.length }} records
      </p>
      <nav class="flex items-center gap-1" aria-label="Pagination">
        <!-- Prev -->
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-(--border) bg-(--surface) text-(--text) hover:bg-(--surface-muted) disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          aria-label="Previous page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>

        <!-- Page numbers -->
        <template v-for="(p, i) in visiblePages" :key="i">
          <span v-if="p === '...'" class="flex items-center justify-center w-9 h-9 text-(--text-muted) text-sm select-none">…</span>
          <button
            v-else
            @click="currentPage = p"
            :aria-current="currentPage === p ? 'page' : undefined"
            :class="currentPage === p
              ? 'bg-green-600 text-white border-green-600 shadow-sm shadow-green-200 scale-105'
              : 'bg-(--surface) text-(--text) border-(--border) hover:bg-(--surface-muted)'"
            class="flex items-center justify-center w-9 h-9 rounded-lg border text-sm font-semibold transition-all duration-150 cursor-pointer"
          >{{ p }}</button>
        </template>

        <!-- Next -->
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-(--border) bg-(--surface) text-(--text) hover:bg-(--surface-muted) disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer"
          aria-label="Next page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </nav>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  rows: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
})

const PAGE_SIZE = 10
const currentPage = ref(1)
const activeFilter = ref('all')

const openCount = computed(() => (props.rows || []).filter(r => ((r && r.status) || 'Open') === 'Open').length)

const filteredRows = computed(() => {
  const all = props.rows || []
  if (activeFilter.value === 'open') return all.filter(r => (r.status || 'Open') === 'Open')
  if (activeFilter.value === 'verified') return all.filter(r => r.status === 'Verified')
  return all
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / PAGE_SIZE)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredRows.value.slice(start, start + PAGE_SIZE)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const cur = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (cur > 3) pages.push('...')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

function setFilter(f) {
  activeFilter.value = f
  currentPage.value = 1
}

watch(() => props.rows, () => { currentPage.value = 1 })

function navigateToDetail(row) {
  if (row.numericId) {
    router.push(`/sensus/${row.numericId}`)
  }
}

function statusChipClass(status) {
  const base = 'inline-block py-1.5 px-3 rounded-full text-xs font-semibold border'
  if (status && status.toLowerCase() === 'verified') {
    return base + ' bg-green-50 text-green-700 border-green-200'
  }
  return base + ' bg-orange-50 text-orange-700 border-orange-200'
}
</script>

<style scoped>
.sensus-open-badge {
  position: absolute;
  top: 12px;
  right: 24px;
  background: #f59e0b;
  color: #fff;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(15,23,42,0.08);
  z-index: 10;
  font-size: 13px;
}
@media (max-width: 920px) {
  .sensus-open-badge { display: none; }
}
</style>
