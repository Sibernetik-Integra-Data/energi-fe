<template>
  <div class="flex min-w-0 flex-col gap-5">
    <section class="rounded-2xl bg-(--surface) p-4">
      <PerformanceFilters v-model:month="month" v-model:year="year" :years="years" />
      <div class="mt-4 grid grid-cols-4 gap-4 max-[920px]:grid-cols-2 max-[560px]:grid-cols-1">
        <div class="performance-stat">
          <div>
            <p>Total hari kerja</p>
            <strong>{{ totalWorkDays }}</strong>
          </div>
          <span><BaseIcon name="calendar" :size="30" /></span>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-(--border) bg-(--surface)">
      <div v-if="loading" class="px-4 py-12 text-center text-sm text-(--text-muted)">Memuat laporan pekerjaan…</div>
      <div v-else-if="error" class="px-4 py-8 text-center text-sm text-red-600">{{ error }}</div>
      <div v-else class="overflow-x-auto">
        <table class="worker-performance-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pekerjaan</th>
              <th>Tipe Pekerjaan</th>
              <th>ID Sensus</th>
              <th class="text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="`${row.id}-${row.date}`">
              <td>{{ formatPerformanceDate(row.date) }}</td>
              <td>{{ row.workName }}</td>
              <td>{{ row.groupOfWork }}</td>
              <td>{{ row.sensusId }}</td>
              <td class="text-center">
                <button type="button" class="worker-report-view" @click="selectedReport = row">View</button>
              </td>
            </tr>
            <tr v-if="!rows.length">
              <td colspan="5" class="empty-cell">Tidak ada laporan pada periode ini.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <LaborActionPopup
      v-if="selectedReport"
      :labor="selectedReport.labor"
      :plan-id="selectedReport.planId"
      :plan="selectedReport.plan"
      :work-date="selectedReport.date"
      @close="selectedReport = null" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BaseIcon from '../../shared/icon'
import LaborActionPopup from '../../pembersihan/components/LaborActionPopup.vue'
import PerformanceFilters from './PerformanceFilters.vue'
import {
  countPerformanceDays,
  filterWorkerPerformanceRows,
  formatPerformanceDate,
  getDefaultPerformancePeriod,
  loadWorkerPerformance
} from '../model'

const props = defineProps({ userId: { type: String, default: '' } })
const initialPeriod = getDefaultPerformancePeriod()
const month = ref(initialPeriod.month)
const year = ref(initialPeriod.year)
const reports = ref([])
const loading = ref(false)
const error = ref('')
const selectedReport = ref(null)
const rows = computed(() => filterWorkerPerformanceRows(reports.value, month.value, year.value))
const totalWorkDays = computed(() => countPerformanceDays(rows.value))
const years = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, index) => currentYear - index)
})

async function loadReports() {
  if (!props.userId) return
  loading.value = true
  error.value = ''
  try {
    reports.value = await loadWorkerPerformance(props.userId)
  } catch (loadError) {
    error.value = loadError?.message || 'Gagal memuat laporan pekerjaan.'
  } finally {
    loading.value = false
  }
}

onMounted(loadReports)
watch(() => props.userId, loadReports)
</script>

<style scoped>
.performance-stat {
  display: flex;
  min-height: 122px;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--surface);
  padding: 22px;
}

.performance-stat p {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
}

.performance-stat strong {
  display: block;
  margin-top: 24px;
  font-size: 26px;
}

.performance-stat > span {
  display: flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #b8a44c;
  color: #fff;
}

.worker-performance-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}

.worker-performance-table th {
  padding: 12px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .04em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.worker-performance-table td {
  border-top: 1px solid var(--border);
  padding: 9px 12px;
  color: var(--text);
  font-size: 14px;
  white-space: nowrap;
}

.worker-performance-table .empty-cell {
  padding: 36px 12px;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
}

.worker-report-view {
  min-width: 56px;
  border: 1px solid var(--border-strong, var(--border));
  border-radius: 999px;
  background: transparent;
  color: var(--text);
  padding: 4px 12px;
  font-size: 13px;
  cursor: pointer;
}

.worker-report-view:hover {
  background: var(--surface-muted);
}
</style>
