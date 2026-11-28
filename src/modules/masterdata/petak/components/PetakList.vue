<template>
  <MdPage :title="t('petak.title')" :description="t('petak.description')">
    <template #actions>
      <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />{{ t('petak.add') }}</button>
    </template>

    <div class="md-kpis">
      <MdKpi icon="map" tone="info" :label="t('petak.kpi.total')" :value="rows.length" :sub="t('petak.kpi.totalSub', { n: blokOptions.length })" action :hint="t('petak.ui.showAll')" :pressed="false" @select="clearStatus" />
      <MdKpi icon="leaf" tone="success" :label="t('petak.kpi.tm')" :value="count('TM')" :sub="t('petak.kpi.tmSub', { n: pct(count('TM')) })" action :pressed="onlyStatus('TM')" @select="quickStatus('TM')" />
      <MdKpi icon="tree" tone="warning" :label="t('petak.kpi.tbm')" :value="count('TBM')" :sub="t('petak.kpi.tbmSub', { n: count('-') })" action :pressed="onlyStatus('TBM')" @select="quickStatus('TBM')" />
      <MdKpi icon="pin" tone="brand" :label="t('petak.kpi.tph')" :value="fmt(totalTph)" :sub="t('petak.kpi.tphSub', { n: fmt(totalTrees) })" action :hint="t('petak.ui.sort')" @select="table?.setSort('tph', -1)" />
    </div>

    <MdBarChart
      :title="t('petak.chart.title')"
      :subtitle="t('petak.chart.subtitle', { petak: rows.length, blok: blokOptions.length })"
      :legend="[{ label: 'TM', color: 'var(--success)' }, { label: 'TBM', color: '#f59e0b' }, { label: t('petak.status.notSet'), color: 'var(--border-strong)' }]"
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
      :entity-label="t('petak.entity')"
      empty-icon="map"
      :empty-text="t('petak.empty')"
      :add-label="t('petak.add')"
      :can-add="canWrite"
      initial-sort="name"
      :aria-label="t('petak.aria')"
      @retry="loadData"
      @add="openCreate"
      @clear-filters="clearAll">
      <template #toolbar>
        <label class="md-search">
          <MdIcon name="search" />
          <input v-model.trim="search" type="search" :placeholder="t('petak.searchPlaceholder')" :aria-label="t('petak.searchAria')" />
        </label>
        <MdDropdown v-model="filterBlok" :label="t('petak.filter.blok')" :options="blokFilterOptions" multiple />
        <MdDropdown v-model="filterStatus" :label="t('petak.ui.status')" :options="statusFilterOptions" multiple />
        <MdDropdown :label="t('petak.filter.year')" :active="!!(yearFrom || yearTo)" :summary-text="yearSummary">
          <div style="padding: 8px 10px 6px; display: flex; gap: 8px">
            <MdField :label="t('petak.filter.from')" for-id="petak-y0">
              <input id="petak-y0" v-model.trim="yearFrom" class="md-input" inputmode="numeric" placeholder="2010" style="width: 96px" />
            </MdField>
            <MdField :label="t('petak.filter.to')" for-id="petak-y1">
              <input id="petak-y1" v-model.trim="yearTo" class="md-input" inputmode="numeric" :placeholder="String(thisYear)" style="width: 96px" />
            </MdField>
          </div>
          <div class="md-menu__sep" />
          <button type="button" class="md-opt" @click="yearFrom = yearTo = ''">{{ t('petak.filter.clearRange') }}</button>
        </MdDropdown>
        <div class="md-chips">
          <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="t('petak.ui.removeFilter', { label: c.label })" @click="c.remove()">
            {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
          </button>
          <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">{{ t('petak.ui.clearAll') }}</button>
        </div>
      </template>

      <template #cell-name="{ row }">
        <div class="md-ident">
          <span class="md-avatar">{{ suffix(row.name) }}</span>
          <div><b>{{ row.name }}</b><small>{{ row.block_group ? t('petak.blokLabel', { name: row.block_group }) : t('petak.noBlok') }}</small></div>
        </div>
      </template>
      <template #cell-planting_status="{ row }">
        <MdBadge :tone="statusTone(row.planting_status)" :title="isAutoTm(row) ? t('petak.status.autoTitle') : undefined">
          {{ statusLabel(row) }}
        </MdBadge>
      </template>
      <template #cell-planting_year="{ row }">
        <template v-if="row.planting_year"><span class="md-num">{{ row.planting_year }}</span> <span class="md-muted">· {{ t('petak.yearsAbbr', { n: thisYear - row.planting_year }) }}</span></template>
        <span v-else class="md-muted">—</span>
      </template>
      <template #cell-wide="{ row }">
        <template v-if="row.wide != null"><span class="md-num">{{ fmtDec(row.wide) }}</span> ha</template>
        <span v-else class="md-muted">—</span>
      </template>
      <template #cell-tph="{ row }">
        <span class="md-num" :title="t('petak.tphTitle', { p: row.tph_perawatan_count || 0, h: row.tph_panen_count || 0 })">{{ tphOf(row) }}</span>
      </template>
      <template #cell-plants_count="{ row }">
        <MdBarCell :value="row.plants_count" :max="maxTrees" />
      </template>
      <template #cell-updated_by="{ row }">
        <span class="md-muted">{{ userName(row.updated_by || row.created_by) }}</span>
      </template>

      <template v-if="canWrite" #actions="{ row }">
        <button type="button" class="md-icon-btn" :aria-label="t('petak.editAria', { name: row.name })" @click="openEdit(row)"><MdIcon name="edit" /></button>
        <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="t('petak.deleteAria', { name: row.name })" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
      </template>

      <template #card="{ row }">
        <div class="md-card__top">
          <span class="md-avatar">{{ suffix(row.name) }}</span>
          <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.block_group ? t('petak.blokLabel', { name: row.block_group }) : t('petak.noBlok') }}</div></div>
          <MdBadge :tone="statusTone(row.planting_status)">{{ statusLabel(row) }}</MdBadge>
        </div>
        <div class="md-card__grid">
          <div>{{ t('petak.col.year') }}<b>{{ row.planting_year || '—' }}</b></div>
          <div>TPH<b>{{ tphOf(row) }}</b></div>
          <div>{{ t('petak.col.wide') }}<b>{{ row.wide != null ? `${fmtDec(row.wide)} ha` : '—' }}</b></div>
          <div>{{ t('petak.col.trees') }}<b>{{ fmt(row.plants_count) }}</b></div>
        </div>
      </template>
    </MdDataTable>

    <PetakForm :visible="showForm" :petak="editing" :rows="rows" :submitting="submitting" :error="actionError || ''" @submit="onFormSubmit" @cancel="closeForm" />

    <MdConfirm :open="!!deleting" :title="t('petak.confirm.title')" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
      <template v-if="deleting">
        <i18n-t keypath="petak.confirm.body" scope="global">
          <template #name><b>{{ deleting.name }}</b></template>
          <template #blok>{{ deleting.block_group ? t('petak.confirm.blokSuffix', { b: deleting.block_group }) : '' }}</template>
        </i18n-t>
        <i18n-t v-if="tphOf(deleting)" keypath="petak.confirm.hasTph" scope="global">
          <template #n><b>{{ t('petak.confirm.tphCount', { n: tphOf(deleting) }) }}</b></template>
        </i18n-t>
      </template>
    </MdConfirm>
  </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import PetakForm from './PetakForm.vue'
