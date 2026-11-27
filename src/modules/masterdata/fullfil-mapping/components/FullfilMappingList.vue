<template>
  <MdPage title="Pemetaan Kebutuhan" description="Hubungan jenis pekerjaan dengan jenis kebutuhan, siapa yang mengaksesnya, dan apakah ditampilkan. Klik kartu atau batang grafik untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Pemetaan</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" label="Total pemetaan" :value="rows.length" :sub="`${workOptions.length} jenis pekerjaan`" action hint="Tampilkan semua" @select="clearAll" />
      <MdKpi icon="eye" tone="success" label="Ditampilkan" :value="countView('1')" :sub="`${countView('0')} disembunyikan`" action :pressed="only(filterView, '1')" @select="quick(filterView, '1')" />
      <MdKpi icon="user" tone="brand" label="Akses admin" :value="countAccess('admin')" :sub="`${countAccess('-')} tanpa akses`" action :pressed="only(filterAccess, 'admin')" @select="quick(filterAccess, 'admin')" />
      <MdKpi icon="users" tone="warning" label="Akses pekerja" :value="countAccess('pekerja')" :sub="`${needOptions.length} jenis kebutuhan dipakai`" action :pressed="only(filterAccess, 'pekerja')" @select="quick(filterAccess, 'pekerja')" />
    </div>

    <MdBarChart
      v-if="bars.length"
      title="Pemetaan per jenis pekerjaan"
      :subtitle="`${rows.length} pemetaan di ${workOptions.length} jenis pekerjaan`"
      :legend="[{ label: 'Ditampilkan', color: 'var(--success)' }, { label: 'Disembunyikan', color: 'var(--border-strong)' }]"
      :bars="bars"
      :selected="filterWork"
      @toggle="toggleWork" />

    <MdDataTable
      ref="table"
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="error || ''"
      entity-label="Pemetaan"
      empty-icon="layers"
      empty-text="Tambahkan pemetaan pertama untuk menghubungkan jenis pekerjaan dengan kebutuhannya."
      add-label="Tambah Pemetaan"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar pemetaan kebutuhan"
      @retry="load"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari nama, pekerjaan, kebutuhan…" aria-label="Cari pemetaan" />
        </label>
        <MdDropdown v-model="filterWork" label="Jenis pekerjaan" :options="workFilterOptions" multiple />
        <MdDropdown v-model="filterNeed" label="Jenis kebutuhan" :options="needFilterOptions" multiple />
        <MdDropdown v-model="filterAccess" label="Akses" :options="accessFilterOptions" multiple />
        <MdDropdown v-model="filterView" label="Tampil" :options="viewFilterOptions" multiple />
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
          <div><b>{{ row.name || '—' }}</b><small>{{ row.title || `ID ${row.id}` }}</small></div>
        </div>
      </template>
      <template #cell-tow_id="{ row }">{{ workName(row.tow_id) }}</template>
      <template #cell-ton_id="{ row }">{{ needName(row.ton_id) }}</template>
      <template #cell-access="{ row }">
        <MdBadge v-if="row.access" :tone="row.access === 'admin' ? 'info' : 'warning'">{{ accessLabel(row.access) }}</MdBadge>
        <span v-else class="md-muted">—</span>
      </template>
      <template #cell-is_view="{ row }">
        <MdBadge :tone="row.is_view === 0 ? 'neutral' : 'success'">{{ row.is_view === 0 ? 'Tidak' : 'Ya' }}</MdBadge>
      </template>
      <template #cell-notes="{ row }"><span class="md-muted">{{ row.notes || '—' }}</span></template>
      <template #cell-updated_at="{ row }">
        <span class="md-muted">{{ formatDate(row.updated_at) }}<template v-if="row.updated_by || row.created_by"> · {{ userName(row.updated_by || row.created_by) }}</template></span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah pemetaan ${row.name || row.id}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus pemetaan ${row.name || row.id}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name || `${workName(row.tow_id)} → ${needName(row.ton_id)}` }}</b><div class="md-muted" style="font-size: 12px">ID {{ row.id }}</div></div>
          <MdBadge :tone="row.is_view === 0 ? 'neutral' : 'success'">{{ row.is_view === 0 ? 'Disembunyikan' : 'Ditampilkan' }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Jenis pekerjaan<b>{{ workName(row.tow_id) }}</b></div>
          <div>Jenis kebutuhan<b>{{ needName(row.ton_id) }}</b></div>
          <div>Akses<b>{{ accessLabel(row.access) }}</b></div>
          <div>Catatan<b>{{ row.notes || '—' }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <FullfilMappingForm :visible="showForm" :fullfil="editing" :type-of-works="typeOfWorks" :type-of-needs="typeOfNeeds" :submitting="submitting" :error="actionError || ''" @submit="save" @cancel="closeForm" />

    <MdConfirm :open="!!deleteTarget" title="Hapus pemetaan kebutuhan?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="remove">
      <template v-if="deleteTarget">
        Pemetaan <b>{{ deleteTarget.name || `${workName(deleteTarget.tow_id)} → ${needName(deleteTarget.ton_id)}` }}</b> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FullfilMappingForm from './FullfilMappingForm.vue'
import { createFullfil, deleteFullfil, listFullfil, listTypeOfNeed, listTypeOfWork, updateFullfil } from '../model'
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
  { key: 'tow_id', label: 'Jenis pekerjaan', sortValue: (r) => workName(r.tow_id) },
  { key: 'ton_id', label: 'Jenis kebutuhan', sortValue: (r) => needName(r.ton_id) },
  { key: 'access', label: 'Akses' },
  { key: 'is_view', label: 'Tampil', sortValue: (r) => (r.is_view === 0 ? 0 : 1) },
  { key: 'notes', label: 'Catatan', sortable: false },
  { key: 'updated_at', label: 'Diubah' }
]

const table = ref(null)
const rows = ref([]); const typeOfWorks = ref([]); const typeOfNeeds = ref([])
const loading = ref(false); const submitting = ref(false)
const error = ref(null); const actionError = ref(null); const deleteError = ref('')
const search = ref(''); const filterWork = ref([]); const filterNeed = ref([]); const filterAccess = ref([]); const filterView = ref([])
const showForm = ref(false); const editing = ref(null); const deleteTarget = ref(null)

function workName(id) { return typeOfWorks.value.find((item) => Number(item.id) === Number(id))?.name || `#${id}` }
function needName(id) { return typeOfNeeds.value.find((item) => Number(item.id) === Number(id))?.name || `#${id}` }
function formatDate(value) { return value ? String(value).replace(/\.\d+/, '').replace('T', ' ').replace('Z', '') : '-' }
const initial = (name) => String(name || '#').trim().charAt(0).toUpperCase() || '#'
const accessLabel = (a) => (a === 'admin' ? 'Admin' : a === 'pekerja' ? 'Pekerja' : a || '—')
const accessKey = (r) => r.access || '-'
const viewKey = (r) => (r.is_view === 0 ? '0' : '1')
const countAccess = (a) => rows.value.filter((r) => accessKey(r) === a).length
const countView = (v) => rows.value.filter((r) => viewKey(r) === v).length
const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })

