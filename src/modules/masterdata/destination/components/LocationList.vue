<template>
  <MdPage title="Tujuan" description="Lokasi tujuan pengiriman hasil kebun beserta tipe dan koordinatnya. Klik kartu atau batang grafik untuk menyaring tabel.">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Tujuan</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="truck" tone="info" label="Total tujuan" :value="rows.length" :sub="`${typeKeys.length} tipe`" action hint="Tampilkan semua" :pressed="false" @select="clearAll" />
      <MdKpi icon="pin" tone="success" label="Berkoordinat" :value="countCoord('yes')" :sub="`${pct(countCoord('yes'))}% dari tujuan`" action :pressed="onlyCoord('yes')" @select="quickCoord('yes')" />
      <MdKpi icon="alert" tone="warning" label="Tanpa koordinat" :value="countCoord('no')" sub="Lengkapi latitude & longitude" action :pressed="onlyCoord('no')" @select="quickCoord('no')" />
      <MdKpi icon="layers" tone="brand" label="Tipe terbanyak" :value="topType ? topType.label : '—'" :sub="topType ? `${topType.count} tujuan` : 'Belum ada data'" action :pressed="!!topType && filterType.length === 1 && filterType[0] === topType.key" @select="topType && toggleType(topType.key)" />
    </div>

    <MdBarChart
      v-if="typeKeys.length"
      title="Jumlah tujuan per tipe"
      :subtitle="`${rows.length} tujuan di ${typeKeys.length} tipe`"
      :legend="[{ label: 'Berkoordinat', color: 'var(--success)' }, { label: 'Tanpa koordinat', color: 'var(--border-strong)' }]"
      :bars="bars"
      :selected="filterType"
      @toggle="toggleType" />

    <MdDataTable
      ref="table"
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      entity-label="Tujuan"
      empty-icon="truck"
      empty-text="Tambahkan tujuan pertama agar bisa dipakai saat pengiriman hasil panen."
      add-label="Tambah Tujuan"
      :can-add="canWrite"
      initial-sort="name"
      aria-label="Daftar tujuan"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" placeholder="Cari nama, tujuan, atau catatan…" aria-label="Cari tujuan" />
        </label>
        <MdDropdown v-model="filterType" label="Tipe" :options="typeFilterOptions" multiple />
        <MdDropdown v-model="filterCoord" label="Koordinat" :options="coordFilterOptions" multiple />
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
          <div><b>{{ row.name }}</b><small>{{ row.location || 'Tanpa keterangan tujuan' }}</small></div>
        </div>
      </template>
      <template #cell-type="{ row }">
        <MdBadge :tone="typeKey(row) === '-' ? 'neutral' : 'info'">{{ typeLabel(typeKey(row)) }}</MdBadge>
      </template>
      <template #cell-latitude="{ row }">
        <span v-if="row.latitude" class="md-num">{{ row.latitude }}</span><span v-else class="md-muted">—</span>
      </template>
      <template #cell-longitude="{ row }">
        <span v-if="row.longitude" class="md-num">{{ row.longitude }}</span><span v-else class="md-muted">—</span>
      </template>
      <template #cell-notes="{ row }">
        <span :class="{ 'md-muted': !row.notes }">{{ row.notes || '—' }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="`Ubah tujuan ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus tujuan ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.location || 'Tanpa keterangan tujuan' }}</div></div>
          <MdBadge :tone="typeKey(row) === '-' ? 'neutral' : 'info'">{{ typeLabel(typeKey(row)) }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Latitude<b>{{ row.latitude || '—' }}</b></div>
          <div>Longitude<b>{{ row.longitude || '—' }}</b></div>
          <div style="grid-column: 1 / -1">Catatan<b>{{ row.notes || '—' }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <LocationForm :visible="showForm" :location="editingLocation" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deletingLocation" title="Hapus tujuan?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deletingLocation">Tujuan <b>{{ deletingLocation.name }}</b> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LocationForm from './LocationForm.vue'
import { listLocations, createLocation, updateLocation, deleteLocation, listTypeOfLocations } from '../model'
import { useToast } from '../../../../utils/toast'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const table = ref(null)
const rows = ref([])
const types = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)
const search = ref('')
const filterType = ref([])
const filterCoord = ref([])
const showForm = ref(false)
const editingLocation = ref(null)
const deletingLocation = ref(null)

const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })
const initial = (n) => String(n || '#').trim().charAt(0).toUpperCase() || '#'
const hasCoord = (r) => Boolean(r.latitude && r.longitude)
const coordKey = (r) => (hasCoord(r) ? 'yes' : 'no')

// Tipe tujuan: dari relasi bila ada, kalau tidak dari tol_id + daftar tipe.
function typeKey(r) {
  const id = r.tol_id ?? r.location_type?.id
  if (id != null && id !== '') return String(id)
  if (r.type_of_location) return `n:${r.type_of_location}`
  return '-'
}
function typeLabel(key) {
  if (key === '-') return 'Tanpa tipe'
  if (key.startsWith('n:')) return key.slice(2)
  const t = types.value.find((x) => String(x.id) === key)
  if (t) return t.name
  const r = rows.value.find((x) => typeKey(x) === key)
  return r?.location_type?.name || r?.type_of_location || `Tipe ${key}`
}

