<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div>
        <h2 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0 mb-1">Jenis Komponen</h2>
        <p class="text-sm text-(--text-muted) m-0">Kelola jenis komponen</p>
      </div>
      <button type="button" class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm" v-if="canWrite" @click="openCreate">
        + Tambah Tipe
      </button>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="searchQuery" type="text" placeholder="Cari nama atau keterangan..." class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors w-64" aria-label="Cari jenis komponen" />
    </div>

    <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">Memuat data&hellip;</div>
    <div v-else-if="fetchError" class="flex justify-center items-center py-16 text-sm text-red-600">{{ fetchError }}</div>

    <template v-else>
      <div class="bg-(--surface) rounded-xl overflow-x-auto border border-(--border) shadow-sm max-[1100px]:hidden">
        <table class="w-full min-w-[1100px] border-collapse table-fixed">
          <colgroup>
            <col style="width:6%" />
            <col style="width:13%" />
            <col style="width:18%" />
            <col style="width:11%" />
            <col style="width:9%" />
            <col style="width:12%" />
            <col style="width:12%" />
            <col style="width:12%" />
            <col style="width:7%" />
          </colgroup>
          <thead>
            <tr class="border-b border-(--border) bg-(--surface-muted)">
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-center">ID</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Nama</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Keterangan</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Catatan</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Dibuat Pada</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Dibuat Oleh</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Diubah Pada / Oleh</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRows.length === 0">
              <td colspan="8" class="py-10 px-6 text-center text-sm text-(--text-muted)">Belum ada data.</td>
            </tr>
            <tr v-for="row in paginatedRows" :key="row.id" class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors">
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-center">{{ row.id }}</td>
              <td class="py-4 px-3 align-middle text-sm font-semibold text-(--text) text-left">{{ row.name || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left whitespace-normal wrap-break-word">{{ row.detail || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left whitespace-normal wrap-break-word">{{ row.notes || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left">{{ formatDateTime(row.created_at) || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left">{{ displayUser(row.created_by) }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left">
                <div>{{ formatDateTime(row.updated_at) || '-' }}</div>
                <div class="text-xs text-(--text-soft)">{{ displayUser(row.updated_by) }}</div>
              </td>
              <td class="py-4 pl-3 pr-6 align-middle text-center whitespace-nowrap">
                <div class="flex gap-2 items-center justify-start">
                  <button type="button" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border border-(--border) hover:bg-(--surface-muted) transition-colors cursor-pointer" v-if="canWrite" @click="openEdit(row)">Ubah</button>
                  <button type="button" class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors cursor-pointer" v-if="canWrite" @click="confirmDelete(row)">Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="hidden gap-3 max-[1100px]:flex max-[1100px]:flex-col">
        <div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">Belum ada data.</div>
        <div v-for="row in paginatedRows" :key="row.id" class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-bold text-sm text-(--text)">{{ row.name || '-' }}</div>
              <div class="text-xs text-(--text-muted)">ID: {{ row.id }}</div>
            </div>
          </div>
          <div class="text-xs text-(--text-muted) flex flex-col gap-1">
            <span>Keterangan: {{ row.detail || '-' }}</span>
            <span>Catatan: {{ row.notes || '-' }}</span>
            <span>Dibuat pada: {{ formatDateTime(row.created_at) || '-' }}</span>
            <span>Dibuat oleh: {{ displayUser(row.created_by) }}</span>
            <span>Diubah pada: {{ formatDateTime(row.updated_at) || '-' }}</span>
            <span>Diubah oleh: {{ displayUser(row.updated_by) }}</span>
          </div>
          <div class="flex justify-end gap-2 mt-1">
            <button type="button" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-(--border) bg-(--surface) hover:bg-(--surface-muted) transition-colors cursor-pointer" v-if="canWrite" @click="openEdit(row)">Ubah</button>
            <button type="button" class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors cursor-pointer" v-if="canWrite" @click="confirmDelete(row)">Hapus</button>
          </div>
        </div>
      </div>
    </template>

    <div v-if="actionError && !showDeleteConfirm" class="mt-3 text-xs text-red-500">{{ actionError }}</div>

    <TypeOfComponentForm :visible="showForm" :type-of-component="editingType" :submitting="submitting" @submit="onFormSubmit" @cancel="closeForm" />

    <Teleport to="body">
      <div v-if="showDeleteConfirm" role="dialog" aria-modal="true" aria-labelledby="delete-type-of-component-title" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="showDeleteConfirm = false">
        <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
          <h3 id="delete-type-of-component-title" class="text-base font-bold text-(--text) m-0">Hapus Jenis Komponen</h3>
          <p class="text-sm text-(--text-muted) m-0">Hapus <strong>{{ deletingType?.name }}</strong>? Tindakan ini tidak bisa dibatalkan.</p>
          <div v-if="actionError" class="text-xs text-red-500">{{ actionError }}</div>
          <div class="flex justify-end gap-3">
            <button type="button" class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted) transition-colors" :disabled="submitting" @click="showDeleteConfirm = false">Batal</button>
            <button type="button" class="border-0 bg-red-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-60" :disabled="submitting" @click="onDeleteConfirm">
              <span v-if="submitting">Menghapus&hellip;</span>
              <span v-else>Ya, Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <MasterDataPagination id="type-of-component" :total-items="totalItems" :current-page="currentPage" :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages" @update:current-page="currentPage = $event" @update:page-size="pageSize = $event" />
  </div>
</template>

<script setup>
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
import { computed, onMounted, ref } from 'vue'
import TypeOfComponentForm from './TypeOfComponentForm.vue'
import { createTypeOfComponent, deleteTypeOfComponent, listTypeOfComponent, updateTypeOfComponent } from '../model'
import { useToast } from '../../../../utils/toast'
import { resolveUsernames } from '../../../../utils/userCache'
import { useListPagination } from '../../../shared/pagination/useListPagination.js'
import MasterDataPagination from '../../../shared/pagination/MasterDataPagination.vue'

const { show: showToast } = useToast()
const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const submitting = ref(false)
const searchQuery = ref('')
const showForm = ref(false)
const editingType = ref(null)
const showDeleteConfirm = ref(false)
const deletingType = ref(null)
const userNames = ref(new Map())

const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((row) => [row.name, row.detail, row.notes].some((value) => String(value || '').toLowerCase().includes(q)))
})

const { currentPage, pageSize, totalItems, totalPages, paginatedItems: paginatedRows, visiblePages } = useListPagination(filteredRows)

function formatDateTime(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.replace(/\.\d+/, '').replace(/T/, ' ').replace(/Z$/, '').trim()
  if (value instanceof Date) return value.toISOString().replace(/T/, ' ').replace(/Z$/, '').substring(0, 19)
  return String(value)
}

function displayUser(userId) {
  if (!userId) return '-'
  return userNames.value.get(userId) || userId
}

async function resolveAuditUsers(data) {
  const ids = data.flatMap((row) => [row.created_by, row.updated_by]).filter(Boolean)
  if (ids.length === 0) {
    userNames.value = new Map()
    return
  }
  userNames.value = await resolveUsernames(ids)
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listTypeOfComponent()
    await resolveAuditUsers(rows.value)
  } catch (err) {
    console.error('[TypeOfComponent] Failed to load:', err)
    fetchError.value = err?.message || 'Gagal memuat data.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingType.value = null
  actionError.value = null
  showForm.value = true
}

function openEdit(typeOfComponent) {
  editingType.value = { ...typeOfComponent }
  actionError.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingType.value = null
}

async function onFormSubmit(formData) {
  submitting.value = true
  actionError.value = null
  try {
    if (editingType.value?.id) {
      await updateTypeOfComponent(editingType.value.id, formData)
      showToast('Jenis Komponen berhasil diubah.')
    } else {
      await createTypeOfComponent(formData)
      showToast('Jenis Komponen berhasil ditambahkan.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TypeOfComponent] Save failed:', err)
    actionError.value = err?.message || 'Gagal menyimpan data.'
  } finally {
    submitting.value = false
  }
}

function confirmDelete(typeOfComponent) {
  deletingType.value = typeOfComponent
  actionError.value = null
  showDeleteConfirm.value = true
}

async function onDeleteConfirm() {
  if (!deletingType.value) return
  submitting.value = true
  actionError.value = null
  try {
    await deleteTypeOfComponent(deletingType.value.id)
    showDeleteConfirm.value = false
    deletingType.value = null
    showToast('Jenis Komponen berhasil dihapus.')
    await loadData()
  } catch (err) {
    console.error('[TypeOfComponent] Delete failed:', err)
    actionError.value = err?.message || 'Gagal menghapus data.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
