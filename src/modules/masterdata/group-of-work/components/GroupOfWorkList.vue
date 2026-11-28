<template>
  <MdPage :title="t('groupOfWork.title')" :description="t('groupOfWork.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('groupOfWork.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" :label="t('groupOfWork.kpi.total')" :value="rows.length" :sub="t('groupOfWork.kpi.totalSub')" action :hint="t('groupOfWork.ui.showAll')" :pressed="false" @select="clearAll" />
      <MdKpi icon="leaf" tone="success" :label="t('groupOfWork.kpi.perawatan')" :value="count('PERAWATAN')" :sub="t('groupOfWork.kpi.pctSub', { n: pct(count('PERAWATAN')) })" action :pressed="onlyType('PERAWATAN')" @select="quickType('PERAWATAN')" />
      <MdKpi icon="truck" tone="warning" :label="t('groupOfWork.kpi.panen')" :value="count('PANEN')" :sub="t('groupOfWork.kpi.pctSub', { n: pct(count('PANEN')) })" action :pressed="onlyType('PANEN')" @select="quickType('PANEN')" />
      <MdKpi icon="info" tone="brand" :label="t('groupOfWork.noDetail')" :value="noDetail" :sub="noDetail ? t('groupOfWork.kpi.needsFill') : t('groupOfWork.kpi.allFilled')" action :pressed="onlyNoDetail" @select="onlyNoDetail = !onlyNoDetail" />
    </div>

    <MdDataTable
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      :entity-label="t('groupOfWork.entity')"
      empty-icon="layers"
      :empty-text="t('groupOfWork.empty')"
      :add-label="t('groupOfWork.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('groupOfWork.aria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('groupOfWork.searchPlaceholder')" :aria-label="t('groupOfWork.searchAria')" />
        </label>
        <MdDropdown v-model="filterType" :label="t('groupOfWork.tphType')" :options="typeFilterOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('groupOfWork.ui.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('groupOfWork.ui.clearAll') }}</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div><b>{{ row.name }}</b><small>{{ row.detail || t('groupOfWork.noDetail') }}</small></div>
        </div>
      </template>
      <template #cell-tph_type="{ row }">
        <MdBadge :tone="typeTone(row.tph_type)">{{ typeLabel(row.tph_type) }}</MdBadge>
      </template>
      <template #cell-created_by="{ row }">
        <span class="md-muted">{{ userName(row.created_by) }}</span>
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="t('groupOfWork.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('groupOfWork.deleteAria', { name: row.name })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.detail || t('groupOfWork.noDetail') }}</div></div>
          <MdBadge :tone="typeTone(row.tph_type)">{{ typeLabel(row.tph_type) }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>{{ t('groupOfWork.ui.createdBy') }}<b>{{ userName(row.created_by) }}</b></div>
          <div>{{ t('groupOfWork.ui.updatedBy') }}<b>{{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <GroupOfWorkForm :visible="showForm" :group="editingGroup" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deletingGroup" :title="t('groupOfWork.confirm.title')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deletingGroup">
        <i18n-t keypath="groupOfWork.confirm.body" scope="global">
          <template #name><b>{{ deletingGroup.name }}</b></template>
        </i18n-t>
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import GroupOfWorkForm from './GroupOfWorkForm.vue'
import { listGroupOfWork, createGroupOfWork, updateGroupOfWork, deleteGroupOfWork } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

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
const filterType = ref([])
const onlyNoDetail = ref(false)
const showForm = ref(false)
const editingGroup = ref(null)
const deletingGroup = ref(null)

const initial = (n) => String(n || '#').trim().charAt(0).toUpperCase() || '#'
const typeKey = (r) => r.tph_type || '-'
const typeLabel = (v) => (v === 'PANEN' ? t('groupOfWork.type.panen') : v === 'PERAWATAN' ? t('groupOfWork.type.perawatan') : '-')
const typeTone = (v) => (v === 'PANEN' ? 'warning' : v === 'PERAWATAN' ? 'success' : 'neutral')
const count = (v) => rows.value.filter((r) => typeKey(r) === v).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const noDetail = computed(() => rows.value.filter((r) => !r.detail).length)

const columns = computed(() => [
  { key: 'name', label: t('groupOfWork.ui.name') },
  { key: 'tph_type', label: t('groupOfWork.tphType'), sortValue: (r) => (r.tph_type ? typeLabel(r.tph_type) : '') },
  { key: 'created_by', label: t('groupOfWork.ui.createdBy'), sortable: false },
  { key: 'updated_by', label: t('groupOfWork.ui.updatedBy'), sortable: false }
])

const typeFilterOptions = computed(() => {
  const o = [
    { value: 'PERAWATAN', label: t('groupOfWork.type.perawatan'), count: count('PERAWATAN') },
    { value: 'PANEN', label: t('groupOfWork.type.panen'), count: count('PANEN') }
  ]
  if (count('-')) o.push({ value: '-', label: t('groupOfWork.type.notSet'), count: count('-') })
  return o
})

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || `${r.name || ''} ${r.detail || ''}`.toLowerCase().includes(q)) &&
    (!filterType.value.length || filterType.value.includes(typeKey(r))) &&
    (!onlyNoDetail.value || !r.detail)
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterType.value.forEach((v) => c.push({ key: `t-${v}`, label: v === '-' ? t('groupOfWork.type.notSet') : typeLabel(v), remove: () => (filterType.value = filterType.value.filter((x) => x !== v)) }))
  if (onlyNoDetail.value) c.push({ key: 'nd', label: t('groupOfWork.noDetail'), remove: () => (onlyNoDetail.value = false) })
  return c
})

function clearAll() {
  search.value = ''
  filterType.value = []
  onlyNoDetail.value = false
}
const onlyType = (v) => filterType.value.length === 1 && filterType.value[0] === v
function quickType(v) {
  filterType.value = onlyType(v) ? [] : [v]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listGroupOfWork()
  } catch (err) {
    console.error('[GroupOfWork] Failed to load:', err)
    fetchError.value = err?.message || t('groupOfWork.error.load')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingGroup.value = null
  actionError.value = null
  showForm.value = true
}
function openEdit(group) {
  editingGroup.value = { ...group }
  actionError.value = null
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  editingGroup.value = null
}

async function onFormSubmit(formData) {
  submitting.value = true
  actionError.value = null
  try {
    if (editingGroup.value?.id) {
      await updateGroupOfWork(editingGroup.value.id, formData)
      showToast(t('groupOfWork.toast.updated'))
    } else {
      await createGroupOfWork(formData)
      showToast(t('groupOfWork.toast.created'))
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[GroupOfWork] Save failed:', err)
    actionError.value = err?.message || t('groupOfWork.ui.saveFailed')
  } finally {
    submitting.value = false
  }
}

function confirmDelete(group) {
  deletingGroup.value = group
  deleteError.value = ''
}
function closeDelete() {
  deletingGroup.value = null
  deleteError.value = ''
}
async function onDeleteConfirm() {
  if (!deletingGroup.value) return
  submitting.value = true
  deleteError.value = ''
  try {
    await deleteGroupOfWork(deletingGroup.value.id)
    deletingGroup.value = null
    showToast(t('groupOfWork.toast.deleted'))
    await loadData()
  } catch (err) {
    console.error('[GroupOfWork] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? t('groupOfWork.error.inUse')
      : err?.message || t('groupOfWork.error.delete')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
