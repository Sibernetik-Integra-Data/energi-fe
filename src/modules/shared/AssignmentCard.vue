<template>
  <article class="bg-(--surface) border border-(--border) rounded-[14px] overflow-hidden flex flex-col min-w-0 h-fit self-start p-[20px]">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-base font-bold text-(--text) leading-6 truncate">{{ jobType || 'Pekerjaan' }}</h3>
        <p class="text-sm font-bold text-(--text) leading-6">{{ date || '—' }}</p>
        <p class="text-sm text-(--text-muted) leading-6 truncate">{{ sensusRef }}</p>
      </div>
      <img :src="iconSrc" :alt="`Ikon ${jobType || 'pekerjaan'}`" class="w-[46px] h-[46px] shrink-0" />
    </div>

    <div class="flex flex-col gap-2 mt-4">
      <div class="flex flex-col gap-2">
        <p class="text-xs text-(--text-muted) leading-4 m-0">Status</p>
        <span v-if="statusMeta" :class="statusMeta.className">{{ statusMeta.label }}</span>
      </div>

      <div class="flex flex-col gap-2 mt-3">
        <p class="text-xs text-(--text-muted) leading-4 m-0">Nomor Petak</p>
        <div class="flex flex-wrap gap-2">
        <span v-for="(block, index) in visibleBlocks" :key="index" class="bg-(--surface-muted) text-(--text) rounded-xl px-2 py-1 text-xs leading-4 font-medium tracking-[0.4px]">
          {{ block }}
        </span>
        <span v-if="hiddenCount" class="bg-(--status-wip-bg) text-(--status-wip-text) rounded-xl px-2 py-1 text-xs leading-4 font-medium tracking-[0.4px]">+ {{ hiddenCount }} more</span>
        </div>
      </div>
    </div>

    <div v-if="photo && showPhoto" class="pb-3 mt-auto">
      <div class="relative h-28 rounded-lg overflow-hidden bg-(--surface-muted)">
        <ProtectedImage :src="photo" alt="Foto pekerjaan" container-class="w-full h-full" image-class="w-full h-full object-cover" />
        <span v-if="extraPhotos > 0" class="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">+{{ extraPhotos }} more</span>
      </div>
    </div>

    <div class="mt-4">
      <div class="flex flex-wrap gap-3">
        <button type="button" class="basis-0 flex-1 min-w-0 h-10 inline-flex items-center justify-center whitespace-nowrap text-sm leading-5 font-medium p-2.5 rounded-3xl border border-(--border-strong) bg-transparent text-(--text-muted) hover:bg-(--surface-muted) transition-colors cursor-pointer" @click="$emit('view-detail')">
          Lihat Detail
        </button>
        <button v-if="showAddToPlan" type="button" class="basis-0 flex-1 min-w-0 h-10 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-none font-semibold px-3 rounded-full bg-(--text) text-(--surface) hover:opacity-80 transition-opacity cursor-pointer" @click="$emit('add-to-plan')">
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
import ProtectedImage from './ProtectedImage.vue'

const props = defineProps({
  jobType: { type: String, default: '' },
  groupOfWork: { type: String, default: '' },
  date: { type: String, default: '' },
  sensusRef: { type: String, default: '' },
  blocks: { type: Array, default: () => [] },
  photo: { type: String, default: '' },
  extraPhotos: { type: Number, default: 0 },
  maxVisible: { type: Number, default: 7 },
  showAddToPlan: { type: Boolean, default: true },
  progressStatus: { type: String, default: '' },
  showPhoto: { type: Boolean, default: true }
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
const statusMeta = computed(() => {
  const status = String(props.progressStatus || '').toLowerCase()
  const statuses = {
    wip: { label: 'On Progress', className: 'self-start bg-(--status-wip-bg) text-(--status-wip-text) rounded-xl px-2 py-1 text-xs leading-4' },
    submitted: { label: 'On Plan', className: 'self-start bg-(--status-plan-bg) text-(--status-plan-text) rounded-xl px-2 py-1 text-xs leading-4' },
    planned: { label: 'On Plan', className: 'self-start bg-(--status-plan-bg) text-(--status-plan-text) rounded-xl px-2 py-1 text-xs leading-4' },
    overtime: { label: 'Overtime', className: 'self-start bg-(--status-overtime-bg) text-(--status-overtime-text) rounded-xl px-2 py-1 text-xs leading-4' },
    done: { label: 'Done', className: 'self-start bg-(--status-done-bg) text-(--status-done-text) rounded-xl px-2 py-1 text-xs leading-4' }
  }
  return statuses[status] || null
})
</script>
