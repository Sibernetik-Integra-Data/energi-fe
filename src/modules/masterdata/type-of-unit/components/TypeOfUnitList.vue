<template>
  <MdPage :title="t('typeOfUnit.title')" :description="t('typeOfUnit.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('typeOfUnit.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" :label="t('typeOfUnit.kpi.total')" :value="rows.length" :sub="t('typeOfUnit.withDetailSub', { n: count('detail') })" action :hint="t('typeOfUnit.showAll')" @select="clearAll" />
      <MdKpi icon="info" tone="warning" :label="t('typeOfUnit.kpi.noDetail')" :value="count('nodetail')" :sub="t('typeOfUnit.pctOfData', { n: pct(count('nodetail')) })" action :pressed="only('nodetail')" @select="quick('nodetail')" />
      <MdKpi icon="bookmark" tone="success" :label="t('typeOfUnit.kpi.notes')" :value="count('notes')" :sub="t('typeOfUnit.pctOfData', { n: pct(count('notes')) })" action :pressed="only('notes')" @select="quick('notes')" />
      <MdKpi icon="alert" tone="brand" :label="t('typeOfUnit.kpi.unused')" :value="count('unused')" :sub="t('typeOfUnit.kpi.unusedSub')" action :pressed="only('unused')" @select="quick('unused')" />
    </div>

    <MdBarChart
      v-if="rows.length"
      :title="t('typeOfUnit.chartTitle')"
      :subtitle="t('typeOfUnit.chartSubtitle', { used: rows.length - count('unused'), n: rows.length })"
      :legend="USAGE.map((u) => ({ label: t(u.label), color: u.color }))"
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
      :entity-label="t('typeOfUnit.entity')"
      empty-icon="layers"
      :empty-text="t('typeOfUnit.empty')"
      :add-label="t('typeOfUnit.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('typeOfUnit.tableAria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('typeOfUnit.searchPlaceholder')" :aria-label="t('typeOfUnit.searchAria')" />
        </label>
        <MdDropdown v-model="filterInfo" :label="t('typeOfUnit.info.label')" :options="infoOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('typeOfUnit.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('typeOfUnit.clearAll') }}</button>
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
        <span v-if="usageTotal(row.id)" class="md-num">{{ usageTotal(row.id) }}</span><span v-else class="md-muted">{{ t('typeOfUnit.unused') }}</span>
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
        <button type="button" class="md-icon-btn" :aria-label="t('typeOfUnit.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('typeOfUnit.deleteAria', { name: row.name })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name || '-' }}</b><div class="md-muted" style="font-size: 12px">ID {{ row.id }}</div></div>
        </div>
        <div class="md-card__grid">
          <div>{{ t('typeOfUnit.col.detail') }}<b>{{ row.detail || '—' }}</b></div>
          <div>{{ t('typeOfUnit.colUsage') }}<b>{{ usageTotal(row.id) || t('typeOfUnit.unusedShort') }}</b></div>
          <div>{{ t('typeOfUnit.col.notes') }}<b>{{ row.notes || '—' }}</b></div>
          <div>{{ t('typeOfUnit.col.createdAt') }}<b>{{ fmtDate(row.created_at) }} · {{ userName(row.created_by) }}</b></div>
          <div>{{ t('typeOfUnit.col.updatedAt') }}<b>{{ fmtDate(row.updated_at) }} · {{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <TypeOfUnitForm :visible="showForm" :type-of-unit="editing" :rows="rows" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" :title="t('typeOfUnit.confirmTitle')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        {{ t('typeOfUnit.confirmBefore') }} <b>{{ deleting.name }}</b> {{ t('typeOfUnit.confirmAfter') }}
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { isDuplicate, isStillReferenced } from '../../../../api/apiError'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { currentIntlLocale } from '../../../../i18n'
import TypeOfUnitForm from './TypeOfUnitForm.vue'
import { createTypeOfUnit, deleteTypeOfUnit, listTypeOfUnit, updateTypeOfUnit } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { signedApiFetch } from '../../../../api/fetch'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { t } = useI18n()
const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const columns = computed(() => [
  { key: 'name', label: t('typeOfUnit.col.name') },
  { key: 'detail', label: t('typeOfUnit.col.detail'), sortValue: (r) => r.detail || '' },
  { key: 'usage', label: t('typeOfUnit.colUsage'), align: 'right', sortValue: (r) => usageTotal(r.id) },
  { key: 'notes', label: t('typeOfUnit.col.notes'), sortValue: (r) => r.notes || '' },
  { key: 'created_at', label: t('typeOfUnit.col.createdAt'), sortValue: (r) => r.created_at || '' },
  { key: 'updated_at', label: t('typeOfUnit.col.updatedAt'), sortValue: (r) => r.updated_at || '' }
])

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
  return isNaN(d) ? String(v) : d.toLocaleString(currentIntlLocale(), { dateStyle: 'medium', timeStyle: 'short' })
}
// Pemakaian satuan oleh data lain (unit_id). Gagal dimuat = dianggap 0, daftar tetap tampil.
const USAGE = [
  { key: 'need', label: 'typeOfUnit.usage.need', path: '/type_of_need', color: 'var(--success)' },
  { key: 'params', label: 'typeOfUnit.usage.params', path: '/fullfil_params?page=1&limit=1000', color: '#0ea5e9' },
  { key: 'payment', label: 'typeOfUnit.usage.payment', path: '/fullfil_payment?page=1&limit=1000', color: 'var(--warning)' }
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
      ariaLabel: `${r.name}: ${USAGE.map((u) => `${usageOf(u.key, r.id)} ${t(u.label).toLowerCase()}`).join(', ')}`,
      segments: USAGE.map((u) => ({ value: usageOf(u.key, r.id), color: u.color }))
    }))
)
function toggleUnit(id) {
  filterUnit.value = filterUnit.value.includes(id) ? filterUnit.value.filter((x) => x !== id) : [...filterUnit.value, id]
}

