<template>
  <MdPage :title="t('aktifitasKebun.title')" :description="t('aktifitasKebun.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('aktifitasKebun.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="leaf" tone="info" :label="t('aktifitasKebun.kpi.total')" :value="rows.length" :sub="t('aktifitasKebun.kpi.totalSub', { n: usedGroups })" action :hint="t('aktifitasKebun.ui.showAll')" :pressed="false" @select="clearAll" />
      <MdKpi icon="upload" tone="success" :label="t('aktifitasKebun.needFoto')" :value="countFoto('yes')" :sub="t('aktifitasKebun.kpi.pctSub', { n: pct(countFoto('yes')) })" action :pressed="onlyFoto('yes')" @select="quickFoto('yes')" />
      <MdKpi icon="eye" tone="warning" :label="t('aktifitasKebun.noFoto')" :value="countFoto('no')" :sub="t('aktifitasKebun.kpi.noFotoSub')" action :pressed="onlyFoto('no')" @select="quickFoto('no')" />
      <MdKpi icon="layers" tone="brand" :label="t('aktifitasKebun.kpi.groups')" :value="groups.length" :sub="emptyGroups ? t('aktifitasKebun.kpi.emptyGroups', { n: emptyGroups }) : t('aktifitasKebun.kpi.allFilled')" />
    </div>

    <MdBarChart
      v-if="groupKeys.length"
      :title="t('aktifitasKebun.chart.title')"
      :subtitle="t('aktifitasKebun.chart.subtitle', { n: rows.length, g: groupKeys.length })"
      :legend="[{ label: t('aktifitasKebun.needFoto'), color: 'var(--success)' }, { label: t('aktifitasKebun.noFoto'), color: 'var(--border-strong)' }]"
      :bars="bars"
      :selected="filterGroup"
      @toggle="toggleGroup" />

    <MdDataTable
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      :entity-label="t('aktifitasKebun.entity')"
      empty-icon="leaf"
      :empty-text="t('aktifitasKebun.empty')"
      :add-label="t('aktifitasKebun.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('aktifitasKebun.aria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('aktifitasKebun.searchPlaceholder')" :aria-label="t('aktifitasKebun.searchAria')" />
        </label>
        <MdDropdown v-model="filterGroup" :label="t('aktifitasKebun.group')" :options="groupFilterOptions" multiple />
        <MdDropdown v-model="filterFoto" :label="t('aktifitasKebun.foto')" :options="fotoFilterOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('aktifitasKebun.ui.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('aktifitasKebun.ui.clearAll') }}</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div><b>{{ row.name }}</b><small>{{ groupLabel(groupKey(row)) }}</small></div>
        </div>
      </template>
      <template #cell-group_of_work_name="{ row }">
        <MdBadge :tone="groupKey(row) === '-' ? 'neutral' : 'info'">{{ groupLabel(groupKey(row)) }}</MdBadge>
      </template>
      <template #cell-detail="{ row }">
        <span :class="{ 'md-muted': !row.detail }">{{ row.detail || '—' }}</span>
      </template>
      <template #cell-is_upload="{ row }">
        <MdBadge :tone="isFoto(row) ? 'success' : 'neutral'">{{ isFoto(row) ? t('aktifitasKebun.ui.yes') : t('aktifitasKebun.ui.no') }}</MdBadge>
      </template>
      <template #cell-created_by="{ row }">
        <span class="md-muted">{{ userName(row.created_by) }}</span>
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="t('aktifitasKebun.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('aktifitasKebun.deleteAria', { name: row.name })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ groupLabel(groupKey(row)) }}</div></div>
          <MdBadge :tone="isFoto(row) ? 'success' : 'neutral'">{{ isFoto(row) ? t('aktifitasKebun.needFoto') : t('aktifitasKebun.noFoto') }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div style="grid-column: 1 / -1">{{ t('aktifitasKebun.detail') }}<b>{{ row.detail || '—' }}</b></div>
          <div>{{ t('aktifitasKebun.ui.createdBy') }}<b>{{ userName(row.created_by) }}</b></div>
          <div>{{ t('aktifitasKebun.ui.updatedBy') }}<b>{{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <KebunForm :visible="showForm" :activity="editingActivity" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deletingActivity" :title="t('aktifitasKebun.confirm.title')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deletingActivity">
        <i18n-t keypath="aktifitasKebun.confirm.body" scope="global">
          <template #name><b>{{ deletingActivity.name }}</b></template>
        </i18n-t>
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import KebunForm from './KebunForm.vue'
import { listTypeOfWork, createTypeOfWork, updateTypeOfWork, deleteTypeOfWork, listGroupOfWork } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { t } = useI18n()
const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const rows = ref([])
const groups = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)
const search = ref('')
const filterGroup = ref([])
const filterFoto = ref([])
const showForm = ref(false)
const editingActivity = ref(null)
const deletingActivity = ref(null)

const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })
const initial = (n) => String(n || '#').trim().charAt(0).toUpperCase() || '#'
const isFoto = (r) => Boolean(Number(r.is_upload))
const fotoKey = (r) => (isFoto(r) ? 'yes' : 'no')
const groupKey = (r) => (r.group_of_work != null && r.group_of_work !== '' ? String(r.group_of_work) : '-')
function groupLabel(key) {
  if (key === '-') return t('aktifitasKebun.noGroup')
  const g = groups.value.find((x) => String(x.id) === key)
  if (g) return g.name
  return rows.value.find((r) => groupKey(r) === key)?.group_of_work_name || t('aktifitasKebun.groupN', { key })
}

