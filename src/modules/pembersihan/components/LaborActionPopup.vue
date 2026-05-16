<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-black/45" aria-hidden="true" @click="$emit('close')" />

    <div
      class="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-(--surface) border border-(--border) rounded-2xl shadow-2xl"
      role="dialog"
      aria-modal="true"
      :aria-label="`Rencana baru untuk ${displayName}`"
    >
      <div class="px-6 py-4 border-b border-(--border) flex items-center">
        <h4 class="text-sm font-bold text-(--text) m-0">Rencana Baru</h4>
        <button
          type="button"
          class="ml-auto w-8 h-8 rounded-lg border-0 bg-transparent text-(--text-muted) hover:text-(--text) hover:bg-(--surface-muted) cursor-pointer"
          aria-label="Tutup modal"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="px-6 py-5">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-lg shrink-0" aria-hidden="true">👷</div>
          <div>
            <p class="text-sm font-semibold text-(--text) m-0">{{ displayName }}</p>
            <p class="text-xs text-(--text-muted) m-0 mt-0.5">{{ workerIdLabel }}</p>
          </div>
        </div>

        <div class="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-xs mb-4 items-start">
          <p class="m-0 text-(--text-muted)">Tanggal Pengerjaan</p>
          <p class="m-0 text-(--text) font-medium">{{ formattedWorkDate }}</p>

          <p class="m-0 text-(--text-muted)">Nomor Petak</p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="(block, index) in blocks"
              :key="`${block}-${index}`"
              class="inline-block px-2 py-0.5 rounded-md bg-(--surface-muted) border border-(--border) text-[10px] text-(--text) font-semibold"
            >{{ block }}</span>
          </div>

          <p class="m-0 text-(--text-muted)">Jumlah Pokok</p>
          <p class="m-0 text-(--text) font-medium">{{ plantCount }}</p>
        </div>

        <div class="grid grid-cols-[110px_1fr] gap-x-4 gap-y-4 text-xs">
          <p class="m-0 text-(--text-muted)">Foto Sebelum Pengerjaan</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <img
              v-for="(src, index) in beforePhotos"
              :key="`before-${index}`"
              :src="src"
              alt="Foto sebelum pengerjaan"
              class="w-full h-32 object-cover rounded-lg border border-(--border)"
            />
          </div>

          <p class="m-0 text-(--text-muted)">Foto Setelah Pengerjaan</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <img
              v-for="(src, index) in afterPhotos"
              :key="`after-${index}`"
              :src="src"
              alt="Foto setelah pengerjaan"
              class="w-full h-32 object-cover rounded-lg border border-(--border)"
            />
          </div>

          <p class="m-0 text-(--text-muted)">Keterangan</p>
          <p class="m-0 text-(--text) leading-relaxed">{{ description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  labor: { type: Object, required: true },
  planId: { type: [Number, String], default: null },
  plan: { type: Object, default: null },
  workDate: { type: String, default: '' }
})

const emit = defineEmits(['close'])

const displayName = computed(() => {
  if (props.labor.username && props.labor.username !== props.labor.userId) {
    return props.labor.username
  }
  return props.labor.userId || `Pekerja #${props.labor.id}`
})

const workerIdLabel = computed(() => {
  if (props.labor.userId) return props.labor.userId
  return `ID Pekerja ${String(props.labor.id || '').padStart(4, '0')}`
})

const formattedWorkDate = computed(() => {
  const raw = props.workDate || props.labor.workDate || props.plan?.startDate || ''
  const dateOnly = String(raw).slice(0, 10)
  if (!dateOnly) return '—'
  return dateOnly
})

const blocks = computed(() => {
  const value = Array.isArray(props.plan?.blocks) ? props.plan.blocks : []
  if (value.length) return value.slice(0, 8)
  return ['Blok C1', 'Blok C2', 'Blok C3']
})

const plantCount = computed(() => {
  return props.labor.plantCount || props.labor.totalPlants || props.plan?.totalPlants || 200
})

const beforePhotos = computed(() => {
  const value = Array.isArray(props.labor.beforePhotos) ? props.labor.beforePhotos : []
  if (value.length) return value.slice(0, 3)
  return [
    'https://picsum.photos/seed/pembersihan-before-1/320/180',
    'https://picsum.photos/seed/pembersihan-before-2/320/180',
    'https://picsum.photos/seed/pembersihan-before-3/320/180'
  ]
})

const afterPhotos = computed(() => {
  const value = Array.isArray(props.labor.afterPhotos) ? props.labor.afterPhotos : []
  if (value.length) return value.slice(0, 3)
  return [
    'https://picsum.photos/seed/pembersihan-after-1/320/180',
    'https://picsum.photos/seed/pembersihan-after-2/320/180',
    'https://picsum.photos/seed/pembersihan-after-3/320/180'
  ]
})

const description = computed(() => {
  return props.labor.description || props.labor.notes || 'Lorem ipsum'
})

function handleKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>
