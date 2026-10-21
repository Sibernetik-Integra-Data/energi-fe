<template>
  <div class="flex h-screen bg-(--bg) text-(--text) max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader eyebrow="Monitoring" title="Audit Log" :notifications="0" :user="user" :on-logout="logoutFromKeycloak" />
      <main class="min-w-0 flex-1 overflow-y-auto bg-(--surface-muted) p-6 max-[920px]:p-4">
        <header class="mb-6">
          <p class="m-0 text-xs font-semibold uppercase tracking-wider text-teal-700">Jejak aktivitas sistem</p>
          <h1 class="m-0 mt-1 text-2xl font-semibold">Audit Log</h1>
          <p class="m-0 mt-1 text-sm text-(--text-muted)">Riwayat perubahan data dan operasi sistem.</p>
        </header>
        <section class="rounded-2xl border border-(--border) bg-(--surface) p-4 sm:p-5">
          <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label class="relative block w-full lg:max-w-md">
              <span class="sr-only">Cari audit log pada halaman ini</span>
              <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--text-muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>
              <input v-model="search" type="search" placeholder="Cari modul, aksi, ID, aktor…" class="w-full rounded-lg border border-(--border) bg-(--surface) py-2.5 pl-9 pr-3 text-sm text-(--text) outline-none focus:ring-2 focus:ring-teal-200" />
            </label>
            <div class="flex flex-wrap items-center gap-2">
              <label for="audit-sort" class="text-sm text-(--text-muted)">Urutkan</label>
              <select id="audit-sort" v-model="sortOrder" class="rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none focus:ring-2 focus:ring-teal-200">
                <option value="newest">Terbaru</option><option value="oldest">Terlama</option>
              </select>
              <label for="audit-page-size" class="ml-1 text-sm text-(--text-muted)">Baris</label>
              <select id="audit-page-size" :value="pageSize" class="rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--text) outline-none focus:ring-2 focus:ring-teal-200" @change="changePageSize(Number($event.target.value))">
                <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
              </select>
              <button type="button" class="rounded-lg border border-(--border) px-3 py-2 text-sm font-medium hover:bg-(--surface-muted) disabled:opacity-50" :disabled="loading" @click="refresh">Muat ulang</button>
            </div>
          </div>
          <p class="mb-3 text-xs text-(--text-muted)">Pencarian dan urutan diterapkan pada halaman yang sedang dibuka.</p>
          <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{{ error }}</div>
          <div v-if="loading && !pageRows.length" class="py-12 text-center text-sm text-(--text-muted)">Memuat audit log…</div>
          <div v-else class="overflow-hidden rounded-xl border border-(--border)">
            <div class="max-w-full overflow-x-auto">
              <table class="w-full min-w-[900px] table-fixed text-left text-sm">
                <thead class="bg-(--surface-muted) text-xs uppercase tracking-wide text-(--text-muted)">
                  <tr><th class="w-48 px-4 py-3">Waktu (WIB)</th><th class="w-40 px-4 py-3">Modul / aksi</th><th class="w-48 px-4 py-3">Entitas</th><th class="w-40 px-4 py-3">Aktor</th><th class="w-28 px-4 py-3">Hasil</th><th class="w-32 px-4 py-3">Sumber</th><th class="w-24 px-4 py-3">Detail</th></tr>
                </thead>
                <tbody class="divide-y divide-(--border)">
                  <tr v-for="row in visibleRows" :key="row.created_at + '-' + row.id" class="align-top hover:bg-(--surface-muted)">
                    <td class="max-w-0 truncate px-4 py-3 tabular-nums" :title="row.created_at">{{ formatAuditDate(row.created_at) }}</td>
                    <td class="max-w-0 px-4 py-3"><div class="truncate font-medium" :title="row.module">{{ row.module || '—' }}</div><div class="truncate text-xs text-(--text-muted)" :title="row.action">{{ row.action || '—' }}</div></td>
                    <td class="max-w-0 px-4 py-3"><div class="truncate font-medium" :title="row.entity_type">{{ row.entity_type || '—' }}</div><div class="truncate font-mono text-xs text-(--text-muted)" :title="row.entity_id">{{ row.entity_id || '—' }}</div></td>
                    <td class="max-w-0 px-4 py-3"><div class="truncate" :title="row.actor_id">{{ row.actor_id || 'Service' }}</div><div class="truncate text-xs text-(--text-muted)">{{ row.actor_type || '—' }}</div></td>
                    <td class="px-4 py-3"><span class="inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-semibold" :class="outcomeClass(row.outcome)">{{ row.outcome || '—' }}</span></td>
                    <td class="max-w-0 truncate px-4 py-3" :title="row.source">{{ row.source || '—' }}</td>
                    <td class="px-4 py-3"><button type="button" class="rounded-lg border border-(--border) px-3 py-1.5 text-xs font-semibold hover:bg-(--surface-muted)" @click="openDetail(row)">Lihat</button></td>
                  </tr>
                  <tr v-if="!loading && !visibleRows.length"><td colspan="7" class="px-4 py-12 text-center text-sm text-(--text-muted)">{{ pageRows.length ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada audit log pada rentang waktu default API.' }}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="m-0 text-xs text-(--text-muted)">Halaman {{ pageIndex + 1 }}<span v-if="filteredRows.length !== pageRows.length"> · {{ filteredRows.length }} hasil pencarian</span></p>
            <nav class="flex flex-wrap items-center gap-1" aria-label="Paginasi audit log">
              <button class="page-button" :disabled="pageIndex === 0 || loading" aria-label="Halaman pertama" @click="goToPage(0)">« Awal</button>
              <button class="page-button" :disabled="pageIndex === 0 || loading" aria-label="Halaman sebelumnya" @click="goToPage(pageIndex - 1)">‹</button>
              <template v-for="item in pageButtons" :key="item">
                <span v-if="item === '…'" class="px-2 text-sm text-(--text-muted)">…</span>
                <button v-else class="page-button" :class="pageIndex + 1 === item && 'page-button-active'" :aria-current="pageIndex + 1 === item ? 'page' : undefined" :disabled="loading" @click="goToPage(item - 1)">{{ item }}</button>
              </template>
              <button class="page-button" :disabled="!hasNext || loading" aria-label="Halaman berikutnya" @click="goToPage(pageIndex + 1)">›</button>
              <button class="page-button" :disabled="!hasNext || loading" @click="goToLast">Terakhir »</button>
            </nav>
          </div>
          <p v-if="loading && pageIndex > 0" class="m-0 mt-2 text-right text-xs text-(--text-muted)">Memuat halaman…</p>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { navigation as sharedNavigation } from '../shared/navigation'
import { AUDIT_PAGE_SIZES, filterAuditEvents, formatAuditDate } from './model'

const props = defineProps({ controller: { type: Object, required: true } })
const router = useRouter()
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation
const pageSizes = AUDIT_PAGE_SIZES
const pageSize = ref(10)
const pages = ref([])
const pageIndex = ref(0)
const loading = ref(false)
const error = ref('')
const search = ref('')
const sortOrder = ref('newest')
const pageRows = computed(() => pages.value[pageIndex.value]?.rows || [])
const hasNext = computed(() => Boolean(pages.value[pageIndex.value]?.nextCursor))
const visibleRows = computed(() => filterAuditEvents(pageRows.value, search.value, sortOrder.value))
const filteredRows = computed(() => filterAuditEvents(pageRows.value, search.value, sortOrder.value))
const pageButtons = computed(() => {
  const last = pages.value.length
  if (last <= 7) return Array.from({ length: last }, (_, index) => index + 1)
  const current = pageIndex.value + 1
  if (current <= 4) return [1, 2, 3, 4, 5, '…', last]
  if (current >= last - 3) return [1, '…', last - 4, last - 3, last - 2, last - 1, last]
  return [1, '…', current - 1, current, current + 1, '…', last]
})

async function loadPage(index) {
  if (pages.value[index]) { pageIndex.value = index; error.value = ''; return }
  const previous = pages.value[index - 1]
  if (!previous?.nextCursor) return
  loading.value = true
  error.value = ''
  try {
    const result = await props.controller.fetchEvents({ limit: pageSize.value, cursor: previous.nextCursor })
    pages.value.push({ rows: result.rows, nextCursor: result.meta.next_cursor || null })
    pageIndex.value = index
  } catch (cause) {
    error.value = cause?.message || cause?.error || 'Gagal memuat audit log.'
  } finally { loading.value = false }
}

async function goToPage(index) {
  if (index < 0 || loading.value) return
  while (pages.value.length <= index && pages.value.at(-1)?.nextCursor) await loadPage(pages.value.length)
  if (pages.value[index]) pageIndex.value = index
}

async function goToLast() {
  if (loading.value) return
  while (pages.value.at(-1)?.nextCursor && !error.value) await loadPage(pages.value.length)
  pageIndex.value = pages.value.length - 1
}

async function refresh() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await props.controller.fetchEvents({ limit: pageSize.value })
    pages.value = [{ rows: result.rows, nextCursor: result.meta.next_cursor || null }]
    pageIndex.value = 0
  } catch (cause) { error.value = cause?.message || cause?.error || 'Gagal memuat audit log.' }
  finally { loading.value = false }
}

function changePageSize(value) { pageSize.value = value; pages.value = []; pageIndex.value = 0; refresh() }
function openDetail(row) { router.push({ name: 'AuditLogDetail', params: { id: row.id }, query: { created_at: row.created_at } }) }
function outcomeClass(outcome) {
  return ({ success: 'bg-emerald-50 text-emerald-700', failure: 'bg-red-50 text-red-700', denied: 'bg-amber-50 text-amber-700', partial: 'bg-orange-50 text-orange-700', unknown: 'bg-slate-100 text-slate-700' })[outcome] || 'bg-slate-100 text-slate-700'
}

onMounted(refresh)
</script>

<style scoped>
.page-button {
  display: inline-flex;
  min-width: 2.25rem;
  height: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--surface);
  padding: 0 0.625rem;
  color: var(--text);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.page-button:hover:not(:disabled) { background: var(--surface-muted); }
.page-button:disabled { cursor: not-allowed; opacity: 0.4; }
.page-button-active,
.page-button-active:hover:not(:disabled) {
  border-color: #0d9488;
  background: #0d9488;
  color: #fff;
}
</style>
