<template>
  <MdPage :title="t('sensusProgressStatus.title')" :description="t('sensusProgressStatus.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('sensusProgressStatus.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="list" tone="info" :label="t('sensusProgressStatus.kpi.total')" :value="rows.length" :sub="t('sensusProgressStatus.kpi.totalSub')" action :hint="t('sensusProgressStatus.showAll')" :pressed="false" @select="clearAll" />
      <MdKpi icon="check" tone="success" :label="t('sensusProgressStatus.kpi.withDetail')" :value="countDetail('yes')" :sub="t('sensusProgressStatus.kpi.withDetailSub', { n: pct(countDetail('yes')) })" action :pressed="onlyDetail('yes')" @select="quickDetail('yes')" />
      <MdKpi icon="alert" tone="warning" :label="t('sensusProgressStatus.kpi.noDetail')" :value="countDetail('no')" :sub="countDetail('no') ? t('sensusProgressStatus.kpi.needsWork') : t('sensusProgressStatus.kpi.allDetailed')" action :pressed="onlyDetail('no')" @select="quickDetail('no')" />
      <MdKpi icon="users" tone="brand" :label="t('sensusProgressStatus.kpi.editors')" :value="editors" :sub="t('sensusProgressStatus.kpi.editorsSub')" />
    </div>

    <MdDataTable
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      :entity-label="t('sensusProgressStatus.entity')"
      empty-icon="list"
      :empty-text="t('sensusProgressStatus.empty')"
      :add-label="t('sensusProgressStatus.add')"
      :can-add="canWrite"
      initial-sort="id"
      :aria-label="t('sensusProgressStatus.tableAria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('sensusProgressStatus.searchPlaceholder')" :aria-label="t('sensusProgressStatus.searchAria')" />
        </label>
        <MdDropdown v-model="filterDetail" :label="t('sensusProgressStatus.filterDetail')" :options="detailFilterOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('sensusProgressStatus.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('sensusProgressStatus.clearAll') }}</button>
        </div>
      </template>

      <template #cell-id="{ row }">
        <span class="md-num md-muted">{{ row.id }}</span>
      </template>
      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div><b>{{ row.name }}</b></div>
        </div>
      </template>
      <template #cell-detail="{ row }">
        <span :class="{ 'md-muted': !row.detail }">{{ row.detail || '—' }}</span>
      </template>
      <template #cell-created_by="{ row }">
        <span class="md-muted">{{ userName(row.created_by) }}</span>
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="t('sensusProgressStatus.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('sensusProgressStatus.deleteAria', { name: row.name })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.detail || t('sensusProgressStatus.noDetail') }}</div></div>
        </div>
        <div class="md-card__grid">
          <div>{{ t('sensusProgressStatus.col.createdBy') }}<b>{{ userName(row.created_by) }}</b></div>
          <div>{{ t('sensusProgressStatus.col.updatedBy') }}<b>{{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <SensusProgressStatusForm :visible="showForm" :status="editingStatus" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deletingStatus" :title="t('sensusProgressStatus.confirmTitle')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deletingStatus">{{ t('sensusProgressStatus.confirmBefore') }} <b>{{ deletingStatus.name }}</b> {{ t('sensusProgressStatus.confirmAfter') }}</template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { isStillReferenced } from '../../../../api/apiError'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import SensusProgressStatusForm from './SensusProgressStatusForm.vue'
import { listSensusProgressStatus, createSensusProgressStatus, updateSensusProgressStatus, deleteSensusProgressStatus } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdDataTable, MdDropdown, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { t } = useI18n()
const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)
const search = ref('')
const filterDetail = ref([])
const showForm = ref(false)
const editingStatus = ref(null)
const deletingStatus = ref(null)

const initial = (n) => String(n || '#').trim().charAt(0).toUpperCase() || '#'
const detailKey = (r) => (r.detail ? 'yes' : 'no')
const countDetail = (k) => rows.value.filter((r) => detailKey(r) === k).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const editors = computed(() => new Set(rows.value.map((r) => r.updated_by || r.created_by).filter(Boolean)).size)

const columns = computed(() => [
  { key: 'id', label: '#', sortValue: (r) => (r.id == null ? null : Number(r.id)) },
  { key: 'name', label: t('sensusProgressStatus.col.name') },
  { key: 'detail', label: t('sensusProgressStatus.col.detail') },
  { key: 'created_by', label: t('sensusProgressStatus.col.createdBy'), sortable: false },
  { key: 'updated_by', label: t('sensusProgressStatus.col.updatedBy'), sortable: false }
])

const detailFilterOptions = computed(() => [
  { value: 'yes', label: t('sensusProgressStatus.withDetail'), count: countDetail('yes') },
  { value: 'no', label: t('sensusProgressStatus.noDetail'), count: countDetail('no') }
])

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || `${r.name || ''} ${r.detail || ''}`.toLowerCase().includes(q)) &&
    (!filterDetail.value.length || filterDetail.value.includes(detailKey(r)))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterDetail.value.forEach((k) => c.push({ key: `d-${k}`, label: k === 'yes' ? t('sensusProgressStatus.withDetail') : t('sensusProgressStatus.noDetail'), remove: () => (filterDetail.value = filterDetail.value.filter((x) => x !== k)) }))
  return c
})

function clearAll() {
  search.value = ''
  filterDetail.value = []
}
const onlyDetail = (k) => filterDetail.value.length === 1 && filterDetail.value[0] === k
function quickDetail(k) {
  filterDetail.value = onlyDetail(k) ? [] : [k]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listSensusProgressStatus()
  } catch (err) {
    console.error('[SensusProgressStatus] Failed to load:', err)
    fetchError.value = err?.message || t('sensusProgressStatus.loadFailed')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingStatus.value = null
  actionError.value = null
  showForm.value = true
}
function openEdit(status) {
  editingStatus.value = { ...status }
  actionError.value = null
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  editingStatus.value = null
}

async function onFormSubmit(formData) {
  submitting.value = true
  actionError.value = null
  try {
    if (editingStatus.value?.id) {
      const updated = await updateSensusProgressStatus(editingStatus.value.id, formData)
      const idx = rows.value.findIndex((r) => r.id === editingStatus.value.id)
      if (idx !== -1) rows.value[idx] = updated || { ...rows.value[idx], ...formData }
      showToast(t('sensusProgressStatus.toastUpdated'))
    } else {
      const created = await createSensusProgressStatus(formData)
      if (created) rows.value.unshift(created)
      showToast(t('sensusProgressStatus.toastCreated'))
    }
    closeForm()
  } catch (err) {
    console.error('[SensusProgressStatus] Save failed:', err)
    actionError.value = err?.message || t('sensusProgressStatus.saveFailed')
  } finally {
    submitting.value = false
  }
}

function confirmDelete(status) {
  deletingStatus.value = status
  deleteError.value = ''
}
function closeDelete() {
  deletingStatus.value = null
  deleteError.value = ''
}
async function onDeleteConfirm() {
  if (!deletingStatus.value) return
  submitting.value = true
  deleteError.value = ''
  try {
    await deleteSensusProgressStatus(deletingStatus.value.id)
    rows.value = rows.value.filter((r) => r.id !== deletingStatus.value.id)
    deletingStatus.value = null
    showToast(t('sensusProgressStatus.toastDeleted'))
  } catch (err) {
    console.error('[SensusProgressStatus] Delete failed:', err)
    deleteError.value = isStillReferenced(err)
      ? t('sensusProgressStatus.inUse')
      : err?.message || t('sensusProgressStatus.deleteStatusFailed')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
