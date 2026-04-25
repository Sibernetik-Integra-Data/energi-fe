<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="close"></div>

        <!-- Dialog -->
        <div
          class="relative z-10 w-full max-w-md bg-(--surface) rounded-2xl shadow-2xl border border-(--border) overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-modal-title"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-(--border)">
            <h3 id="plan-modal-title" class="text-base font-bold text-(--text) m-0">Tambah Rencana</h3>
            <button
              @click="close"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-(--text-muted) hover:text-(--text) hover:bg-(--surface-muted) transition-colors cursor-pointer border-0 bg-transparent"
              aria-label="Tutup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Body -->
          <form @submit.prevent="submit" class="px-6 py-5 flex flex-col gap-4">

            <!-- Job Type -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Jenis Pekerjaan</label>
              <select
                v-model="form.jobType"
                required
                class="w-full bg-(--surface-muted) border border-(--border) rounded-lg px-3 py-2.5 text-sm text-(--text) outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer appearance-none"
              >
                <option value="" disabled>Pilih jenis pekerjaan...</option>
                <option v-for="jt in jobTypes" :key="jt" :value="jt">{{ jt }}</option>
              </select>
            </div>

            <!-- Blocks -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Blok</label>
              <div
                v-if="availableBlocks.length === 0"
                class="text-xs text-(--text-muted) italic py-1"
              >Pilih jenis pekerjaan terlebih dahulu.</div>
              <div v-else class="flex flex-wrap gap-2">
                <button
                  v-for="b in availableBlocks"
                  :key="b"
                  type="button"
                  @click="toggleBlock(b)"
                  :class="form.blocks.includes(b)
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-(--surface-muted) text-(--text) border-(--border) hover:border-green-400'"
                  class="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer"
                >{{ b }}</button>
              </div>
              <p v-if="blockError" class="text-xs text-red-500 mt-0.5">{{ blockError }}</p>
            </div>

            <!-- Date range -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Tanggal Mulai</label>
                <input
                  v-model="form.startDate"
                  type="date"
                  required
                  class="bg-(--surface-muted) border border-(--border) rounded-lg px-3 py-2.5 text-sm text-(--text) outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Tanggal Selesai</label>
                <input
                  v-model="form.endDate"
                  type="date"
                  required
                  :min="form.startDate"
                  class="bg-(--surface-muted) border border-(--border) rounded-lg px-3 py-2.5 text-sm text-(--text) outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>
            </div>
            <p v-if="dateError" class="text-xs text-red-500 -mt-2">{{ dateError }}</p>

            <!-- Actions -->
            <div class="flex gap-3 pt-1">
              <button
                type="button"
                @click="close"
                class="flex-1 py-2.5 rounded-lg border border-(--border) bg-(--surface-muted) text-(--text) text-sm font-semibold hover:bg-(--border) transition-colors cursor-pointer"
              >Batal</button>
              <button
                type="submit"
                class="flex-1 py-2.5 rounded-lg border-0 bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors cursor-pointer"
              >Simpan</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] }   // sensus detail items to populate dropdowns
})

const emit = defineEmits(['update:modelValue', 'save'])

// Derive unique job types from the sensus items
const jobTypes = computed(() => {
  const seen = new Set()
  const result = []
  for (const item of props.items) {
    if (item.jobType && !seen.has(item.jobType)) {
      seen.add(item.jobType)
      result.push(item.jobType)
    }
  }
  return result
})

// Derive available blocks for the selected job type
const availableBlocks = computed(() => {
  if (!form.value.jobType) return []
  const matched = props.items.filter(i => i.jobType === form.value.jobType)
  const seen = new Set()
  const result = []
  for (const item of matched) {
    for (const b of item.blocks || []) {
      if (!seen.has(b)) { seen.add(b); result.push(b) }
    }
  }
  return result
})

const todayIso = new Date().toISOString().slice(0, 10)

const defaultForm = () => ({
  jobType: '',
  blocks: [],
  startDate: todayIso,
  endDate: todayIso
})

const form = ref(defaultForm())
const blockError = ref('')
const dateError = ref('')

// Reset form when modal opens
watch(() => props.modelValue, (v) => {
  if (v) {
    form.value = defaultForm()
    blockError.value = ''
    dateError.value = ''
  }
})

// Clear selected blocks when job type changes
watch(() => form.value.jobType, () => {
  form.value.blocks = []
  blockError.value = ''
})

function toggleBlock(b) {
  const idx = form.value.blocks.indexOf(b)
  if (idx >= 0) form.value.blocks.splice(idx, 1)
  else form.value.blocks.push(b)
  blockError.value = ''
}

function close() {
  emit('update:modelValue', false)
}

function submit() {
  blockError.value = ''
  dateError.value = ''

  if (form.value.blocks.length === 0) {
    blockError.value = 'Pilih minimal satu blok.'
    return
  }
  if (form.value.endDate < form.value.startDate) {
    dateError.value = 'Tanggal selesai tidak boleh sebelum tanggal mulai.'
    return
  }

  emit('save', {
    id: Date.now().toString(),
    jobType: form.value.jobType,
    blocks: [...form.value.blocks],
    startDate: form.value.startDate,
    endDate: form.value.endDate
  })
  close()
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.18s ease;
}
.modal-fade-enter-from .relative {
  transform: scale(0.96) translateY(8px);
}
.modal-fade-leave-to .relative {
  transform: scale(0.96) translateY(8px);
}
</style>
