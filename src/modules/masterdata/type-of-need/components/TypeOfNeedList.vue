<template>
  <MdPage :title="t('typeOfNeed.title')" :description="t('typeOfNeed.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('typeOfNeed.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" :label="t('typeOfNeed.kpi.total')" :value="rows.length" :sub="t('typeOfNeed.withDetailSub', { n: count('detail') })" action :hint="t('typeOfNeed.showAll')" @select="clearAll" />
      <MdKpi icon="info" tone="warning" :label="t('typeOfNeed.kpi.noDetail')" :value="count('nodetail')" :sub="t('typeOfNeed.pctOfData', { n: pct(count('nodetail')) })" action :pressed="only('nodetail')" @select="quick('nodetail')" />
      <MdKpi icon="bookmark" tone="success" :label="t('typeOfNeed.kpi.notes')" :value="count('notes')" :sub="t('typeOfNeed.pctOfData', { n: pct(count('notes')) })" action :pressed="only('notes')" @select="quick('notes')" />
      <MdKpi icon="grid" tone="brand" :label="t('typeOfNeed.kpi.unitsUsed')" :value="groupOptions.length" :sub="topGroup ? t('typeOfNeed.mostCommon', { label: topGroup.label, n: topGroup.count }) : t('typeOfNeed.noData')" action :hint="t('typeOfNeed.sort')" @select="table?.setSort('unit_name', 1)" />
    </div>

    <MdBarChart
      v-if="groupOptions.length"
      :title="t('typeOfNeed.chartTitle')"
      :subtitle="t('typeOfNeed.chartSubtitle', { n: rows.length, g: groupOptions.length })"
      :legend="[{ label: t('typeOfNeed.info.detail'), color: 'var(--success)' }, { label: t('typeOfNeed.info.nodetail'), color: 'var(--border-strong)' }]"
      :bars="bars"
      :selected="filterGroup"
      @toggle="toggleGroup" />

    <MdDataTable
      ref="table"
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      :entity-label="t('typeOfNeed.entity')"
      empty-icon="layers"
      :empty-text="t('typeOfNeed.empty')"
      :add-label="t('typeOfNeed.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('typeOfNeed.tableAria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('typeOfNeed.searchPlaceholder')" :aria-label="t('typeOfNeed.searchAria')" />
        </label>
        <MdDropdown v-model="filterGroup" :label="t('typeOfNeed.col.unit')" :options="groupOptions" multiple />
        <MdDropdown v-model="filterInfo" :label="t('typeOfNeed.info.label')" :options="infoOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('typeOfNeed.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('typeOfNeed.clearAll') }}</button>
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
      <template #cell-notes="{ row }">
        <span v-if="row.notes">{{ row.notes }}</span><span v-else class="md-muted">—</span>
      </template>
      <template #cell-unit_name="{ row }">
        <MdBadge v-if="row.unit_name" tone="info">{{ row.unit_name }}</MdBadge><span v-else class="md-muted">—</span>
      </template>
      <template #cell-created_at="{ row }">
        <div>{{ fmtDate(row.created_at) }}</div><small class="md-muted">{{ userName(row.created_by) }}</small>
      </template>
      <template #cell-updated_at="{ row }">
        <div>{{ fmtDate(row.updated_at) }}</div><small class="md-muted">{{ userName(row.updated_by) }}</small>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="t('typeOfNeed.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('typeOfNeed.deleteAria', { name: row.name })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name || '-' }}</b><div class="md-muted" style="font-size: 12px">ID {{ row.id }}</div></div>
          <MdBadge v-if="row.unit_name" tone="info">{{ row.unit_name }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>{{ t('typeOfNeed.col.detail') }}<b>{{ row.detail || '—' }}</b></div>
          <div>{{ t('typeOfNeed.col.notes') }}<b>{{ row.notes || '—' }}</b></div>
          <div>{{ t('typeOfNeed.col.createdAt') }}<b>{{ fmtDate(row.created_at) }} · {{ userName(row.created_by) }}</b></div>
          <div>{{ t('typeOfNeed.col.updatedAt') }}<b>{{ fmtDate(row.updated_at) }} · {{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <TypeOfNeedForm :visible="showForm" :type-of-need="editing" :rows="rows" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" :title="t('typeOfNeed.confirmTitle')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        {{ t('typeOfNeed.confirmBefore') }} <b>{{ deleting.name }}</b> {{ t('typeOfNeed.confirmAfter') }}
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { currentIntlLocale } from '../../../../i18n'
import TypeOfNeedForm from './TypeOfNeedForm.vue'
import { createTypeOfNeed, deleteTypeOfNeed, listTypeOfNeed, updateTypeOfNeed } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdDataTable, MdDropdown, MdBadge, MdBarChart, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { t } = useI18n()
const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const columns = computed(() => [
  { key: 'name', label: t('typeOfNeed.col.name') },
  { key: 'unit_name', label: t('typeOfNeed.col.unit'), sortValue: (r) => r.unit_name || '' },
  { key: 'detail', label: t('typeOfNeed.col.detail'), sortValue: (r) => r.detail || '' },
  { key: 'notes', label: t('typeOfNeed.col.notes'), sortValue: (r) => r.notes || '' },
  { key: 'created_at', label: t('typeOfNeed.col.createdAt'), sortValue: (r) => r.created_at || '' },
  { key: 'updated_at', label: t('typeOfNeed.col.updatedAt'), sortValue: (r) => r.updated_at || '' }
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
const filterGroup = ref([])
const NONE = '—'
const groupOf = (r) => r.unit_name || NONE
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
const INFO = {
  detail: { label: () => t('typeOfNeed.info.detail'), test: (r) => !!r.detail },
  nodetail: { label: () => t('typeOfNeed.info.nodetail'), test: (r) => !r.detail },
  notes: { label: () => t('typeOfNeed.info.notes'), test: (r) => !!r.notes },
  recent: { label: () => t('typeOfNeed.info.recent'), test: (r) => Date.now() - new Date(r.updated_at || r.created_at || 0).getTime() <= 30 * DAY }
}
const count = (k) => rows.value.filter(INFO[k].test).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const infoOptions = computed(() => Object.entries(INFO).map(([value, o]) => ({ value, label: o.label(), count: count(value) })))

const groupOptions = computed(() => {
  const m = new Map()
  rows.value.forEach((r) => m.set(groupOf(r), (m.get(groupOf(r)) || 0) + 1))
  return [...m.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'id', { numeric: true }))
    .map(([value, count]) => ({ value, label: value === NONE ? t('typeOfNeed.noUnit') : value, count }))
})
const topGroup = computed(() => groupOptions.value.reduce((t, g) => (!t || g.count > t.count ? g : t), null))
const bars = computed(() =>
  groupOptions.value.map((g) => {
    const rs = rows.value.filter((r) => groupOf(r) === g.value)
    const withDetail = rs.filter((r) => r.detail).length
    return {
      key: g.value,
      label: g.label,
      ariaLabel: t('typeOfNeed.barAriaDetail', { label: g.label, total: rs.length, n: withDetail }),
      segments: [
        { value: withDetail, color: 'var(--success)' },
        { value: rs.length - withDetail, color: 'var(--border-strong)' }
      ]
    }
  })
)
function toggleGroup(k) {
  filterGroup.value = filterGroup.value.includes(k) ? filterGroup.value.filter((x) => x !== k) : [...filterGroup.value, k]
}

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || [r.name, r.detail, r.notes, r.unit_name].some((v) => String(v || '').toLowerCase().includes(q))) &&
    (!filterGroup.value.length || filterGroup.value.includes(groupOf(r))) &&
    filterInfo.value.every((k) => INFO[k].test(r))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterGroup.value.forEach((g) => c.push({ key: `g-${g}`, label: g === NONE ? t('typeOfNeed.noUnit') : g, remove: () => (filterGroup.value = filterGroup.value.filter((x) => x !== g)) }))
  filterInfo.value.forEach((k) => c.push({ key: `i-${k}`, label: INFO[k].label(), remove: () => (filterInfo.value = filterInfo.value.filter((x) => x !== k)) }))
  return c
})

function clearAll() {
  search.value = ''
  filterInfo.value = []
  filterGroup.value = []
}
const only = (k) => filterInfo.value.length === 1 && filterInfo.value[0] === k
function quick(k) {
  filterInfo.value = only(k) ? [] : [k]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listTypeOfNeed()
  } catch (err) {
    console.error('[TypeOfNeed] Failed to load:', err)
    fetchError.value = err?.message || t('typeOfNeed.loadFailed')
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
      await updateTypeOfNeed(editing.value.id, formData)
      showToast(t('typeOfNeed.toastUpdated'))
    } else {
      await createTypeOfNeed(formData)
      showToast(t('typeOfNeed.toastCreated'))
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TypeOfNeed] Save failed:', err)
    actionError.value = /409/.test(err?.message || '')
      ? t('typeOfNeed.nameTaken', { name: formData.name })
      : err?.message || t('typeOfNeed.saveFailed')
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
    await deleteTypeOfNeed(deleting.value.id)
    deleting.value = null
    showToast(t('typeOfNeed.toastDeleted'))
    await loadData()
  } catch (err) {
    console.error('[TypeOfNeed] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? t('typeOfNeed.inUse')
      : err?.message || t('typeOfNeed.deleteFailed')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
