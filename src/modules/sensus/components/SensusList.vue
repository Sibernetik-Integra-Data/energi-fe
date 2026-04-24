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
          class="bg-(--surface) text-(--text) shadow-sm border border-(--border) py-2 px-3.5 rounded-full text-sm font-semibold cursor-pointer"
          role="tab" aria-selected="true"
        >All Reports ({{ rows.length }})</button>
        <button
          class="bg-transparent border-0 py-2 px-3.5 rounded-full text-(--text-muted) text-sm font-semibold cursor-pointer hover:text-(--text) transition-colors"
          role="tab"
        >Open ({{ rows.filter(r => (r.status || 'Open') === 'Open').length }})</button>
        <button
          class="bg-transparent border-0 py-2 px-3.5 rounded-full text-(--text-muted) text-sm font-semibold cursor-pointer hover:text-(--text) transition-colors"
          role="tab"
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
            v-for="row in rows" :key="row.id"
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
        v-for="row in rows" :key="row.id"
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
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps({
  rows: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: null }
})

const openCount = computed(() => (props.rows || []).filter(r => ((r && r.status) || 'Open') === 'Open').length)

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
