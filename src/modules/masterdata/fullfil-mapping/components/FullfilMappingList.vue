<template>
  <MdPage :title="t('fullfilMapping.title')" :description="t('fullfilMapping.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('fullfilMapping.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" :label="t('fullfilMapping.kpi.total')" :value="rows.length" :sub="t('fullfilMapping.kpi.totalSub', { n: workOptions.length })" action :hint="t('fullfilMapping.showAll')" @select="clearAll" />
      <MdKpi icon="eye" tone="success" :label="t('fullfilMapping.kpi.shown')" :value="countView('1')" :sub="t('fullfilMapping.kpi.shownSub', { n: countView('0') })" action :pressed="only('view', '1')" @select="quick('view', '1')" />
      <MdKpi icon="user" tone="brand" :label="t('fullfilMapping.kpi.admin')" :value="countAccess('admin')" :sub="t('fullfilMapping.kpi.adminSub', { n: countAccess('-') })" action :pressed="only('access', 'admin')" @select="quick('access', 'admin')" />
      <MdKpi icon="users" tone="warning" :label="t('fullfilMapping.kpi.worker')" :value="countAccess('pekerja')" :sub="t('fullfilMapping.kpi.workerSub', { n: needOptions.length })" action :pressed="only('access', 'pekerja')" @select="quick('access', 'pekerja')" />
    </div>

    <MdBarChart
      v-if="bars.length"
      :title="t('fullfilMapping.chartTitle')"
      :subtitle="t('fullfilMapping.chartSubtitle', { n: rows.length, g: workOptions.length })"
      :legend="[{ label: t('fullfilMapping.shown'), color: 'var(--success)' }, { label: t('fullfilMapping.hidden'), color: 'var(--border-strong)' }]"
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
      :entity-label="t('fullfilMapping.entity')"
      empty-icon="layers"
      :empty-text="t('fullfilMapping.empty')"
      :add-label="t('fullfilMapping.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('fullfilMapping.tableAria')"
      @retry="load"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('fullfilMapping.searchPlaceholder')" :aria-label="t('fullfilMapping.searchAria')" />
        </label>
        <MdDropdown v-model="filterWork" :label="t('fullfilMapping.workType')" :options="workFilterOptions" multiple />
        <MdDropdown v-model="filterNeed" :label="t('fullfilMapping.needType')" :options="needFilterOptions" multiple />
        <MdDropdown v-model="filterAccess" :label="t('fullfilMapping.access')" :options="accessFilterOptions" multiple />
        <MdDropdown v-model="filterView" :label="t('fullfilMapping.view')" :options="viewFilterOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('fullfilMapping.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('fullfilMapping.clearAll') }}</button>
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
        <MdBadge :tone="row.is_view === 0 ? 'neutral' : 'success'">{{ row.is_view === 0 ? t('fullfilMapping.no') : t('fullfilMapping.yes') }}</MdBadge>
      </template>
      <template #cell-notes="{ row }"><span class="md-muted">{{ row.notes || '—' }}</span></template>
      <template #cell-updated_at="{ row }">
        <span class="md-muted">{{ formatDate(row.updated_at) }}<template v-if="row.updated_by || row.created_by"> · {{ userName(row.updated_by || row.created_by) }}</template></span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="t('fullfilMapping.editAria', { name: row.name || row.id })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('fullfilMapping.deleteAria', { name: row.name || row.id })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name || `${workName(row.tow_id)} → ${needName(row.ton_id)}` }}</b><div class="md-muted" style="font-size: 12px">ID {{ row.id }}</div></div>
          <MdBadge :tone="row.is_view === 0 ? 'neutral' : 'success'">{{ row.is_view === 0 ? t('fullfilMapping.hidden') : t('fullfilMapping.shown') }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>{{ t('fullfilMapping.workType') }}<b>{{ workName(row.tow_id) }}</b></div>
          <div>{{ t('fullfilMapping.needType') }}<b>{{ needName(row.ton_id) }}</b></div>
          <div>{{ t('fullfilMapping.access') }}<b>{{ accessLabel(row.access) }}</b></div>
          <div>{{ t('fullfilMapping.col.notes') }}<b>{{ row.notes || '—' }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <FullfilMappingForm :visible="showForm" :fullfil="editing" :type-of-works="typeOfWorks" :type-of-needs="typeOfNeeds" :submitting="submitting" :error="actionError || ''" @submit="save" @cancel="closeForm" />

    <MdConfirm :open="!!deleteTarget" :title="t('fullfilMapping.confirmTitle')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="remove">
      <template v-if="deleteTarget">
        {{ t('fullfilMapping.confirmBefore') }} <b>{{ deleteTarget.name || `${workName(deleteTarget.tow_id)} → ${needName(deleteTarget.ton_id)}` }}</b> {{ t('fullfilMapping.confirmAfter') }}
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FullfilMappingForm from './FullfilMappingForm.vue'
import { createFullfil, deleteFullfil, listFullfil, listTypeOfNeed, listTypeOfWork, updateFullfil } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const { t } = useI18n()
const canWrite = useCanManageMasterData()
const { userName } = useUserNames()
const { show: showToast } = useToast()

const columns = computed(() => [
  { key: 'name', label: t('fullfilMapping.col.name') },
  { key: 'tow_id', label: t('fullfilMapping.workType'), sortValue: (r) => workName(r.tow_id) },
  { key: 'ton_id', label: t('fullfilMapping.needType'), sortValue: (r) => needName(r.ton_id) },
  { key: 'access', label: t('fullfilMapping.access') },
  { key: 'is_view', label: t('fullfilMapping.view'), sortValue: (r) => (r.is_view === 0 ? 0 : 1) },
  { key: 'notes', label: t('fullfilMapping.col.notes'), sortable: false },
  { key: 'updated_at', label: t('fullfilMapping.col.updatedAt') }
])

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
const accessLabel = (a) => (a === 'admin' ? t('fullfilMapping.admin') : a === 'pekerja' ? t('fullfilMapping.worker') : a || '—')
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
  { value: 'admin', label: t('fullfilMapping.admin'), count: countAccess('admin') },
  { value: 'pekerja', label: t('fullfilMapping.worker'), count: countAccess('pekerja') },
  { value: '-', label: t('fullfilMapping.noAccess'), count: countAccess('-') }
])
const viewFilterOptions = computed(() => [
  { value: '1', label: t('fullfilMapping.shown'), count: countView('1') },
  { value: '0', label: t('fullfilMapping.hidden'), count: countView('0') }
])

