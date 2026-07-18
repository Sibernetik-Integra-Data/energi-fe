<template>
    <div>
        <!-- Header row -->
        <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div>
                <h2 class="text-2xl font-semibold tracking-tight text-(--text) m-0 mb-1">Aktifitas Kebun</h2>
                <p class="text-sm text-(--text-muted) m-0">Manage type of work</p>
            </div>
            <button
                type="button"
                class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm"
                @click="openCreate">
                + Add Activity
            </button>
        </div>

        <!-- Filter bar -->
        <div class="flex flex-wrap gap-3 mb-4">
            <input
                v-model="searchName"
                type="text"
                placeholder="Search activity name…"
                class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors w-56" />
            <select
                v-model="filterGroup"
                class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors">
                <option value="">All Groups</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
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
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="border-b border-(--border) bg-(--surface-muted)">
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Name</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Group</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Detail</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Upload</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Created By</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Updated By</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredRows.length === 0">
                            <td colspan="7" class="py-10 px-6 text-center text-sm text-(--text-muted)">No data.</td>
                        </tr>
                        <tr
                            v-for="row in filteredRows"
                            :key="row.id"
                            class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors">
                            <td class="py-4 px-6 align-middle text-sm font-semibold text-(--text)">{{ row.name }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text)">{{ row.group_of_work_name || '' }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text-muted) max-w-xs truncate">{{ row.detail || '' }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text)">
                                <span
                                    :class="row.is_upload ? 'bg-green-100 text-green-700' : 'bg-(--surface-muted) text-(--text-muted)'"
                                    class="text-xs font-semibold px-2.5 py-1 rounded-full">
                                    {{ row.is_upload ? 'Yes' : 'No' }}
                                </span>
                            </td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text-muted)">{{ row.created_by || '-' }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text-muted)">{{ row.updated_by || '-' }}</td>
                            <td class="py-4 px-6 align-middle">
                                <div class="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border-0 hover:bg-(--surface-muted) transition-colors cursor-pointer"
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
                        <span v-if="row.group_of_work_name">Group: {{ row.group_of_work_name }}</span>
                        <span v-if="row.detail">Detail: {{ row.detail }}</span>
                        <span>Upload: {{ row.is_upload ? 'Yes' : 'No' }}</span>
                        <span>Created by: {{ row.created_by || '-' }}</span>
                        <span>Updated by: {{ row.updated_by || '-' }}</span>
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

        <!-- Kebun Form Modal -->
        <KebunForm
            :visible="showForm"
            :activity="editingActivity"
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
                    <h3 class="text-base font-bold text-(--text) m-0">Delete Activity</h3>
                    <p class="text-sm text-(--text-muted) m-0">
                        Delete activity <strong>{{ deletingActivity?.name }}</strong>? This action cannot be undone.
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
import KebunForm from './KebunForm.vue'
import { listTypeOfWork, createTypeOfWork, updateTypeOfWork, deleteTypeOfWork, listGroupOfWork } from '../model'
import { useToast } from '../../../../utils/toast'

const { show: showToast } = useToast()

const rows = ref([])
const groups = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const submitting = ref(false)

const searchName = ref('')
const filterGroup = ref('')

const showForm = ref(false)
const editingActivity = ref(null)

const showDeleteConfirm = ref(false)
const deletingActivity = ref(null)

const filteredRows = computed(() => {
    let result = rows.value
    const q = searchName.value.trim().toLowerCase()
    if (q) result = result.filter(row => row.name?.toLowerCase().includes(q))
    if (filterGroup.value !== '') result = result.filter(row => String(row.group_of_work) === String(filterGroup.value))
    return result
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
        const [typeOfWorkList, groupList] = await Promise.all([
            listTypeOfWork(),
            listGroupOfWork()
        ])
        rows.value = typeOfWorkList
        groups.value = groupList
    } catch (err) {
        console.error('[AktifitasKebun] Failed to load:', err)
        fetchError.value = err?.message || 'Failed to load data.'
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
        const grp = groups.value.find(g => String(g.id) === String(record.group_of_work))
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
            const idx = rows.value.findIndex(r => r.id === editingActivity.value.id)
            if (idx !== -1) {
                const merged = updated || { ...rows.value[idx], ...formData }
                rows.value[idx] = enrichWithGroupName(merged)
            }
            showToast('Activity updated successfully.')
        } else {
            const created = await createTypeOfWork(formData)
            if (created) rows.value.unshift(enrichWithGroupName(created))
            showToast('Activity created successfully.')
        }
        closeForm()
    } catch (err) {
        console.error('[AktifitasKebun] Save failed:', err)
        actionError.value = err?.message || 'Failed to save data.'
    } finally {
        submitting.value = false
    }
}

function confirmDelete(activity) {
    deletingActivity.value = activity
    actionError.value = null
    showDeleteConfirm.value = true
}

async function onDeleteConfirm() {
    if (!deletingActivity.value) return
    submitting.value = true
    actionError.value = null
    try {
        await deleteTypeOfWork(deletingActivity.value.id)
        rows.value = rows.value.filter(r => r.id !== deletingActivity.value.id)
        showDeleteConfirm.value = false
        deletingActivity.value = null
        showToast('Activity deleted successfully.')
    } catch (err) {
        console.error('[AktifitasKebun] Delete failed:', err)
        actionError.value = err?.message || 'Failed to delete activity.'
    } finally {
        submitting.value = false
    }
}

onMounted(loadData)
</script>