const workOptions = computed(() => [...new Set(rows.value.map((r) => String(r.tow_id)))].sort((a, b) => byName(workName(a), workName(b))))
const needOptions = computed(() => [...new Set(rows.value.map((r) => String(r.ton_id)))].sort((a, b) => byName(needName(a), needName(b))))
const workFilterOptions = computed(() => workOptions.value.map((id) => ({ value: id, label: workName(id), count: rows.value.filter((r) => String(r.tow_id) === id).length })))
const needFilterOptions = computed(() => needOptions.value.map((id) => ({ value: id, label: needName(id), count: rows.value.filter((r) => String(r.ton_id) === id).length })))
const accessFilterOptions = computed(() => [
  { value: 'admin', label: 'Admin', count: countAccess('admin') },
  { value: 'pekerja', label: 'Pekerja', count: countAccess('pekerja') },
  { value: '-', label: 'Tanpa akses', count: countAccess('-') }
])
const viewFilterOptions = computed(() => [
  { value: '1', label: 'Ditampilkan', count: countView('1') },
  { value: '0', label: 'Disembunyikan', count: countView('0') }
])

const bars = computed(() => workOptions.value.map((id) => {
  const rs = rows.value.filter((r) => String(r.tow_id) === id)
  const shown = rs.filter((r) => viewKey(r) === '1').length
  return {
    key: id,
    label: workName(id),
    ariaLabel: `${workName(id)}: ${rs.length} pemetaan, ${shown} ditampilkan`,
    segments: [{ value: shown, color: 'var(--success)' }, { value: rs.length - shown, color: 'var(--border-strong)' }]
  }
}))

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((row) =>
    (!q || `${row.name || ''} ${row.title || ''} ${workName(row.tow_id)} ${needName(row.ton_id)} ${row.access || ''} ${row.notes || ''}`.toLowerCase().includes(q)) &&
    (!filterWork.value.length || filterWork.value.includes(String(row.tow_id))) &&
    (!filterNeed.value.length || filterNeed.value.includes(String(row.ton_id))) &&
    (!filterAccess.value.length || filterAccess.value.includes(accessKey(row))) &&
    (!filterView.value.length || filterView.value.includes(viewKey(row)))
  )
})

const chips = computed(() => {
  const c = []
  const drop = (f, v) => () => (f.value = f.value.filter((x) => x !== v))
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterWork.value.forEach((v) => c.push({ key: `w-${v}`, label: workName(v), remove: drop(filterWork, v) }))
  filterNeed.value.forEach((v) => c.push({ key: `n-${v}`, label: needName(v), remove: drop(filterNeed, v) }))
  filterAccess.value.forEach((v) => c.push({ key: `a-${v}`, label: v === '-' ? 'Tanpa akses' : accessLabel(v), remove: drop(filterAccess, v) }))
  filterView.value.forEach((v) => c.push({ key: `v-${v}`, label: v === '1' ? 'Ditampilkan' : 'Disembunyikan', remove: drop(filterView, v) }))
  return c
})

function clearAll() { search.value = ''; filterWork.value = []; filterNeed.value = []; filterAccess.value = []; filterView.value = [] }
const only = (f, v) => f.value.length === 1 && f.value[0] === v
function quick(f, v) { f.value = only(f, v) ? [] : [v] }
function toggleWork(id) { filterWork.value = filterWork.value.includes(id) ? filterWork.value.filter((x) => x !== id) : [...filterWork.value, id] }

async function load() {
  loading.value = true; error.value = null
  try {
    const result = await Promise.all([listFullfil(), listTypeOfWork(), listTypeOfNeed()])
    rows.value = result[0].data; typeOfWorks.value = result[1]; typeOfNeeds.value = result[2]
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
    if (editing.value?.id) { await updateFullfil(editing.value.id, payload); showToast('Pemetaan Kebutuhan berhasil diubah.') }
    else { await createFullfil(payload); showToast('Pemetaan Kebutuhan berhasil ditambahkan.') }
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
    await deleteFullfil(deleteTarget.value.id)
    deleteTarget.value = null
    showToast('Pemetaan Kebutuhan berhasil dihapus.')
    await load()
  } catch (err) {
    deleteError.value = err?.message || 'Gagal menghapus data.'
  } finally {
    submitting.value = false
  }
}
onMounted(load)
</script>
