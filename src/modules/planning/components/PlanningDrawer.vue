<template>
  <!-- Backdrop -->
  <Transition name="backdrop-fade">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black/25 z-40"
      @click="close"
      aria-hidden="true"
    ></div>
  </Transition>

  <!-- Drawer panel -->
  <Transition name="drawer-slide">
    <aside
      v-if="modelValue"
      class="fixed top-0 right-0 bottom-0 w-90 bg-(--surface) border-l border-(--border) z-50 flex flex-col overflow-hidden shadow-[-8px_0_32px_rgba(2,6,23,0.12)]"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 pt-4.5 pb-4 border-b border-(--border) shrink-0">
        <h2 class="m-0 text-base font-bold text-(--text)">{{ title }}</h2>
        <button
          type="button"
          class="grid place-items-center w-8 h-8 rounded-lg border border-(--border) bg-(--surface-muted) text-(--text-muted) cursor-pointer transition-colors duration-150 hover:text-(--text) hover:bg-(--surface)"
          aria-label="Tutup"
          @click="close"
        >
          <BaseIcon name="x" :size="18" />
        </button>
      </div>

      <!-- Form -->
      <form class="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4" @submit.prevent="handleSave">

        <!-- ID Sensus -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-(--text-muted) tracking-wide uppercase" for="planning-sensus-id">
            ID Sensus
          </label>
          <select
            id="planning-sensus-id"
            v-model="form.sensusId"
            :disabled="!!editItem || !!prefillSensusId"
            class="h-9.5 px-3 border border-(--border) rounded-lg bg-(--surface) text-(--text) text-sm outline-none transition-colors duration-150 focus:border-(--brand) w-full disabled:opacity-50 disabled:cursor-not-allowed"
            @change="onSensusChange"
          >
            <option value="" disabled>Pilih Sensus...</option>
            <option v-for="opt in sensusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Sensus Detail (two-step: shown after sensus is selected, only for create) -->
        <div v-if="!editItem" class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-(--text-muted) tracking-wide uppercase" for="planning-sensus-detail">
            Detail Sensus
          </label>
          <div v-if="detailsLoading" class="text-xs text-(--text-muted) py-2">Memuat detail...</div>
          <select
            v-else
            id="planning-sensus-detail"
            v-model="form.sensusDetailId"
            :disabled="!form.sensusId || sensusDetailOptions.length === 0"
            class="h-9.5 px-3 border border-(--border) rounded-lg bg-(--surface) text-(--text) text-sm outline-none transition-colors duration-150 focus:border-(--brand) w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option :value="null" disabled>{{ form.sensusId ? 'Pilih Detail...' : 'Pilih Sensus terlebih dahulu' }}</option>
            <option v-for="opt in sensusDetailOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <p v-if="form.sensusId && !detailsLoading && sensusDetailOptions.length === 0" class="text-xs text-red-500">
            Tidak ada detail sensus untuk ID ini.
          </p>
        </div>

        <!-- Tanggal Mulai & Akhir (side by side) -->
        <div class="flex gap-3">
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="text-[12px] font-semibold text-(--text-muted) tracking-wide uppercase" for="planning-tgl-mulai">
              Tanggal Mulai
            </label>
            <input
              id="planning-tgl-mulai"
              type="date"
              v-model="form.startDate"
              class="h-9.5 px-3 border border-(--border) rounded-lg bg-(--surface) text-(--text) text-sm outline-none transition-colors duration-150 focus:border-(--brand) w-full"
            />
          </div>
          <div class="flex flex-col gap-1.5 flex-1">
            <label class="text-[12px] font-semibold text-(--text-muted) tracking-wide uppercase" for="planning-tgl-akhir">
              Tanggal Akhir
            </label>
            <input
              id="planning-tgl-akhir"
              type="date"
              v-model="form.endDate"
              class="h-9.5 px-3 border border-(--border) rounded-lg bg-(--surface) text-(--text) text-sm outline-none transition-colors duration-150 focus:border-(--brand) w-full"
            />
          </div>
        </div>

        <!-- Status -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-(--text-muted) tracking-wide uppercase" for="planning-status">
            Status
          </label>
          <select
            id="planning-status"
            v-model="form.status"
            class="h-9.5 px-3 border border-(--border) rounded-lg bg-(--surface) text-(--text) text-sm outline-none transition-colors duration-150 focus:border-(--brand) w-full"
          >
            <option value="">— Opsional —</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Catatan -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[12px] font-semibold text-(--text-muted) tracking-wide uppercase" for="planning-notes">
            Catatan
          </label>
          <textarea
            id="planning-notes"
            v-model="form.notes"
            rows="3"
            class="px-3 py-2 border border-(--border) rounded-lg bg-(--surface) text-(--text) text-sm outline-none transition-colors duration-150 focus:border-(--brand) w-full resize-none"
            placeholder="Opsional..."
          ></textarea>
        </div>

        <!-- Error message -->
        <p v-if="saveError" class="text-xs text-red-500">{{ saveError }}</p>

        <!-- Footer -->
        <div class="pt-1 mt-auto">
          <button
            type="submit"
            :disabled="!isFormValid || saving"
            class="w-full h-10.5 bg-(--text) text-(--surface) border-none rounded-xl text-sm font-bold cursor-pointer transition-opacity duration-150 hover:enabled:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </form>
    </aside>
  </Transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import BaseIcon from '../../shared/icon'
