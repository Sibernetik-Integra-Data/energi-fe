<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @mousedown.self="onCancel">
            <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Edit Activity' : 'Add Activity' }}</h3>
                    <button
                        type="button"
                        class="border-0 bg-transparent cursor-pointer text-(--text-soft) hover:text-(--text) text-xl leading-none transition-colors"
                        aria-label="Close"
                        @click="onCancel">
                        &times;
                    </button>
                </div>

                <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
                    <!-- Name -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="kebun-name">
                            Name <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="kebun-name"
                            v-model.trim="form.name"
                            type="text"
                            placeholder="e.g. Pemupukan Dasar"
                            class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                            :class="
                                errors.name
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
                            "
                            autocomplete="off" />
                        <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</span>
                    </div>

                    <!-- Detail -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="kebun-detail">Detail</label>
                        <textarea
                            id="kebun-detail"
                            v-model.trim="form.detail"
                            rows="3"
                            placeholder="Activity description"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
                    </div>

                    <!-- Group of Work -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="kebun-group">
                            Group of Work <span class="text-red-500">*</span>
                        </label>
                        <select
                            id="kebun-group"
                            v-model="form.group_of_work"
                            class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                            :class="
                                errors.group_of_work
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
                            ">
                            <option value="" disabled>Select group…</option>
                            <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                        </select>
                        <span v-if="errors.group_of_work" class="text-xs text-red-500">{{ errors.group_of_work }}</span>
                        <div v-if="groupsLoading" class="text-xs text-(--text-muted)">Loading groups&hellip;</div>
                        <div v-if="groupLoadError" class="text-xs text-red-500">{{ groupLoadError }}</div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted) transition-colors"
                            :disabled="submitting"
                            @click="onCancel">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-60"
                            :disabled="submitting">
                            <span v-if="submitting">Saving&hellip;</span>
                            <span v-else>{{ isEdit ? 'Save Changes' : 'Add Activity' }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { listGroupOfWork } from '../model'

const props = defineProps({
    visible: { type: Boolean, default: false },
    activity: { type: Object, default: null },
    submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.activity?.id))

const emptyForm = () => ({
    name: '',
    detail: '',
    group_of_work: ''
})

const form = ref(emptyForm())
const errors = ref({})

const groups = ref([])
const groupsLoading = ref(false)
const groupLoadError = ref(null)

async function loadGroups() {
    if (groups.value.length > 0) return
    groupsLoading.value = true
    groupLoadError.value = null
    try {
        groups.value = await listGroupOfWork()
    } catch (err) {
        console.error('[KebunForm] Failed to load groups:', err)
        groupLoadError.value = err?.message || 'Failed to load groups.'
    } finally {
        groupsLoading.value = false
    }
}

watch(
    () => [props.visible, props.activity],
    ([visible, activity]) => {
        if (visible) {
            form.value = activity
                ? {
                      name: activity.name || '',
                      detail: activity.detail || '',
                      group_of_work: activity.group_of_work ?? ''
                  }
                : emptyForm()
            errors.value = {}
            loadGroups()
        }
    },
    { immediate: true }
)

function validate() {
    const errs = {}
    if (!form.value.name) errs.name = 'Name is required.'
    if (form.value.group_of_work === '' || form.value.group_of_work == null) {
        errs.group_of_work = 'Group of Work is required.'
    }
    errors.value = errs
    return Object.keys(errs).length === 0
}

function onSubmit() {
    if (!validate()) return
    const selectedGroup = groups.value.find(g => String(g.id) === String(form.value.group_of_work))
    emit('submit', {
        ...form.value,
        group_of_work_name: selectedGroup?.name ?? null
    })
}

function onCancel() {
    emit('cancel')
}
</script>
