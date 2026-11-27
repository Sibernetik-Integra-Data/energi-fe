<template>
  <MdPage title="Nomor Petak" description="Ringkasan petak per blok, status tanam, dan jumlah pohon. Klik kartu atau batang grafik untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Petak</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="map" tone="info" label="Total petak" :value="rows.length" :sub="`${blokOptions.length} blok`" action hint="Tampilkan semua" :pressed="false" @select="clearStatus" />
      <MdKpi icon="leaf" tone="success" label="Menghasilkan (TM)" :value="count('TM')" :sub="`${pct(count('TM'))}% dari petak`" action :pressed="onlyStatus('TM')" @select="quickStatus('TM')" />
      <MdKpi icon="tree" tone="warning" label="Belum menghasilkan (TBM)" :value="count('TBM')" :sub="`${count('-')} belum diisi`" action :pressed="onlyStatus('TBM')" @select="quickStatus('TBM')" />
      <MdKpi icon="pin" tone="brand" label="TPH · pohon" :value="fmt(totalTph)" :sub="`${fmt(totalTrees)} pohon tercatat`" action hint="Urutkan" @select="table?.setSort('tph', -1)" />
    </div>

    <MdBarChart
      title="Jumlah petak per blok"
      :subtitle="`${rows.length} petak di ${blokOptions.length} blok`"
      :legend="[{ label: 'TM', color: 'var(--success)' }, { label: 'TBM', color: '#f59e0b' }, { label: 'Belum diisi', color: 'var(--border-strong)' }]"
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
      entity-label="Petak"
      empty-icon="map"
      empty-text="Tambahkan petak pertama agar bisa dipakai di sensus dan perencanaan kerja."
      add-label="Tambah Petak"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar petak"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari nomor petak atau blok…" aria-label="Cari petak" />
        </label>
        <MdDropdown v-model="filterBlok" label="Blok" :options="blokFilterOptions" multiple />
        <MdDropdown v-model="filterStatus" label="Status" :options="statusFilterOptions" multiple />
        <MdDropdown label="Tahun tanam" :active="!!(yearFrom || yearTo)" :summary-text="yearSummary">
          <div style="padding: 8px 10px 6px; display: flex; gap: 8px">
            <MdField label="Dari" for-id="petak-y0">
              <input id="petak-y0" v-model.trim="yearFrom" class="md-input" inputmode="numeric" placeholder="2010" style="width: 96px" />
            </MdField>
            <MdField label="Sampai" for-id="petak-y1">
              <input id="petak-y1" v-model.trim="yearTo" class="md-input" inputmode="numeric" :placeholder="String(thisYear)" style="width: 96px" />
            </MdField>
          </div>
          <div class="md-menu__sep" />
          <button type="button" class="md-opt" @click="yearFrom = yearTo = ''">Bersihkan rentang</button>
        </MdDropdown>
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="`Hapus filter ${c.label}`" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">Bersihkan semua</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ suffix(row.name) }}</span>
          <div><b>{{ row.name }}</b><small>{{ row.block_group ? `Blok ${row.block_group}` : 'Tanpa blok' }}</small></div>
        </div>
      </template>
      <template #cell-planting_status="{ row }">
        <MdBadge :tone="statusTone(row.planting_status)" :title="isAutoTm(row) ? 'Otomatis TM: ada TPH panen aktif' : undefined">
          {{ statusLabel(row) }}
        </MdBadge>
      </template>
      <template #cell-planting_year="{ row }">
        <template v-if="row.planting_year"><span class="md-num">{{ row.planting_year }}</span> <span class="md-muted">· {{ thisYear - row.planting_year }} th</span></template>
        <span v-else class="md-muted">—</span>
      </template>
      <template #cell-wide="{ row }">
        <template v-if="row.wide != null"><span class="md-num">{{ fmtDec(row.wide) }}</span> ha</template>
        <span v-else class="md-muted">—</span>
      </template>
      <template #cell-tph="{ row }">
        <span class="md-num" :title="`Perawatan ${row.tph_perawatan_count || 0} · Panen ${row.tph_panen_count || 0}`">{{ tphOf(row) }}</span>
      </template>
      <template #cell-plants_count="{ row }">
        <MdBarCell :value="row.plants_count" :max="maxTrees" />
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by || row.created_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah petak ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus petak ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ suffix(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.block_group ? `Blok ${row.block_group}` : 'Tanpa blok' }}</div></div>
          <MdBadge :tone="statusTone(row.planting_status)">{{ statusLabel(row) }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Tahun tanam<b>{{ row.planting_year || '—' }}</b></div>
          <div>TPH<b>{{ tphOf(row) }}</b></div>
          <div>Luas<b>{{ row.wide != null ? `${fmtDec(row.wide)} ha` : '—' }}</b></div>
          <div>Pohon<b>{{ fmt(row.plants_count) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <PetakForm :visible="showForm" :petak="editing" :rows="rows" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" title="Hapus petak?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        Petak <b>{{ deleting.name }}</b>{{ deleting.block_group ? ` (Blok ${deleting.block_group})` : '' }} akan dihapus permanen.
        <template v-if="tphOf(deleting)"> Petak ini masih punya <b>{{ tphOf(deleting) }} TPH</b>; penghapusan akan ditolak sampai TPH-nya dihapus atau dipindahkan.</template>
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PetakForm from './PetakForm.vue'
import { listPetak, createPetak, updatePetak, deletePetak } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdBarCell, MdConfirm, MdField, MdIcon } from '../../../shared/masterdata-ui'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()
const thisYear = new Date().getFullYear()

const columns = [
  { key: 'name', label: 'Petak' },
  { key: 'planting_status', label: 'Status tanam', sortValue: (r) => r.planting_status || '' },
  { key: 'planting_year', label: 'Tahun tanam' },
  { key: 'wide', label: 'Luas', sortValue: (r) => (r.wide == null ? null : Number(r.wide)) },
  { key: 'tph', label: 'TPH', sortValue: (r) => tphOf(r) },
  { key: 'plants_count', label: 'Pohon' },
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
const filterStatus = ref([])
const yearFrom = ref('')
const yearTo = ref('')
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

const fmt = (n) => (n == null ? '—' : Number(n).toLocaleString('id-ID'))
const fmtDec = (n) => Number(n).toLocaleString('id-ID', { maximumFractionDigits: 2 })
const suffix = (name) => String(name || '').replace(/^\d+/, '') || '#'
const tphOf = (r) => (r?.tph_perawatan_count || 0) + (r?.tph_panen_count || 0)
const statusKey = (r) => r.planting_status || '-'
const isAutoTm = (r) => r.planting_status === 'TM' && r.planting_status_manual !== 'TM'
const statusTone = (s) => (s === 'TM' ? 'success' : s === 'TBM' ? 'warning' : 'neutral')
const statusLabel = (r) => (r.planting_status ? `${r.planting_status}${isAutoTm(r) ? ' · otomatis' : ''}` : 'Belum diisi')
const count = (s) => rows.value.filter((r) => statusKey(r) === s).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })

const blokOptions = computed(() => [...new Set(rows.value.map((r) => r.block_group).filter(Boolean))].sort(byName))
const blokFilterOptions = computed(() =>
  blokOptions.value.map((b) => ({ value: b, label: `Blok ${b}`, count: rows.value.filter((r) => r.block_group === b).length }))
)
const statusFilterOptions = computed(() => [
  { value: 'TM', label: 'TM · Menghasilkan', count: count('TM') },
  { value: 'TBM', label: 'TBM · Belum menghasilkan', count: count('TBM') },
  { value: '-', label: 'Belum diisi', count: count('-') }
])
const totalTph = computed(() => rows.value.reduce((s, r) => s + tphOf(r), 0))
const totalTrees = computed(() => rows.value.reduce((s, r) => s + (r.plants_count || 0), 0))
const maxTrees = computed(() => Math.max(1, ...rows.value.map((r) => r.plants_count || 0)))

const bars = computed(() =>
  blokOptions.value.map((b) => {
    const rs = rows.value.filter((r) => r.block_group === b)
    const tm = rs.filter((r) => r.planting_status === 'TM').length
    const tbm = rs.filter((r) => r.planting_status === 'TBM').length
    return {
      key: b,
      label: b,
      ariaLabel: `Blok ${b}: ${rs.length} petak, ${tm} TM, ${tbm} TBM`,
      segments: [
        { value: tm, color: 'var(--success)' },
        { value: tbm, color: '#f59e0b' },
        { value: rs.length - tm - tbm, color: 'var(--border-strong)' }
      ]
    }
  })
)

const yearSummary = computed(() => (yearFrom.value || yearTo.value ? `${yearFrom.value || '…'}–${yearTo.value || '…'}` : 'Semua'))

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  const y0 = Number(yearFrom.value) || null
  const y1 = Number(yearTo.value) || null
  return rows.value.filter((r) =>
    (!q || `${r.name} blok ${r.block_group || ''}`.toLowerCase().includes(q)) &&
    (!filterBlok.value.length || filterBlok.value.includes(r.block_group)) &&
    (!filterStatus.value.length || filterStatus.value.includes(statusKey(r))) &&
    (!y0 || (r.planting_year ?? 0) >= y0) &&
    (!y1 || (r.planting_year ?? 9999) <= y1)
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterBlok.value.forEach((b) => c.push({ key: `b-${b}`, label: `Blok ${b}`, remove: () => (filterBlok.value = filterBlok.value.filter((x) => x !== b)) }))
  filterStatus.value.forEach((s) => c.push({ key: `s-${s}`, label: s === '-' ? 'Belum diisi' : s, remove: () => (filterStatus.value = filterStatus.value.filter((x) => x !== s)) }))
  if (yearFrom.value || yearTo.value) c.push({ key: 'y', label: `Tahun ${yearSummary.value}`, remove: () => (yearFrom.value = yearTo.value = '') })
  return c
})

