<template>
  <MdPage title="TPH" description="Tempat pengumpulan hasil per petak: jenis, sisi, nomor jalur dan jumlah pohon. Klik kartu atau batang grafik untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah TPH</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="pin" tone="info" label="Total TPH" :value="rows.length" :sub="`${countActive} aktif · ${rows.length - countActive} nonaktif`" action hint="Tampilkan semua" @select="clearAll" />
      <MdKpi icon="leaf" tone="success" label="TPH panen" :value="countType('PANEN')" :sub="`${countType('PERAWATAN')} TPH perawatan`" action :pressed="filterType === 'PANEN'" @select="quickType('PANEN')" />
      <MdKpi icon="alert" tone="warning" label="Pohon belum diisi" :value="countMissing" :sub="`${pct(countMissing)}% dari TPH`" action :pressed="onlyMissingTrees" @select="onlyMissingTrees = !onlyMissingTrees" />
      <MdKpi icon="tree" tone="brand" label="Total pohon" :value="fmt(totalTreesAll)" :sub="`${fmt(totalTrees)} pada hasil saringan`" action hint="Urutkan" @select="table?.setSort('tree_count', -1)" />
    </div>

    <MdBarChart
      v-if="rows.length"
      title="Jumlah TPH per blok"
      :subtitle="`${rows.length} TPH di ${blokOptions.length} blok`"
      :legend="[{ label: 'Panen', color: 'var(--success)' }, { label: 'Perawatan', color: '#0ea5e9' }]"
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
      entity-label="TPH"
      empty-icon="pin"
      empty-text="Tambahkan TPH pertama agar bisa dipakai di sensus dan penugasan."
      add-label="Tambah TPH"
      :can-add="canWrite"
      initial-sort="code"
      aria-label="Daftar TPH"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari kode, mis. U01…" aria-label="Cari TPH" />
        </label>
        <MdDropdown v-model="filterBlok" label="Blok" :options="blokFilterOptions" multiple @change="filterPetak = null" />
        <MdDropdown v-model="filterPetak" label="Petak" :options="petakFilterOptions" />
        <MdDropdown v-model="filterType" label="Jenis" :options="typeFilterOptions" />
        <MdDropdown v-model="filterActive" label="Status" :options="activeFilterOptions" all-text="Aktif & nonaktif" />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="`Hapus filter ${c.label}`" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">Bersihkan semua</button>
        </div>
      </template>

      <template #cell-code="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ row.side || '#' }}</span>
          <div><b>{{ row.code || row.name }}</b><small>Jalur {{ row.line_no ?? '—' }}</small></div>
        </div>
      </template>
      <template #cell-block_name="{ row }">
        <span v-if="row.block_name">{{ row.block_name }}</span><span v-else class="md-muted">Tanpa petak</span>
      </template>
      <template #cell-block_group="{ row }">
        <span v-if="row.block_group">Blok {{ row.block_group }}</span><span v-else class="md-muted">—</span>
      </template>
      <template #cell-tph_type="{ row }">
        <MdBadge :tone="typeTone(row.tph_type)">{{ typeLabel(row.tph_type) }}</MdBadge>
      </template>
      <template #cell-line_no="{ row }"><span class="md-num">{{ row.line_no ?? '—' }}</span></template>
      <template #cell-tree_count="{ row }">
        <MdBadge v-if="row.tree_count == null" tone="warning">Belum diisi</MdBadge>
        <MdBarCell v-else :value="row.tree_count" :max="maxTrees" />
      </template>
      <template #cell-is_active="{ row }">
        <MdBadge :tone="row.is_active ? 'success' : 'neutral'">{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</MdBadge>
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by || row.created_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah TPH ${row.code || row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus TPH ${row.code || row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top" :style="row.is_active ? undefined : 'opacity: .6'">
          <span class="md-avatar">{{ row.side || '#' }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.code || row.name }} · {{ row.block_name || 'Tanpa petak' }}</b><div class="md-muted" style="font-size: 12px">{{ row.block_group ? `Blok ${row.block_group}` : '—' }}</div></div>
          <MdBadge :tone="typeTone(row.tph_type)">{{ typeLabel(row.tph_type) }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Pohon<b>{{ row.tree_count == null ? 'Belum diisi' : fmt(row.tree_count) }}</b></div>
          <div>Status<b>{{ row.is_active ? 'Aktif' : 'Nonaktif' }}</b></div>
          <div>Jalur<b>{{ row.line_no ?? '—' }}</b></div>
          <div>Diubah oleh<b>{{ userName(row.updated_by || row.created_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <TphForm :visible="showForm" :tph="editing" :default-petak-id="defaultPetakId" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" title="Hapus TPH?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        TPH <b>{{ deleting.code || deleting.name }}</b> di {{ deleting.block_name || 'tanpa petak' }} akan dihapus permanen.
        TPH yang sudah dipakai sensus atau penugasan tidak bisa dihapus; nonaktifkan lewat Ubah.
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import TphForm from './TphForm.vue'
import { listTph, createTph, updateTph, deleteTph } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdBarCell, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const columns = [
  { key: 'code', label: 'Kode', sortValue: (r) => r.code || r.name || '' },
  { key: 'block_name', label: 'Petak' },
  { key: 'block_group', label: 'Blok' },
  { key: 'tph_type', label: 'Jenis' },
  { key: 'side', label: 'Sisi' },
  { key: 'line_no', label: 'Jalur' },
  { key: 'tree_count', label: 'Pohon' },
  { key: 'is_active', label: 'Status', sortValue: (r) => (r.is_active ? 1 : 0) },
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
const filterBlok = ref([])
const filterPetak = ref(null) // id petak (angka) | 'none' | null
const filterType = ref(null)
const filterActive = ref(null)
const onlyMissingTrees = ref(false)
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('id-ID'))
const typeLabel = (t) => (t === 'PANEN' ? 'Panen' : t === 'PERAWATAN' ? 'Perawatan' : '—')
const typeTone = (t) => (t === 'PANEN' ? 'success' : t === 'PERAWATAN' ? 'info' : 'neutral')
const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })
const countType = (t) => rows.value.filter((r) => r.tph_type === t).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)

const countActive = computed(() => rows.value.filter((r) => r.is_active).length)
const countMissing = computed(() => rows.value.filter((r) => r.tree_count == null).length)
const totalTreesAll = computed(() => rows.value.reduce((s, r) => s + (r.tree_count || 0), 0))
const maxTrees = computed(() => Math.max(1, ...rows.value.map((r) => r.tree_count || 0)))

const blokOptions = computed(() => [...new Set(rows.value.map((r) => r.block_group).filter(Boolean))].sort(byName))
const blokFilterOptions = computed(() =>
  blokOptions.value.map((b) => ({ value: b, label: `Blok ${b}`, count: rows.value.filter((r) => r.block_group === b).length }))
)
const petakFilterOptions = computed(() => {
  const seen = new Map()
  for (const r of rows.value) {
    if (!r.id_block || (filterBlok.value.length && !filterBlok.value.includes(r.block_group))) continue
    const cur = seen.get(r.id_block) || { name: r.block_name, count: 0 }
    cur.count++
    seen.set(r.id_block, cur)
  }
  const opts = [...seen].map(([id, v]) => ({ value: id, label: v.name, count: v.count })).sort((a, b) => byName(a.label, b.label))
  opts.push({ value: 'none', label: 'Tanpa petak', count: rows.value.filter((r) => !r.id_block).length })
  return opts
})
const typeFilterOptions = computed(() => [
  { value: 'PERAWATAN', label: 'Perawatan', count: countType('PERAWATAN') },
  { value: 'PANEN', label: 'Panen', count: countType('PANEN') }
])
const activeFilterOptions = computed(() => [
  { value: '1', label: 'Aktif', count: countActive.value },
  { value: '0', label: 'Nonaktif', count: rows.value.length - countActive.value }
])

const defaultPetakId = computed(() => (filterPetak.value != null && filterPetak.value !== 'none' ? Number(filterPetak.value) : null))

const bars = computed(() =>
  blokOptions.value.map((b) => {
    const rs = rows.value.filter((r) => r.block_group === b)
    const panen = rs.filter((r) => r.tph_type === 'PANEN').length
    return {
      key: b,
      label: b,
      ariaLabel: `Blok ${b}: ${rs.length} TPH, ${panen} panen, ${rs.length - panen} perawatan`,
      segments: [
        { value: panen, color: 'var(--success)' },
        { value: rs.length - panen, color: '#0ea5e9' }
      ]
    }
  })
)

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) => {
    if (q && !String(r.code || r.name || '').toLowerCase().includes(q)) return false
    if (filterBlok.value.length && !filterBlok.value.includes(r.block_group)) return false
    if (filterPetak.value === 'none' && r.id_block) return false
    if (filterPetak.value != null && filterPetak.value !== 'none' && String(r.id_block) !== String(filterPetak.value)) return false
    if (filterType.value && r.tph_type !== filterType.value) return false
    if (filterActive.value && String(Number(!!r.is_active)) !== filterActive.value) return false
    if (onlyMissingTrees.value && r.tree_count != null) return false
    return true
  })
})

