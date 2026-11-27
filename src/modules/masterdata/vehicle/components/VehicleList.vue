<template>
    <MdPage title="Kendaraan" description="Kelola kendaraan angkut kebun: nama, tipe, dan nomor polisi. Klik kartu atau batang grafik untuk menyaring tabel.">
        <template #actions>
            <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Kendaraan</button>
        </template>

        <div class="md-kpis">
            <MdKpi icon="truck" tone="info" label="Total kendaraan" :value="rows.length" :sub="`${typeOptions.length} tipe`" action hint="Tampilkan semua" @select="clearAll" />
            <MdKpi icon="layers" tone="success" label="Tipe terbanyak" :value="topType ? topType.count : 0" :sub="topType ? topType.label : 'Belum ada tipe'" action :pressed="!!topType && onlyType(topType.value)" @select="topType && quickType(topType.value)" />
            <MdKpi icon="alert" tone="warning" label="Tanpa tipe" :value="countByType(NO_TYPE)" :sub="`${pct(countByType(NO_TYPE))}% dari kendaraan`" action :pressed="onlyType(NO_TYPE)" @select="quickType(NO_TYPE)" />
        </div>

        <MdBarChart
            v-if="rows.length && typeOptions.length"
            title="Jumlah kendaraan per tipe"
            :subtitle="`${rows.length} kendaraan dalam ${typeOptions.length} tipe`"
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
            entity-label="Kendaraan"
            empty-icon="truck"
            empty-text="Tambahkan kendaraan pertama agar bisa dipakai di pengangkutan panen."
            add-label="Tambah Kendaraan"
            :can-add="canWrite"
            initial-sort="name"
            aria-label="Daftar kendaraan"
            @retry="loadData"
            @add="openCreate"
            @clear-filters="clearAll">
            <template #toolbar>
                <label class="md-search">
                    <MdIcon name="search" />
                    <input v-model.trim="searchName" type="search" placeholder="Cari nama, tipe, atau nomor polisi…" aria-label="Cari kendaraan" />
                </label>
                <MdDropdown v-model="filterType" label="Tipe" :options="typeFilterOptions" multiple />
                <div class="md-chips">
                    <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="`Hapus filter ${c.label}`" @click="c.remove()">
                        {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
                    </button>
                    <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">Bersihkan semua</button>
                </div>
            </template>

            <template #cell-name="{ row }">
                <div class="md-ident">
                    <span class="md-avatar"><MdIcon name="truck" :size="16" /></span>
                    <div><b>{{ row.name }}</b><small>{{ row.title || '—' }}</small></div>
                </div>
            </template>
            <template #cell-type="{ row }">
                <MdBadge v-if="row.type" tone="info">{{ row.type }}</MdBadge>
                <span v-else class="md-muted">—</span>
            </template>
            <template #cell-plate_number="{ row }">
                <span class="md-num" style="white-space: nowrap">{{ row.plate_number?.trim() || '—' }}</span>
            </template>
            <template #cell-notes="{ row }">
                <span class="md-muted" :title="row.notes || undefined" style="display: inline-block; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom">{{ row.notes || '—' }}</span>
            </template>
            <template #cell-created_by="{ row }">
                <span class="md-muted">{{ userName(row.created_by) }}</span>
            </template>
            <template #cell-updated_by="{ row }">
                <span class="md-muted">{{ userName(row.updated_by) }}</span>
            </template>

            <template v-if="canWrite" #actions="{ row }">
                <button type="button" class="md-icon-btn" :aria-label="`Ubah kendaraan ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
                <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus kendaraan ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
            </template>

            <template #card="{ row }">
                <div class="md-card__top">
                    <span class="md-avatar"><MdIcon name="truck" :size="16" /></span>
                    <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.plate_number?.trim() || '—' }}</div></div>
                    <MdBadge v-if="row.type" tone="info">{{ row.type }}</MdBadge>
                </div>
                <div class="md-card__grid">
                    <div>Judul<b>{{ row.title || '—' }}</b></div>
                    <div>Catatan<b>{{ row.notes || '—' }}</b></div>
                    <div>Dibuat oleh<b>{{ userName(row.created_by) }}</b></div>
                    <div>Diubah oleh<b>{{ userName(row.updated_by) }}</b></div>
                </div>
            </template>
        </MdDataTable>

        <VehicleForm
            :visible="showForm"
            :vehicle="editingVehicle"
            :submitting="submitting"
            :error="actionError || ''"
            :type-suggestions="typeOptions"
            @submit="onFormSubmit"
            @cancel="closeForm" />

        <MdConfirm :open="showDeleteConfirm" title="Hapus kendaraan?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
            <template v-if="deletingVehicle">
                Kendaraan <b>{{ deletingVehicle.name }}</b>{{ deletingVehicle.plate_number?.trim() ? ` (${deletingVehicle.plate_number.trim()})` : '' }} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </template>
        </MdConfirm>
    </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VehicleForm from './VehicleForm.vue'
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const NO_TYPE = '-'

