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

      <main class="flex-1 min-w-0 p-5 max-[920px]:p-4 overflow-y-auto">
        <div class="flex flex-col gap-1 mb-4">
          <h1 class="text-2xl font-semibold leading-8 tracking-tight text-(--text) m-0">Sensus Detail</h1>
          <RouterLink
            :to="`/sensus/${id}`"
            class="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 transition-colors w-fit"
          >
            <span aria-hidden="true">←</span>
            Kembali ke Sensus list
          </RouterLink>
        </div>

        <div v-if="loading" class="flex justify-center items-center py-20 text-sm text-(--text-muted)">
          Memuat data&hellip;
        </div>

        <div v-else-if="error" class="flex justify-center items-center py-20 text-sm text-red-500">
          {{ error }}
        </div>

        <template v-else>
          <section class="bg-(--surface) rounded-xl p-4 mb-3">
            <div class="flex items-center justify-between gap-3 mb-3">
              <h2 class="text-xl font-bold text-(--text) leading-6 m-0">
                {{ summaryId }}
              </h2>
              <span class="bg-(--status-wip-bg) text-(--status-wip-text) border border-(--status-wip-text)/30 rounded-lg px-2.5 py-1 text-xs font-medium">
                Open
              </span>
            </div>
            <dl class="grid gap-2 text-sm m-0">
              <div class="flex gap-6">
                <dt class="text-(--text-muted) w-24 shrink-0">Date &amp; Time</dt>
                <dd class="text-(--text) m-0">{{ sensus.sensus_date || '—' }}</dd>
              </div>
              <div class="flex gap-6">
                <dt class="text-(--text-muted) w-24 shrink-0">Reporter</dt>
                <dd class="text-(--text) m-0">{{ sensus.reporter || '—' }}</dd>
              </div>
            </dl>
          </section>

          <section class="bg-(--surface) border border-(--border) rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr class="bg-(--surface-muted) border-b border-(--border)">
                    <th v-for="column in columns" :key="column.key" class="text-left text-xs font-semibold text-(--text-muted) uppercase tracking-wide px-5 py-3">
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in paginatedRows" :key="row.id" class="border-b border-(--border) last:border-b-0">
                    <td class="px-5 py-2.5 text-sm font-medium text-(--text)">{{ row.task }}</td>
                    <td class="px-5 py-2.5 text-sm text-(--text)">{{ row.taskType }}</td>
                    <td class="px-5 py-2.5 text-sm text-(--text)">{{ row.totalBlock }}</td>
                    <td class="px-5 py-2.5">
                      <span :class="row.status.className">{{ row.status.label }}</span>
                    </td>
                    <td class="px-5 py-2.5 text-center">
                      <button type="button" class="inline-flex items-center justify-center h-8 min-w-16 px-3 rounded-full border border-(--border-strong) text-xs font-medium text-(--text-muted) hover:bg-(--surface-muted) transition-colors cursor-pointer" @click="openTask(row)">
                        View
                      </button>
                    </td>
                  </tr>
                  <tr v-if="paginatedRows.length === 0">
                    <td colspan="5" class="px-5 py-8 text-center text-sm text-(--text-muted)">Tidak ada detail sensus.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <ListPagination
              :total-items="totalItems"
              :current-page="currentPage"
              :page-size="pageSize"
              :total-pages="totalPages"
              :visible-pages="visiblePages"
              @update:current-page="currentPage = $event"
              @update:page-size="pageSize = $event"
            />
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import ListPagination from '../shared/pagination/ListPagination.vue'
import { useListPagination } from '../shared/pagination/useListPagination.js'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'

const props = defineProps({
  controller: { type: Object, required: true },
  id: { type: [String, Number], default: null }
})

const appStore = useAppStore()
const router = useRouter()
const navigation = computed(() => props.controller.getNavigation())
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const sensus = ref({})
const rows = ref([])
const loading = ref(false)
const error = ref(null)

const columns = [
  { key: 'task', label: 'Task' },
  { key: 'taskType', label: 'Task Type' },
  { key: 'totalBlock', label: 'Total Block' },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' }
]

const mappedRows = computed(() => rows.value.map((detail) => ({
  id: detail.id,
  task: detail.type_of_work?.name || detail.description || '—',
  taskType: detail.type_of_work?.group_of_work_name || '—',
  totalBlock: Array.isArray(detail.blocks) ? detail.blocks.length : 0,
  status: statusMeta(detail.progress_status)
})))

const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  paginatedItems: paginatedRows,
  visiblePages
} = useListPagination(mappedRows)

const summaryId = computed(() => sensus.value.id_sensus ? `Sensus ${sensus.value.id_sensus}` : 'Sensus Detail')

function openTask(row) {
  router.push(`/sensus/${props.id}/record/${row.id}`)
}

function statusMeta(raw) {
  const value = String(raw || '').toLowerCase()
  if (value === 'done') return { label: 'Done', className: 'inline-block bg-(--status-done-bg) text-(--status-done-text) rounded-xl px-2 py-1 text-xs' }
  if (value === 'submitted' || value === 'planned') return { label: 'On Plan', className: 'inline-block bg-(--status-plan-bg) text-(--status-plan-text) rounded-xl px-2 py-1 text-xs' }
  if (value === 'overtime') return { label: 'Overtime', className: 'inline-block bg-(--status-overtime-bg) text-(--status-overtime-text) rounded-xl px-2 py-1 text-xs' }
  return { label: 'On Progress', className: 'inline-block bg-(--status-wip-bg) text-(--status-wip-text) rounded-xl px-2 py-1 text-xs' }
}

onMounted(async () => {
  if (!props.id) {
    error.value = 'ID sensus tidak ditemukan.'
    return
  }

  loading.value = true
  try {
    const data = await props.controller.loadSensusRecord(props.id)
    sensus.value = data || {}
    rows.value = Array.isArray(data?.details) ? data.details : []
  } catch (err) {
    error.value = err?.message || 'Gagal memuat detail sensus.'
  } finally {
    loading.value = false
  }
})
</script>
