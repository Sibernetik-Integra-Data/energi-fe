<template>
    <Teleport to="body">
        <div
            v-if="visible"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            @mousedown.self="onCancel">
            <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between">
                    <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Edit Vehicle' : 'Add Vehicle' }}</h3>
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
                        <label class="text-sm font-semibold text-(--text)" for="vehicle-name">
                            Name <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="vehicle-name"
                            v-model.trim="form.name"
                            type="text"
                            placeholder="e.g. Truck A"
                            class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                            :class="
                                errors.name
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
                            "
                            autocomplete="off" />
                        <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</span>
                    </div>

                    <!-- Title -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="vehicle-title">Title</label>
                        <input
                            id="vehicle-title"
                            v-model.trim="form.title"
                            type="text"
                            placeholder="e.g. Heavy Truck"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors"
                            autocomplete="off" />
                    </div>

                    <!-- Type -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="vehicle-type">Type</label>
                        <input
                            id="vehicle-type"
                            v-model.trim="form.type"
                            type="text"
                            placeholder="e.g. Dump Truck"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors"
                            autocomplete="off" />
                    </div>

                    <!-- Notes -->
                    <div class="flex flex-col gap-1">
                        <label class="text-sm font-semibold text-(--text)" for="vehicle-notes">Notes</label>
                        <textarea
                            id="vehicle-notes"
                            v-model.trim="form.notes"
                            rows="3"
                            placeholder="Additional notes"
                            class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
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
                            <span v-else>{{ isEdit ? 'Save Changes' : 'Add Vehicle' }}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
    visible: { type: Boolean, default: false },
    vehicle: { type: Object, default: null },
    submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.vehicle?.id))

const emptyForm = () => ({
    name: '',
    title: '',
    type: '',
    notes: ''
})

const form = ref(emptyForm())
const errors = ref({})

watch(
    () => props.visible,
    (val) => {
        if (val) {
            errors.value = {}
            if (props.vehicle) {
                form.value = {
                    name: props.vehicle.name || '',
                    title: props.vehicle.title || '',
                    type: props.vehicle.type || '',
                    notes: props.vehicle.notes || ''
                }
            } else {
                form.value = emptyForm()
            }
        }
    }
)

function validate() {
    const errs = {}
    if (!form.value.name) errs.name = 'Name is required.'
    errors.value = errs
    return Object.keys(errs).length === 0
}

function onSubmit() {
    if (!validate()) return
    const payload = {
        name: form.value.name
    }
    if (form.value.title) payload.title = form.value.title
    if (form.value.type) payload.type = form.value.type
    if (form.value.notes) payload.notes = form.value.notes
    emit('submit', payload)
}

function onCancel() {
    emit('cancel')
}
</script>