const totalTrees = computed(() => filteredRows.value.reduce((s, r) => s + (r.tree_count || 0), 0))

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterBlok.value.forEach((b) => c.push({ key: `b-${b}`, label: `Blok ${b}`, remove: () => { filterBlok.value = filterBlok.value.filter((x) => x !== b); filterPetak.value = null } }))
  if (filterPetak.value != null) {
    const label = petakFilterOptions.value.find((o) => String(o.value) === String(filterPetak.value))?.label || 'Petak'
    c.push({ key: 'p', label: filterPetak.value === 'none' ? 'Tanpa petak' : `Petak ${label}`, remove: () => (filterPetak.value = null) })
  }
  if (filterType.value) c.push({ key: 't', label: typeLabel(filterType.value), remove: () => (filterType.value = null) })
  if (filterActive.value) c.push({ key: 'a', label: filterActive.value === '1' ? 'Aktif' : 'Nonaktif', remove: () => (filterActive.value = null) })
  if (onlyMissingTrees.value) c.push({ key: 'm', label: 'Jumlah pohon kosong', remove: () => (onlyMissingTrees.value = false) })
  return c
})

function clearAll() {
  search.value = ''
  filterBlok.value = []
  filterPetak.value = null
  filterType.value = null
  filterActive.value = null
  onlyMissingTrees.value = false
}
function quickType(t) {
  filterType.value = filterType.value === t ? null : t
}
function toggleBlok(b) {
  filterBlok.value = filterBlok.value.includes(b) ? filterBlok.value.filter((x) => x !== b) : [...filterBlok.value, b]
  filterPetak.value = null
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listTph()
  } catch (err) {
    console.error('[TPH] Failed to load:', err)
    fetchError.value = err?.message || 'Gagal memuat TPH.'
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
  if (/dipakai|nonaktifkan/i.test(m)) return 'TPH sudah dipakai sensus atau penugasan. Nonaktifkan lewat Ubah (matikan Aktif).'
  return m || fallback
}

async function onFormSubmit(payload) {
  submitting.value = true
  actionError.value = null
  try {
    if (editing.value?.id) {
      await updateTph(editing.value.id, payload)
      showToast('TPH berhasil diubah.')
    } else {
      await createTph(payload)
      showToast('TPH berhasil ditambahkan.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TPH] Save failed:', err)
    actionError.value = friendly(err, 'Gagal menyimpan TPH.')
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
    await deleteTph(deleting.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleting.value.id)
    deleting.value = null
    showToast('TPH berhasil dihapus.')
  } catch (err) {
    console.error('[TPH] Delete failed:', err)
    deleteError.value = friendly(err, 'Gagal menghapus TPH.')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
