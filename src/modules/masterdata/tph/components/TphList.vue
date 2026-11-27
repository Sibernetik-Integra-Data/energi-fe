<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div>
        <h2 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0 mb-1">TPH</h2>
        <p class="text-sm text-(--text-muted) m-0">Tempat pengumpulan hasil per petak: jenis, sisi, nomor jalur dan jumlah pohon</p>
      </div>
      <button v-if="canWrite" type="button"
        class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 shadow-sm"
        @click="openCreate">+ Add TPH</button>
    </div>

    <div class="flex flex-wrap gap-3 mb-2">
      <input v-model="search" type="text" placeholder="Cari kode, mis. U01…" :class="filterClass" class="w-44" />
      <select v-model="filterBlok" :class="filterClass" @change="filterPetak = ''">
        <option value="">Semua blok</option>
        <option v-for="b in blokOptions" :key="b" :value="b">Blok {{ b }}</option>
      </select>
      <select v-model="filterPetak" :class="filterClass">
        <option value="">Semua petak</option>
        <option v-for="p in petakOptions" :key="p.id" :value="String(p.id)">{{ p.name }}</option>
        <option value="none">Tanpa petak</option>
      </select>
      <select v-model="filterType" :class="filterClass">
        <option value="">Semua jenis</option>
        <option value="PERAWATAN">Perawatan</option>
        <option value="PANEN">Panen</option>
      </select>
      <select v-model="filterActive" :class="filterClass">
        <option value="">Aktif &amp; nonaktif</option>
        <option value="1">Aktif</option>
        <option value="0">Nonaktif</option>
      </select>
      <label class="flex items-center gap-2 text-sm text-(--text-muted) cursor-pointer">
        <input v-model="onlyMissingTrees" type="checkbox" class="accent-green-600" /> Jumlah pohon kosong
      </label>
    </div>
    <p class="text-xs text-(--text-muted) mb-4">{{ filteredRows.length }} TPH · {{ fmt(totalTrees) }} pohon</p>

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
            <tr v-for="row in paginatedRows" :key="row.id" class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted)" :class="{ 'opacity-60': !row.is_active }">
              <td class="py-3 px-4 text-sm font-semibold text-(--text)">{{ row.code || row.name }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.block_name || 'Tanpa petak' }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.block_group ? `Blok ${row.block_group}` : '-' }}</td>
              <td class="py-3 px-4 text-sm"><span class="inline-block text-xs font-semibold px-2 py-0.5 rounded-md" :class="typeClass(row.tph_type)">{{ typeLabel(row.tph_type) }}</span></td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.side || '-' }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.line_no ?? '-' }}</td>
              <td class="py-3 px-4 text-sm" :class="row.tree_count == null ? 'text-amber-700' : 'text-(--text)'">{{ row.tree_count == null ? 'Belum diisi' : fmt(row.tree_count) }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</td>
              <td class="py-3 px-4 text-sm text-(--text-muted)">{{ userName(row.updated_by || row.created_by) }}</td>
              <td v-if="canWrite" class="py-3 px-4">
                <div class="flex gap-2 items-center">
                  <button type="button" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border-0 hover:bg-(--surface-muted) cursor-pointer" @click="openEdit(row)">Edit</button>
                  <button type="button" class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 cursor-pointer" @click="confirmDelete(row)">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="hidden gap-3 max-[920px]:flex max-[920px]:flex-col">
        <div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">No data.</div>
        <div v-for="row in paginatedRows" :key="row.id" class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-2" :class="{ 'opacity-60': !row.is_active }">
          <div class="flex justify-between items-center gap-2">
            <span class="font-bold text-sm text-(--text)">{{ row.code || row.name }} · {{ row.block_name || 'Tanpa petak' }}</span>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-md" :class="typeClass(row.tph_type)">{{ typeLabel(row.tph_type) }}</span>
          </div>
          <div class="text-xs text-(--text-muted) flex flex-wrap gap-x-4 gap-y-1">
            <span>{{ row.block_group ? `Blok ${row.block_group}` : '-' }}</span>
            <span>Pohon: {{ row.tree_count == null ? 'belum diisi' : fmt(row.tree_count) }}</span>
            <span>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</span>
            <span>Updated by: {{ userName(row.updated_by || row.created_by) }}</span>
          </div>
          <div v-if="canWrite" class="flex justify-end gap-2 mt-1">
            <button type="button" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-(--border) bg-(--surface) cursor-pointer" @click="openEdit(row)">Edit</button>
            <button type="button" class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold cursor-pointer" @click="confirmDelete(row)">Delete</button>
          </div>
        </div>
      </div>
    </template>

    <TphForm :visible="showForm" :tph="editing" :default-petak-id="defaultPetakId" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <Teleport to="body">
      <div v-if="deleting" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="deleting = null">
        <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
          <h3 class="text-base font-bold text-(--text) m-0">Delete TPH</h3>
          <p class="text-sm text-(--text-muted) m-0">Hapus TPH <strong>{{ deleting.code || deleting.name }}</strong> di {{ deleting.block_name || 'tanpa petak' }}? Tidak bisa dibatalkan.</p>
          <p class="text-xs text-(--text-muted) m-0">TPH yang sudah dipakai sensus atau penugasan tidak bisa dihapus; nonaktifkan lewat Edit.</p>
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

    <MasterDataPagination id="tph" :total-items="totalItems" :current-page="currentPage" :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages" @update:current-page="currentPage = $event" @update:page-size="pageSize = $event" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TphForm from './TphForm.vue'
import { listTph, createTph, updateTph, deleteTph } from '../model'
import { useToast } from '../../../../utils/toast'
import { useListPagination } from '../../../shared/pagination/useListPagination.js'
import MasterDataPagination from '../../../shared/pagination/MasterDataPagination.vue'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const headers = ['Kode', 'Petak', 'Blok', 'Jenis', 'Sisi', 'Jalur', 'Pohon', 'Status', 'Updated By']
const filterClass = 'border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500'

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const submitting = ref(false)
const search = ref('')
const filterBlok = ref('')
const filterPetak = ref('')
const filterType = ref('')
const filterActive = ref('')
const onlyMissingTrees = ref(false)
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('id-ID'))
const typeLabel = (t) => (t === 'PANEN' ? 'Panen' : t === 'PERAWATAN' ? 'Perawatan' : '-')
const typeClass = (t) => (t === 'PANEN' ? 'bg-green-50 text-green-700' : t === 'PERAWATAN' ? 'bg-sky-50 text-sky-700' : 'bg-(--surface-muted) text-(--text-muted)')
const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })

