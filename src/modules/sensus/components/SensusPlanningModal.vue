<template>
  <Teleport to="body">
    <Transition name="panel">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex justify-end"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>

        <!-- Side Panel -->
        <div
          class="panel-content relative z-10 w-96 max-w-[90vw] h-full bg-(--surface) border-l border-(--border) shadow-2xl flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-panel-title"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-(--border)">
            <h3 id="plan-panel-title" class="text-base font-bold text-(--text) m-0">Rencana Baru</h3>
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

          <!-- Form wraps scrollable body + footer -->
          <form @submit.prevent="submit" class="flex-1 flex flex-col min-h-0">

            <!-- Scrollable body -->
            <div class="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

              <!-- ID Sensus -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">ID Sensus</label>
                <div class="w-full bg-(--surface-muted) border border-(--border) rounded-xl px-4 py-2.5 text-sm text-(--text) flex items-center justify-between">
                  <span>{{ sensusId || '—' }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-(--text-muted) shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <!-- Aktivitas (Sensus Detail) -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Aktivitas Kebun</label>
                <div class="relative">
                  <select
                    :value="form.sensusDetailId"
                    @change="handleDetailChange"
                    required
                    class="w-full bg-(--surface-muted) border border-(--border) rounded-xl px-4 py-2.5 text-sm text-(--text) outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer appearance-none pr-10"
                  >
                    <option :value="null" disabled>Pilih aktivitas...</option>
                    <option v-for="opt in detailOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                  <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <p v-if="items.length === 0" class="text-xs text-(--text-muted) italic">Tidak ada aktivitas tersedia untuk sensus ini.</p>
              </div>

              <!-- Date range -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Start Date</label>
                  <input
                    v-model="form.startDate"
                    type="date"
                    required
                    class="bg-(--surface-muted) border border-(--border) rounded-xl px-3 py-2.5 text-sm text-(--text) outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">End Date</label>
                  <input
                    v-model="form.endDate"
                    type="date"
                    required
                    :min="form.startDate"
                    class="bg-(--surface-muted) border border-(--border) rounded-xl px-3 py-2.5 text-sm text-(--text) outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
              </div>
              <p v-if="dateError" class="text-xs text-red-500 -mt-3">{{ dateError }}</p>

              <!-- Status -->
              <!-- <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Status</label>
                <div class="relative">
                  <select
                    v-model="form.status"
                    class="w-full bg-(--surface-muted) border border-(--border) rounded-xl px-4 py-2.5 text-sm text-(--text) outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer appearance-none pr-10"
                  >
                    <option value="">— Opsional —</option>
                    <option value="planned">Planned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div> -->

              <!-- Catatan -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Catatan</label>
                <textarea
                  v-model="form.notes"
                  rows="3"
                  placeholder="Opsional..."
                  class="bg-(--surface-muted) border border-(--border) rounded-xl px-4 py-2.5 text-sm text-(--text) outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                ></textarea>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Block Terkait</label>
                <div
                  v-if="selectedDetailBlocks.length"
                  class="flex flex-wrap gap-1.5 rounded-xl border border-(--border) bg-(--surface-muted) p-2"
                >
                  <span
                    v-for="block in selectedDetailBlocks"
                    :key="block"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-(--surface) text-(--text) border border-(--border)"
                  >
                    {{ block }}
                  </span>
                </div>
                <p v-else class="text-xs text-(--text-muted)">Pilih aktivitas kebun untuk melihat daftar block.</p>
              </div>

              <!-- Save error -->
              <p v-if="saveError" class="text-xs text-red-500">{{ saveError }}</p>

            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t border-(--border)">
              <button
                type="submit"
                :disabled="saving"
                class="w-full py-3 rounded-2xl border-0 bg-(--text) text-(--surface) text-sm font-semibold hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >{{ saving ? 'Menyimpan...' : 'Simpan' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  sensusId: { type: String, default: '' },
  prefillSensusDetailId: { type: Number, default: null }
})

