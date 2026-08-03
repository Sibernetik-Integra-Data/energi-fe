<template>
  <div class="relative">
    <!-- Title and filters (stacked, filters below subtitle) -->
    <div class="mb-3">
      <div>
        <h2 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0 mb-1.5">{{ title }}</h2>
        <p class="text-sm text-(--text-muted) m-0">{{ subtitle }}</p>
      </div>
      <div class="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 bg-(--surface-muted) border border-(--border) p-2 rounded-xl items-center">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari ID sensus, reporter, blok, atau jenis pekerjaan..."
          class="md:col-span-2 w-full border border-(--border) bg-(--surface) rounded-lg px-3 py-2 text-sm text-(--text) outline-none focus:ring-2 focus:ring-green-200"
        />

        <select
          v-model="sortOrder"
          class="w-full border border-(--border) bg-(--surface) rounded-lg px-3 py-2 text-sm text-(--text) outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
          aria-label="Urutkan data"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>

        <select
          v-model="activeStatus"
          class="w-full border border-(--border) bg-(--surface) rounded-lg px-3 py-2 text-sm text-(--text) outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
          aria-label="Filter status"
        >
          <option value="all">Semua Status ({{ rows.length }})</option>
          <option value="draft">Draft ({{ statusCount.draft }})</option>
          <option value="wip">WIP ({{ statusCount.wip }})</option>
          <option value="done">Done ({{ statusCount.done }})</option>
          <option value="submitted">Submitted ({{ statusCount.submitted }})</option>
        </select>
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
    <div v-if="wipCount > 0" class="sensus-open-badge">{{ wipCount }} WIP</div>
    <div class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[920px]:hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-(--border) bg-(--surface-muted)">
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">SENSUS ID</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">REPORTER</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">TANGGAL</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">BLOK</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">JENIS PEKERJAAN</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">STATUS</th>
            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">AKSI</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in paginatedRows" :key="row.id"
            class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors"
          >
            <td class="py-5 px-6 align-middle text-sm font-bold text-(--text)">{{ row.id }}</td>
            <td class="py-5 px-6 align-middle text-sm text-(--text)">{{ row.worker }}</td>
            <td class="py-5 px-6 align-middle text-sm text-(--text) whitespace-nowrap">{{ row.date }}{{ row.time ? ', ' + row.time : '' }}</td>
            <td class="py-5 px-6 align-middle">
              <div class="flex gap-1.5 flex-wrap">
                <span
                  v-for="(b, idx) in (row.blocks || []).slice(0, 3)" :key="idx"
                  class="inline-block bg-(--surface-muted) border border-(--border) text-(--text) py-0.5 px-2 rounded-full text-xs"
                >{{ b }}</span>
                <span
                  v-if="(row.blocks || []).length > 3"
                  class="inline-block bg-(--surface-muted) border border-(--border) text-(--text-muted) py-0.5 px-2 rounded-full text-xs"
                >+{{ row.blocks.length - 3 }}</span>
              </div>
            </td>
            <td class="py-5 px-6 align-middle">
              <div class="flex gap-2 flex-wrap">
                <span
                  v-for="(j, idx) in row.jobTypes" :key="idx"
                  class="inline-block bg-(--border-strong) text-(--text) py-1.5 px-3 rounded-full text-xs"
                >{{ j }}</span>
                <span v-if="!row.jobTypes || row.jobTypes.length === 0" class="text-xs text-(--text-muted)">—</span>
              </div>
            </td>
            <td class="py-5 px-6 align-middle">
              <span :class="statusChipClass(row.status)">{{ statusLabel(row.status) }}</span>
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
          <span :class="statusChipClass(row.status)">{{ statusLabel(row.status) }}</span>
        </div>
        <!-- Blocks -->
        <div v-if="row.blocks && row.blocks.length" class="flex gap-1.5 flex-wrap">
          <span
            v-for="(b, idx) in row.blocks.slice(0, 4)" :key="'b'+idx"
            class="inline-block bg-(--surface-muted) border border-(--border) text-(--text) py-0.5 px-2 rounded-full text-xs"
          >{{ b }}</span>
          <span
            v-if="row.blocks.length > 4"
            class="inline-block bg-(--surface-muted) border border-(--border) text-(--text-muted) py-0.5 px-2 rounded-full text-xs"
          >+{{ row.blocks.length - 4 }}</span>
        </div>
        <!-- Job types -->
        <div class="flex gap-2 flex-wrap">
          <span
            v-for="(j, idx) in row.jobTypes" :key="idx"
            class="inline-block bg-(--border-strong) text-(--text) py-1.5 px-3 rounded-full text-xs"
          >{{ j }}</span>
          <span v-if="!row.jobTypes || row.jobTypes.length === 0" class="text-xs text-(--text-muted)">—</span>
        </div>
        <div class="flex justify-end gap-2">
          <button @click="navigateToDetail(row)" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-gray-300 bg-(--surface) hover:bg-(--surface-muted) transition-colors cursor-pointer">View</button>
          <button class="text-sm py-1.5 px-4 rounded-lg border-0 bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors cursor-pointer">Verify</button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between mt-5 gap-4 flex-wrap">
      <p class="text-xs text-(--text-muted) font-medium">
        Showing {{ processedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, processedRows.length) }} of {{ processedRows.length }} records
      </p>
      <div class="flex items-center gap-2">
        <label class="text-xs text-(--text-muted) font-medium" for="page-size">Rows:</label>
        <select
          id="page-size"
          v-model.number="pageSize"
          class="border border-(--border) bg-(--surface) rounded-lg px-2.5 py-1.5 text-xs text-(--text) outline-none focus:ring-2 focus:ring-green-200 cursor-pointer"
          aria-label="Jumlah data per halaman"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
        </select>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-end mt-3 gap-4 flex-wrap">
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

