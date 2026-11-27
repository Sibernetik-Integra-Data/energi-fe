<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div>
        <h2 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0 mb-1">Nomor Petak</h2>
        <p class="text-sm text-(--text-muted) m-0">Petak per blok, status tanam, tahun tanam, jumlah pohon dan luas</p>
      </div>
      <button v-if="canWrite" type="button"
        class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 shadow-sm"
        @click="openCreate">+ Tambah Petak</button>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" type="text" placeholder="Cari nomor petak…"
        class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 w-56" />
      <select v-model="filterBlok" class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500">
        <option value="">Semua blok</option>
        <option v-for="b in blokOptions" :key="b" :value="b">Blok {{ b }}</option>
      </select>
      <select v-model="filterStatus" class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500">
        <option value="">Semua status</option>
        <option value="TM">TM</option>
        <option value="TBM">TBM</option>
        <option value="-">Belum diisi</option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">Memuat data&hellip;</div>
    <div v-else-if="fetchError" class="flex justify-center items-center py-16 text-sm text-red-600">{{ fetchError }}</div>

    <template v-else>
      <div class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[920px]:hidden">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-(--border) bg-(--surface-muted)">
              <th v-for="h in headers" :key="h" class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-4 uppercase tracking-widest">{{ h }}</th>
              <th v-if="canWrite" class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-4 uppercase tracking-widest">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRows.length === 0">
              <td :colspan="headers.length + (canWrite ? 1 : 0)" class="py-10 px-6 text-center text-sm text-(--text-muted)">Belum ada data.</td>
            </tr>
            <tr v-for="row in paginatedRows" :key="row.id" class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted)">
              <td class="py-3 px-4 text-sm font-semibold text-(--text)">{{ row.name }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.block_group ? `Blok ${row.block_group}` : '-' }}</td>
              <td class="py-3 px-4 text-sm"><StatusTag :row="row" /></td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.planting_year || '-' }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ fmt(row.plants_count) }}</td>
              <td class="py-3 px-4 text-sm text-(--text)">{{ row.wide == null ? '-' : `${Number(row.wide)} ha` }}</td>
              <td class="py-3 px-4 text-sm text-(--text)" :title="tphTitle(row)">{{ tphCount(row) }}</td>
              <td class="py-3 px-4 text-sm text-(--text-muted)">{{ userName(row.updated_by || row.created_by) }}</td>
              <td v-if="canWrite" class="py-3 px-4">
                <div class="flex gap-2 items-center">
                  <button type="button" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border-0 hover:bg-(--surface-muted) cursor-pointer" @click="openEdit(row)">Ubah</button>
                  <button type="button" class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 cursor-pointer" @click="confirmDelete(row)">Hapus</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="hidden gap-3 max-[920px]:flex max-[920px]:flex-col">
        <div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">Belum ada data.</div>
        <div v-for="row in paginatedRows" :key="row.id" class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div class="flex justify-between items-center gap-2">
            <span class="font-bold text-sm text-(--text)">{{ row.name }} · {{ row.block_group ? `Blok ${row.block_group}` : '-' }}</span>
            <StatusTag :row="row" />
          </div>
          <div class="text-xs text-(--text-muted) flex flex-wrap gap-x-4 gap-y-1">
            <span>Tahun tanam: {{ row.planting_year || '-' }}</span>
            <span>Pohon: {{ fmt(row.plants_count) }}</span>
            <span>Luas: {{ row.wide == null ? '-' : `${Number(row.wide)} ha` }}</span>
            <span>TPH: {{ tphCount(row) }}</span>
            <span>Diubah oleh: {{ userName(row.updated_by || row.created_by) }}</span>
          </div>
          <div v-if="canWrite" class="flex justify-end gap-2 mt-1">
            <button type="button" class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-(--border) bg-(--surface) cursor-pointer" @click="openEdit(row)">Ubah</button>
            <button type="button" class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold cursor-pointer" @click="confirmDelete(row)">Hapus</button>
          </div>
        </div>
      </div>
    </template>

    <PetakForm :visible="showForm" :petak="editing" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <Teleport to="body">
      <div v-if="deleting" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="deleting = null">
        <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
          <h3 class="text-base font-bold text-(--text) m-0">Hapus Petak</h3>
          <p class="text-sm text-(--text-muted) m-0">Hapus petak <strong>{{ deleting.name }}</strong>? Tidak bisa dibatalkan.</p>
          <p v-if="tphCount(deleting) > 0" class="text-xs text-amber-700 m-0">Petak ini masih punya {{ tphCount(deleting) }} TPH aktif; hapus atau pindahkan TPH-nya dulu.</p>
          <div v-if="actionError" class="text-xs text-red-500">{{ actionError }}</div>
          <div class="flex justify-end gap-3">
            <button type="button" class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer" :disabled="submitting" @click="deleting = null">Batal</button>
            <button type="button" class="border-0 bg-red-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer disabled:opacity-60" :disabled="submitting" @click="onDeleteConfirm">
              <span v-if="submitting">Menghapus&hellip;</span><span v-else>Ya, Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <MasterDataPagination id="petak" :total-items="totalItems" :current-page="currentPage" :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages" @update:current-page="currentPage = $event" @update:page-size="pageSize = $event" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue'
