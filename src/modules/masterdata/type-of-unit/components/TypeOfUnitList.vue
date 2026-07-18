<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4">
      <div>
        <h2 class="text-2xl font-semibold tracking-tight text-(--text) m-0 mb-1">Type of Unit</h2>
        <p class="text-sm text-(--text-muted) m-0">Manage type of unit entries</p>
      </div>
      <button
        type="button"
        class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm"
        @click="openCreate">
        + Add Type
      </button>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search name or detail..."
        class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none focus:border-green-500 transition-colors w-64"
        aria-label="Search type of unit" />
    </div>

    <div v-if="loading" class="flex justify-center items-center py-16 text-sm text-(--text-muted)">
      Loading data&hellip;
    </div>

    <div v-else-if="fetchError" class="flex justify-center items-center py-16 text-sm text-red-600">
      {{ fetchError }}
    </div>

    <template v-else>
      <div class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[1100px]:hidden">
        <table class="w-full border-collapse table-fixed">
          <colgroup>
            <col style="width:6%" />
            <col style="width:13%" />
            <col style="width:18%" />
            <col style="width:11%" />
            <col style="width:9%" />
            <col style="width:12%" />
            <col style="width:12%" />
            <col style="width:12%" />
            <col style="width:7%" />
          </colgroup>
          <thead>
            <tr class="border-b border-(--border) bg-(--surface-muted)">
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-center">ID</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Name</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Detail</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Notes</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Status</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Created At</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Created By</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">Updated At / By</th>
              <th class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRows.length === 0">
              <td colspan="9" class="py-10 px-6 text-center text-sm text-(--text-muted)">No data.</td>
            </tr>
            <tr
              v-for="row in filteredRows"
              :key="row.id"
              class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted) transition-colors">
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-center">{{ row.id }}</td>
              <td class="py-4 px-3 align-middle text-sm font-semibold text-(--text) text-left">{{ row.name || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left whitespace-normal wrap-break-word">{{ row.detail || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left whitespace-normal wrap-break-word">{{ row.notes || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left">{{ row.status || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left">{{ formatDateTime(row.created_at) || '-' }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left">{{ displayUser(row.created_by) }}</td>
              <td class="py-4 px-3 align-middle text-sm text-(--text-muted) text-left">
                <div>{{ formatDateTime(row.updated_at) || '-' }}</div>
                <div class="text-xs text-(--text-soft)">{{ displayUser(row.updated_by) }}</div>
              </td>
              <td class="py-4 px-3 align-middle text-center">
                <div class="flex gap-2 items-center justify-center">
                  <button
                    type="button"
                    class="text-sm py-1.5 px-3 rounded-lg font-semibold text-(--text) bg-transparent border border-(--border) hover:bg-(--surface-muted) transition-colors cursor-pointer"
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

      <div class="hidden gap-3 max-[1100px]:flex max-[1100px]:flex-col">
        <div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">No data.</div>
        <div
          v-for="row in filteredRows"
          :key="row.id"
          class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-bold text-sm text-(--text)">{{ row.name || '-' }}</div>
              <div class="text-xs text-(--text-muted)">ID: {{ row.id }}</div>
            </div>
            <div class="text-xs text-(--text-muted)">{{ row.status || '-' }}</div>
          </div>
          <div class="text-xs text-(--text-muted) flex flex-col gap-1">
            <span>Detail: {{ row.detail || '-' }}</span>
            <span>Notes: {{ row.notes || '-' }}</span>
            <span>Created at: {{ formatDateTime(row.created_at) || '-' }}</span>
            <span>Created by: {{ displayUser(row.created_by) }}</span>
            <span>Updated at: {{ formatDateTime(row.updated_at) || '-' }}</span>
            <span>Updated by: {{ displayUser(row.updated_by) }}</span>
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

    <div v-if="actionError && !showDeleteConfirm" class="mt-3 text-xs text-red-500">{{ actionError }}</div>

    <TypeOfUnitForm
      :visible="showForm"
      :type-of-unit="editingType"
      :submitting="submitting"
      @submit="onFormSubmit"
      @cancel="closeForm" />

    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-type-of-unit-title"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @mousedown.self="showDeleteConfirm = false">
        <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
          <h3 id="delete-type-of-unit-title" class="text-base font-bold text-(--text) m-0">Delete Type of Unit</h3>
          <p class="text-sm text-(--text-muted) m-0">
            Delete <strong>{{ deletingType?.name }}</strong>? This action cannot be undone.
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
import { computed, onMounted, ref } from 'vue'
import TypeOfUnitForm from './TypeOfUnitForm.vue'
import { createTypeOfUnit, deleteTypeOfUnit, listTypeOfUnit, updateTypeOfUnit } from '../model'
import { useToast } from '../../../../utils/toast'
import { resolveUsernames } from '../../../../utils/userCache'

const { show: showToast } = useToast()

const rows = ref([])
const loading = ref(false)
const fetchError = ref(null)
const actionError = ref(null)
const submitting = ref(false)

const searchQuery = ref('')
const showForm = ref(false)
const editingType = ref(null)
const showDeleteConfirm = ref(false)
const deletingType = ref(null)
const userNames = ref(new Map())

const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((row) => {
    return [row.name, row.detail, row.notes, row.status]
      .some((value) => String(value || '').toLowerCase().includes(q))
  })
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

function displayUser(userId) {
  if (!userId) return '-'
  return userNames.value.get(userId) || userId
}

async function resolveAuditUsers(data) {
  const ids = data.flatMap((row) => [row.created_by, row.updated_by]).filter(Boolean)
  if (ids.length === 0) {
    userNames.value = new Map()
    return
  }
  userNames.value = await resolveUsernames(ids)
}

async function loadData() {
  loading.value = true
  fetchError.value = null
  try {
    rows.value = await listTypeOfUnit()
    await resolveAuditUsers(rows.value)
  } catch (err) {
    console.error('[TypeOfUnit] Failed to load:', err)
    fetchError.value = err?.message || 'Failed to load data.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingType.value = null
  actionError.value = null
  showForm.value = true
}

function openEdit(typeOfUnit) {
  editingType.value = { ...typeOfUnit }
  actionError.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingType.value = null
}

async function onFormSubmit(formData) {
  submitting.value = true
  actionError.value = null
  try {
    if (editingType.value?.id) {
      await updateTypeOfUnit(editingType.value.id, formData)
      showToast('Type of Unit updated successfully.')
    } else {
      await createTypeOfUnit(formData)
      showToast('Type of Unit created successfully.')
    }
    closeForm()
    await loadData()
  } catch (err) {
    console.error('[TypeOfUnit] Save failed:', err)
    actionError.value = err?.message || 'Failed to save data.'
  } finally {
    submitting.value = false
  }
}

function confirmDelete(typeOfUnit) {
  deletingType.value = typeOfUnit
  actionError.value = null
  showDeleteConfirm.value = true
}

async function onDeleteConfirm() {
  if (!deletingType.value) return
  submitting.value = true
  actionError.value = null
  try {
    await deleteTypeOfUnit(deletingType.value.id)
    showDeleteConfirm.value = false
    deletingType.value = null
    showToast('Type of Unit deleted successfully.')
    await loadData()
  } catch (err) {
    console.error('[TypeOfUnit] Delete failed:', err)
    actionError.value = err?.message || 'Failed to delete data.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>