const currentPage = ref(1)
const searchQuery = ref('')
const sortOrder = ref('newest')
const activeStatus = ref('all')
const pageSize = ref(10)

const wipCount = computed(() => (props.rows || []).filter(r => r?.status === 'wip').length)

const statusCount = computed(() => {
  const all = props.rows || []
  return {
    draft: all.filter(r => (r?.status || '').toLowerCase() === 'draft').length,
    wip: all.filter(r => (r?.status || '').toLowerCase() === 'wip').length,
    done: all.filter(r => (r?.status || '').toLowerCase() === 'done').length,
    submitted: all.filter(r => (r?.status || '').toLowerCase() === 'submitted').length
  }
})

const filteredByStatusRows = computed(() => {
  const all = props.rows || []
  if (activeStatus.value === 'all') return all
  return all.filter(r => (r?.status || '').toLowerCase() === activeStatus.value)
})

const searchedRows = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return filteredByStatusRows.value

  return filteredByStatusRows.value.filter((row) => {
    const haystack = [
      row.id,
      row.worker,
      row.date,
      row.time,
      row.status,
      ...(row.blocks || []),
      ...(row.jobTypes || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(keyword)
  })
})

function sortWeight(row) {
  const combined = [row?.date, row?.time].filter(Boolean).join(' ')
  const parsed = new Date(combined)
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime()
  if (Number.isFinite(row?.numericId)) return Number(row.numericId)
  const idNumber = Number(String(row?.id || '').replace(/\D/g, ''))
  if (Number.isFinite(idNumber)) return idNumber
  return 0
}

const processedRows = computed(() => {
  const copy = [...searchedRows.value]
  copy.sort((a, b) => {
    const diff = sortWeight(a) - sortWeight(b)
    return sortOrder.value === 'oldest' ? diff : -diff
  })
  return copy
})

const totalPages = computed(() => Math.max(1, Math.ceil(processedRows.value.length / pageSize.value)))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return processedRows.value.slice(start, start + pageSize.value)
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

watch(() => props.rows, () => { currentPage.value = 1 })
watch([searchQuery, sortOrder, activeStatus, pageSize], () => { currentPage.value = 1 })
watch(totalPages, (value) => {
  if (currentPage.value > value) currentPage.value = value
})

function navigateToDetail(row) {
  if (row.numericId) {
    router.push(`/sensus/${row.numericId}`)
  }
}

const STATUS_LABEL = {
  done:      'Done',
  wip:       'WIP',
  draft:     'Draft',
  submitted: 'Submitted',
  verified:  'Verified',
  open:      'Open'
}

function statusLabel(status) {
  return STATUS_LABEL[(status || '').toLowerCase()] || status || 'Draft'
}

function statusChipClass(status) {
  const base = 'inline-block py-1.5 px-3 rounded-full text-xs font-semibold border'
  const s = (status || '').toLowerCase()
  if (s === 'done')      return base + ' bg-green-50 text-green-700 border-green-200'
  if (s === 'verified')  return base + ' bg-emerald-50 text-emerald-700 border-emerald-200'
  if (s === 'submitted') return base + ' bg-blue-50 text-blue-700 border-blue-200'
  if (s === 'wip')       return base + ' bg-yellow-50 text-yellow-700 border-yellow-200'
  // draft or unknown
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