import PetakForm from './PetakForm.vue'
import { listPetak, createPetak, updatePetak, deletePetak } from '../model'
import { useToast } from '../../../../utils/toast'
import { useListPagination } from '../../../shared/pagination/useListPagination.js'
import MasterDataPagination from '../../../shared/pagination/MasterDataPagination.vue'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const headers = ['Petak', 'Blok', 'Status', 'Tahun Tanam', 'Pohon', 'Luas', 'TPH', 'Diubah Oleh']

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const submitting = ref(false)
const search = ref('')
const filterBlok = ref('')
const filterStatus = ref('')
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

// Status: TM otomatis bila ada TPH panen aktif; selain itu nilai isian.
const StatusTag = (props) => {
  const s = props.row.planting_status
  const auto = s === 'TM' && props.row.planting_status_manual !== 'TM'
  const cls = s === 'TM' ? 'bg-green-50 text-green-700' : s === 'TBM' ? 'bg-amber-50 text-amber-700' : 'bg-(--surface-muted) text-(--text-muted)'
  return h('span', { class: `inline-block text-xs font-semibold px-2 py-0.5 rounded-md ${cls}`, title: auto ? 'Otomatis TM: ada TPH panen aktif' : undefined }, s ? `${s}${auto ? ' (otomatis)' : ''}` : 'Belum diisi')
}
StatusTag.props = ['row']

const fmt = (n) => (n == null ? '-' : Number(n).toLocaleString('id-ID'))
const tphCount = (r) => (r?.tph_perawatan_count || 0) + (r?.tph_panen_count || 0)
const tphTitle = (r) => `Perawatan ${r.tph_perawatan_count || 0} · Panen ${r.tph_panen_count || 0}`

const blokOptions = computed(() =>
  [...new Set(rows.value.map((r) => r.block_group).filter(Boolean))].sort((a, b) => Number(a) - Number(b) || String(a).localeCompare(String(b)))
)

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value
    .filter((r) => !q || r.name?.toLowerCase().includes(q))
    .filter((r) => !filterBlok.value || r.block_group === filterBlok.value)
    .filter((r) => !filterStatus.value || (filterStatus.value === '-' ? !r.planting_status : r.planting_status === filterStatus.value))
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'id', { numeric: true }))
})

const { currentPage, pageSize, totalItems, totalPages, paginatedItems: paginatedRows, visiblePages } = useListPagination(filteredRows)

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listPetak()
  } catch (err) {
    console.error('[Petak] Failed to load:', err)
    fetchError.value = err?.message || 'Gagal memuat petak.'
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

async function onFormSubmit(payload) {
  submitting.value = true
  actionError.value = null
  try {
    if (editing.value?.id) {
      await updatePetak(editing.value.id, payload)
      showToast('Petak berhasil diubah.')
    } else {
      await createPetak(payload)
      showToast('Petak berhasil ditambahkan.')
    }
    closeForm()
    await loadData() // status/TPH dihitung server
  } catch (err) {
    console.error('[Petak] Save failed:', err)
    actionError.value = err?.message || 'Gagal menyimpan petak.'
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
    await deletePetak(deleting.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleting.value.id)
    deleting.value = null
    showToast('Petak berhasil dihapus.')
  } catch (err) {
    console.error('[Petak] Delete failed:', err)
    actionError.value = /dirujuk|409/i.test(err?.message || '')
      ? 'Petak masih dipakai TPH atau data lain, jadi tidak bisa dihapus.'
      : err?.message || 'Gagal menghapus petak.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
