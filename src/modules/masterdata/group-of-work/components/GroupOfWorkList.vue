<template>
    <div>
        <!-- Header row -->
        <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
            <div>
                <h2 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0 mb-1">Group of Work</h2>
                <p class="text-sm text-(--text-muted) m-0">Manage group of work labels</p>
            </div>
            <button
                type="button"
                class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm"
                @click="openCreate">
                + Add Group
            </button>
        </div>

        <!-- Search bar -->
        <div class="flex flex-wrap gap-3 mb-4">
            <input
                v-model="searchName"
                type="text"
                placeholder="Search group name…"
                class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors w-56" />
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
            <div
                class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[920px]:hidden">
                <table class="w-full border-collapse table-fixed">
                    <thead>
                        <tr class="border-b border-(--border) bg-(--surface-muted)">
                            <th
                                class="w-1/4 align-middle text-center text-xs font-extrabold text-(--text-muted) py-4 px-4 uppercase tracking-widest">
                                Name
                            </th>
                            <th
                                class="w-1/4 align-middle text-center text-xs font-extrabold text-(--text-muted) py-4 px-4 uppercase tracking-widest">
                                Created By
                            </th>
                            <th
                                class="w-1/4 align-middle text-center text-xs font-extrabold text-(--text-muted) py-4 px-4 uppercase tracking-widest">
                                Updated By
                            </th>
                            <th
                                class="w-1/4 align-middle text-center text-xs font-extrabold text-(--text-muted) py-4 px-4 uppercase tracking-widest">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="filteredRows.length === 0">
                            <td colspan="4" class="py-10 px-6 text-center text-sm text-(--text-muted)">No data.</td>
                        </tr>
                        <tr
                            v-for="row in filteredRows"
                            :key="row.id"
                            class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors">
                            <td class="py-4 px-4 align-middle text-sm font-semibold text-(--text) text-center">
                                {{ row.name }}
                            </td>
                            <td class="py-4 px-4 align-middle text-sm text-(--text-muted) text-center">
                                {{ row.created_by || '-' }}
                            </td>
                            <td class="py-4 px-4 align-middle text-sm text-(--text-muted) text-center">
                                {{ row.updated_by || '-' }}
                            </td>
                            <td class="py-4 px-4 align-middle text-center">
                                <div class="flex gap-2 items-center justify-center">
                                    <button
                                        type="button"
                                        class="text-sm py-1.5 px-5 rounded-lg font-semibold text-(--text) bg-blue-500 border-0 hover:bg-blue-300 transition-colors cursor-pointer"
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
                <div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">
                    No data.
                </div>
                <div
                    v-for="row in filteredRows"
                    :key="row.id"
                    class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div class="font-bold text-sm text-(--text)">{{ row.name }}</div>
                    <div class="text-xs text-(--text-muted)">Created by: {{ row.created_by || '-' }}</div>
                    <div class="text-xs text-(--text-muted)">Updated by: {{ row.updated_by || '-' }}</div>
                    <div class="flex justify-end gap-2 mt-1 whitespace-nowrap items-center">
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

        <!-- Group of Work Form Modal -->
        <GroupOfWorkForm
            :visible="showForm"
            :group="editingGroup"
            :submitting="submitting"
            @submit="onFormSubmit"
            @cancel="closeForm" />

        <!-- Delete Confirmation Modal -->
        <Teleport to="body">
            <div
                v-if="showDeleteConfirm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-dialog-title"
                class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                @mousedown.self="showDeleteConfirm = false">
                <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
                    <h3 id="delete-dialog-title" class="text-base font-bold text-(--text) m-0">Delete Group of Work</h3>
                    <p class="text-sm text-(--text-muted) m-0">
                        Delete <strong>{{ deletingGroup?.name }}</strong
                        >? This action cannot be undone.
                        <span class="block mt-1 text-xs text-(--text-muted)"
                            >Note: this is a logical delete — the enum label may be retained in the database.</span
                        >
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
import { ref, computed, onMounted } from "vue";
import GroupOfWorkForm from "./GroupOfWorkForm.vue";
import { listGroupOfWork, createGroupOfWork, updateGroupOfWork, deleteGroupOfWork } from "../model";
import { useToast } from "../../../../utils/toast";

const { show: showToast } = useToast();

const rows = ref([]);
const loading = ref(false);
const fetchError = ref(null);
const actionError = ref(null);
const submitting = ref(false);

const searchName = ref("");

const showForm = ref(false);
const editingGroup = ref(null);

const showDeleteConfirm = ref(false);
const deletingGroup = ref(null);

const filteredRows = computed(() => {
    const q = searchName.value.trim().toLowerCase();
    if (!q) return rows.value;
    return rows.value.filter((row) => row.name?.toLowerCase().includes(q));
});

function formatDateTime(value) {
    if (!value) return "";
    if (typeof value === "string") {
        return value.replace(/\.\d+/, "").replace(/T/, " ").replace(/Z$/, "").trim();
    }
    if (value instanceof Date) {
        return value.toISOString().replace(/T/, " ").replace(/Z$/, "").substring(0, 19);
    }
    return String(value);
}

async function loadData() {
    loading.value = true;
    fetchError.value = null;
    try {
        rows.value = await listGroupOfWork();
    } catch (err) {
        console.error("[GroupOfWork] Failed to load:", err);
        fetchError.value = err?.message || "Failed to load data.";
    } finally {
        loading.value = false;
    }
}

function openCreate() {
    editingGroup.value = null;
    actionError.value = null;
    showForm.value = true;
}

function openEdit(group) {
    editingGroup.value = { ...group };
    actionError.value = null;
    showForm.value = true;
}

function closeForm() {
    showForm.value = false;
    editingGroup.value = null;
}

async function onFormSubmit(formData) {
    submitting.value = true;
    actionError.value = null;
    try {
        if (editingGroup.value?.id) {
            await updateGroupOfWork(editingGroup.value.id, formData);
            showToast("Group of Work updated successfully.");
        } else {
            await createGroupOfWork(formData);
            showToast("Group of Work created successfully.");
        }
        closeForm();
        await loadData();
    } catch (err) {
        console.error("[GroupOfWork] Save failed:", err);
        actionError.value = err?.message || "Failed to save data.";
    } finally {
        submitting.value = false;
    }
}

function confirmDelete(group) {
    deletingGroup.value = group;
    actionError.value = null;
    showDeleteConfirm.value = true;
}

async function onDeleteConfirm() {
    if (!deletingGroup.value) return;
    submitting.value = true;
    actionError.value = null;
    try {
        await deleteGroupOfWork(deletingGroup.value.id);
        showDeleteConfirm.value = false;
        deletingGroup.value = null;
        showToast("Group of Work deleted successfully.");
        await loadData();
    } catch (err) {
        console.error("[GroupOfWork] Delete failed:", err);
        actionError.value = err?.message || "Failed to delete.";
    } finally {
        submitting.value = false;
    }
}

onMounted(loadData);
</script>
