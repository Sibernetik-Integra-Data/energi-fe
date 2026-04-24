<template>
  <div class="bg-(--surface) border border-(--border) rounded-2xl p-6 relative shadow-sm">
    <!-- Status badge -->
    <div class="absolute top-5 right-5">
      <span :class="statusChipClass(status)">{{ status || 'Open' }}</span>
    </div>

    <!-- Sensus ID -->
    <h2 class="text-2xl font-extrabold text-(--text) mb-4 pr-24">{{ displayId }}</h2>

    <!-- Meta info grid -->
    <dl class="grid gap-y-2.5" style="grid-template-columns: auto 1fr">
      <dt class="text-sm text-(--text-muted) font-medium pr-8">Date & Time</dt>
      <dd class="text-sm text-(--text)">{{ date || '—' }}</dd>
      <dt class="text-sm text-(--text-muted) font-medium pr-8">Reporter</dt>
      <dd class="text-sm text-(--text)">{{ reporter || '—' }}</dd>
    </dl>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sensusId: { type: String, default: '' },
  date: { type: String, default: '' },
  reporter: { type: String, default: '' },
  status: { type: String, default: 'Open' }
})

// Format "SEN2026005" → "Sensus 2026-005" or just prefix with "Sensus" if already readable
const displayId = computed(() => {
  if (!props.sensusId) return '—'
  if (props.sensusId.toLowerCase().startsWith('sensus')) return props.sensusId
  return props.sensusId
})

function statusChipClass(status) {
  const base = 'inline-block py-1.5 px-4 rounded-full text-xs font-semibold border'
  if (status && status.toLowerCase() === 'verified') {
    return base + ' bg-green-50 text-green-700 border-green-200'
  }
  return base + ' bg-orange-50 text-orange-700 border-orange-200'
}
</script>
