<template>
  <MdPage title="Satuan" description="Satuan ukur yang dipakai jenis kebutuhan dan pekerjaan, beserta kelengkapan keterangannya. Klik kartu untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Satuan</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" label="Total satuan" :value="rows.length" :sub="`${count('detail')} berketerangan`" action hint="Tampilkan semua" @select="clearAll" />
      <MdKpi icon="info" tone="warning" label="Tanpa keterangan" :value="count('nodetail')" :sub="`${pct(count('nodetail'))}% dari data`" action :pressed="only('nodetail')" @select="quick('nodetail')" />
      <MdKpi icon="bookmark" tone="success" label="Ada catatan" :value="count('notes')" :sub="`${pct(count('notes'))}% dari data`" action :pressed="only('notes')" @select="quick('notes')" />
      <MdKpi icon="alert" tone="brand" label="Belum dipakai" :value="count('unused')" sub="Tidak dipakai kebutuhan, parameter, atau pembayaran" action :pressed="only('unused')" @select="quick('unused')" />
    </div>

    <MdBarChart
      v-if="rows.length"
      title="Pemakaian satuan"
      :subtitle="`${rows.length - count('unused')} dari ${rows.length} satuan dipakai`"
      :legend="USAGE.map((u) => ({ label: u.label, color: u.color }))"
      :bars="bars"
      :selected="filterUnit"
      @toggle="toggleUnit" />

    <MdDataTable
      ref="table"
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      entity-label="Satuan"
      empty-icon="layers"
      empty-text="Tambahkan satuan pertama."
      add-label="Tambah Satuan"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar satuan"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari nama, keterangan, atau catatan…" aria-label="Cari satuan" />
        </label>
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
      <template #cell-usage="{ row }">
        <span v-if="usageTotal(row.id)" class="md-num">{{ usageTotal(row.id) }}</span><span v-else class="md-muted">Belum dipakai</span>
      </template>
      <template #cell-notes="{ row }">
        <span v-if="row.notes">{{ row.notes }}</span><span v-else class="md-muted">—</span>
      </template>
      <template #cell-created_at="{ row }">
        <div>{{ fmtDate(row.created_at) }}</div><small class="md-muted">{{ userName(row.created_by) }}</small>
      </template>
      <template #cell-updated_at="{ row }">
        <div>{{ fmtDate(row.updated_at) }}</div><small class="md-muted">{{ userName(row.updated_by) }}</small>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah satuan ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus satuan ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name || '-' }}</b><div class="md-muted" style="font-size: 12px">ID {{ row.id }}</div></div>
        </div>
        <div class="md-card__grid">
          <div>Keterangan<b>{{ row.detail || '—' }}</b></div>
          <div>Dipakai<b>{{ usageTotal(row.id) || 'Belum' }}</b></div>
          <div>Catatan<b>{{ row.notes || '—' }}</b></div>
          <div>Dibuat<b>{{ fmtDate(row.created_at) }} · {{ userName(row.created_by) }}</b></div>
          <div>Diubah<b>{{ fmtDate(row.updated_at) }} · {{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <TypeOfUnitForm :visible="showForm" :type-of-unit="editing" :rows="rows" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" title="Hapus satuan?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        Satuan <b>{{ deleting.name }}</b> akan dihapus permanen. Penghapusan ditolak bila masih dipakai data lain.
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import TypeOfUnitForm from './TypeOfUnitForm.vue'
import { createTypeOfUnit, deleteTypeOfUnit, listTypeOfUnit, updateTypeOfUnit } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { signedApiFetch } from '../../../../api/fetch'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const columns = [
  { key: 'name', label: 'Nama' },
  { key: 'detail', label: 'Keterangan', sortValue: (r) => r.detail || '' },
  { key: 'usage', label: 'Dipakai', align: 'right', sortValue: (r) => usageTotal(r.id) },
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
const filterUnit = ref([]) // id satuan (string) dari klik batang grafik
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
// Pemakaian satuan oleh data lain (unit_id). Gagal dimuat = dianggap 0, daftar tetap tampil.
const USAGE = [
  { key: 'need', label: 'Jenis kebutuhan', path: '/type_of_need', color: 'var(--success)' },
  { key: 'params', label: 'Parameter', path: '/fullfil_params?page=1&limit=1000', color: '#0ea5e9' },
  { key: 'payment', label: 'Pembayaran', path: '/fullfil_payment?page=1&limit=1000', color: 'var(--warning)' }
]
const usage = ref({}) // { need: { [unitId]: n }, ... }
const usageOf = (key, id) => usage.value[key]?.[String(id)] || 0
const usageTotal = (id) => USAGE.reduce((s, u) => s + usageOf(u.key, id), 0)

async function loadUsage() {
  const next = {}
  await Promise.all(USAGE.map(async (u) => {
    try {
      const resp = await signedApiFetch(u.path, { method: 'GET' })
      const counts = {}
      for (const r of resp.data || []) if (r.unit_id != null) counts[String(r.unit_id)] = (counts[String(r.unit_id)] || 0) + 1
      next[u.key] = counts
    } catch (err) {
      console.warn(`[TypeOfUnit] Gagal memuat pemakaian ${u.label}:`, err)
    }
  }))
  usage.value = next
}

const bars = computed(() =>
  rows.value
    .slice()
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'id', { numeric: true }))
    .map((r) => ({
      key: String(r.id),
      label: r.name,
      ariaLabel: `${r.name}: ${USAGE.map((u) => `${usageOf(u.key, r.id)} ${u.label.toLowerCase()}`).join(', ')}`,
      segments: USAGE.map((u) => ({ value: usageOf(u.key, r.id), color: u.color }))
    }))
)
function toggleUnit(id) {
  filterUnit.value = filterUnit.value.includes(id) ? filterUnit.value.filter((x) => x !== id) : [...filterUnit.value, id]
}

const INFO = {
  unused: { label: 'Belum dipakai', test: (r) => usageTotal(r.id) === 0 },
  detail: { label: 'Ada keterangan', test: (r) => !!r.detail },
  nodetail: { label: 'Tanpa keterangan', test: (r) => !r.detail },
  notes: { label: 'Ada catatan', test: (r) => !!r.notes },
  recent: { label: 'Diubah 30 hari', test: (r) => Date.now() - new Date(r.updated_at || r.created_at || 0).getTime() <= 30 * DAY }
}
const count = (k) => rows.value.filter(INFO[k].test).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const infoOptions = computed(() => Object.entries(INFO).map(([value, o]) => ({ value, label: o.label, count: count(value) })))

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || [r.name, r.detail, r.notes].some((v) => String(v || '').toLowerCase().includes(q))) &&
    filterInfo.value.every((k) => INFO[k].test(r)) &&
    (!filterUnit.value.length || filterUnit.value.includes(String(r.id)))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterInfo.value.forEach((k) => c.push({ key: `i-${k}`, label: INFO[k].label, remove: () => (filterInfo.value = filterInfo.value.filter((x) => x !== k)) }))
  filterUnit.value.forEach((id) => c.push({ key: `u-${id}`, label: rows.value.find((r) => String(r.id) === id)?.name || `Satuan ${id}`, remove: () => toggleUnit(id) }))
  return c
})

function clearAll() {
  search.value = ''
  filterInfo.value = []
  filterUnit.value = []
}
const only = (k) => filterInfo.value.length === 1 && filterInfo.value[0] === k
function quick(k) {
  filterInfo.value = only(k) ? [] : [k]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    const [list] = await Promise.all([listTypeOfUnit(), loadUsage()])
    rows.value = list
  } catch (err) {
    console.error('[TypeOfUnit] Failed to load:', err)
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
      await updateTypeOfUnit(editing.value.id, formData)
      showToast('Satuan berhasil diubah.')
    } else {
      await createTypeOfUnit(formData)
      showToast('Satuan berhasil ditambahkan.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TypeOfUnit] Save failed:', err)
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
    await deleteTypeOfUnit(deleting.value.id)
    deleting.value = null
    showToast('Satuan berhasil dihapus.')
    await loadData()
  } catch (err) {
    console.error('[TypeOfUnit] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? 'Satuan masih dipakai data lain, jadi tidak bisa dihapus.'
      : err?.message || 'Gagal menghapus data.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
