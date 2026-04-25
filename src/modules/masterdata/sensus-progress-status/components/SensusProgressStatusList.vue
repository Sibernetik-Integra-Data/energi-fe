<template>
    <div>
        <!-- Header row -->
        <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div>
                <h2 class="text-2xl font-extrabold tracking-tight text-(--text) m-0 mb-1">Sensus Progress Status</h2>
                <p class="text-sm text-(--text-muted) m-0">Manage sensus progress status entries</p>
            </div>
            <button
                type="button"
                class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm"
                @click="openCreate">
                + Add Status
            </button>
        </div>

        <!-- Search bar -->
        <div class="flex flex-wrap gap-3 mb-4">
            <input
                v-model="searchName"
                type="text"
                placeholder="Search status name…"
                class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors w-56"
                aria-label="Search by name" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">
            Loading data&hellip;
        </div>

        <!-- Error -->
        <div v-else-if="fetchError" class="flex justify-center items-center py-16 text-sm text-red-600">
            {{ fetchError }}
        </div>

        <!-- Table desktop -->
        <template v-else>
            <div class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[920px]:hidden">
                <table class="w-full border-collapse table-fixed">
                    <colgroup>
                        <col class="w-20" />
                        <col />
                        <col class="w-40" />
                    </colgroup>
                    <thead>
                        <tr class="border-b border-(--border) bg-(--surface-muted)">
                            <th class="text-xs font-extrabold text-(--text-muted) py-4 px-8 uppercase tracking-widest">#</th>
                            <th class="text-xs font-extrabold text-(--text-muted) py-4 px-8 uppercase tracking-widest">Name</th>
                            <th class="text-xs font-extrabold text-(--text-muted) py-4 px-8 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredRows.length === 0">
                            <td colspan="3" class="py-10 px-6 text-center text-sm text-(--text-muted)">No data.</td>
                        </tr>
                        <tr
                            v-for="(row, index) in filteredRows"
                            :key="row.id"
                            class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors">
                            <td class="py-5 px-8 align-middle text-sm text-(--text-muted) text-center">{{ index + 1 }}</td>
                            <td class="py-5 px-8 align-middle text-sm font-semibold text-(--text) text-center">{{ row.name }}</td>
                            <td class="py-5 px-8 align-middle text-center">
                                <div class="flex gap-3 items-center justify-center">
                                    <button
                                        type="button"
                                        class="text-sm py-1.5 px-4 rounded-lg font-semibold text-(--text) bg-transparent border-0 hover:bg-(--surface-muted) transition-colors cursor-pointer"
                                        @click="openEdit(row)">
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        class="text-sm py-1.5 px-4 rounded-full border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                                        @click="confirmDelete(row)">
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Mobile cards -->
            <div class="hidden gap-3 max-[920px]:flex max-[920px]:flex-col">
                <div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">No data.</div>
                <div
                    v-for="row in filteredRows"
                    :key="row.id"
                    class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div class="font-bold text-sm text-(--text)">{{ row.name }}</div>
                    <div class="text-xs text-(--text-muted) flex flex-wrap gap-x-4 gap-y-1">
                        <span v-if="row.detail">Detail: {{ row.detail }}</span>
                        <span v-if="row.created_by">By: {{ row.created_by }}</span>
                        <span v-if="row.created_at">Created: {{ formatDateTime(row.created_at) }}</span>
                    </div>
                    <div class="flex justify-end gap-2 mt-1">
                        <button
                            type="button"
                            class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) border border-(--border) bg-(--surface) hover:bg-(--surface-muted) transition-colors cursor-pointer"
                            @click="openEdit(row)">
                            Edit
                        </button>
                        <button
                            type="button"
                            class="text-sm py-1.5 px-3 rounded-lg border-0 bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                            @click="confirmDelete(row)">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <!-- Action Error (outside modal) -->
        <div v-if="actionError && !showDeleteConfirm" class="mt-3 text-xs text-red-500">{{ actionError }}</div>

        <!-- Form Modal -->
        <SensusProgressStatusForm
            :visible="showForm"
            :status="editingStatus"
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
                    <h3 class="text-base font-bold text-(--text) m-0">Delete Status</h3>
                    <p class="text-sm text-(--text-muted) m-0">
                        Delete status <strong>{{ deletingStatus?.name }}</strong>? This action cannot be undone.
                    </p>
                    <div v-if="actionError" class="text-xs text-red-500">{{ actionError }}</div>
                    <div class="flex justify-end gap-3">
                        <button
                            type="button"
                            class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            :disabled="submitting"
                            @click="showDeleteConfirm = false">
                            Cancel
                        </button>
                        <button
                            type="button"
                            class="border-0 bg-red-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-red-700 transition-colors disabled:opacity-60"
                            :disabled="submitting"
                            @click="onDeleteConfirm">
                            <span v-if="submitting">Deleting&hellip;</span>
                            <span v-else>Yes, Delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SensusProgressStatusForm from './SensusProgressStatusForm.vue'
import { listSensusProgressStatus, createSensusProgressStatus, updateSensusProgressStatus, deleteSensusProgressStatus } from '../model'
import { useToast } from '../../../../utils/toast'

const { show: showToast } = useToast()

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const submitting = ref(false)

const searchName = ref('')

const showForm = ref(false)
const editingStatus = ref(null)

const showDeleteConfirm = ref(false)
const deletingStatus = ref(null)

const filteredRows = computed(() => {
    const q = searchName.value.trim().toLowerCase()
    if (!q) return rows.value
    return rows.value.filter(row => row.name?.toLowerCase().includes(q))
})

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
        rows.value = await listSensusProgressStatus()
    } catch (err) {
        console.error('[SensusProgressStatus] Failed to load:', err)
        fetchError.value = err?.message || 'Failed to load data.'
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
            const idx = rows.value.findIndex(r => r.id === editingStatus.value.id)
            if (idx !== -1) rows.value[idx] = updated || { ...rows.value[idx], ...formData }
            showToast('Status updated successfully.')
        } else {
            const created = await createSensusProgressStatus(formData)
            if (created) rows.value.unshift(created)
            showToast('Status created successfully.')
        }
        closeForm()
    } catch (err) {
        console.error('[SensusProgressStatus] Save failed:', err)
        actionError.value = err?.message || 'Failed to save data.'
    } finally {
        submitting.value = false
    }
}

function confirmDelete(status) {
    deletingStatus.value = status
    actionError.value = null
    showDeleteConfirm.value = true
}

async function onDeleteConfirm() {
    if (!deletingStatus.value) return
    submitting.value = true
    actionError.value = null
    try {
        await deleteSensusProgressStatus(deletingStatus.value.id)
        rows.value = rows.value.filter(r => r.id !== deletingStatus.value.id)
        showDeleteConfirm.value = false
        deletingStatus.value = null
        showToast('Status deleted successfully.')
    } catch (err) {
        console.error('[SensusProgressStatus] Delete failed:', err)
        actionError.value = err?.message || 'Failed to delete status.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadData)
</script>
