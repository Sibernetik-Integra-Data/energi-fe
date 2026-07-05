<template>
  <Teleport to="body">
    <Transition name="panel">
      <div
        v-if="modelValue && plan"
        class="fixed inset-0 z-50 flex justify-end"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close"></div>

        <!-- Side Panel -->
        <div
          class="panel-content relative z-10 w-96 max-w-[90vw] h-full bg-(--surface) border-l border-(--border) shadow-2xl flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-detail-title"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-(--border)">
            <div>
              <h3 id="plan-detail-title" class="text-base font-bold text-(--text) m-0">Detail Rencana</h3>
              <p class="text-xs text-(--text-muted) mt-0.5 font-mono">{{ planDisplayId }}</p>
            </div>
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
          <div class="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

            <!-- Job Type -->
            <div class="flex flex-col gap-2">
              <span class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Job Type</span>
              <div class="flex items-center gap-3 py-1">
                <div class="w-1 h-6 rounded-full shrink-0" :style="{ backgroundColor: planColor.bar }"></div>
                <span class="text-base font-semibold text-(--text)">{{ plan.jobType }}</span>
              </div>
            </div>

            <!-- Date Range -->
            <div class="flex flex-col gap-2">
              <span class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Date Range</span>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <span class="text-xs text-(--text-muted)">Start Date</span>
                  <div class="bg-(--surface-muted) border border-(--border) rounded-lg px-3 py-2.5 text-sm text-(--text) font-medium">
                    {{ formatDate(plan.startDate) }}
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-xs text-(--text-muted)">End Date</span>
                  <div class="bg-(--surface-muted) border border-(--border) rounded-lg px-3 py-2.5 text-sm text-(--text) font-medium">
                    {{ formatDate(plan.endDate) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Assigned Blocks -->
            <div class="flex flex-col gap-2">
              <span class="text-xs font-semibold text-(--text-muted) uppercase tracking-wide">Assigned Blocks ({{ plan.blocks?.length || 0 }})</span>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="b in plan.blocks"
                  :key="b"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-(--border) bg-(--surface-muted) text-xs font-semibold text-(--text)"
                >
                  <!-- Location pin icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 shrink-0 text-(--text-muted)" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.218-4.512 3.218-7.327C19.5 6.08 16.185 3 12 3 7.815 3 4.5 6.08 4.5 10c0 2.815 1.274 5.248 3.218 7.327a19.58 19.58 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" clip-rule="evenodd" />
                  </svg>
                  {{ b }}
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-(--border)">
            <button
              @click="$emit('edit', plan)"
              class="w-full py-3 rounded-2xl border border-(--border) bg-(--surface-muted) text-(--text) text-sm font-semibold hover:bg-(--border) transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  plan: { type: Object, default: null },
  planIndex: { type: Number, default: 1 }
})

const emit = defineEmits(['update:modelValue', 'edit'])

const PALETTE = [
  { bar: '#5b7fa6', chipBg: 'rgba(91,127,166,0.15)', chipText: '#3a5a80' },
  { bar: '#5f9e72', chipBg: 'rgba(95,158,114,0.15)', chipText: '#2e6641' },
  { bar: '#c97c44', chipBg: 'rgba(201,124,68,0.15)', chipText: '#8b4a15' },
  { bar: '#8b6bca', chipBg: 'rgba(139,107,202,0.15)', chipText: '#5a2d90' },
  { bar: '#ca9a3a', chipBg: 'rgba(202,154,58,0.15)', chipText: '#8a5e10' },
  { bar: '#4fa8a0', chipBg: 'rgba(79,168,160,0.15)', chipText: '#1e5e5a' },
]

function getJobColor(jobType) {
  if (!jobType) return PALETTE[0]
  let hash = 0
  for (const ch of jobType) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

const planColor = computed(() => getJobColor(props.plan?.jobType))

const planDisplayId = computed(() => {
  const n = String(props.planIndex).padStart(3, '0')
  return `Plan-${n}`
})

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function close() {
  emit('update:modelValue', false)
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
</style>
