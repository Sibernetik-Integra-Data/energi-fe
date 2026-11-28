<template>
  <MdPage :title="t('typeOfComponent.title')" :description="t('typeOfComponent.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('typeOfComponent.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="layers" tone="info" :label="t('typeOfComponent.kpi.total')" :value="rows.length" :sub="t('typeOfComponent.withDetailSub', { n: count('detail') })" action :hint="t('typeOfComponent.showAll')" @select="clearAll" />
      <MdKpi icon="info" tone="warning" :label="t('typeOfComponent.kpi.noDetail')" :value="count('nodetail')" :sub="t('typeOfComponent.pctOfData', { n: pct(count('nodetail')) })" action :pressed="only('nodetail')" @select="quick('nodetail')" />
      <MdKpi icon="bookmark" tone="success" :label="t('typeOfComponent.kpi.notes')" :value="count('notes')" :sub="t('typeOfComponent.pctOfData', { n: pct(count('notes')) })" action :pressed="only('notes')" @select="quick('notes')" />
      <MdKpi icon="clock" tone="brand" :label="t('typeOfComponent.kpi.recent')" :value="count('recent')" :sub="t('typeOfComponent.kpi.recentSub')" action :pressed="only('recent')" @select="quick('recent')" />
    </div>

    <MdDataTable
      ref="table"
      :columns="columns"
      :rows="filteredRows"
      :total-rows="rows.length"
      :loading="loading"
      :error="fetchError || ''"
      :entity-label="t('typeOfComponent.entity')"
      empty-icon="layers"
      :empty-text="t('typeOfComponent.empty')"
      :add-label="t('typeOfComponent.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('typeOfComponent.tableAria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('typeOfComponent.searchPlaceholder')" :aria-label="t('typeOfComponent.searchAria')" />
        </label>
        <MdDropdown v-model="filterInfo" :label="t('typeOfComponent.info.label')" :options="infoOptions" multiple />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('typeOfComponent.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('typeOfComponent.clearAll') }}</button>
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
      <template #cell-created_at="{ row }">
        <div>{{ fmtDate(row.created_at) }}</div><small class="md-muted">{{ userName(row.created_by) }}</small>
      </template>
      <template #cell-updated_at="{ row }">
        <div>{{ fmtDate(row.updated_at) }}</div><small class="md-muted">{{ userName(row.updated_by) }}</small>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="t('typeOfComponent.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('typeOfComponent.deleteAria', { name: row.name })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ initial(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name || '-' }}</b><div class="md-muted" style="font-size: 12px">ID {{ row.id }}</div></div>
        </div>
        <div class="md-card__grid">
          <div>{{ t('typeOfComponent.col.detail') }}<b>{{ row.detail || '—' }}</b></div>
          <div>{{ t('typeOfComponent.col.notes') }}<b>{{ row.notes || '—' }}</b></div>
          <div>{{ t('typeOfComponent.col.createdAt') }}<b>{{ fmtDate(row.created_at) }} · {{ userName(row.created_by) }}</b></div>
          <div>{{ t('typeOfComponent.col.updatedAt') }}<b>{{ fmtDate(row.updated_at) }} · {{ userName(row.updated_by) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <TypeOfComponentForm :visible="showForm" :type-of-component="editing" :rows="rows" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" :title="t('typeOfComponent.confirmTitle')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        {{ t('typeOfComponent.confirmBefore') }} <b>{{ deleting.name }}</b> {{ t('typeOfComponent.confirmAfter') }}
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { isDuplicate, isStillReferenced } from '../../../../api/apiError'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { currentIntlLocale } from '../../../../i18n'
import TypeOfComponentForm from './TypeOfComponentForm.vue'
import { createTypeOfComponent, deleteTypeOfComponent, listTypeOfComponent, updateTypeOfComponent } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdDataTable, MdDropdown, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { t } = useI18n()
const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const columns = computed(() => [
  { key: 'name', label: t('typeOfComponent.col.name') },
  { key: 'detail', label: t('typeOfComponent.col.detail'), sortValue: (r) => r.detail || '' },
  { key: 'notes', label: t('typeOfComponent.col.notes'), sortValue: (r) => r.notes || '' },
  { key: 'created_at', label: t('typeOfComponent.col.createdAt'), sortValue: (r) => r.created_at || '' },
  { key: 'updated_at', label: t('typeOfComponent.col.updatedAt'), sortValue: (r) => r.updated_at || '' }
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
  detail: { label: () => t('typeOfComponent.info.detail'), test: (r) => !!r.detail },
  nodetail: { label: () => t('typeOfComponent.info.nodetail'), test: (r) => !r.detail },
  notes: { label: () => t('typeOfComponent.info.notes'), test: (r) => !!r.notes },
  recent: { label: () => t('typeOfComponent.info.recent'), test: (r) => Date.now() - new Date(r.updated_at || r.created_at || 0).getTime() <= 30 * DAY }
}
const count = (k) => rows.value.filter(INFO[k].test).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const infoOptions = computed(() => Object.entries(INFO).map(([value, o]) => ({ value, label: o.label(), count: count(value) })))

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || [r.name, r.detail, r.notes].some((v) => String(v || '').toLowerCase().includes(q))) &&
    filterInfo.value.every((k) => INFO[k].test(r))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterInfo.value.forEach((k) => c.push({ key: `i-${k}`, label: INFO[k].label(), remove: () => (filterInfo.value = filterInfo.value.filter((x) => x !== k)) }))
  return c
})

function clearAll() {
  search.value = ''
  filterInfo.value = []
}
const only = (k) => filterInfo.value.length === 1 && filterInfo.value[0] === k
function quick(k) {
  filterInfo.value = only(k) ? [] : [k]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listTypeOfComponent()
  } catch (err) {
    console.error('[TypeOfComponent] Failed to load:', err)
    fetchError.value = err?.message || t('typeOfComponent.loadFailed')
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
      await updateTypeOfComponent(editing.value.id, formData)
      showToast(t('typeOfComponent.toastUpdated'))
    } else {
      await createTypeOfComponent(formData)
      showToast(t('typeOfComponent.toastCreated'))
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TypeOfComponent] Save failed:', err)
    actionError.value = isDuplicate(err)
      ? t('typeOfComponent.nameTaken', { name: formData.name })
      : err?.message || t('typeOfComponent.saveFailed')
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
    await deleteTypeOfComponent(deleting.value.id)
    deleting.value = null
    showToast(t('typeOfComponent.toastDeleted'))
    await loadData()
  } catch (err) {
    console.error('[TypeOfComponent] Delete failed:', err)
    deleteError.value = isStillReferenced(err)
      ? t('typeOfComponent.inUse')
      : err?.message || t('typeOfComponent.deleteFailed')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
