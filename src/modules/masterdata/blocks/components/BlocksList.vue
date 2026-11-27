<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div>
        <h2 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0 mb-1">Blocks</h2>
        <p class="text-sm text-(--text-muted) m-0">Blok kebun; tiap blok berisi beberapa petak (Master Data → Nomor Petak)</p>
      </div>
      <button v-if="canWrite" type="button"
        class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 shadow-sm"
        @click="openCreate">+ Add Blok</button>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" type="text" placeholder="Cari nomor blok…"
        class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 w-56" />
    </div>

    <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">Loading data&hellip;</div>
    <div v-else-if="fetchError" class="flex justify-center items-center py-16 text-sm text-red-600">{{ fetchError }}</div>

    <template v-else>
      <div class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[920px]:hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-(--border) bg-(--surface-muted)">
              <th v-for="h in headers" :key="h" class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-4 uppercase tracking-widest">{{ h }}</th>
              <th v-if="canWrite" class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-4 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRows.length === 0">
              <td :colspan="headers.length + (canWrite ? 1 : 0)" class="py-10 px-6 text-center text-sm text-(--text-muted)">No data.</td>
            </tr>
            <tr v-for="row in paginatedRows" :key="row.id" class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted)">
              <td class="py-3 px-4 text-sm font-semibold text-(--text)">Blok {{ row.name }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.block_count || 0 }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.tph_count || 0 }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ fmt(row.tree_count) }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ fmt(row.tree_harvest_count) }}</td>
              <td class="py-3 px-4 text-sm">
                <span class="inline-block text-xs font-semibold px-2 py-0.5 rounded-md" :class="row.has_tm ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'">
                  {{ row.has_tm ? 'Ada TM' : 'TBM' }}
                </span>
              </td>
              <td class="py-3 px-4 text-sm text-(--text-muted) max-w-xs truncate">{{ row.notes || '-' }}</td>
              <td class="py-3 px-4 text-sm text-(--text-muted)">{{ userName(row.updated_by || row.created_by) }}</td>
              <td v-if="canWrite" class="py-3 px-4">
                <div class="flex gap-2 items-center">
                  <button type="button" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border-0 hover:bg-(--surface-muted) cursor-pointer" @click="openEdit(row)">Edit</button>
                  <button type="button" class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="row.block_count > 0" :title="row.block_count > 0 ? 'Masih berisi petak' : undefined" @click="confirmDelete(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="hidden gap-3 max-[920px]:flex max-[920px]:flex-col">
        <div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">No data.</div>
        <div v-for="row in paginatedRows" :key="row.id" class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div class="font-bold text-sm text-(--text)">Blok {{ row.name }}</div>
          <div class="text-xs text-(--text-muted) flex flex-wrap gap-x-4 gap-y-1">
            <span>Petak: {{ row.block_count || 0 }}</span>
            <span>TPH: {{ row.tph_count || 0 }}</span>
            <span>Pohon perawatan: {{ fmt(row.tree_count) }}</span>
            <span>Pohon panen: {{ fmt(row.tree_harvest_count) }}</span>
            <span>{{ row.has_tm ? 'Ada TM' : 'TBM' }}</span>
            <span>Updated by: {{ userName(row.updated_by || row.created_by) }}</span>
          </div>
          <div v-if="canWrite" class="flex justify-end gap-2 mt-1">
            <button type="button" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-(--border) bg-(--surface) cursor-pointer" @click="openEdit(row)">Edit</button>
            <button type="button" class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold cursor-pointer disabled:opacity-40" :disabled="row.block_count > 0" @click="confirmDelete(row)">Delete</button>
          </div>
        </div>
      </div>
    </template>

    <BlockForm :visible="showForm" :block="editing" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <Teleport to="body">
      <div v-if="deleting" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="deleting = null">
        <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
          <h3 class="text-base font-bold text-(--text) m-0">Delete Blok</h3>
          <p class="text-sm text-(--text-muted) m-0">Hapus <strong>Blok {{ deleting.name }}</strong>? Tidak bisa dibatalkan.</p>
          <div v-if="actionError" class="text-xs text-red-500">{{ actionError }}</div>
          <div class="flex justify-end gap-3">
            <button type="button" class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer" :disabled="submitting" @click="deleting = null">Cancel</button>
            <button type="button" class="border-0 bg-red-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer disabled:opacity-60" :disabled="submitting" @click="onDeleteConfirm">
              <span v-if="submitting">Deleting&hellip;</span><span v-else>Yes, Delete</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <MasterDataPagination id="blocks" :total-items="totalItems" :current-page="currentPage" :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages" @update:current-page="currentPage = $event" @update:page-size="pageSize = $event" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BlockForm from './BlockForm.vue'
import { listBlocks, createBlock, updateBlock, deleteBlock } from '../model'
import { useToast } from '../../../../utils/toast'
import { useListPagination } from '../../../shared/pagination/useListPagination.js'
import MasterDataPagination from '../../../shared/pagination/MasterDataPagination.vue'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const headers = ['Blok', 'Petak', 'TPH', 'Pohon Perawatan', 'Pohon Panen', 'Status', 'Catatan', 'Updated By']

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const submitting = ref(false)
const search = ref('')
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('id-ID'))

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter((r) => !q || String(r.name).toLowerCase().includes(q))
})

const { currentPage, pageSize, totalItems, totalPages, paginatedItems: paginatedRows, visiblePages } = useListPagination(filteredRows)

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listBlocks()
  } catch (err) {
    console.error('[Blocks] Failed to load:', err)
    fetchError.value = err?.message || 'Failed to load blok.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  actionError.value = null
  showForm.value = true
}

function openEdit(row) {
  editing.value = { ...row }
  actionError.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

const friendly = (err, fallback) => {
  const m = err?.message || ''
  if (/block_group_name_uq|sudah ada/i.test(m)) return 'Nomor blok sudah ada.'
  if (/dirujuk/i.test(m)) return 'Blok masih berisi petak, jadi tidak bisa dihapus.'
  return m || fallback
}

async function onFormSubmit(payload) {
  submitting.value = true
  actionError.value = null
  try {
    if (editing.value?.id) {
      await updateBlock(editing.value.id, payload)
      showToast('Blok updated successfully.')
    } else {
      await createBlock(payload)
      showToast('Blok created successfully.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[Blocks] Save failed:', err)
    actionError.value = friendly(err, 'Failed to save blok.')
  } finally {
    submitting.value = false
  }
}

function confirmDelete(row) {
  deleting.value = row
  actionError.value = null
}

async function onDeleteConfirm() {
  if (!deleting.value) return
  submitting.value = true
  actionError.value = null
  try {
    await deleteBlock(deleting.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleting.value.id)
    deleting.value = null
    showToast('Blok deleted successfully.')
  } catch (err) {
    console.error('[Blocks] Delete failed:', err)
    actionError.value = friendly(err, 'Failed to delete blok.')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
