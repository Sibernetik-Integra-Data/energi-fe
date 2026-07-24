<template>
  <article class="bg-(--surface) border border-(--border) rounded-xl overflow-hidden shadow-sm flex flex-col min-w-0 min-h-[237px]">
    <div class="p-4 pb-3 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-bold text-(--text) leading-snug truncate">{{ jobType || 'Pekerjaan' }}</h3>
        <p class="text-xs font-semibold text-(--text) mt-1">{{ date || '—' }}</p>
        <p class="text-xs text-(--text-muted) mt-1 truncate">{{ sensusRef }}</p>
      </div>
      <img :src="iconSrc" :alt="`Ikon ${jobType || 'pekerjaan'}`" class="w-[46px] h-[46px] shrink-0" />
    </div>

    <div class="px-4 pb-3">
      <p class="text-[10px] text-(--text-muted) mb-1.5">Nomor Petak</p>
      <div class="flex flex-wrap gap-1.5">
        <span v-for="(block, index) in visibleBlocks" :key="index" class="bg-(--surface-muted) text-(--text) rounded-full px-2.5 py-1 text-[10px] font-medium">
          {{ block }}
        </span>
        <span v-if="hiddenCount" class="bg-orange-50 text-orange-500 rounded-full px-2.5 py-1 text-[10px] font-medium">+ {{ hiddenCount }} more</span>
      </div>
    </div>

    <div v-if="photo" class="px-4 pb-3 mt-auto">
      <div class="relative h-28 rounded-lg overflow-hidden bg-(--surface-muted)">
        <img :src="photo" alt="Foto pekerjaan" class="w-full h-full object-cover" />
        <span v-if="extraPhotos > 0" class="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">+{{ extraPhotos }} more</span>
      </div>
    </div>

    <div class="px-4 pb-4">
      <div class="flex gap-2">
        <button type="button" class="flex-1 h-16 text-base px-3 rounded-full border border-(--border) bg-transparent text-(--text) hover:bg-(--surface-muted) transition-colors cursor-pointer" @click="$emit('view-detail')">
          Lihat Detail
        </button>
        <button type="button" class="flex-[1.8] h-16 text-base font-semibold px-3 rounded-full bg-(--text) text-(--surface) hover:opacity-80 transition-opacity cursor-pointer" @click="$emit('add-to-plan')">
          +&nbsp; Tambahkan ke Perencanaan
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import cleaningIcon from '@/assets/icons/pembersihan.svg'
import fertilizeIcon from '@/assets/icons/pemupukan.svg'
import harvestIcon from '@/assets/icons/panen.svg'

const props = defineProps({
  jobType: { type: String, default: '' },
  groupOfWork: { type: String, default: '' },
  date: { type: String, default: '' },
  sensusRef: { type: String, default: '' },
  blocks: { type: Array, default: () => [] },
  photo: { type: String, default: '' },
  extraPhotos: { type: Number, default: 0 },
  maxVisible: { type: Number, default: 5 }
})

defineEmits(['view-detail', 'add-to-plan'])

const typeKey = computed(() => `${props.groupOfWork} ${props.jobType}`.toLowerCase())
const iconSrc = computed(() => {
  if (typeKey.value.includes('panen') || typeKey.value.includes('harvest')) return harvestIcon
  if (typeKey.value.includes('pemupukan') || typeKey.value.includes('pupuk') || typeKey.value.includes('fertiliz')) return fertilizeIcon
  return cleaningIcon
})
const visibleBlocks = computed(() => props.blocks.slice(0, props.maxVisible))
const hiddenCount = computed(() => Math.max(0, props.blocks.length - props.maxVisible))
</script>
