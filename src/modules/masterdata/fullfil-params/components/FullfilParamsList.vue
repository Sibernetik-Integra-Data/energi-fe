<template>
  <MdPage title="Parameter Kebutuhan" description="Nilai parameter untuk setiap pemetaan kebutuhan beserta satuannya. Klik kartu atau batang grafik untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Parameter</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="sliders" tone="info" label="Total parameter" :value="rows.length" :sub="`${mappingOptions.length} pemetaan`" action hint="Tampilkan semua" @select="clearAll" />
      <MdKpi icon="layers" tone="success" label="Pemetaan tercakup" :value="mappingOptions.length" :sub="`dari ${mappings.length} pemetaan`" action hint="Urutkan" @select="table?.setSort('fullfil_id', 1)" />
      <MdKpi icon="grid" tone="brand" label="Satuan dipakai" :value="unitOptions.length" :sub="topUnit ? `Terbanyak: ${unitName(topUnit)}` : 'Belum ada'" action :pressed="!!topUnit && only(filterUnit, topUnit)" @select="topUnit && quick(filterUnit, topUnit)" />
      <MdKpi icon="bookmark" tone="warning" label="Tanpa catatan" :value="noNotes" :sub="`${rows.length - noNotes} bercatatan`" action hint="Urutkan nilai" @select="table?.setSort('value', -1)" />
    </div>

    <MdBarChart
      v-if="bars.length"
      title="Parameter per pemetaan kebutuhan"
      :subtitle="`${rows.length} parameter di ${mappingOptions.length} pemetaan`"
      :legend="[{ label: 'Parameter', color: 'var(--success)' }]"
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
      entity-label="Parameter"
      empty-icon="sliders"
      empty-text="Tambahkan parameter pertama untuk pemetaan kebutuhan."
      add-label="Tambah Parameter"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar parameter kebutuhan"
      @retry="load"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari pemetaan, nama, atau catatan…" aria-label="Cari parameter" />
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
        <button type="button" class="md-icon-btn" :aria-label="`Ubah parameter ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus parameter ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
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

    <FullfilParamsForm :visible="showForm" :item="editing" :mappings="mappings" :units="units" :submitting="submitting" :error="actionError || ''" @submit="save" @cancel="closeForm" />

    <MdConfirm :open="!!deleteTarget" title="Hapus parameter kebutuhan?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="remove">
      <template v-if="deleteTarget">
        Parameter <b>{{ deleteTarget.name }}</b> ({{ mappingName(deleteTarget.fullfil_id) }}) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FullfilParamsForm from './FullfilParamsForm.vue'
import { createFullfilParams, deleteFullfilParams, listFullfilMappings, listFullfilParams, listTypeOfUnits, updateFullfilParams } from '../model'
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
  return { key: id, label: mappingName(id), ariaLabel: `${mappingName(id)}: ${n} parameter`, segments: [{ value: n, color: 'var(--success)' }] }
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
const only = (f, v) => f.value.length === 1 && f.value[0] === v
function quick(f, v) { f.value = only(f, v) ? [] : [v] }
function toggleMapping(id) { filterMapping.value = filterMapping.value.includes(id) ? filterMapping.value.filter((x) => x !== id) : [...filterMapping.value, id] }

async function load() {
  loading.value = true; error.value = null
  try {
    const result = await Promise.all([listFullfilParams(), listFullfilMappings(), listTypeOfUnits()])
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
async function save(payload) {
  submitting.value = true; actionError.value = null
  try {
    if (editing.value?.id) { await updateFullfilParams(editing.value.id, payload); showToast('Parameter Kebutuhan berhasil diubah.') }
    else { await createFullfilParams(payload); showToast('Parameter Kebutuhan berhasil ditambahkan.') }
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
    await deleteFullfilParams(deleteTarget.value.id)
    deleteTarget.value = null
    showToast('Parameter Kebutuhan berhasil dihapus.')
    await load()
  } catch (err) {
    deleteError.value = err?.message || 'Gagal menghapus data.'
  } finally {
    submitting.value = false
  }
}
onMounted(load)
</script>