const blokOptions = computed(() => [...new Set(rows.value.map((r) => r.block_group).filter(Boolean))].sort(byName))

const petakOptions = computed(() => {
  const seen = new Map()
  for (const r of rows.value) {
    if (!r.id_block || (filterBlok.value && r.block_group !== filterBlok.value)) continue
    seen.set(r.id_block, r.block_name)
  }
  return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => byName(a.name, b.name))
})

const defaultPetakId = computed(() => (/^\d+$/.test(filterPetak.value) ? Number(filterPetak.value) : null))

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter((r) => {
    if (q && !String(r.code || r.name || '').toLowerCase().includes(q)) return false
    if (filterBlok.value && r.block_group !== filterBlok.value) return false
    if (filterPetak.value === 'none' && r.id_block) return false
    if (/^\d+$/.test(filterPetak.value) && String(r.id_block) !== filterPetak.value) return false
    if (filterType.value && r.tph_type !== filterType.value) return false
    if (filterActive.value && String(Number(!!r.is_active)) !== filterActive.value) return false
    if (onlyMissingTrees.value && r.tree_count != null) return false
    return true
  })
})

const totalTrees = computed(() => filteredRows.value.reduce((s, r) => s + (r.tree_count || 0), 0))

const { currentPage, pageSize, totalItems, totalPages, paginatedItems: paginatedRows, visiblePages } = useListPagination(filteredRows)

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listTph()
  } catch (err) {
    console.error('[TPH] Failed to load:', err)
    fetchError.value = err?.message || 'Failed to load TPH.'
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
  if (/tph_block_type_side_line_uq|sudah ada/i.test(m)) return 'Petak ini sudah punya TPH dengan jenis, sisi dan nomor jalur yang sama.'
  if (/dipakai|nonaktifkan/i.test(m)) return 'TPH sudah dipakai sensus atau penugasan. Nonaktifkan lewat Edit (hapus centang Aktif).'
  return m || fallback
}

async function onFormSubmit(payload) {
  submitting.value = true
  actionError.value = null
  try {
    if (editing.value?.id) {
      await updateTph(editing.value.id, payload)
      showToast('TPH updated successfully.')
    } else {
      await createTph(payload)
      showToast('TPH created successfully.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TPH] Save failed:', err)
    actionError.value = friendly(err, 'Failed to save TPH.')
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
    await deleteTph(deleting.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleting.value.id)
    deleting.value = null
    showToast('TPH deleted successfully.')
  } catch (err) {
    console.error('[TPH] Delete failed:', err)
    actionError.value = friendly(err, 'Failed to delete TPH.')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
