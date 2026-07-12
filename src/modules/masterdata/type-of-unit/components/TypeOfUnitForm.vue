<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @mousedown.self="onCancel">
      <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Edit Type of Unit' : 'Add Type of Unit' }}</h3>
          <button
            type="button"
            class="border-0 bg-transparent cursor-pointer text-(--text-soft) hover:text-(--text) text-xl leading-none transition-colors"
            aria-label="Close"
            @click="onCancel">
            &times;
          </button>
        </div>

        <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="tou-name">
              Name <span class="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="tou-name"
              v-model.trim="form.name"
              type="text"
              placeholder="e.g. HK"
              maxlength="100"
              autocomplete="off"
              aria-required="true"
              :aria-invalid="Boolean(errors.name)"
              class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
              :class="
                errors.name
                  ? 'border-red-400 bg-red-50 focus:border-red-500'
                  : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
              " />
            <span v-if="errors.name" class="text-xs text-red-500" role="alert">{{ errors.name }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="tou-detail">Detail</label>
            <textarea
              id="tou-detail"
              v-model.trim="form.detail"
              rows="3"
              maxlength="500"
              placeholder="Optional description"
              class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
            <span v-if="errors.detail" class="text-xs text-red-500" role="alert">{{ errors.detail }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="tou-notes">Notes</label>
            <textarea
              id="tou-notes"
              v-model.trim="form.notes"
              rows="3"
              maxlength="500"
              placeholder="Optional notes"
              class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors resize-none" />
            <span v-if="errors.notes" class="text-xs text-red-500" role="alert">{{ errors.notes }}</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="tou-status">Status</label>
            <input
              id="tou-status"
              v-model.trim="form.status"
              type="text"
              placeholder="Optional status"
              maxlength="100"
              autocomplete="off"
              class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 transition-colors" />
            <span v-if="errors.status" class="text-xs text-red-500" role="alert">{{ errors.status }}</span>
          </div>

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
              <span v-else>{{ isEdit ? 'Save Changes' : 'Add Type' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  typeOfUnit: { type: Object, default: null },
  submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.typeOfUnit?.id))

const emptyForm = () => ({ name: '', detail: '', notes: '', status: '' })

const form = ref(emptyForm())
const errors = ref({})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.value = props.typeOfUnit
        ? {
            name: props.typeOfUnit.name || '',
            detail: props.typeOfUnit.detail || '',
            notes: props.typeOfUnit.notes || '',
            status: props.typeOfUnit.status || ''
          }
        : emptyForm()
      errors.value = {}
    }
  }
)

function validate() {
  const errs = {}
  if (!form.value.name) {
    errs.name = 'Name is required.'
  } else if (form.value.name.length > 100) {
    errs.name = 'Name must be 100 characters or fewer.'
  }
  if (form.value.detail && form.value.detail.length > 500) {
    errs.detail = 'Detail must be 500 characters or fewer.'
  }
  if (form.value.notes && form.value.notes.length > 500) {
    errs.notes = 'Notes must be 500 characters or fewer.'
  }
  if (form.value.status && form.value.status.length > 100) {
    errs.status = 'Status must be 100 characters or fewer.'
  }
  errors.value = errs
  return Object.keys(errs).length === 0
}

function appendNullable(payload, key) {
  payload[key] = form.value[key] || null
}

function onSubmit() {
  if (!validate()) return
  const payload = { name: form.value.name }
  appendNullable(payload, 'detail')
  appendNullable(payload, 'notes')
  appendNullable(payload, 'status')
  emit('submit', payload)
}

function onCancel() {
  emit('cancel')
}
</script>