const bars = computed(() => workOptions.value.map((id) => {
  const rs = rows.value.filter((r) => String(r.tow_id) === id)
  const shown = rs.filter((r) => viewKey(r) === '1').length
  return {
    key: id,
    label: workName(id),
    ariaLabel: t('fullfilMapping.barAria', { label: workName(id), total: rs.length, n: shown }),
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
  filterAccess.value.forEach((v) => c.push({ key: `a-${v}`, label: v === '-' ? t('fullfilMapping.noAccess') : accessLabel(v), remove: drop(filterAccess, v) }))
  filterView.value.forEach((v) => c.push({ key: `v-${v}`, label: v === '1' ? t('fullfilMapping.shown') : t('fullfilMapping.hidden'), remove: drop(filterView, v) }))
  return c
})

function clearAll() { search.value = ''; filterWork.value = []; filterNeed.value = []; filterAccess.value = []; filterView.value = [] }
// Template membuka ref otomatis, jadi filter dirujuk lewat nama.
const filterRefs = { view: filterView, access: filterAccess }
const only = (k, v) => filterRefs[k].value.length === 1 && filterRefs[k].value[0] === v
function quick(k, v) { filterRefs[k].value = only(k, v) ? [] : [v] }
function toggleWork(id) { filterWork.value = filterWork.value.includes(id) ? filterWork.value.filter((x) => x !== id) : [...filterWork.value, id] }

async function load() {
  loading.value = true; error.value = null
  try {
    const result = await Promise.all([listFullfil(), listTypeOfWork(), listTypeOfNeed()])
    rows.value = result[0].data; typeOfWorks.value = result[1]; typeOfNeeds.value = result[2]
  } catch (err) {
    error.value = err?.message || t('fullfilMapping.loadFailed')
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
    if (editing.value?.id) { await updateFullfil(editing.value.id, payload); showToast(t('fullfilMapping.toastUpdated')) }
    else { await createFullfil(payload); showToast(t('fullfilMapping.toastCreated')) }
    closeForm(); await load()
  } catch (err) {
    actionError.value = err?.message || t('fullfilMapping.saveFailed')
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
    showToast(t('fullfilMapping.toastDeleted'))
    await load()
  } catch (err) {
    deleteError.value = err?.message || t('fullfilMapping.deleteFailed')
  } finally {
    submitting.value = false
  }
}
onMounted(load)
</script>
