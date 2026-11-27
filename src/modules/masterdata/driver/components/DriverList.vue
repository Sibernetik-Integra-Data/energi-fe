<template>
    <MdPage title="Pengemudi" description="Kelola pengemudi angkutan panen beserta lokasi dan kendaraannya. Klik kartu atau batang grafik untuk menyaring tabel.">
        <template #actions>
            <button v-if="canWrite" type="button" class="md-btn md-btn--primary" @click="openCreate"><MdIcon name="plus" />Tambah Pengemudi</button>
        </template>

        <div class="md-kpis">
            <MdKpi icon="users" tone="info" label="Total pengemudi" :value="rows.length" :sub="`${locationOptions.length} lokasi`" action hint="Tampilkan semua" @select="clearAll" />
            <MdKpi icon="truck" tone="success" label="Punya kendaraan" :value="countVehicle('has')" :sub="`${pct(countVehicle('has'))}% dari pengemudi`" action :pressed="filterVehicle === 'has'" @select="quickVehicle('has')" />
            <MdKpi icon="alert" tone="warning" label="Tanpa kendaraan" :value="countVehicle('none')" :sub="`${pct(countVehicle('none'))}% dari pengemudi`" action :pressed="filterVehicle === 'none'" @select="quickVehicle('none')" />
            <MdKpi icon="pin" tone="brand" label="Tanpa lokasi" :value="countLocation(NO_LOC)" :sub="`${pct(countLocation(NO_LOC))}% dari pengemudi`" action :pressed="onlyLocation(NO_LOC)" @select="quickLocation(NO_LOC)" />
        </div>

        <MdBarChart
            v-if="rows.length && locationOptions.length"
            title="Jumlah pengemudi per lokasi"
            :subtitle="`${rows.length} pengemudi di ${locationOptions.length} lokasi`"
            :legend="[{ label: 'Punya kendaraan', color: 'var(--success)' }, { label: 'Tanpa kendaraan', color: 'var(--border-strong)' }]"
            :bars="bars"
            :selected="filterLocation"
            @toggle="toggleLocation" />

        <MdDataTable
            ref="table"
            :columns="columns"
            :rows="filteredRows"
            :total-rows="rows.length"
            :loading="loading"
            :error="fetchError || ''"
            entity-label="Pengemudi"
            empty-icon="users"
            empty-text="Tambahkan pengemudi pertama agar bisa dipakai di pengangkutan panen."
            add-label="Tambah Pengemudi"
            :can-add="canWrite"
            initial-sort="name"
            aria-label="Daftar pengemudi"
            @retry="loadData"
            @add="openCreate"
            @clear-filters="clearAll">
            <template #toolbar>
                <label class="md-search">
                    <MdIcon name="search" />
                    <input v-model.trim="searchName" type="search" placeholder="Cari nama pengemudi…" aria-label="Cari pengemudi" />
                </label>
                <MdDropdown v-model="filterLocation" label="Lokasi" :options="locationFilterOptions" multiple />
                <MdDropdown v-model="filterVehicle" label="Kendaraan" :options="vehicleFilterOptions" />
                <div class="md-chips">
                    <button v-for="c in chips" :key="c.key" type="button" class="md-chip" :aria-label="`Hapus filter ${c.label}`" @click="c.remove()">
                        {{ c.label }}<MdIcon name="x" :size="14" :stroke="2.4" />
                    </button>
                    <button v-if="chips.length > 1" type="button" class="md-btn md-btn--ghost md-btn--sm" @click="clearAll">Bersihkan semua</button>
                </div>
            </template>

            <template #cell-name="{ row }">
                <div class="md-ident">
                    <span class="md-avatar">{{ initials(row.name) }}</span>
                    <div><b>{{ row.name }}</b><small>{{ row.address || '—' }}</small></div>
                </div>
            </template>
            <template #cell-location="{ row }">
                <span v-if="row.location">{{ row.location }}</span><span v-else class="md-muted">—</span>
            </template>
            <template #cell-vehicle="{ row }">
                <span v-if="row.vehicle?.name">{{ row.vehicle.name }}</span>
                <MdBadge v-else tone="neutral">Tanpa kendaraan</MdBadge>
            </template>
            <template #cell-plate="{ row }">
                <span class="md-num" style="white-space: nowrap">{{ row.vehicle?.plate_number?.trim() || '—' }}</span>
            </template>
            <template #cell-created_by="{ row }">
                <span class="md-muted">{{ userName(row.created_by) }}</span>
            </template>
            <template #cell-updated_by="{ row }">
                <span class="md-muted">{{ userName(row.updated_by) }}</span>
            </template>

            <template v-if="canWrite" #actions="{ row }">
                <button type="button" class="md-icon-btn" :aria-label="`Ubah pengemudi ${row.name}`" @click="openEdit(row)"><MdIcon name="edit" /></button>
                <button type="button" class="md-icon-btn md-icon-btn--danger" :aria-label="`Hapus pengemudi ${row.name}`" @click="confirmDelete(row)"><MdIcon name="trash" /></button>
            </template>

            <template #card="{ row }">
                <div class="md-card__top">
                    <span class="md-avatar">{{ initials(row.name) }}</span>
                    <div style="flex: 1"><b class="md-strong">{{ row.name }}</b><div class="md-muted" style="font-size: 12px">{{ row.location || 'Tanpa lokasi' }}</div></div>
                    <MdBadge :tone="row.vehicle?.name ? 'success' : 'neutral'">{{ row.vehicle?.name || 'Tanpa kendaraan' }}</MdBadge>
                </div>
                <div class="md-card__grid">
                    <div>Nomor polisi<b>{{ row.vehicle?.plate_number?.trim() || '—' }}</b></div>
                    <div>Alamat<b>{{ row.address || '—' }}</b></div>
                    <div>Dibuat oleh<b>{{ userName(row.created_by) }}</b></div>
                    <div>Diubah oleh<b>{{ userName(row.updated_by) }}</b></div>
                </div>
            </template>
        </MdDataTable>

        <DriverForm
            :visible="showForm"
            :driver="editingDriver"
            :submitting="submitting"
            :error="actionError || ''"
            @submit="onFormSubmit"
            @cancel="closeForm" />

        <MdConfirm :open="showDeleteConfirm" title="Hapus pengemudi?" :busy="submitting" :error="deleteError" @cancel="closeDelete" @confirm="onDeleteConfirm">
            <template v-if="deletingDriver">
                Pengemudi <b>{{ deletingDriver.name }}</b> akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </template>
        </MdConfirm>
    </MdPage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DriverForm from './DriverForm.vue'