const INFO = {
  unused: { label: () => t('typeOfUnit.info.unused'), test: (r) => usageTotal(r.id) === 0 },
  detail: { label: () => t('typeOfUnit.info.detail'), test: (r) => !!r.detail },
  nodetail: { label: () => t('typeOfUnit.info.nodetail'), test: (r) => !r.detail },
  notes: { label: () => t('typeOfUnit.info.notes'), test: (r) => !!r.notes },
  recent: { label: () => t('typeOfUnit.info.recent'), test: (r) => Date.now() - new Date(r.updated_at || r.created_at || 0).getTime() <= 30 * DAY }
}
const count = (k) => rows.value.filter(INFO[k].test).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const infoOptions = computed(() => Object.entries(INFO).map(([value, o]) => ({ value, label: o.label(), count: count(value) })))

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
  filterInfo.value.forEach((k) => c.push({ key: `i-${k}`, label: INFO[k].label(), remove: () => (filterInfo.value = filterInfo.value.filter((x) => x !== k)) }))
  filterUnit.value.forEach((id) => c.push({ key: `u-${id}`, label: rows.value.find((r) => String(r.id) === id)?.name || t('typeOfUnit.unitChip', { id }), remove: () => toggleUnit(id) }))
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
    fetchError.value = err?.message || t('typeOfUnit.loadFailed')
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
      showToast(t('typeOfUnit.toastUpdated'))
    } else {
      await createTypeOfUnit(formData)
      showToast(t('typeOfUnit.toastCreated'))
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TypeOfUnit] Save failed:', err)
    actionError.value = isDuplicate(err)
      ? t('typeOfUnit.nameTaken', { name: formData.name })
      : err?.message || t('typeOfUnit.saveFailed')
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
    showToast(t('typeOfUnit.toastDeleted'))
    await loadData()
  } catch (err) {
    console.error('[TypeOfUnit] Delete failed:', err)
    deleteError.value = isStillReferenced(err)
      ? t('typeOfUnit.inUse')
      : err?.message || t('typeOfUnit.deleteFailed')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
