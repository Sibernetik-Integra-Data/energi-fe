<template>
  <MdPage title="Pembayaran Kebutuhan" description="Nilai pembayaran untuk setiap pemetaan kebutuhan beserta satuannya. Klik kartu atau batang grafik untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Pembayaran</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="database" tone="info" label="Total pembayaran" :value="rows.length" :sub="`${mappingOptions.length} pemetaan`" action hint="Tampilkan semua" @select="clearAll" />
      <MdKpi icon="layers" tone="success" label="Pemetaan tercakup" :value="mappingOptions.length" :sub="`dari ${mappings.length} pemetaan`" action hint="Urutkan" @select="table?.setSort('fullfil_id', 1)" />
      <MdKpi icon="grid" tone="brand" label="Satuan dipakai" :value="unitOptions.length" :sub="topUnit ? `Terbanyak: ${unitName(topUnit)}` : 'Belum ada'" action :pressed="!!topUnit && only('unit', topUnit)" @select="topUnit && quick('unit', topUnit)" />
      <MdKpi icon="bookmark" tone="warning" label="Tanpa catatan" :value="noNotes" :sub="`${rows.length - noNotes} bercatatan`" action hint="Urutkan nilai" @select="table?.setSort('value', -1)" />
    </div>

    <MdBarChart
      v-if="bars.length"
      title="Pembayaran per pemetaan kebutuhan"
      :subtitle="`${rows.length} pembayaran di ${mappingOptions.length} pemetaan`"
      :legend="[{ label: 'Pembayaran', color: 'var(--success)' }]"
      :bars="bars"
      :selected="filterMapping"
      @toggle="toggleMapping" />

    <MdDataTable
      ref="table"
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="error || ''"
      entity-label="Pembayaran"
      empty-icon="database"
      empty-text="Tambahkan pembayaran pertama untuk pemetaan kebutuhan."
      add-label="Tambah Pembayaran"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar pembayaran kebutuhan"
      @retry="load"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari pemetaan, nama, atau catatan…" aria-label="Cari pembayaran" />
        </label>
        <MdDropdown v-model="filterMapping" label="Pemetaan" :options="mappingFilterOptions" multiple />
        <MdDropdown v-model="filterUnit" label="Satuan" :options="unitFilterOptions" multiple />
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
          <div><b>{{ row.name || '—' }}</b><small>ID {{ row.id }}</small></div>
        </div>
      </template>
      <template #cell-fullfil_id="{ row }">{{ mappingName(row.fullfil_id) }}</template>
      <template #cell-value="{ row }"><span class="md-num">{{ fmt(row.value) }}</span> <span class="md-muted">{{ unitName(row.unit_id) }}</span></template>
      <template #cell-unit_id="{ row }"><MdBadge tone="neutral">{{ unitName(row.unit_id) }}</MdBadge></template>
      <template #cell-notes="{ row }"><span class="md-muted">{{ row.notes || '—' }}</span></template>
      <template #cell-updated_at="{ row }">
        <span class="md-muted">{{ formatDate(row.updated_at) }}<template v-if="row.updated_by || row.created_by"> · {{ userName(row.updated_by || row.created_by) }}</template></span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah pembayaran ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus pembayaran ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">ID {{ row.id }}</div></div>
          <MdBadge tone="neutral">{{ unitName(row.unit_id) }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Pemetaan<b>{{ mappingName(row.fullfil_id) }}</b></div>
          <div>Nilai<b>{{ fmt(row.value) }} {{ unitName(row.unit_id) }}</b></div>
          <div>Catatan<b>{{ row.notes || '—' }}</b></div>
          <div>Diubah<b>{{ formatDate(row.updated_at) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <FullfilPaymentForm :visible="showForm" :item="editing" :mappings="mappings" :units="units" :submitting="submitting" :error="actionError || ''" @submit="save" @cancel="closeForm" />

    <MdConfirm :open="!!deleteTarget" title="Hapus pembayaran kebutuhan?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="remove">
      <template v-if="deleteTarget">
        Pembayaran <b>{{ deleteTarget.name }}</b> ({{ mappingName(deleteTarget.fullfil_id) }}) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FullfilPaymentForm from './FullfilPaymentForm.vue'
import { createFullfilPayment, deleteFullfilPayment, listFullfilMappings, listFullfilPayments, listTypeOfUnits, updateFullfilPayment } from '../model'
import { getAuthenticatedUser, getTokenClaims } from '../../../../auth/keycloak'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { userName } = useUserNames()
const { show: showToast } = useToast()

const columns = [
  { key: 'name', label: 'Nama' },
  { key: 'fullfil_id', label: 'Pemetaan kebutuhan', sortValue: (r) => mappingName(r.fullfil_id) },
  { key: 'value', label: 'Nilai', sortValue: (r) => (r.value == null ? null : Number(r.value)) },
  { key: 'unit_id', label: 'Satuan', sortValue: (r) => unitName(r.unit_id) },
  { key: 'notes', label: 'Catatan', sortable: false },
  { key: 'updated_at', label: 'Diubah' }
]

const table = ref(null)
const rows = ref([]); const mappings = ref([]); const units = ref([])
const loading = ref(false); const submitting = ref(false)
const error = ref(null); const actionError = ref(null); const deleteError = ref('')
const search = ref(''); const filterMapping = ref([]); const filterUnit = ref([])
const showForm = ref(false); const editing = ref(null); const deleteTarget = ref(null)

const unitName = (id) => units.value.find((item) => Number(item.id) === Number(id))?.name || `#${id}`
const mappingName = (id) => mappings.value.find((item) => Number(item.id) === Number(id))?.name || `#${id}`
const formatDate = (value) => value ? String(value).replace(/\.\d+/, '').replace('T', ' ').replace('Z', '') : '-'
const fmt = (n) => (n == null || n === '' ? '—' : Number(n).toLocaleString('id-ID', { maximumFractionDigits: 2 }))
const initial = (name) => String(name || '#').trim().charAt(0).toUpperCase() || '#'
const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })
const countBy = (key, id) => rows.value.filter((r) => String(r[key]) === id).length

const mappingOptions = computed(() => [...new Set(rows.value.map((r) => String(r.fullfil_id)))].sort((a, b) => byName(mappingName(a), mappingName(b))))
const unitOptions = computed(() => [...new Set(rows.value.map((r) => String(r.unit_id)))].sort((a, b) => byName(unitName(a), unitName(b))))
const mappingFilterOptions = computed(() => mappingOptions.value.map((id) => ({ value: id, label: mappingName(id), count: countBy('fullfil_id', id) })))
const unitFilterOptions = computed(() => unitOptions.value.map((id) => ({ value: id, label: unitName(id), count: countBy('unit_id', id) })))
const topUnit = computed(() => unitOptions.value.reduce((best, id) => (!best || countBy('unit_id', id) > countBy('unit_id', best) ? id : best), ''))
const noNotes = computed(() => rows.value.filter((r) => !r.notes).length)

const bars = computed(() => mappingOptions.value.map((id) => {
  const n = countBy('fullfil_id', id)
  return { key: id, label: mappingName(id), ariaLabel: `${mappingName(id)}: ${n} pembayaran`, segments: [{ value: n, color: 'var(--success)' }] }
}))

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((row) =>
    (!q || `${mappingName(row.fullfil_id)} ${row.name} ${row.notes || ''} ${unitName(row.unit_id)}`.toLowerCase().includes(q)) &&
    (!filterMapping.value.length || filterMapping.value.includes(String(row.fullfil_id))) &&
    (!filterUnit.value.length || filterUnit.value.includes(String(row.unit_id)))
  )
})