import { listDrivers, createDriver, updateDriver, deleteDriver } from '../model'
import { useToast } from '../../../../utils/toast'
import { useUserNames } from '../../../../auth/useUserNames'
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
import { MdPage, MdKpi, MdBarChart, MdDataTable, MdDropdown, MdBadge, MdConfirm, MdIcon } from '../../../shared/masterdata-ui'

const { userName } = useUserNames()
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
const { show: showToast } = useToast()

const NO_LOC = '-'

const columns = [
    { key: 'name', label: 'Nama' },
    { key: 'location', label: 'Lokasi' },
    { key: 'vehicle', label: 'Kendaraan', sortValue: (r) => r.vehicle?.name || '' },
    { key: 'plate', label: 'Nomor polisi', sortValue: (r) => r.vehicle?.plate_number?.trim() || '' },
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
const filterLocation = ref([])
const filterVehicle = ref(null) // 'has' | 'none' | null

const showForm = ref(false)
const editingDriver = ref(null)

const showDeleteConfirm = ref(false)
const deletingDriver = ref(null)

const initials = (name) => String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
const locKey = (r) => r.location?.trim() || NO_LOC
const hasVehicle = (r) => Boolean(r.vehicle_id ?? r.vehicle?.id)
const countLocation = (l) => rows.value.filter((r) => locKey(r) === l).length
const countVehicle = (k) => rows.value.filter((r) => (k === 'has' ? hasVehicle(r) : !hasVehicle(r))).length
const pct = (n) => (rows.value.length ? Math.round((n / rows.value.length) * 100) : 0)
const byName = (a, b) => String(a).localeCompare(String(b), 'id', { numeric: true })

const locationOptions = computed(() => [...new Set(rows.value.map((r) => r.location?.trim()).filter(Boolean))].sort(byName))
const locationFilterOptions = computed(() => {
    const opts = locationOptions.value.map((l) => ({ value: l, label: l, count: countLocation(l) }))
    if (countLocation(NO_LOC)) opts.push({ value: NO_LOC, label: 'Tanpa lokasi', count: countLocation(NO_LOC) })
    return opts
})
const vehicleFilterOptions = computed(() => [
    { value: 'has', label: 'Punya kendaraan', count: countVehicle('has') },
    { value: 'none', label: 'Tanpa kendaraan', count: countVehicle('none') }
])

const bars = computed(() =>
    locationFilterOptions.value.map((o) => {
        const rs = rows.value.filter((r) => locKey(r) === o.value)
        const withV = rs.filter(hasVehicle).length
        return {
            key: o.value,
            label: o.label,
            ariaLabel: `${o.label}: ${rs.length} pengemudi, ${withV} punya kendaraan`,
            segments: [
                { value: withV, color: 'var(--success)' },
                { value: rs.length - withV, color: 'var(--border-strong)' }
            ]
        }
    })
)

const filteredRows = computed(() => {
    const q = searchName.value.trim().toLowerCase()
    return rows.value.filter((row) =>
        (!q || row.name?.toLowerCase().includes(q)) &&
        (!filterLocation.value.length || filterLocation.value.includes(locKey(row))) &&
        (!filterVehicle.value || (filterVehicle.value === 'has' ? hasVehicle(row) : !hasVehicle(row)))
    )
})

const chips = computed(() => {
    const c = []
    if (searchName.value) c.push({ key: 'q', label: `“${searchName.value}”`, remove: () => (searchName.value = '') })
    filterLocation.value.forEach((l) => c.push({ key: `l-${l}`, label: l === NO_LOC ? 'Tanpa lokasi' : l, remove: () => (filterLocation.value = filterLocation.value.filter((x) => x !== l)) }))
    if (filterVehicle.value) c.push({ key: 'v', label: filterVehicle.value === 'has' ? 'Punya kendaraan' : 'Tanpa kendaraan', remove: () => (filterVehicle.value = null) })
    return c
})

function clearAll() {
    searchName.value = ''
    filterLocation.value = []
    filterVehicle.value = null
}
const onlyLocation = (l) => filterLocation.value.length === 1 && filterLocation.value[0] === l
function quickLocation(l) {
    filterLocation.value = onlyLocation(l) ? [] : [l]
}
function quickVehicle(k) {
    filterVehicle.value = filterVehicle.value === k ? null : k
}
function toggleLocation(l) {
    filterLocation.value = filterLocation.value.includes(l) ? filterLocation.value.filter((x) => x !== l) : [...filterLocation.value, l]
}

async function loadData() {
    loading.value = true
    fetchError.value = null
    try {
        rows.value = await listDrivers()
    } catch (err) {
        console.error('[Drivers] Failed to load:', err)
        fetchError.value = err?.message || 'Gagal memuat pengemudi.'
    } finally {
        loading.value = false
    }
}

function openCreate() {
    editingDriver.value = null
    actionError.value = null
    showForm.value = true
}

function openEdit(driver) {
    editingDriver.value = { ...driver }
    actionError.value = null
    showForm.value = true
}

function closeForm() {
    showForm.value = false
    editingDriver.value = null
}

async function onFormSubmit(formData) {
    submitting.value = true
    actionError.value = null
    try {
        if (editingDriver.value?.id) {
            const updated = await updateDriver(editingDriver.value.id, formData)
            const idx = rows.value.findIndex((r) => r.id === editingDriver.value.id)
            if (idx !== -1) rows.value[idx] = updated || { ...rows.value[idx], ...formData }
            showToast('Pengemudi berhasil diubah.')
        } else {
            const created = await createDriver(formData)
            if (created) rows.value.unshift(created)
            showToast('Pengemudi berhasil ditambahkan.')
        }
        closeForm()
    } catch (err) {
        console.error('[Drivers] Save failed:', err)
        actionError.value = err?.message || 'Gagal menyimpan data.'
    } finally {
        submitting.value = false
    }
}

function confirmDelete(driver) {
    deletingDriver.value = driver
    deleteError.value = ''
    showDeleteConfirm.value = true
}

function closeDelete() {
    showDeleteConfirm.value = false
    deletingDriver.value = null
    deleteError.value = ''
}

async function onDeleteConfirm() {
    if (!deletingDriver.value) return
    submitting.value = true
    deleteError.value = ''
    try {
        await deleteDriver(deletingDriver.value.id)
        rows.value = rows.value.filter((r) => r.id !== deletingDriver.value.id)
        showDeleteConfirm.value = false
        deletingDriver.value = null
        showToast('Pengemudi berhasil dihapus.')
    } catch (err) {
        console.error('[Drivers] Delete failed:', err)
        deleteError.value = err?.message || 'Gagal menghapus pengemudi.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadData)
</script>
