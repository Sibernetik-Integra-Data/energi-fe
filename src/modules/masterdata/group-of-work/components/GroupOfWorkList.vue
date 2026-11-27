<template>
  <MdPage title="Kelompok Pekerjaan" description="Pengelompokan pekerjaan kebun dan jenis TPH yang boleh dipakai di sensus serta penugasan. Klik kartu untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Kelompok</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" label="Total kelompok" :value="rows.length" sub="Semua jenis TPH" action hint="Tampilkan semua" :pressed="false" @select="clearAll" />
      <MdKpi icon="leaf" tone="success" label="TPH perawatan" :value="count('PERAWATAN')" :sub="`${pct(count('PERAWATAN'))}% dari kelompok`" action :pressed="onlyType('PERAWATAN')" @select="quickType('PERAWATAN')" />
      <MdKpi icon="truck" tone="warning" label="TPH panen" :value="count('PANEN')" :sub="`${pct(count('PANEN'))}% dari kelompok`" action :pressed="onlyType('PANEN')" @select="quickType('PANEN')" />
      <MdKpi icon="info" tone="brand" label="Tanpa keterangan" :value="noDetail" :sub="noDetail ? 'Perlu dilengkapi' : 'Semua berketerangan'" action :pressed="onlyNoDetail" @select="onlyNoDetail = !onlyNoDetail" />
    </div>

    <MdDataTable
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      entity-label="Kelompok"
      empty-icon="layers"
      empty-text="Tambahkan kelompok pekerjaan pertama agar aktivitas kebun bisa dikelompokkan."
      add-label="Tambah Kelompok"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar kelompok pekerjaan"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari nama atau keterangan kelompok…" aria-label="Cari kelompok pekerjaan" />
        </label>
        <MdDropdown v-model="filterType" label="Jenis TPH" :options="typeFilterOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="`Hapus filter ${c.label}`" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">Bersihkan semua</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div><b>{{ row.name }}</b><small>{{ row.detail || 'Tanpa keterangan' }}</small></div>
        </div>
      </template>
      <template #cell-tph_type="{ row }">
        <MdBadge :tone="typeTone(row.tph_type)">{{ typeLabel(row.tph_type) }}</MdBadge>
      </template>
      <template #cell-created_by="{ row }">
        <span class="md-muted">{{ userName(row.created_by) }}</span>
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah kelompok ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus kelompok ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.detail || 'Tanpa keterangan' }}</div></div>
          <MdBadge :tone="typeTone(row.tph_type)">{{ typeLabel(row.tph_type) }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Dibuat oleh<b>{{ userName(row.created_by) }}</b></div>
          <div>Diubah oleh<b>{{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <GroupOfWorkForm :visible="showForm" :group="editingGroup" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deletingGroup" title="Hapus kelompok pekerjaan?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deletingGroup">Kelompok <b>{{ deletingGroup.name }}</b> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GroupOfWorkForm from './GroupOfWorkForm.vue'
import { listGroupOfWork, createGroupOfWork, updateGroupOfWork, deleteGroupOfWork } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)
const search = ref('')
const filterType = ref([])
const onlyNoDetail = ref(false)
const showForm = ref(false)
const editingGroup = ref(null)
const deletingGroup = ref(null)

const initial = (n) => String(n || '#').trim().charAt(0).toUpperCase() || '#'
const typeKey = (r) => r.tph_type || '-'
const typeLabel = (t) => (t === 'PANEN' ? 'Panen' : t === 'PERAWATAN' ? 'Perawatan' : '-')
const typeTone = (t) => (t === 'PANEN' ? 'warning' : t === 'PERAWATAN' ? 'success' : 'neutral')
const count = (t) => rows.value.filter((r) => typeKey(r) === t).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const noDetail = computed(() => rows.value.filter((r) => !r.detail).length)

const columns = [
  { key: 'name', label: 'Nama' },
  { key: 'tph_type', label: 'Jenis TPH', sortValue: (r) => (r.tph_type ? typeLabel(r.tph_type) : '') },
  { key: 'created_by', label: 'Dibuat oleh', sortable: false },
  { key: 'updated_by', label: 'Diubah oleh', sortable: false }
]

const typeFilterOptions = computed(() => {
  const o = [
    { value: 'PERAWATAN', label: 'Perawatan', count: count('PERAWATAN') },
    { value: 'PANEN', label: 'Panen', count: count('PANEN') }
  ]
  if (count('-')) o.push({ value: '-', label: 'Belum diisi', count: count('-') })
  return o
})

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || `${r.name || ''} ${r.detail || ''}`.toLowerCase().includes(q)) &&
    (!filterType.value.length || filterType.value.includes(typeKey(r))) &&
    (!onlyNoDetail.value || !r.detail)
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterType.value.forEach((t) => c.push({ key: `t-${t}`, label: t === '-' ? 'Belum diisi' : typeLabel(t), remove: () => (filterType.value = filterType.value.filter((x) => x !== t)) }))
  if (onlyNoDetail.value) c.push({ key: 'nd', label: 'Tanpa keterangan', remove: () => (onlyNoDetail.value = false) })
  return c
})

function clearAll() {
  search.value = ''
  filterType.value = []
  onlyNoDetail.value = false
}
const onlyType = (t) => filterType.value.length === 1 && filterType.value[0] === t
function quickType(t) {
  filterType.value = onlyType(t) ? [] : [t]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listGroupOfWork()
  } catch (err) {
    console.error('[GroupOfWork] Failed to load:', err)
    fetchError.value = err?.message || 'Gagal memuat data.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingGroup.value = null
  actionError.value = null
  showForm.value = true
}
function openEdit(group) {
  editingGroup.value = { ...group }
  actionError.value = null
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  editingGroup.value = null
}

async function onFormSubmit(formData) {
  submitting.value = true
  actionError.value = null
  try {
    if (editingGroup.value?.id) {
      await updateGroupOfWork(editingGroup.value.id, formData)
      showToast('Kelompok Pekerjaan berhasil diubah.')
    } else {
      await createGroupOfWork(formData)
      showToast('Kelompok Pekerjaan berhasil ditambahkan.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[GroupOfWork] Save failed:', err)
    actionError.value = err?.message || 'Gagal menyimpan data.'
  } finally {
    submitting.value = false
  }
}

function confirmDelete(group) {
  deletingGroup.value = group
  deleteError.value = ''
}
function closeDelete() {
  deletingGroup.value = null
  deleteError.value = ''
}
async function onDeleteConfirm() {
  if (!deletingGroup.value) return
  submitting.value = true
  deleteError.value = ''
  try {
    await deleteGroupOfWork(deletingGroup.value.id)
    deletingGroup.value = null
    showToast('Kelompok Pekerjaan berhasil dihapus.')
    await loadData()
  } catch (err) {
    console.error('[GroupOfWork] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? 'Kelompok masih dipakai aktivitas kebun atau data lain, jadi tidak bisa dihapus.'
      : err?.message || 'Gagal menghapus.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