const columns = [
  { key: 'name', label: 'Nama' },
  { key: 'type', label: 'Tipe', sortValue: (r) => (typeKey(r) === '-' ? '' : typeLabel(typeKey(r))) },
  { key: 'latitude', label: 'Latitude', sortValue: (r) => (r.latitude ? Number(r.latitude) : null) },
  { key: 'longitude', label: 'Longitude', sortValue: (r) => (r.longitude ? Number(r.longitude) : null) },
  { key: 'notes', label: 'Catatan' }
]

const countCoord = (k) => rows.value.filter((r) => coordKey(r) === k).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)

const typeKeys = computed(() => [...new Set(rows.value.map(typeKey))].sort((a, b) => byName(typeLabel(a), typeLabel(b))))
const typeFilterOptions = computed(() =>
  typeKeys.value.map((k) => ({ value: k, label: typeLabel(k), count: rows.value.filter((r) => typeKey(r) === k).length }))
)
const coordFilterOptions = computed(() => [
  { value: 'yes', label: 'Berkoordinat', count: countCoord('yes') },
  { value: 'no', label: 'Tanpa koordinat', count: countCoord('no') }
])
const topType = computed(() => {
  const best = typeFilterOptions.value.filter((o) => o.value !== '-').sort((a, b) => b.count - a.count)[0]
  return best ? { key: best.value, label: best.label, count: best.count } : null
})

const bars = computed(() =>
  typeKeys.value.map((k) => {
    const rs = rows.value.filter((r) => typeKey(r) === k)
    const yes = rs.filter(hasCoord).length
    return {
      key: k,
      label: typeLabel(k),
      ariaLabel: `${typeLabel(k)}: ${rs.length} tujuan, ${yes} berkoordinat`,
      segments: [
        { value: yes, color: 'var(--success)' },
        { value: rs.length - yes, color: 'var(--border-strong)' }
      ]
    }
  })
)

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || `${r.name || ''} ${r.location || ''} ${r.notes || ''}`.toLowerCase().includes(q)) &&
    (!filterType.value.length || filterType.value.includes(typeKey(r))) &&
    (!filterCoord.value.length || filterCoord.value.includes(coordKey(r)))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterType.value.forEach((k) => c.push({ key: `t-${k}`, label: typeLabel(k), remove: () => (filterType.value = filterType.value.filter((x) => x !== k)) }))
  filterCoord.value.forEach((k) => c.push({ key: `c-${k}`, label: k === 'yes' ? 'Berkoordinat' : 'Tanpa koordinat', remove: () => (filterCoord.value = filterCoord.value.filter((x) => x !== k)) }))
  return c
})

function clearAll() {
  search.value = ''
  filterType.value = []
  filterCoord.value = []
}
const onlyCoord = (k) => filterCoord.value.length === 1 && filterCoord.value[0] === k
function quickCoord(k) {
  filterCoord.value = onlyCoord(k) ? [] : [k]
}
function toggleType(k) {
  filterType.value = filterType.value.includes(k) ? filterType.value.filter((x) => x !== k) : [...filterType.value, k]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listLocations()
  } catch (err) {
    console.error('[Destination] Failed to load:', err)
    fetchError.value = err?.message || 'Gagal memuat tujuan.'
  } finally {
    loading.value = false
  }
  // Nama tipe untuk filter/grafik; gagal di sini tidak menghalangi daftar.
  try {
    types.value = await listTypeOfLocations()
  } catch (err) {
    console.warn('[Destination] Failed to load type_of_location:', err)
  }
}

function openCreate() {
  editingLocation.value = null
  actionError.value = null
  showForm.value = true
}
function openEdit(location) {
  editingLocation.value = { ...location }
  actionError.value = null
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  editingLocation.value = null
}

async function onFormSubmit(formData) {
  submitting.value = true
  actionError.value = null
  try {
    if (editingLocation.value?.id) {
      const updated = await updateLocation(editingLocation.value.id, formData)
      const idx = rows.value.findIndex((r) => r.id === editingLocation.value.id)
      if (idx !== -1) rows.value[idx] = updated || { ...rows.value[idx], ...formData }
      showToast('Tujuan berhasil diubah.')
    } else {
      const created = await createLocation(formData)
      if (created) rows.value.unshift(created)
      showToast('Tujuan berhasil ditambahkan.')
    }
    closeForm()
  } catch (err) {
    console.error('[Destination] Save failed:', err)
    actionError.value = err?.message || 'Gagal menyimpan data.'
  } finally {
    submitting.value = false
  }
}

function confirmDelete(location) {
  deletingLocation.value = location
  deleteError.value = ''
}
function closeDelete() {
  deletingLocation.value = null
  deleteError.value = ''
}
async function onDeleteConfirm() {
  if (!deletingLocation.value) return
  submitting.value = true
  deleteError.value = ''
  try {
    await deleteLocation(deletingLocation.value.id)
    rows.value = rows.value.filter((r) => r.id !== deletingLocation.value.id)
    deletingLocation.value = null
    showToast('Tujuan berhasil dihapus.')
  } catch (err) {
    console.error('[Destination] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? 'Tujuan masih dipakai data lain, jadi tidak bisa dihapus.'
      : err?.message || 'Gagal menghapus tujuan.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
