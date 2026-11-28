<template>
  <MdPage :title="t('destination.title')" :description="t('destination.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('destination.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="truck" tone="info" :label="t('destination.kpi.total')" :value="rows.length" :sub="t('destination.kpi.totalSub', { n: typeKeys.length })" action :hint="t('destination.ui.showAll')" :pressed="false" @select="clearAll" />
      <MdKpi icon="pin" tone="success" :label="t('destination.hasCoord')" :value="countCoord('yes')" :sub="t('destination.kpi.pctSub', { n: pct(countCoord('yes')) })" action :pressed="onlyCoord('yes')" @select="quickCoord('yes')" />
      <MdKpi icon="alert" tone="warning" :label="t('destination.noCoord')" :value="countCoord('no')" :sub="t('destination.kpi.noCoordSub')" action :pressed="onlyCoord('no')" @select="quickCoord('no')" />
      <MdKpi icon="layers" tone="brand" :label="t('destination.kpi.top')" :value="topType ? topType.label : '—'" :sub="topType ? t('destination.kpi.topSub', { n: topType.count }) : t('destination.kpi.noData')" action :pressed="!!topType && filterType.length === 1 && filterType[0] === topType.key" @select="topType && toggleType(topType.key)" />
    </div>

    <MdBarChart
      v-if="typeKeys.length"
      :title="t('destination.chart.title')"
      :subtitle="t('destination.chart.subtitle', { n: rows.length, t: typeKeys.length })"
      :legend="[{ label: t('destination.hasCoord'), color: 'var(--success)' }, { label: t('destination.noCoord'), color: 'var(--border-strong)' }]"
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
      :entity-label="t('destination.entity')"
      empty-icon="truck"
      :empty-text="t('destination.empty')"
      :add-label="t('destination.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('destination.aria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('destination.searchPlaceholder')" :aria-label="t('destination.searchAria')" />
        </label>
        <MdDropdown v-model="filterType" :label="t('destination.type')" :options="typeFilterOptions" multiple />
        <MdDropdown v-model="filterCoord" :label="t('destination.coord')" :options="coordFilterOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('destination.ui.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('destination.ui.clearAll') }}</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div><b>{{ row.name }}</b><small>{{ row.location || t('destination.noLocation') }}</small></div>
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
        <button type="button" class="md-icon-btn" :aria-label="t('destination.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('destination.deleteAria', { name: row.name })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.location || t('destination.noLocation') }}</div></div>
          <MdBadge :tone="typeKey(row) === '-' ? 'neutral' : 'info'">{{ typeLabel(typeKey(row)) }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>Latitude<b>{{ row.latitude || '—' }}</b></div>
          <div>Longitude<b>{{ row.longitude || '—' }}</b></div>
          <div style="grid-column: 1 / -1">{{ t('destination.ui.notes') }}<b>{{ row.notes || '—' }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <LocationForm :visible="showForm" :location="editingLocation" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deletingLocation" :title="t('destination.confirm.title')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deletingLocation">
        <i18n-t keypath="destination.confirm.body" scope="global">
          <template #name><b>{{ deletingLocation.name }}</b></template>
        </i18n-t>
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { isStillReferenced } from '../../../../api/apiError'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import LocationForm from './LocationForm.vue'
import { listLocations, createLocation, updateLocation, deleteLocation, listTypeOfLocations } from '../model'
import { useToast } from '../../../../utils/toast'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { t } = useI18n()
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
  if (key === '-') return t('destination.noType')
  if (key.startsWith('n:')) return key.slice(2)
  const t = types.value.find((x) => String(x.id) === key)
  if (t) return t.name
  const r = rows.value.find((x) => typeKey(x) === key)
  return r?.location_type?.name || r?.type_of_location || t('destination.typeN', { key })
}

const columns = computed(() => [
  { key: 'name', label: t('destination.ui.name') },
  { key: 'type', label: t('destination.type'), sortValue: (r) => (typeKey(r) === '-' ? '' : typeLabel(typeKey(r))) },
  { key: 'latitude', label: 'Latitude', sortValue: (r) => (r.latitude ? Number(r.latitude) : null) },
  { key: 'longitude', label: 'Longitude', sortValue: (r) => (r.longitude ? Number(r.longitude) : null) },
  { key: 'notes', label: t('destination.ui.notes') }
])

const countCoord = (k) => rows.value.filter((r) => coordKey(r) === k).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)

const typeKeys = computed(() => [...new Set(rows.value.map(typeKey))].sort((a, b) => byName(typeLabel(a), typeLabel(b))))
const typeFilterOptions = computed(() =>
  typeKeys.value.map((k) => ({ value: k, label: typeLabel(k), count: rows.value.filter((r) => typeKey(r) === k).length }))
)
const coordFilterOptions = computed(() => [
  { value: 'yes', label: t('destination.hasCoord'), count: countCoord('yes') },
  { value: 'no', label: t('destination.noCoord'), count: countCoord('no') }
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
      ariaLabel: t('destination.chart.barAria', { label: typeLabel(k), n: rs.length, c: yes }),
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
  filterCoord.value.forEach((k) => c.push({ key: `c-${k}`, label: k === 'yes' ? t('destination.hasCoord') : t('destination.noCoord'), remove: () => (filterCoord.value = filterCoord.value.filter((x) => x !== k)) }))
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
    fetchError.value = err?.message || t('destination.error.load')
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
      showToast(t('destination.toast.updated'))
    } else {
      const created = await createLocation(formData)
      if (created) rows.value.unshift(created)
      showToast(t('destination.toast.created'))
    }
    closeForm()
  } catch (err) {
    console.error('[Destination] Save failed:', err)
    actionError.value = err?.message || t('destination.ui.saveFailed')
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
    showToast(t('destination.toast.deleted'))
  } catch (err) {
    console.error('[Destination] Delete failed:', err)
    deleteError.value = isStillReferenced(err)
      ? t('destination.error.inUse')
      : err?.message || t('destination.error.delete')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
