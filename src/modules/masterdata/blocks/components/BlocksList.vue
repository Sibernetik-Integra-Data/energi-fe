<template>
    <div>
        <!-- Header row -->
        <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div>
                <h2 class="text-2xl font-extrabold tracking-tight text-(--text) m-0 mb-1">Blocks List</h2>
                <p class="text-sm text-(--text-muted) m-0">Manage blocks</p>
            </div>
            <button
                type="button"
                class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm"
                @click="openCreate">
                + Add Block
            </button>
        </div>

        <!-- Search / filter bar -->
        <div class="flex flex-wrap gap-3 mb-4">
            <input
                v-model="searchName"
                type="text"
                placeholder="Search block name…"
                class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors w-56" />
            <input
                v-model.number="filterPlants"
                type="number"
                min="0"
                placeholder="Min. plants"
                class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors w-48" />
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
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Plants Count</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Area (ha)</th>
                            <th class="text-left text-xs font-extrabold text-(--text-muted) py-4 px-6 uppercase tracking-widest">Created At</th>
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
                            <td class="py-4 px-6 align-middle text-sm text-(--text)">{{ row.plants_count ?? "" }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text)">{{ row.wide ?? "" }}</td>
                            <td class="py-4 px-6 align-middle text-sm text-(--text-muted)">{{ formatDateTime(row.created_at) }}</td>
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
                        <span v-if="row.plants_count != null">Plants: {{ row.plants_count }}</span>
                        <span v-if="row.wide != null">Area: {{ row.wide }} ha</span>
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

        <!-- Block Form Modal -->
        <BlockForm
            :visible="showForm"
            :block="editingBlock"
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
                        <h3 class="text-base font-bold text-(--text) m-0">Delete Block</h3>
                    <p class="text-sm text-(--text-muted) m-0">Delete block <strong>{{ deletingBlock?.name }}</strong>? This action cannot be undone.</p>
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
import { ref, computed, onMounted } from "vue";
import BlockForm from "./BlockForm.vue";
import { listBlocks, createBlock, updateBlock, deleteBlock } from "../model";
import { useToast } from '../../../../utils/toast'

const { show: showToast } = useToast();

const rows = ref([]);
const loading = ref(false);
const fetchError = ref(null);
const actionError = ref(null);
const submitting = ref(false);

const searchName = ref("");
const filterPlants = ref(null);

const showForm = ref(false);
const editingBlock = ref(null);

const showDeleteConfirm = ref(false);
const deletingBlock = ref(null);

const filteredRows = computed(() => {
    return rows.value.filter((row) => {
        const nameMatch = !searchName.value || row.name?.toLowerCase().includes(searchName.value.toLowerCase());
        const plantsMatch =
            filterPlants.value == null || filterPlants.value === "" || (row.plants_count ?? 0) >= filterPlants.value;
        return nameMatch && plantsMatch;
    });
});

function formatDateTime(value) {
    if (!value) return "";
    // Prefer to display the server-provided timestamp without converting to the client's timezone.
    // If the server returns an ISO string, normalize it to `YYYY-MM-DD HH:mm:ss` by string operations.
    if (typeof value === 'string') {
        // remove fractional seconds and trailing Z, then replace T with space
        return value.replace(/\.\d+/, '').replace(/T/, ' ').replace(/Z$/, '').trim();
    }
    if (value instanceof Date) {
        // to avoid using client-local formatting, use ISO string and strip the T
        return value.toISOString().replace(/T/, ' ').replace(/Z$/, '').substr(0, 19);
    }
    return String(value);
}

async function loadData() {
    loading.value = true;
    fetchError.value = null;
    try {
        rows.value = await listBlocks();
    } catch (err) {
        console.error("[Blocks] Failed to load:", err);
        fetchError.value = err?.message || "Failed to load blocks.";
    } finally {
        loading.value = false;
    }
}

function openCreate() {
    editingBlock.value = null;
    actionError.value = null;
    showForm.value = true;
}

function openEdit(block) {
    editingBlock.value = { ...block };
    actionError.value = null;
    showForm.value = true;
}

function closeForm() {
    showForm.value = false;
    editingBlock.value = null;
}

async function onFormSubmit(formData) {
    submitting.value = true;
    actionError.value = null;

    try {
        if (editingBlock.value?.id) {
            const updated = await updateBlock(editingBlock.value.id, formData);
            const idx = rows.value.findIndex((r) => r.id === editingBlock.value.id);
            if (idx !== -1) rows.value[idx] = updated || { ...rows.value[idx], ...formData };
            showToast('Block updated successfully.');
        } else {
            const created = await createBlock(formData);
            if (created) rows.value.unshift(created);
            showToast('Block created successfully.');
        }
        closeForm();
    } catch (err) {
        console.error("[Blocks] Save failed:", err);
        actionError.value = err?.message || "Failed to save data.";
    } finally {
        submitting.value = false;
    }
}

function confirmDelete(block) {
    deletingBlock.value = block;
    actionError.value = null;
    showDeleteConfirm.value = true;
}

async function onDeleteConfirm() {
    if (!deletingBlock.value) return;
    submitting.value = true;
    actionError.value = null;
    try {
        await deleteBlock(deletingBlock.value.id);
        rows.value = rows.value.filter((r) => r.id !== deletingBlock.value.id);
        showDeleteConfirm.value = false;
        deletingBlock.value = null;
        showToast('Block deleted successfully.');
    } catch (err) {
        console.error("[Blocks] Delete failed:", err);
        actionError.value = err?.message || "Failed to delete block.";
    } finally {
        submitting.value = false;
    }
}

onMounted(loadData);
</script>