const columns = [
    { key: 'name', label: 'Nama' },
    { key: 'type', label: 'Tipe' },
    { key: 'plate_number', label: 'Nomor polisi', sortValue: (r) => r.plate_number?.trim() || '' },
    { key: 'notes', label: 'Catatan', sortable: false },
    { key: 'created_by', label: 'Dibuat oleh', sortable: false },
    { key: 'updated_by', label: 'Diubah oleh', sortable: false }
]

const table = ref(null)
const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const deleteError = ref('')
const submitting = ref(false)

const searchName = ref('')
const filterType = ref([])

const showForm = ref(false)
const editingVehicle = ref(null)

const showDeleteConfirm = ref(false)
const deletingVehicle = ref(null)

const typeKey = (r) => r.type?.trim() || NO_TYPE
const countByType = (t) => rows.value.filter((r) => typeKey(r) === t).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })

const typeOptions = computed(() => [...new Set(rows.value.map((r) => r.type?.trim()).filter(Boolean))].sort(byName))
const typeFilterOptions = computed(() => {
    const opts = typeOptions.value.map((t) => ({ value: t, label: t, count: countByType(t) }))
    if (countByType(NO_TYPE)) opts.push({ value: NO_TYPE, label: 'Tanpa tipe', count: countByType(NO_TYPE) })
    return opts
})
const topType = computed(() =>
    typeFilterOptions.value.filter((o) => o.value !== NO_TYPE).reduce((best, o) => (!best || o.count > best.count ? o : best), null)
)

const bars = computed(() =>
    typeFilterOptions.value.map((o) => ({
        key: o.value,
        label: o.label,
        ariaLabel: `${o.label}: ${o.count} kendaraan`,
        segments: [{ value: o.count, color: o.value === NO_TYPE ? 'var(--border-strong)' : 'var(--success)' }]
    }))
)

const filteredRows = computed(() => {
    const q = searchName.value.trim().toLowerCase()
    return rows.value.filter((row) =>
        (!q || row.name?.toLowerCase().includes(q) || row.type?.toLowerCase().includes(q) || row.plate_number?.toLowerCase().includes(q)) &&
        (!filterType.value.length || filterType.value.includes(typeKey(row)))
    )
})

const chips = computed(() => {
    const c = []
    if (searchName.value) c.push({ key: 'q', label: `“${searchName.value}”`, remove: () => (searchName.value = '') })
    filterType.value.forEach((t) => c.push({ key: `t-${t}`, label: t === NO_TYPE ? 'Tanpa tipe' : t, remove: () => (filterType.value = filterType.value.filter((x) => x !== t)) }))
    return c
})

function clearAll() {
    searchName.value = ''
    filterType.value = []
}
const onlyType = (t) => filterType.value.length === 1 && filterType.value[0] === t
function quickType(t) {
    filterType.value = onlyType(t) ? [] : [t]
}
function toggleType(t) {
    filterType.value = filterType.value.includes(t) ? filterType.value.filter((x) => x !== t) : [...filterType.value, t]
}

async function loadData() {
    loading.value = true
    fetchError.value = null
    try {
        rows.value = await listVehicles()
    } catch (err) {
        console.error('[Vehicles] Failed to load:', err)
        fetchError.value = err?.message || 'Gagal memuat kendaraan.'
    } finally {
        loading.value = false
    }
}

function openCreate() {
    editingVehicle.value = null
    actionError.value = null
    showForm.value = true
}

function openEdit(vehicle) {
    editingVehicle.value = { ...vehicle }
    actionError.value = null
    showForm.value = true
}

function closeForm() {
    showForm.value = false
    editingVehicle.value = null
}

async function onFormSubmit(formData) {
    submitting.value = true
    actionError.value = null
    try {
        if (editingVehicle.value?.id) {
            const updated = await updateVehicle(editingVehicle.value.id, formData)
            const idx = rows.value.findIndex((r) => r.id === editingVehicle.value.id)
            if (idx !== -1) rows.value[idx] = updated || { ...rows.value[idx], ...formData }
            showToast('Kendaraan berhasil diubah.')
        } else {
            const created = await createVehicle(formData)
            if (created) rows.value.unshift(created)
            showToast('Kendaraan berhasil ditambahkan.')
        }
        closeForm()
    } catch (err) {
        console.error('[Vehicles] Save failed:', err)
        actionError.value = err?.message || 'Gagal menyimpan data.'
    } finally {
        submitting.value = false
    }
}

function confirmDelete(vehicle) {
    deletingVehicle.value = vehicle
    deleteError.value = ''
    showDeleteConfirm.value = true
}

function closeDelete() {
    showDeleteConfirm.value = false
    deletingVehicle.value = null
    deleteError.value = ''
}

async function onDeleteConfirm() {
    if (!deletingVehicle.value) return
    submitting.value = true
    deleteError.value = ''
    try {
        await deleteVehicle(deletingVehicle.value.id)
        rows.value = rows.value.filter((r) => r.id !== deletingVehicle.value.id)
        showDeleteConfirm.value = false
        deletingVehicle.value = null
        showToast('Kendaraan berhasil dihapus.')
    } catch (err) {
        console.error('[Vehicles] Delete failed:', err)
        deleteError.value = err?.message || 'Gagal menghapus kendaraan.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadData)
</script>