const chips = computed(() => {
  const c = []
  const drop = (f, v) => () => (f.value = f.value.filter((x) => x !== v))
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterMapping.value.forEach((v) => c.push({ key: `m-${v}`, label: mappingName(v), remove: drop(filterMapping, v) }))
  filterUnit.value.forEach((v) => c.push({ key: `u-${v}`, label: unitName(v), remove: drop(filterUnit, v) }))
  return c
})

function clearAll() { search.value = ''; filterMapping.value = []; filterUnit.value = [] }
// Template membuka ref otomatis, jadi filter dirujuk lewat nama.
const filterRefs = { unit: filterUnit }
const only = (k, v) => filterRefs[k].value.length === 1 && filterRefs[k].value[0] === v
function quick(k, v) { filterRefs[k].value = only(k, v) ? [] : [v] }
function toggleMapping(id) { filterMapping.value = filterMapping.value.includes(id) ? filterMapping.value.filter((x) => x !== id) : [...filterMapping.value, id] }

async function load() {
  loading.value = true; error.value = null
  try {
    const result = await Promise.all([listFullfilPayments(), listFullfilMappings(), listTypeOfUnits()])
    rows.value = result[0].data; mappings.value = result[1]; units.value = result[2]
  } catch (err) {
    error.value = err?.message || 'Gagal memuat data.'
  } finally {
    loading.value = false
  }
}
function openCreate() { editing.value = null; actionError.value = null; showForm.value = true }
function openEdit(row) { editing.value = { ...row }; actionError.value = null; showForm.value = true }
function closeForm() { showForm.value = false; editing.value = null }
function currentUserId() { return getAuthenticatedUser()?.userId || getTokenClaims()?.sub || '' }
async function save(payload) {
  submitting.value = true; actionError.value = null
  try {
    if (editing.value?.id) { await updateFullfilPayment(editing.value.id, payload); showToast('Pembayaran Kebutuhan berhasil diubah.') }
    else {
      const userId = currentUserId()
      if (!userId) throw new Error('Tidak bisa mengenali pengguna yang sedang masuk.')
      await createFullfilPayment({ ...payload, user_id: userId }); showToast('Pembayaran Kebutuhan berhasil ditambahkan.') }
    closeForm(); await load()
  } catch (err) {
    actionError.value = err?.message || 'Gagal menyimpan data.'
  } finally {
    submitting.value = false
  }
}
function confirmDelete(row) { deleteTarget.value = row; deleteError.value = '' }
function closeDelete() { deleteTarget.value = null; deleteError.value = '' }
async function remove() {
  if (!deleteTarget.value) return
  submitting.value = true; deleteError.value = ''
  try {
    await deleteFullfilPayment(deleteTarget.value.id)
    deleteTarget.value = null
    showToast('Pembayaran Kebutuhan berhasil dihapus.')
    await load()
  } catch (err) {
    deleteError.value = err?.message || 'Gagal menghapus data.'
  } finally {
    submitting.value = false
  }
}
onMounted(load)
</script>
