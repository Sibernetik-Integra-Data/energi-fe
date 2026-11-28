<template>
  <MdPage :title="t('blocks.title')" :description="t('blocks.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('blocks.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="grid" tone="info" :label="t('blocks.kpi.total')" :value="rows.length" :sub="t('blocks.kpi.totalSub', { n: fmt(totalPetak) })" action :hint="t('blocks.ui.showAll')" @select="clearAll" />
      <MdKpi icon="leaf" tone="success" :label="t('blocks.kpi.hasTm')" :value="countStatus('tm')" :sub="t('blocks.kpi.hasTmSub', { n: pct(countStatus('tm')) })" action :pressed="onlyStatus('tm')" @select="quickStatus('tm')" />
      <MdKpi icon="tree" tone="warning" :label="t('blocks.kpi.tbm')" :value="countStatus('tbm')" :sub="t('blocks.kpi.tbmSub', { n: countEmpty })" action :pressed="onlyStatus('tbm')" @select="quickStatus('tbm')" />
      <MdKpi icon="pin" tone="brand" :label="t('blocks.kpi.tph')" :value="fmt(totalTph)" :sub="t('blocks.kpi.tphSub', { n: fmt(totalHarvest) })" action :hint="t('blocks.ui.sort')" @select="table?.setSort('tph_count', -1)" />
    </div>

    <MdBarChart
      v-if="rows.length"
      :title="t('blocks.chart.title')"
      :subtitle="t('blocks.chart.subtitle', { petak: fmt(totalPetak), blok: rows.length })"
      :legend="[{ label: t('blocks.hasTm'), color: 'var(--success)' }, { label: 'TBM', color: '#f59e0b' }]"
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
      :entity-label="t('blocks.entity')"
      empty-icon="grid"
      :empty-text="t('blocks.empty')"
      :add-label="t('blocks.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('blocks.aria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('blocks.searchPlaceholder')" :aria-label="t('blocks.searchAria')" />
        </label>
        <MdDropdown v-model="filterStatus" :label="t('blocks.ui.status')" :options="statusFilterOptions" multiple />
        <MdDropdown v-model="filterPetak" :label="t('blocks.filter.petak')" :options="petakFilterOptions" />
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('blocks.ui.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('blocks.ui.clearAll') }}</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ row.name }}</span>
          <div><b>{{ t('blocks.blokLabel', { name: row.name }) }}</b><small>{{ t('blocks.petakCount', { n: row.block_count || 0 }) }}</small></div>
        </div>
      </template>
      <template #cell-block_count="{ row }"><span class="md-num">{{ row.block_count || 0 }}</span></template>
      <template #cell-tph_count="{ row }"><span class="md-num">{{ row.tph_count || 0 }}</span></template>
      <template #cell-tree_count="{ row }"><MdBarCell :value="row.tree_count" :max="maxTrees" /></template>
      <template #cell-tree_harvest_count="{ row }"><span class="md-num">{{ fmt(row.tree_harvest_count) }}</span></template>
      <template #cell-has_tm="{ row }">
        <MdBadge :tone="row.has_tm ? 'success' : 'warning'">{{ row.has_tm ? t('blocks.hasTm') : 'TBM' }}</MdBadge>
      </template>
      <template #cell-notes="{ row }">
        <span class="md-muted" :title="row.notes || undefined" style="display: inline-block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom">{{ row.notes || '—' }}</span>
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by || row.created_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="t('blocks.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('blocks.deleteAria', { name: row.name })" :disabled="row.block_count > 0" :title="row.block_count > 0 ? t('blocks.deleteBlocked') : undefined" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ row.name }}</span>
          <div style="flex: 1"><b class="md-strong">{{ t('blocks.blokLabel', { name: row.name }) }}</b><div class="md-muted" style="font-size: 12px">{{ t('blocks.updatedByName', { name: userName(row.updated_by || row.created_by) }) }}</div></div>
          <MdBadge :tone="row.has_tm ? 'success' : 'warning'">{{ row.has_tm ? t('blocks.hasTm') : 'TBM' }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>{{ t('blocks.col.petak') }}<b>{{ row.block_count || 0 }}</b></div>
          <div>TPH<b>{{ row.tph_count || 0 }}</b></div>
          <div>{{ t('blocks.col.treeCare') }}<b>{{ fmt(row.tree_count) }}</b></div>
          <div>{{ t('blocks.col.treeHarvest') }}<b>{{ fmt(row.tree_harvest_count) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <BlockForm :visible="showForm" :block="editing" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" :title="t('blocks.confirm.title')" :busy="submitting" :blocked="(deleting?.block_count || 0) > 0" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        <i18n-t keypath="blocks.confirm.body" scope="global">
          <template #name><b>{{ t('blocks.blokLabel', { name: deleting.name }) }}</b></template>
        </i18n-t>
        <i18n-t v-if="deleting.block_count > 0" keypath="blocks.confirm.hasPetak" scope="global">
          <template #n><b>{{ t('blocks.petakCount', { n: deleting.block_count }) }}</b></template>
        </i18n-t>
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { isDuplicate, isStillReferenced } from '../../../../api/apiError'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import BlockForm from './BlockForm.vue'
import { listBlocks, createBlock, updateBlock, deleteBlock } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { currentIntlLocale } from '../../../../i18n'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdBarCell, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { t, locale } = useI18n()
const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const columns = computed(() => [
  { key: 'name', label: t('blocks.col.name') },
  { key: 'block_count', label: t('blocks.col.petak'), sortValue: (r) => r.block_count || 0 },
  { key: 'tph_count', label: t('blocks.col.tph'), sortValue: (r) => r.tph_count || 0 },
  { key: 'tree_count', label: t('blocks.col.treeCare'), sortValue: (r) => r.tree_count || 0 },
  { key: 'tree_harvest_count', label: t('blocks.col.treeHarvest'), sortValue: (r) => r.tree_harvest_count || 0 },
  { key: 'has_tm', label: t('blocks.ui.status'), sortValue: (r) => (r.has_tm ? 1 : 0) },
  { key: 'notes', label: t('blocks.ui.notes'), sortable: false },
  { key: 'updated_by', label: t('blocks.ui.updatedBy'), sortable: false }
])

const table = ref(null)
const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)
const search = ref('')
const filterStatus = ref([])
const filterPetak = ref(null)
const filterBlok = ref([])
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

// locale.value dibaca agar template ikut diperbarui saat bahasa berganti.
const fmt = (n) => (locale.value, n == null ? '—' : Number(n).toLocaleString(currentIntlLocale()))
const statusKey = (r) => (r.has_tm ? 'tm' : 'tbm')
const countStatus = (s) => rows.value.filter((r) => statusKey(r) === s).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const byName = (a, b) => String(a.name).localeCompare(String(b.name), 'id', { numeric: true })

const totalPetak = computed(() => rows.value.reduce((s, r) => s + (r.block_count || 0), 0))
const totalTph = computed(() => rows.value.reduce((s, r) => s + (r.tph_count || 0), 0))
const totalHarvest = computed(() => rows.value.reduce((s, r) => s + (r.tree_harvest_count || 0), 0))
const countEmpty = computed(() => rows.value.filter((r) => !r.block_count).length)
const maxTrees = computed(() => Math.max(1, ...rows.value.map((r) => r.tree_count || 0)))

const statusFilterOptions = computed(() => [
  { value: 'tm', label: t('blocks.hasTm'), count: countStatus('tm') },
  { value: 'tbm', label: 'TBM', count: countStatus('tbm') }
])
const petakFilterOptions = computed(() => [
  { value: 'has', label: t('blocks.filter.hasPetak'), count: rows.value.length - countEmpty.value },
  { value: 'empty', label: t('blocks.filter.noPetak'), count: countEmpty.value }
])

const bars = computed(() =>
  rows.value.slice().sort(byName).map((r) => ({
    key: r.name,
    label: r.name,
    ariaLabel: t('blocks.chart.barAria', { name: r.name, n: r.block_count || 0, status: r.has_tm ? t('blocks.chart.barTm') : 'TBM' }),
    segments: [{ value: r.block_count || 0, color: r.has_tm ? 'var(--success)' : '#f59e0b' }]
  }))
)

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter((r) =>
    (!q || `${r.name} ${r.notes || ''}`.toLowerCase().includes(q)) &&
    (!filterStatus.value.length || filterStatus.value.includes(statusKey(r))) &&
    (!filterBlok.value.length || filterBlok.value.includes(r.name)) &&
    (!filterPetak.value || (filterPetak.value === 'has' ? r.block_count > 0 : !r.block_count))
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterStatus.value.forEach((s) => c.push({ key: `s-${s}`, label: s === 'tm' ? t('blocks.hasTm') : 'TBM', remove: () => (filterStatus.value = filterStatus.value.filter((x) => x !== s)) }))
  filterBlok.value.forEach((b) => c.push({ key: `b-${b}`, label: t('blocks.blokLabel', { name: b }), remove: () => (filterBlok.value = filterBlok.value.filter((x) => x !== b)) }))
  if (filterPetak.value) c.push({ key: 'p', label: filterPetak.value === 'has' ? t('blocks.filter.hasPetak') : t('blocks.filter.noPetak'), remove: () => (filterPetak.value = null) })
  return c
})

function clearAll() {
  search.value = ''
  filterStatus.value = []
  filterBlok.value = []
  filterPetak.value = null
}
const onlyStatus = (s) => filterStatus.value.length === 1 && filterStatus.value[0] === s
function quickStatus(s) {
  filterStatus.value = onlyStatus(s) ? [] : [s]
}
function toggleBlok(b) {
  filterBlok.value = filterBlok.value.includes(b) ? filterBlok.value.filter((x) => x !== b) : [...filterBlok.value, b]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listBlocks()
  } catch (err) {
    console.error('[Blocks] Failed to load:', err)
    fetchError.value = err?.message || t('blocks.error.load')
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

const friendly = (err, fallback) => {
  if (isDuplicate(err, /block_group_name_uq|sudah ada/i)) return t('blocks.error.duplicate')
  if (isStillReferenced(err, /dirujuk/i)) return t('blocks.error.inUse')
  return err?.message || fallback
}

async function onFormSubmit(payload) {
  submitting.value = true
  actionError.value = null
  try {
    if (editing.value?.id) {
      await updateBlock(editing.value.id, payload)
      showToast(t('blocks.toast.updated'))
    } else {
      await createBlock(payload)
      showToast(t('blocks.toast.created'))
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[Blocks] Save failed:', err)
    actionError.value = friendly(err, t('blocks.error.save'))
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
    await deleteBlock(deleting.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleting.value.id)
    deleting.value = null
    showToast(t('blocks.toast.deleted'))
  } catch (err) {
    console.error('[Blocks] Delete failed:', err)
    deleteError.value = friendly(err, t('blocks.error.delete'))
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
