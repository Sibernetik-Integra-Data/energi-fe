<template>
  <MdPage title="Jenis Kebutuhan" description="Jenis kebutuhan kerja beserta satuannya, dikelompokkan per satuan. Klik kartu untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Jenis Kebutuhan</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" label="Total jenis kebutuhan" :value="rows.length" :sub="`${count('detail')} berketerangan`" action hint="Tampilkan semua" @select="clearAll" />
      <MdKpi icon="info" tone="warning" label="Tanpa keterangan" :value="count('nodetail')" :sub="`${pct(count('nodetail'))}% dari data`" action :pressed="only('nodetail')" @select="quick('nodetail')" />
      <MdKpi icon="bookmark" tone="success" label="Ada catatan" :value="count('notes')" :sub="`${pct(count('notes'))}% dari data`" action :pressed="only('notes')" @select="quick('notes')" />
      <MdKpi icon="grid" tone="brand" label="Satuan dipakai" :value="groupOptions.length" :sub="topGroup ? `Terbanyak: ${topGroup.label} (${topGroup.count})` : 'Belum ada data'" action hint="Urutkan" @select="table?.setSort('unit_name', 1)" />
    </div>

    <MdBarChart
      v-if="groupOptions.length"
      title="Jumlah jenis kebutuhan per satuan"
      :subtitle="`${rows.length} data di ${groupOptions.length} satuan`"
      :legend="[{ label: 'Ada keterangan', color: 'var(--success)' }, { label: 'Tanpa keterangan', color: 'var(--border-strong)' }]"
      :bars="bars"
      :selected="filterGroup"
      @toggle="toggleGroup" />

    <MdDataTable
      ref="table"
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      entity-label="Jenis Kebutuhan"
      empty-icon="layers"
      empty-text="Tambahkan jenis kebutuhan pertama."
      add-label="Tambah Jenis Kebutuhan"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar jenis kebutuhan"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari nama, keterangan, atau catatan…" aria-label="Cari jenis kebutuhan" />
        </label>
        <MdDropdown v-model="filterGroup" label="Satuan" :options="groupOptions" multiple />
        <MdDropdown v-model="filterInfo" label="Kelengkapan" :options="infoOptions" multiple />
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
          <div><b>{{ row.name || '-' }}</b><small>ID {{ row.id }}</small></div>
        </div>
      </template>
      <template #cell-detail="{ row }">
        <span v-if="row.detail">{{ row.detail }}</span><span v-else class="md-muted">—</span>
      </template>
      <template #cell-notes="{ row }">
        <span v-if="row.notes">{{ row.notes }}</span><span v-else class="md-muted">—</span>
      </template>
      <template #cell-unit_name="{ row }">
        <MdBadge v-if="row.unit_name" tone="info">{{ row.unit_name }}</MdBadge><span v-else class="md-muted">—</span>
      </template>
      <template #cell-created_at="{ row }">
        <div>{{ fmtDate(row.created_at) }}</div><small class="md-muted">{{ userName(row.created_by) }}</small>
      </template>
      <template #cell-updated_at="{ row }">
        <div>{{ fmtDate(row.updated_at) }}</div><small class="md-muted">{{ userName(row.updated_by) }}</small>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah jenis kebutuhan ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus jenis kebutuhan ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name || '-' }}</b><div class="md-muted" style="font-size: 12px">ID {{ row.id }}</div></div>
          <MdBadge v-if="row.unit_name" tone="info">{{ row.unit_name }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Keterangan<b>{{ row.detail || '—' }}</b></div>
          <div>Catatan<b>{{ row.notes || '—' }}</b></div>
          <div>Dibuat<b>{{ fmtDate(row.created_at) }} · {{ userName(row.created_by) }}</b></div>
          <div>Diubah<b>{{ fmtDate(row.updated_at) }} · {{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <TypeOfNeedForm :visible="showForm" :type-of-need="editing" :rows="rows" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" title="Hapus jenis kebutuhan?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        Jenis kebutuhan <b>{{ deleting.name }}</b> akan dihapus permanen. Penghapusan ditolak bila masih dipakai data lain.
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import TypeOfNeedForm from './TypeOfNeedForm.vue'
import { createTypeOfNeed, deleteTypeOfNeed, listTypeOfNeed, updateTypeOfNeed } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdDataTable, MdDropdown, MdBadge, MdBarChart, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const columns = [
  { key: 'name', label: 'Nama' },
  { key: 'unit_name', label: 'Satuan', sortValue: (r) => r.unit_name || '' },
  { key: 'detail', label: 'Keterangan', sortValue: (r) => r.detail || '' },
  { key: 'notes', label: 'Catatan', sortValue: (r) => r.notes || '' },
  { key: 'created_at', label: 'Dibuat', sortValue: (r) => r.created_at || '' },
  { key: 'updated_at', label: 'Diubah', sortValue: (r) => r.updated_at || '' }
]

const table = ref(null)
const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)
const search = ref('')
const filterInfo = ref([])
const filterGroup = ref([])
const NONE = '—'
const groupOf = (r) => r.unit_name || NONE
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

const DAY = 86400000
const initial = (n) => String(n || '#').trim().charAt(0).toUpperCase() || '#'
const fmtDate = (v) => {
  if (!v) return '-'
  const d = new Date(v)
  return isNaN(d) ? String(v) : d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
const INFO = {
  detail: { label: 'Ada keterangan', test: (r) => !!r.detail },
  nodetail: { label: 'Tanpa keterangan', test: (r) => !r.detail },
  notes: { label: 'Ada catatan', test: (r) => !!r.notes },
  recent: { label: 'Diubah 30 hari', test: (r) => Date.now() - new Date(r.updated_at || r.created_at || 0).getTime() <= 30 * DAY }
}
const count = (k) => rows.value.filter(INFO[k].test).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const infoOptions = computed(() => Object.entries(INFO).map(([value, o]) => ({ value, label: o.label, count: count(value) })))

const groupOptions = computed(() => {
  const m = new Map()
  rows.value.forEach((r) => m.set(groupOf(r), (m.get(groupOf(r)) || 0) + 1))
  return [...m.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'id', { numeric: true }))
    .map(([value, count]) => ({ value, label: value === NONE ? 'Tanpa satuan' : value, count }))
})
const topGroup = computed(() => groupOptions.value.reduce((t, g) => (!t || g.count > t.count ? g : t), null))
const bars = computed(() =>
  groupOptions.value.map((g) => {
    const rs = rows.value.filter((r) => groupOf(r) === g.value)
    const withDetail = rs.filter((r) => r.detail).length
    return {
      key: g.value,
      label: g.label,
      ariaLabel: `${g.label}: ${rs.length} data, ${withDetail} berketerangan`,
      segments: [
        { value: withDetail, color: 'var(--success)' },
        { value: rs.length - withDetail, color: 'var(--border-strong)' }
      ]
    }
  })
)
function toggleGroup(k) {
  filterGroup.value = filterGroup.value.includes(k) ? filterGroup.value.filter((x) => x !== k) : [...filterGroup.value, k]
}

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || [r.name, r.detail, r.notes, r.unit_name].some((v) => String(v || '').toLowerCase().includes(q))) &&
    (!filterGroup.value.length || filterGroup.value.includes(groupOf(r))) &&
    filterInfo.value.every((k) => INFO[k].test(r))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterGroup.value.forEach((g) => c.push({ key: `g-${g}`, label: g === NONE ? 'Tanpa satuan' : g, remove: () => (filterGroup.value = filterGroup.value.filter((x) => x !== g)) }))
  filterInfo.value.forEach((k) => c.push({ key: `i-${k}`, label: INFO[k].label, remove: () => (filterInfo.value = filterInfo.value.filter((x) => x !== k)) }))
  return c
})