import { useToast } from '../../../utils/toast'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Rencana Baru' },
  sensusOptions: { type: Array, default: () => [] },
  editItem: { type: Object, default: null },
  prefillSensusId: { type: String, default: '' },
  prefillSensusDetailId: { type: Number, default: null },
  onFetchSensusDetails: { type: Function, default: null },
  onSave: { type: Function, default: null }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { show: showToast } = useToast()

const form = ref(createEmptyForm())
const sensusDetailOptions = ref([])
const detailsLoading = ref(false)
const saving = ref(false)
const saveError = ref('')

function createEmptyForm() {
  return {
    sensusId: '',
    sensusDetailId: null,
    startDate: '',
    endDate: '',
    status: '',
    notes: ''
  }
}

watch(
  () => props.editItem,
  (item) => {
    if (item) {
      form.value = {
        sensusId: item.sensusId ?? '',
        sensusDetailId: item.sensusDetailId ?? null,
        startDate: item.startDate ?? '',
        endDate: item.endDate ?? '',
        status: item.status ?? '',
        notes: item.notes ?? ''
      }
    } else {
      form.value = createEmptyForm()
      sensusDetailOptions.value = []
    }
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      saveError.value = ''
      if (!props.editItem) {
        form.value = createEmptyForm()
        sensusDetailOptions.value = []
      }
      return
    }
    // When opening for create with prefill values, populate the form
    if (!props.editItem && props.prefillSensusId) {
      form.value = createEmptyForm()
      form.value.sensusId = props.prefillSensusId
      await onSensusChange()
      if (props.prefillSensusDetailId) {
        form.value.sensusDetailId = props.prefillSensusDetailId
      }
    }
  }
)

async function onSensusChange() {
  form.value.sensusDetailId = null
  sensusDetailOptions.value = []
  if (!form.value.sensusId || !props.onFetchSensusDetails) return
  detailsLoading.value = true
  try {
    sensusDetailOptions.value = await props.onFetchSensusDetails(form.value.sensusId)
  } catch {
    sensusDetailOptions.value = []
  } finally {
    detailsLoading.value = false
  }
}

const isFormValid = computed(() => {
  const base = form.value.startDate && form.value.endDate
  if (props.editItem) return !!base
  return !!(base && form.value.sensusDetailId)
})

function close() {
  emit('update:modelValue', false)
}

async function handleSave() {
  if (!isFormValid.value) return
  saveError.value = ''
  saving.value = true
  try {
    const payload = {
      start_date: form.value.startDate,
      end_date: form.value.endDate
    }
    if (form.value.status) payload.status = form.value.status
    if (form.value.notes) payload.notes = form.value.notes

    if (props.editItem) {
      await props.onSave(props.editItem.id, payload)
    } else {
      payload.sensus_detail_id = form.value.sensusDetailId
      await props.onSave(null, payload)
    }
    emit('saved')
    close()
  } catch (err) {
    saveError.value = err?.message || 'Gagal menyimpan rencana.'
    showToast(saveError.value, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* Transitions only — all layout/visual CSS moved to Tailwind */
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>