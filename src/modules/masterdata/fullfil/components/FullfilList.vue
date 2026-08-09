<template>
  <div>
    <div class="flex flex-wrap justify-between items-center gap-4 mb-4"><div><h2 class="text-[clamp(24px,2.5vw,36px)] font-semibold leading-tight tracking-[-0.04em] text-(--text) m-0 mb-1">Fullfil</h2><p class="text-sm text-(--text-muted) m-0">Manage fullfil mapping entries</p></div><button type="button" class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-xl" @click="openCreate">+ Add Fullfil</button></div>
    <div class="flex flex-wrap gap-3 mb-4"><input v-model="search" type="search" placeholder="Search type of work or need..." class="border border-(--border) rounded-lg px-3.5 py-2 text-sm text-(--text) bg-(--surface) outline-none w-72" /></div>
    <div v-if="loading" class="flex justify-center py-16 text-sm text-(--text-muted)">Loading data&hellip;</div>
    <div v-else-if="error" class="flex justify-center py-16 text-sm text-red-600">{{ error }}</div>
    <template v-else>
      <div class="bg-(--surface) rounded-xl overflow-hidden border border-(--border) shadow-sm max-[1100px]:hidden"><table class="w-full border-collapse table-fixed"><thead><tr class="border-b border-(--border) bg-(--surface-muted)"><th v-for="header in headers" :key="header" class="text-xs font-extrabold text-(--text-muted) py-4 px-3 uppercase tracking-widest text-left">{{ header }}</th></tr></thead><tbody><tr v-if="filteredRows.length === 0"><td colspan="8" class="py-10 text-center text-sm text-(--text-muted)">No data.</td></tr><tr v-for="row in filteredRows" :key="row.id" class="border-b border-(--border) last:border-b-0 hover:bg-(--surface-muted)"><td class="cell text-center">{{ row.id }}</td><td class="cell font-semibold">{{ workName(row.tow_id) }}</td><td class="cell">{{ needName(row.ton_id) }}</td><td class="cell">{{ row.access || '-' }}</td><td class="cell">{{ row.is_view === 0 ? 'No' : 'Yes' }}</td><td class="cell">{{ row.notes || '-' }}</td><td class="cell">{{ formatDate(row.updated_at) }}</td><td class="cell"><div class="flex gap-2"><button type="button" class="action" @click="openEdit(row)">Edit</button><button type="button" class="delete-action" @click="confirmDelete(row)">Delete</button></div></td></tr></tbody></table></div>
      <div class="hidden gap-3 max-[1100px]:flex max-[1100px]:flex-col"><div v-if="filteredRows.length === 0" class="text-center text-sm text-(--text-muted) py-10">No data.</div><div v-for="row in filteredRows" :key="row.id" class="bg-(--surface) border border-(--border) rounded-xl p-4 shadow-sm"><div class="flex justify-between gap-3"><strong class="text-sm text-(--text)">{{ workName(row.tow_id) }} → {{ needName(row.ton_id) }}</strong><span class="text-xs text-(--text-muted)">ID: {{ row.id }}</span></div><div class="text-xs text-(--text-muted) mt-2">Access: {{ row.access || '-' }} · Visible: {{ row.is_view === 0 ? 'No' : 'Yes' }}<br />Notes: {{ row.notes || '-' }}</div><div class="flex justify-end gap-2 mt-3"><button type="button" class="action" @click="openEdit(row)">Edit</button><button type="button" class="delete-action" @click="confirmDelete(row)">Delete</button></div></div></div>
    </template>
    <div v-if="actionError && !deleteTarget" class="mt-3 text-xs text-red-500">{{ actionError }}</div>
    <FullfilForm :visible="showForm" :fullfil="editing" :type-of-works="typeOfWorks" :type-of-needs="typeOfNeeds" :submitting="submitting" @submit="save" @cancel="closeForm" />
    <Teleport to="body"><div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"><div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"><h3 class="font-bold text-(--text)">Delete Fullfil</h3><p class="text-sm text-(--text-muted) my-4">Delete this mapping? This action cannot be undone.</p><div v-if="actionError" class="text-xs text-red-500 mb-3">{{ actionError }}</div><div class="flex justify-end gap-3"><button type="button" class="action" @click="deleteTarget = null">Cancel</button><button type="button" class="delete-action" :disabled="submitting" @click="remove">Yes, Delete</button></div></div></div></Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FullfilForm from './FullfilForm.vue'
import { createFullfil, deleteFullfil, listFullfil, listTypeOfNeed, listTypeOfWork, updateFullfil } from '../model'
import { useToast } from '../../../../utils/toast'

const { show: showToast } = useToast()
const headers = ['ID', 'Type of Work', 'Type of Need', 'Access', 'Visible', 'Notes', 'Updated At', 'Actions']
const rows = ref([]); const typeOfWorks = ref([]); const typeOfNeeds = ref([]); const loading = ref(false); const submitting = ref(false); const error = ref(null); const actionError = ref(null); const search = ref(''); const showForm = ref(false); const editing = ref(null); const deleteTarget = ref(null)
const filteredRows = computed(() => { const q = search.value.trim().toLowerCase(); return q ? rows.value.filter((row) => `${workName(row.tow_id)} ${needName(row.ton_id)} ${row.access || ''} ${row.notes || ''}`.toLowerCase().includes(q)) : rows.value })
function workName(id) { return typeOfWorks.value.find((item) => Number(item.id) === Number(id))?.name || `#${id}` }
function needName(id) { return typeOfNeeds.value.find((item) => Number(item.id) === Number(id))?.name || `#${id}` }
function formatDate(value) { return value ? String(value).replace(/\.\d+/, '').replace('T', ' ').replace('Z', '') : '-' }
async function load() { loading.value = true; error.value = null; try { const result = await Promise.all([listFullfil(), listTypeOfWork(), listTypeOfNeed()]); rows.value = result[0].data; typeOfWorks.value = result[1]; typeOfNeeds.value = result[2] } catch (err) { error.value = err?.message || 'Failed to load data.' } finally { loading.value = false } }
function openCreate() { editing.value = null; actionError.value = null; showForm.value = true }
function openEdit(row) { editing.value = { ...row }; actionError.value = null; showForm.value = true }
function closeForm() { showForm.value = false; editing.value = null }
async function save(payload) { submitting.value = true; actionError.value = null; try { if (editing.value?.id) { await updateFullfil(editing.value.id, payload); showToast('Fullfil updated successfully.') } else { await createFullfil(payload); showToast('Fullfil created successfully.') }; closeForm(); await load() } catch (err) { actionError.value = err?.message || 'Failed to save data.' } finally { submitting.value = false } }
function confirmDelete(row) { deleteTarget.value = row; actionError.value = null }
async function remove() { submitting.value = true; actionError.value = null; try { await deleteFullfil(deleteTarget.value.id); deleteTarget.value = null; showToast('Fullfil deleted successfully.'); await load() } catch (err) { actionError.value = err?.message || 'Failed to delete data.' } finally { submitting.value = false } }
onMounted(load)
</script>

<style scoped>
.cell { padding: 1rem .75rem; vertical-align: middle; font-size: .875rem; color: var(--text-muted); text-align: left; overflow-wrap: anywhere; }
.action { border: 1px solid var(--border); background: var(--surface); color: var(--text); font-weight: 600; font-size: .875rem; padding: .375rem .75rem; border-radius: .5rem; cursor: pointer; }
.delete-action { border: 0; background: #fef2f2; color: #dc2626; font-weight: 600; font-size: .875rem; padding: .375rem .75rem; border-radius: .5rem; cursor: pointer; }
</style>