const emit = defineEmits(['update:modelValue', 'save'])

// Build select options from sensus detail items
const detailOptions = computed(() => props.items.map(item => ({
  value: item.id,
  label: item.jobType || `Detail #${item.id}`
})))

const selectedDetailBlocks = computed(() => {
  const selected = props.items.find((item) => item.id === form.value.sensusDetailId)
  return Array.isArray(selected?.blocks) ? selected.blocks : []
})

const todayIso = new Date().toISOString().slice(0, 10)

// Initialize form directly from the prop. This component is mounted fresh on
// every open (parent uses :key), so script setup re-runs and props are already
// committed — props.prefillSensusDetailId is correct from the very first render.
const form = ref({
  sensusDetailId: props.prefillSensusDetailId ?? null,
  startDate: todayIso,
  endDate: todayIso,
  status: '',
  notes: ''
})

// Belt-and-suspenders: onMounted re-confirms the prefill value is applied.
// This helps catch any timing issues with the :key + v-if mechanism.
onMounted(() => {
  console.log('[SensusPlanningModal] onMounted - props inspection:', {
    prefillProp: props.prefillSensusDetailId,
    itemsCount: props.items.length,
    items: props.items.map(i => ({ id: i.id, jobType: i.jobType })),
    detailOptionsCount: detailOptions.value.length,
    detailOptions: detailOptions.value
  })
  
  if (props.prefillSensusDetailId && form.value.sensusDetailId !== props.prefillSensusDetailId) {
    console.log(
      '[SensusPlanningModal] onMounted prefill correction:',
      { prefillProp: props.prefillSensusDetailId, currentForm: form.value.sensusDetailId }
    )
    form.value.sensusDetailId = props.prefillSensusDetailId
  }
  console.log(
    '[SensusPlanningModal] mounted with form state:',
    { sensusDetailId: form.value.sensusDetailId, prefillProp: props.prefillSensusDetailId, itemsCount: props.items.length }
  )
})

const dateError = ref('')
const saveError = ref('')
const saving = ref(false)

function close() {
  emit('update:modelValue', false)
}

function handleDetailChange(event) {
  // HTML select returns string value, but we need a number
  // Number("5") → 5; Number("") → 0; Number(null) → 0
  const value = event.target.value
  const parsed = value ? Number(value) : null
  form.value.sensusDetailId = parsed
  console.log('[SensusPlanningModal] handleDetailChange:', {
    htmlValue: value,
    parsed,
    type: typeof parsed,
    formValue: form.value.sensusDetailId
  })
}

function validate() {
  dateError.value = ''
  saveError.value = ''
  
  // Check sensus detail is selected
  if (form.value.sensusDetailId === null || form.value.sensusDetailId === undefined) {
    saveError.value = 'Pilih aktivitas kebun terlebih dahulu.'
    return false
  }
  
  // Check dates
  if (form.value.endDate && form.value.startDate && form.value.endDate < form.value.startDate) {
    dateError.value = 'Tanggal akhir harus sama dengan atau setelah tanggal mulai.'
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return
  saveError.value = ''
  saving.value = true
  try {
    const payload = {
      sensus_detail_id: form.value.sensusDetailId,
      start_date: form.value.startDate,
      end_date: form.value.endDate
    }
    if (form.value.status) payload.status = form.value.status
    if (form.value.notes?.trim()) payload.notes = form.value.notes.trim()
    await emit('save', payload)
    close()
  } catch (err) {
    saveError.value = err?.message || 'Gagal menyimpan rencana.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease;
}
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
}
.panel-enter-active .panel-content,
.panel-leave-active .panel-content {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-enter-from .panel-content {
  transform: translateX(100%);
}
.panel-leave-to .panel-content {
  transform: translateX(100%);
}
.modal-fade-leave-to .relative {
  transform: scale(0.96) translateY(8px);
}
</style>
