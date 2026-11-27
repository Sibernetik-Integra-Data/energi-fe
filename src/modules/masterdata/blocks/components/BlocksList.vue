<template>
  <MdPage title="Blok" description="Blok kebun; tiap blok berisi beberapa petak (Data Master → Nomor Petak). Klik kartu atau batang grafik untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Blok</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="grid" tone="info" label="Total blok" :value="rows.length" :sub="`${fmt(totalPetak)} petak`" action hint="Tampilkan semua" @select="clearAll" />
      <MdKpi icon="leaf" tone="success" label="Blok ada TM" :value="countStatus('tm')" :sub="`${pct(countStatus('tm'))}% dari blok`" action :pressed="onlyStatus('tm')" @select="quickStatus('tm')" />
      <MdKpi icon="tree" tone="warning" label="Blok TBM" :value="countStatus('tbm')" :sub="`${countEmpty} blok tanpa petak`" action :pressed="onlyStatus('tbm')" @select="quickStatus('tbm')" />
      <MdKpi icon="pin" tone="brand" label="TPH · pohon panen" :value="fmt(totalTph)" :sub="`${fmt(totalHarvest)} pohon panen`" action hint="Urutkan" @select="table?.setSort('tph_count', -1)" />
    </div>

    <MdBarChart
      v-if="rows.length"
      title="Jumlah petak per blok"
      :subtitle="`${fmt(totalPetak)} petak di ${rows.length} blok`"
      :legend="[{ label: 'Ada TM', color: 'var(--success)' }, { label: 'TBM', color: '#f59e0b' }]"
      :bars="bars"
      :selected="filterBlok"
      @toggle="toggleBlok" />

    <MdDataTable
      ref="table"
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      entity-label="Blok"
      empty-icon="grid"
      empty-text="Tambahkan blok pertama, lalu isi petaknya di Nomor Petak."
      add-label="Tambah Blok"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar blok"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari nomor blok atau catatan…" aria-label="Cari blok" />
        </label>
        <MdDropdown v-model="filterStatus" label="Status" :options="statusFilterOptions" multiple />
        <MdDropdown v-model="filterPetak" label="Petak" :options="petakFilterOptions" />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="`Hapus filter ${c.label}`" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">Bersihkan semua</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ row.name }}</span>
          <div><b>Blok {{ row.name }}</b><small>{{ row.block_count || 0 }} petak</small></div>
        </div>
      </template>
      <template #cell-block_count="{ row }"><span class="md-num">{{ row.block_count || 0 }}</span></template>
      <template #cell-tph_count="{ row }"><span class="md-num">{{ row.tph_count || 0 }}</span></template>
      <template #cell-tree_count="{ row }"><MdBarCell :value="row.tree_count" :max="maxTrees" /></template>
      <template #cell-tree_harvest_count="{ row }"><span class="md-num">{{ fmt(row.tree_harvest_count) }}</span></template>
      <template #cell-has_tm="{ row }">
        <MdBadge :tone="row.has_tm ? 'success' : 'warning'">{{ row.has_tm ? 'Ada TM' : 'TBM' }}</MdBadge>
      </template>
      <template #cell-notes="{ row }">
        <span class="md-muted" :title="row.notes || undefined" style="display: inline-block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom">{{ row.notes || '—' }}</span>
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by || row.created_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah blok ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus blok ${row.name}`" :disabled="row.block_count > 0" :title="row.block_count > 0 ? 'Masih berisi petak' : undefined" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ row.name }}</span>
          <div style="flex: 1"><b class="md-strong">Blok {{ row.name }}</b><div class="md-muted" style="font-size: 12px">Diubah oleh {{ userName(row.updated_by || row.created_by) }}</div></div>
          <MdBadge :tone="row.has_tm ? 'success' : 'warning'">{{ row.has_tm ? 'Ada TM' : 'TBM' }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Petak<b>{{ row.block_count || 0 }}</b></div>
          <div>TPH<b>{{ row.tph_count || 0 }}</b></div>
          <div>Pohon perawatan<b>{{ fmt(row.tree_count) }}</b></div>
          <div>Pohon panen<b>{{ fmt(row.tree_harvest_count) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <BlockForm :visible="showForm" :block="editing" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" title="Hapus blok?" :busy="submitting" :blocked="(deleting?.block_count || 0) > 0" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        <b>Blok {{ deleting.name }}</b> akan dihapus permanen. Tidak bisa dibatalkan.
        <template v-if="deleting.block_count > 0"> Blok ini masih berisi <b>{{ deleting.block_count }} petak</b>; pindahkan atau hapus petaknya dulu.</template>
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import BlockForm from './BlockForm.vue'
import { listBlocks, createBlock, updateBlock, deleteBlock } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdBarCell, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const columns = [
  { key: 'name', label: 'Blok' },
  { key: 'block_count', label: 'Petak', sortValue: (r) => r.block_count || 0 },
  { key: 'tph_count', label: 'TPH', sortValue: (r) => r.tph_count || 0 },
  { key: 'tree_count', label: 'Pohon perawatan', sortValue: (r) => r.tree_count || 0 },
  { key: 'tree_harvest_count', label: 'Pohon panen', sortValue: (r) => r.tree_harvest_count || 0 },
  { key: 'has_tm', label: 'Status', sortValue: (r) => (r.has_tm ? 1 : 0) },
  { key: 'notes', label: 'Catatan', sortable: false },
  { key: 'updated_by', label: 'Diubah oleh', sortable: false }
]

const table = ref(null)
const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)
const search = ref('')
const filterStatus = ref([])
const filterPetak = ref(null)
const filterBlok = ref([])
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('id-ID'))
const statusKey = (r) => (r.has_tm ? 'tm' : 'tbm')
const countStatus = (s) => rows.value.filter((r) => statusKey(r) === s).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'id', { numeric: true })

const totalPetak = computed(() => rows.value.reduce((s, r) => s + (r.block_count || 0), 0))
const totalTph = computed(() => rows.value.reduce((s, r) => s + (r.tph_count || 0), 0))
const totalHarvest = computed(() => rows.value.reduce((s, r) => s + (r.tree_harvest_count || 0), 0))
const countEmpty = computed(() => rows.value.filter((r) => !r.block_count).length)
const maxTrees = computed(() => Math.max(1, ...rows.value.map((r) => r.tree_count || 0)))

const statusFilterOptions = computed(() => [
  { value: 'tm', label: 'Ada TM', count: countStatus('tm') },
  { value: 'tbm', label: 'TBM', count: countStatus('tbm') }
])
const petakFilterOptions = computed(() => [
  { value: 'has', label: 'Berisi petak', count: rows.value.length - countEmpty.value },
  { value: 'empty', label: 'Tanpa petak', count: countEmpty.value }
])

const bars = computed(() =>
  rows.value.slice().sort(byName).map((r) => ({
    key: r.name,
    label: r.name,
    ariaLabel: `Blok ${r.name}: ${r.block_count || 0} petak, ${r.has_tm ? 'ada TM' : 'TBM'}`,
    segments: [{ value: r.block_count || 0, color: r.has_tm ? 'var(--success)' : '#f59e0b' }]
  }))
)

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || `${r.name} ${r.notes || ''}`.toLowerCase().includes(q)) &&
    (!filterStatus.value.length || filterStatus.value.includes(statusKey(r))) &&
    (!filterBlok.value.length || filterBlok.value.includes(r.name)) &&
    (!filterPetak.value || (filterPetak.value === 'has' ? r.block_count > 0 : !r.block_count))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterStatus.value.forEach((s) => c.push({ key: `s-${s}`, label: s === 'tm' ? 'Ada TM' : 'TBM', remove: () => (filterStatus.value = filterStatus.value.filter((x) => x !== s)) }))
  filterBlok.value.forEach((b) => c.push({ key: `b-${b}`, label: `Blok ${b}`, remove: () => (filterBlok.value = filterBlok.value.filter((x) => x !== b)) }))
  if (filterPetak.value) c.push({ key: 'p', label: filterPetak.value === 'has' ? 'Berisi petak' : 'Tanpa petak', remove: () => (filterPetak.value = null) })
  return c
})

function clearAll() {
  search.value = ''
  filterStatus.value = []
  filterBlok.value = []
  filterPetak.value = null
}
const onlyStatus = (s) => filterStatus.value.length === 1 && filterStatus.value[0] === s
function quickStatus(s) {
  filterStatus.value = onlyStatus(s) ? [] : [s]
}
function toggleBlok(b) {
  filterBlok.value = filterBlok.value.includes(b) ? filterBlok.value.filter((x) => x !== b) : [...filterBlok.value, b]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listBlocks()
  } catch (err) {
    console.error('[Blocks] Failed to load:', err)
    fetchError.value = err?.message || 'Gagal memuat blok.'
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
      showToast('Blok berhasil diubah.')
    } else {
      await createBlock(payload)
      showToast('Blok berhasil ditambahkan.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[Blocks] Save failed:', err)
    actionError.value = friendly(err, 'Gagal menyimpan blok.')
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
    await deleteBlock(deleting.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleting.value.id)
    deleting.value = null
    showToast('Blok berhasil dihapus.')
  } catch (err) {
    console.error('[Blocks] Delete failed:', err)
    deleteError.value = friendly(err, 'Gagal menghapus blok.')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
