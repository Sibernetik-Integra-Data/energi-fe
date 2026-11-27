<template>
    <div>
        <!-- Header row -->
        <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div>
                <h2 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0 mb-1">Daftar Kendaraan</h2>
                <p class="text-sm text-(--text-muted) m-0">Kelola kendaraan</p>
            </div>
            <button
                type="button"
                class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm"
                v-if="canWrite" @click="openCreate">
                + Tambah Kendaraan
            </button>
        </div>

        <!-- Search bar -->
        <div class="flex flex-wrap gap-3 mb-4">
            <input
                v-model="searchName"
                type="text"
                placeholder="Cari nama atau tipe…"
                class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors w-64" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">
            Memuat data&hellip;
        </div>

        <!-- Error -->
        <div v-else-if="fetchError" class="flex justify-center items-center py-16 text-sm text-red-600">
            {{ fetchError }}
        </div>

        <!-- Table desktop -->
        <template v-else>
            <div class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[920px]:hidden">
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="border-b border-(--border) bg-(--surface-muted)">
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Nama</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Judul</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Tipe</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Nomor Polisi</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Catatan</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Dibuat Oleh</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Diubah Oleh</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredRows.length === 0">
                            <td colspan="8" class="py-10 px-6 text-center text-sm text-(--text-muted)">Belum ada data.</td>
                        </tr>
                        <tr
                            v-for="row in paginatedRows"
                            :key="row.id"
                            class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors">
                            <td class="py-4 px-6 align-middle text-sm font-semibold text-(--text)">{{ row.name }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text)">{{ row.title || '' }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text)">{{ row.type || '' }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text) whitespace-nowrap">{{ row.plate_number?.trim() || '-' }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text-muted) max-w-xs truncate">{{ row.notes || '' }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text-muted)">{{ userName(row.created_by) }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text-muted)">{{ userName(row.updated_by) }}</td>
                            <td class="py-4 px-6 align-middle">
                                <div class="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border-0 hover:bg-(--surface-muted) transition-colors cursor-pointer"
                                        v-if="canWrite" @click="openEdit(row)">
                                        Ubah
                                    </button>
                                    <button
                                        type="button"
                                        class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                                        v-if="canWrite" @click="confirmDelete(row)">
                                        Hapus
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Mobile cards -->
            <div class="hidden gap-3 max-[920px]:flex max-[920px]:flex-col">
                <div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">Belum ada data.</div>
                <div
                    v-for="row in paginatedRows"
                    :key="row.id"
                    class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div class="font-bold text-sm text-(--text)">{{ row.name }}</div>
                    <div class="text-xs text-(--text-muted) flex flex-wrap gap-x-4 gap-y-1">
                        <span v-if="row.title">Judul: {{ row.title }}</span>
                        <span v-if="row.type">Tipe: {{ row.type }}</span>
                        <span v-if="row.plate_number?.trim()">Nomor polisi: {{ row.plate_number.trim() }}</span>
                        <span v-if="row.notes">Catatan: {{ row.notes }}</span>
                        <span>Dibuat oleh: {{ userName(row.created_by) }}</span>
                        <span>Diubah oleh: {{ userName(row.updated_by) }}</span>
                    </div>
                    <div class="flex justify-end gap-2 mt-1">
                        <button
                            type="button"
                            class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-(--border) bg-(--surface) hover:bg-(--surface-muted) transition-colors cursor-pointer"
                            v-if="canWrite" @click="openEdit(row)">
                            Ubah
                        </button>
                        <button
                            type="button"
                            class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                            v-if="canWrite" @click="confirmDelete(row)">
                            Hapus
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <!-- Action Error (outside modal) -->
        <div v-if="actionError && !showDeleteConfirm" class="mt-3 text-xs text-red-500">{{ actionError }}</div>

        <!-- Vehicle Form Modal -->
        <VehicleForm
            :visible="showForm"
            :vehicle="editingVehicle"
            :submitting="submitting"
            @submit="onFormSubmit"
            @cancel="closeForm" />

        <!-- Delete Confirmation Modal -->
        <Teleport to="body">
            <div
                v-if="showDeleteConfirm"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                @mousedown.self="showDeleteConfirm = false">
                <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
                    <h3 class="text-base font-bold text-(--text) m-0">Hapus Kendaraan</h3>
                    <p class="text-sm text-(--text-muted) m-0">Hapus Kendaraan <strong>{{ deletingVehicle?.name }}</strong>? Tindakan ini tidak bisa dibatalkan.</p>
                    <div v-if="actionError" class="text-xs text-red-500">{{ actionError }}</div>
                    <div class="flex justify-end gap-3">
                        <button
                            type="button"
                            class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            :disabled="submitting"
                            @click="showDeleteConfirm = false">
                            Batal
                        </button>
                        <button
                            type="button"
                            class="border-0 bg-red-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-60"
                            :disabled="submitting"
                            @click="onDeleteConfirm">
                            <span v-if="submitting">Menghapus&hellip;</span>
                            <span v-else>Ya, Hapus</span>
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
        <MasterDataPagination id="vehicle" :total-items="totalItems" :current-page="currentPage" :page-size="pageSize" :total-pages="totalPages" :visible-pages="visiblePages" @update:current-page="currentPage = $event" @update:page-size="pageSize = $event" />
</template>

<script setup>
import { useUserNames } from '../../../../auth/useUserNames'
const { userName } = useUserNames()
import { useCanManageMasterData } from '../../../../auth/useMasterAccess'
// Owner/Admin boleh mengubah; peran lain hanya melihat (server tetap memeriksa).
const canWrite = useCanManageMasterData()
import { ref, computed, onMounted } from 'vue'
import VehicleForm from './VehicleForm.vue'
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from '../model'
import { useToast } from '../../../../utils/toast'
import { useListPagination } from '../../../shared/pagination/useListPagination.js'
import MasterDataPagination from '../../../shared/pagination/MasterDataPagination.vue'

const { show: showToast } = useToast()

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const submitting = ref(false)

const searchName = ref('')

const showForm = ref(false)
const editingVehicle = ref(null)

const showDeleteConfirm = ref(false)
const deletingVehicle = ref(null)

const filteredRows = computed(() => {
    const q = searchName.value.trim().toLowerCase()
    if (!q) return rows.value
    return rows.value.filter(row =>
        row.name?.toLowerCase().includes(q) || row.type?.toLowerCase().includes(q)
    )
})

const { currentPage, pageSize, totalItems, totalPages, paginatedItems: paginatedRows, visiblePages } = useListPagination(filteredRows)

function formatDateTime(value) {
    if (!value) return ''
    if (typeof value === 'string') {
        return value.replace(/\.\d+/, '').replace(/T/, ' ').replace(/Z$/, '').trim()
    }
    if (value instanceof Date) {
        return value.toISOString().replace(/T/, ' ').replace(/Z$/, '').substring(0, 19)
    }
    return String(value)
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
            const idx = rows.value.findIndex(r => r.id === editingVehicle.value.id)
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
    actionError.value = null
    showDeleteConfirm.value = true
}

async function onDeleteConfirm() {
    if (!deletingVehicle.value) return
    submitting.value = true
    actionError.value = null
    try {
        await deleteVehicle(deletingVehicle.value.id)
        rows.value = rows.value.filter(r => r.id !== deletingVehicle.value.id)
        showDeleteConfirm.value = false
        deletingVehicle.value = null
        showToast('Kendaraan berhasil dihapus.')
    } catch (err) {
        console.error('[Vehicles] Delete failed:', err)
        actionError.value = err?.message || 'Gagal menghapus kendaraan.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadData)
</script>
