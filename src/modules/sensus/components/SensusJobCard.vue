<template>
  <div class="bg-(--surface) border border-(--border) rounded-2xl overflow-hidden shadow-sm flex flex-col py-2 gap-2">

    <!-- Card header: title + icon -->
    <div class="p-5 pb-3 flex justify-between items-start gap-3">
      <div class="min-w-0 gap-1 flex flex-col">
        <h3 class="text-base font-bold text-(--text) leading-snug">{{ jobType || 'Pekerjaan' }}</h3>
        <p class="text-sm text-(--text-muted) mt-0.5">{{ date }}</p>
        <p class="text-xs text-(--text-muted) mt-0.5 font-medium">{{ sensusRef }}</p>
      </div>
      <div
        :class="iconStyle.bg"
        class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
        aria-hidden="true"
      >{{ iconStyle.icon }}</div>
    </div>

    <!-- Blocks section -->
    <div class="px-5 pb-3">
      <p class="text-xs font-semibold text-(--text-muted) mb-2 tracking-wide uppercase">Nomor Petak</p>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="(block, i) in visibleBlocks"
          :key="i"
          class="inline-block bg-(--surface-muted) border border-(--border) text-(--text) py-0.5 px-2.5 rounded-full text-xs font-medium"
        >{{ block }}</span>
        <button
          v-if="hiddenCount > 0"
          class="inline-block bg-(--surface-muted) border border-(--border) text-(--text-muted) py-0.5 px-2.5 rounded-full text-xs font-medium cursor-pointer hover:bg-(--border) transition-colors"
          @click="showAllBlocks = !showAllBlocks"
        >{{ showAllBlocks ? 'Tutup' : '+' + hiddenCount + ' more' }}</button>
      </div>
    </div>

    <!-- Photo -->
    <!-- <div class="mx-5 mb-4 relative rounded-xl overflow-hidden h-36 bg-(--surface-muted)">
      <img
        v-if="photo"
        :src="photo"
        alt="Foto lapangan"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center gap-1.5 text-(--text-muted)">
        <span class="text-2xl">🌾</span>
        <span class="text-xs">Belum ada foto</span>
      </div>
      <div
        v-if="extraPhotos > 0"
        class="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-full pointer-events-none"
      >+{{ extraPhotos }}m</div> -->

      <!-- Progress status pill on photo -->
      <!-- <div
        v-if="progressStatus"
        class="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-0.5 rounded-full"
        :class="progressStatusClass"
      >{{ progressStatus }}</div>
    </div> -->

    <!-- Actions -->
    <div class="px-2 pb-2 mt-auto flex gap-2 font-semibold">
      <button
        class="shrink-0 text-sm py-2 px-4 rounded-xl text-(--text) bg-transparent border border-(--border) hover:bg-(--surface-muted) transition-colors cursor-pointer"
        @click="$emit('view')"
      >Lihat Detail</button>
      <button
        class="flex-1 text-sm py-2 px-3 rounded-xl text-white bg-(--brand) hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center gap-1.5 min-w-0"
        @click="$emit('plan')"
      >
        <span class="text-base leading-none shrink-0">+</span>
        <span class="whitespace-normal wrap-break-word text-sm text-center">Tambahkan ke Perencanaan</span>
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  jobType: { type: String, default: '' },
  date: { type: String, default: '' },
  sensusRef: { type: String, default: '' },
  blocks: { type: Array, default: () => [] },
  photo: { type: String, default: '' },
  extraPhotos: { type: Number, default: 0 },
  progressStatus: { type: String, default: '' },
  maxVisible: { type: Number, default: 5 }
})

defineEmits(['view', 'plan'])

const showAllBlocks = ref(false)

const visibleBlocks = computed(() =>
  showAllBlocks.value ? props.blocks : props.blocks.slice(0, props.maxVisible)
)
const hiddenCount = computed(() =>
  showAllBlocks.value ? 0 : Math.max(0, props.blocks.length - props.maxVisible)
)

// Icon + color mapping per job type keyword
const JOB_TYPE_MAP = [
  { keywords: ['rawat jalan', 'jalan', 'road'],    icon: '🛤️',  bg: 'bg-blue-100' },
  { keywords: ['pemupukan', 'pupuk', 'fertiliz'],  icon: '🌿',  bg: 'bg-green-100' },
  { keywords: ['panen', 'harvest'],                icon: '🌾',  bg: 'bg-amber-100' },
  { keywords: ['pembersihan', 'bersih', 'clean'],  icon: '🧹',  bg: 'bg-teal-100' },
  { keywords: ['semprot', 'spray', 'pestisid'],    icon: '💧',  bg: 'bg-sky-100' },
  { keywords: ['tanam', 'plant', 'replant'],       icon: '🌱',  bg: 'bg-lime-100' },
  { keywords: ['sensus', 'census', 'survey'],      icon: '📊',  bg: 'bg-violet-100' },
]

const iconStyle = computed(() => {
  const key = (props.jobType || '').toLowerCase()
  const match = JOB_TYPE_MAP.find(m => m.keywords.some(k => key.includes(k)))
  return match || { icon: '📋', bg: 'bg-gray-100' }
})

const progressStatusClass = computed(() => {
  const s = (props.progressStatus || '').toLowerCase()
  if (s === 'done')                          return 'text-green-700'
  if (s === 'submitted')                     return 'text-blue-700'
  if (s === 'wip')                           return 'text-yellow-700'
  if (s === 'draft')                         return 'text-orange-700'
  // legacy / English fallbacks
  if (s.includes('selesai') || s.includes('complete')) return 'text-green-700'
  if (s.includes('proses')  || s.includes('progress')) return 'text-blue-700'
  return 'text-orange-700'
})
</script>