function clearAll() {
  search.value = ''
  filterBlok.value = []
  filterStatus.value = []
  yearFrom.value = ''
  yearTo.value = ''
}
const onlyStatus = (s) => filterStatus.value.length === 1 && filterStatus.value[0] === s
function quickStatus(s) {
  filterStatus.value = onlyStatus(s) ? [] : [s]
}
function clearStatus() {
  filterStatus.value = []
  filterBlok.value = []
}
function toggleBlok(b) {
  filterBlok.value = filterBlok.value.includes(b) ? filterBlok.value.filter((x) => x !== b) : [...filterBlok.value, b]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listPetak()
  } catch (err) {
    console.error('[Petak] Failed to load:', err)
    fetchError.value = err?.message || 'Koneksi ke server bermasalah. Periksa jaringan, lalu coba lagi.'
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
      showToast(`Petak ${payload.name} berhasil diubah.`)
    } else {
      await createPetak(payload)
      showToast(`Petak ${payload.name} berhasil ditambahkan.`)
    }
    closeForm()
    await loadData() // status & jumlah TPH dihitung server
  } catch (err) {
    console.error('[Petak] Save failed:', err)
    actionError.value = err?.message || 'Gagal menyimpan petak.'
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
    const name = deleting.value.name
    await deletePetak(deleting.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleting.value.id)
    deleting.value = null
    showToast(`Petak ${name} berhasil dihapus.`)
  } catch (err) {
    console.error('[Petak] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? 'Petak masih dipakai TPH atau data lain, jadi tidak bisa dihapus.'
      : err?.message || 'Gagal menghapus petak.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