function clearAll() {
  search.value = ''
  filterInfo.value = []
  filterGroup.value = []
}
const only = (k) => filterInfo.value.length === 1 && filterInfo.value[0] === k
function quick(k) {
  filterInfo.value = only(k) ? [] : [k]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listTypeOfNeed()
  } catch (err) {
    console.error('[TypeOfNeed] Failed to load:', err)
    fetchError.value = err?.message || 'Gagal memuat data.'
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

async function onFormSubmit(formData) {
  submitting.value = true
  actionError.value = null
  try {
    if (editing.value?.id) {
      await updateTypeOfNeed(editing.value.id, formData)
      showToast('Jenis Kebutuhan berhasil diubah.')
    } else {
      await createTypeOfNeed(formData)
      showToast('Jenis Kebutuhan berhasil ditambahkan.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TypeOfNeed] Save failed:', err)
    actionError.value = /409/.test(err?.message || '')
      ? `Nama ${formData.name} sudah dipakai. Gunakan nama lain.`
      : err?.message || 'Gagal menyimpan data.'
  } finally {
    submitting.value = false
  }
}

function confirmDelete(row) {
  deleting.value = row
  deleteError.value = ''
}
function closeDelete() {
  deleting.value = null
  deleteError.value = ''
}
async function onDeleteConfirm() {
  if (!deleting.value) return
  submitting.value = true
  deleteError.value = ''
  try {
    await deleteTypeOfNeed(deleting.value.id)
    deleting.value = null
    showToast('Jenis Kebutuhan berhasil dihapus.')
    await loadData()
  } catch (err) {
    console.error('[TypeOfNeed] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? 'Jenis kebutuhan masih dipakai data lain, jadi tidak bisa dihapus.'
      : err?.message || 'Gagal menghapus data.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