const columns = computed(() => [
  { key: 'name', label: t('aktifitasKebun.ui.name') },
  { key: 'group_of_work_name', label: t('aktifitasKebun.group'), sortValue: (r) => (groupKey(r) === '-' ? '' : groupLabel(groupKey(r))) },
  { key: 'detail', label: t('aktifitasKebun.detail') },
  { key: 'is_upload', label: t('aktifitasKebun.foto'), sortValue: (r) => (isFoto(r) ? 1 : 0) },
  { key: 'created_by', label: t('aktifitasKebun.ui.createdBy'), sortable: false },
  { key: 'updated_by', label: t('aktifitasKebun.ui.updatedBy'), sortable: false }
])

const countFoto = (k) => rows.value.filter((r) => fotoKey(r) === k).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const groupKeys = computed(() => [...new Set(rows.value.map(groupKey))].sort((a, b) => byName(groupLabel(a), groupLabel(b))))
const usedGroups = computed(() => groupKeys.value.filter((k) => k !== '-').length)
const emptyGroups = computed(() => groups.value.filter((g) => !rows.value.some((r) => groupKey(r) === String(g.id))).length)

const groupFilterOptions = computed(() => {
  const keys = [...new Set([...groups.value.map((g) => String(g.id)), ...groupKeys.value])]
  return keys
    .map((k) => ({ value: k, label: groupLabel(k), count: rows.value.filter((r) => groupKey(r) === k).length }))
    .sort((a, b) => byName(a.label, b.label))
})
const fotoFilterOptions = computed(() => [
  { value: 'yes', label: t('aktifitasKebun.needFoto'), count: countFoto('yes') },
  { value: 'no', label: t('aktifitasKebun.noFoto'), count: countFoto('no') }
])

const bars = computed(() =>
  groupKeys.value.map((k) => {
    const rs = rows.value.filter((r) => groupKey(r) === k)
    const yes = rs.filter(isFoto).length
    return {
      key: k,
      label: groupLabel(k),
      ariaLabel: t('aktifitasKebun.chart.barAria', { label: groupLabel(k), n: rs.length, f: yes }),
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
    (!q || `${r.name || ''} ${r.detail || ''}`.toLowerCase().includes(q)) &&
    (!filterGroup.value.length || filterGroup.value.includes(groupKey(r))) &&
    (!filterFoto.value.length || filterFoto.value.includes(fotoKey(r)))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterGroup.value.forEach((k) => c.push({ key: `g-${k}`, label: groupLabel(k), remove: () => (filterGroup.value = filterGroup.value.filter((x) => x !== k)) }))
  filterFoto.value.forEach((k) => c.push({ key: `f-${k}`, label: k === 'yes' ? t('aktifitasKebun.needFoto') : t('aktifitasKebun.noFoto'), remove: () => (filterFoto.value = filterFoto.value.filter((x) => x !== k)) }))
  return c
})

function clearAll() {
  search.value = ''
  filterGroup.value = []
  filterFoto.value = []
}
const onlyFoto = (k) => filterFoto.value.length === 1 && filterFoto.value[0] === k
function quickFoto(k) {
  filterFoto.value = onlyFoto(k) ? [] : [k]
}
function toggleGroup(k) {
  filterGroup.value = filterGroup.value.includes(k) ? filterGroup.value.filter((x) => x !== k) : [...filterGroup.value, k]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    const [typeOfWorkList, groupList] = await Promise.all([listTypeOfWork(), listGroupOfWork()])
    rows.value = typeOfWorkList
    groups.value = groupList
  } catch (err) {
    console.error('[AktifitasKebun] Failed to load:', err)
    fetchError.value = err?.message || t('aktifitasKebun.error.load')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingActivity.value = null
  actionError.value = null
  showForm.value = true
}
function openEdit(activity) {
  editingActivity.value = { ...activity }
  actionError.value = null
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  editingActivity.value = null
}

function enrichWithGroupName(record) {
  if (!record) return record
  if (!record.group_of_work_name && record.group_of_work != null) {
    const grp = groups.value.find((g) => String(g.id) === String(record.group_of_work))
    if (grp) record.group_of_work_name = grp.name
  }
  return record
}

async function onFormSubmit(formData) {
  submitting.value = true
  actionError.value = null
  try {
    if (editingActivity.value?.id) {
      const updated = await updateTypeOfWork(editingActivity.value.id, formData)
      const idx = rows.value.findIndex((r) => r.id === editingActivity.value.id)
      if (idx !== -1) rows.value[idx] = enrichWithGroupName(updated || { ...rows.value[idx], ...formData })
      showToast(t('aktifitasKebun.toast.updated'))
    } else {
      const created = await createTypeOfWork(formData)
      if (created) rows.value.unshift(enrichWithGroupName(created))
      showToast(t('aktifitasKebun.toast.created'))
    }
    closeForm()
  } catch (err) {
    console.error('[AktifitasKebun] Save failed:', err)
    actionError.value = err?.message || t('aktifitasKebun.ui.saveFailed')
  } finally {
    submitting.value = false
  }
}

function confirmDelete(activity) {
  deletingActivity.value = activity
  deleteError.value = ''
}
function closeDelete() {
  deletingActivity.value = null
  deleteError.value = ''
}
async function onDeleteConfirm() {
  if (!deletingActivity.value) return
  submitting.value = true
  deleteError.value = ''
  try {
    await deleteTypeOfWork(deletingActivity.value.id)
    rows.value = rows.value.filter((r) => r.id !== deletingActivity.value.id)
    deletingActivity.value = null
    showToast(t('aktifitasKebun.toast.deleted'))
  } catch (err) {
    console.error('[AktifitasKebun] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? t('aktifitasKebun.error.inUse')
      : err?.message || t('aktifitasKebun.error.delete')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
