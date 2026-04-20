<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @mousedown.self="onCancel"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Edit Block' : 'Add Block' }}</h3>
          <button
            type="button"
            class="border-0 bg-transparent cursor-pointer text-slate-400 hover:text-slate-700 text-xl leading-none transition-colors"
            aria-label="Close"
            @click="onCancel"
          >&times;</button>
        </div>

        <form @submit.prevent="onSubmit" class="flex flex-col gap-4" novalidate>
          <!-- Name -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="block-name">
              Block Name <span class="text-red-500">*</span>
            </label>
            <input
              id="block-name"
              v-model.trim="form.name"
              type="text"
              placeholder="e.g. Block A"
              class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
              :class="errors.name ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-slate-200 bg-slate-50 focus:border-green-500'"
              autocomplete="off"
            />
            <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</span>
          </div>

          <!-- Plants Count -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="block-plants">Plants Count</label>
            <input
              id="block-plants"
              v-model.number="form.plants_count"
              type="number"
              min="0"
              placeholder="0"
              class="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-slate-50 outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <!-- Wide -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="block-wide">Area (ha)</label>
            <input
              id="block-wide"
              v-model.number="form.wide"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-slate-50 outline-none focus:border-green-500 transition-colors"
            />
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 pt-1">
            <button
              type="button"
              class="border border-slate-200 bg-white text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
              :disabled="submitting"
              @click="onCancel"
            >Cancel</button>
            <button
              type="submit"
              class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-green-700 transition-colors disabled:opacity-60"
              :disabled="submitting"
            >
              <span v-if="submitting">Saving&hellip;</span>
              <span v-else>{{ isEdit ? 'Save Changes' : 'Add Block' }}</span>
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
  block: { type: Object, default: null },
  submitting: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.block?.id))

const emptyForm = () => ({ name: '', plants_count: null, wide: null })

const form = ref(emptyForm())
const errors = ref({})

watch(
  () => [props.visible, props.block],
  ([visible, block]) => {
    if (visible) {
      form.value = block
        ? { name: block.name || '', plants_count: block.plants_count ?? null, wide: block.wide ?? null }
        : emptyForm()
      errors.value = {}
    }
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  if (!form.value.name) errs.name = 'Block name is required.'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { ...form.value })
}

function onCancel() {
  emit('cancel')
}
</script>