import { listPetak, createPetak, updatePetak, deletePetak } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { currentIntlLocale } from '../../../../i18n'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdBarCell, MdConfirm, MdField, MdIcon } from '../../../shared/masterdata-ui'

const { t, locale } = useI18n()
const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()
const thisYear = new Date().getFullYear()

const columns = computed(() => [
  { key: 'name', label: t('petak.col.name') },
  { key: 'planting_status', label: t('petak.col.status'), sortValue: (r) => r.planting_status || '' },
  { key: 'planting_year', label: t('petak.col.year') },
  { key: 'wide', label: t('petak.col.wide'), sortValue: (r) => (r.wide == null ? null : Number(r.wide)) },
  { key: 'tph', label: t('petak.col.tph'), sortValue: (r) => tphOf(r) },
  { key: 'plants_count', label: t('petak.col.trees') },
  { key: 'updated_by', label: t('petak.ui.updatedBy'), sortable: false }
])

const table = ref(null)
const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)
const search = ref('')
const filterBlok = ref([])
const filterStatus = ref([])
const yearFrom = ref('')
const yearTo = ref('')
const showForm = ref(false)
const editing = ref(null)
const deleting = ref(null)

// locale.value dibaca agar template ikut diperbarui saat bahasa berganti.
const fmt = (n) => (locale.value, n == null ? '—' : Number(n).toLocaleString(currentIntlLocale()))
const fmtDec = (n) => (locale.value, Number(n).toLocaleString(currentIntlLocale(), { maximumFractionDigits: 2 }))
const suffix = (name) => String(name || '').replace(/^\d+/, '') || '#'
const tphOf = (r) => (r?.tph_perawatan_count || 0) + (r?.tph_panen_count || 0)
const statusKey = (r) => r.planting_status || '-'
const isAutoTm = (r) => r.planting_status === 'TM' && r.planting_status_manual !== 'TM'
const statusTone = (s) => (s === 'TM' ? 'success' : s === 'TBM' ? 'warning' : 'neutral')
const statusLabel = (r) => (r.planting_status ? (isAutoTm(r) ? t('petak.status.auto', { s: r.planting_status }) : r.planting_status) : t('petak.status.notSet'))
const count = (s) => rows.value.filter((r) => statusKey(r) === s).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })

const blokOptions = computed(() => [...new Set(rows.value.map((r) => r.block_group).filter(Boolean))].sort(byName))
const blokFilterOptions = computed(() =>
  blokOptions.value.map((b) => ({ value: b, label: t('petak.blokLabel', { name: b }), count: rows.value.filter((r) => r.block_group === b).length }))
)
const statusFilterOptions = computed(() => [
  { value: 'TM', label: t('petak.status.tmOpt'), count: count('TM') },
  { value: 'TBM', label: t('petak.status.tbmOpt'), count: count('TBM') },
  { value: '-', label: t('petak.status.notSet'), count: count('-') }
])
const totalTph = computed(() => rows.value.reduce((s, r) => s + tphOf(r), 0))
const totalTrees = computed(() => rows.value.reduce((s, r) => s + (r.plants_count || 0), 0))
const maxTrees = computed(() => Math.max(1, ...rows.value.map((r) => r.plants_count || 0)))

const bars = computed(() =>
  blokOptions.value.map((b) => {
    const rs = rows.value.filter((r) => r.block_group === b)
    const tm = rs.filter((r) => r.planting_status === 'TM').length
    const tbm = rs.filter((r) => r.planting_status === 'TBM').length
    return {
      key: b,
      label: b,
      ariaLabel: t('petak.chart.barAria', { b, n: rs.length, tm, tbm }),
      segments: [
        { value: tm, color: 'var(--success)' },
        { value: tbm, color: '#f59e0b' },
        { value: rs.length - tm - tbm, color: 'var(--border-strong)' }
      ]
    }
  })
)

const yearSummary = computed(() => (yearFrom.value || yearTo.value ? `${yearFrom.value || '…'}–${yearTo.value || '…'}` : t('petak.filter.all')))

const filteredRows = computed(() => {
  const q = search.value.toLowerCase()
  const y0 = Number(yearFrom.value) || null
  const y1 = Number(yearTo.value) || null
  return rows.value.filter((r) =>
    (!q || `${r.name} blok ${r.block_group || ''}`.toLowerCase().includes(q)) &&
    (!filterBlok.value.length || filterBlok.value.includes(r.block_group)) &&
    (!filterStatus.value.length || filterStatus.value.includes(statusKey(r))) &&
    (!y0 || (r.planting_year ?? 0) >= y0) &&
    (!y1 || (r.planting_year ?? 9999) <= y1)
  )
})

const chips = computed(() => {
  const c = []
  if (search.value) c.push({ key: 'q', label: `“${search.value}”`, remove: () => (search.value = '') })
  filterBlok.value.forEach((b) => c.push({ key: `b-${b}`, label: t('petak.blokLabel', { name: b }), remove: () => (filterBlok.value = filterBlok.value.filter((x) => x !== b)) }))
  filterStatus.value.forEach((s) => c.push({ key: `s-${s}`, label: s === '-' ? t('petak.status.notSet') : s, remove: () => (filterStatus.value = filterStatus.value.filter((x) => x !== s)) }))
  if (yearFrom.value || yearTo.value) c.push({ key: 'y', label: t('petak.filter.yearChip', { range: yearSummary.value }), remove: () => (yearFrom.value = yearTo.value = '') })
  return c
})

function clearAll() {
  search.value = ''
  filterBlok.value = []
  filterStatus.value = []
  yearFrom.value = ''
  yearTo.value = ''
}
const onlyStatus = (s) => filterStatus.value.length === 1 && filterStatus.value[0] === s
function quickStatus(s) {
  filterStatus.value = onlyStatus(s) ? [] : [s]
}
function clearStatus() {
  filterStatus.value = []
  filterBlok.value = []
}
function toggleBlok(b) {
  filterBlok.value = filterBlok.value.includes(b) ? filterBlok.value.filter((x) => x !== b) : [...filterBlok.value, b]
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listPetak()
  } catch (err) {
    console.error('[Petak] Failed to load:', err)
    fetchError.value = err?.message || t('petak.error.load')
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

async function onFormSubmit(payload) {
  submitting.value = true
  actionError.value = null
  try {
    if (editing.value?.id) {
      await updatePetak(editing.value.id, payload)
      showToast(t('petak.toast.updated', { name: payload.name }))
    } else {
      await createPetak(payload)
      showToast(t('petak.toast.created', { name: payload.name }))
    }
    closeForm()
    await loadData() // status & jumlah TPH dihitung server
  } catch (err) {
    console.error('[Petak] Save failed:', err)
    actionError.value = err?.message || t('petak.error.save')
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
    const name = deleting.value.name
    await deletePetak(deleting.value.id)
    rows.value = rows.value.filter((r) => r.id !== deleting.value.id)
    deleting.value = null
    showToast(t('petak.toast.deleted', { name }))
  } catch (err) {
    console.error('[Petak] Delete failed:', err)
    deleteError.value = /dirujuk|409/i.test(err?.message || '')
      ? t('petak.error.inUse')
      : err?.message || t('petak.error.delete')
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
