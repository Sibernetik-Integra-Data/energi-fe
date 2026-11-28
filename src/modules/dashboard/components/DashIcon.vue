<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" class="dash-icon">
    <template v-if="name === 'refresh'"><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" /></template>
    <template v-else-if="name === 'alert'"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></template>
    <template v-else-if="name === 'info'"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></template>
    <template v-else-if="name === 'check'"><path d="M20 6 9 17l-5-5" /></template>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></template>
    <template v-else-if="name === 'calendar'"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></template>
    <template v-else-if="name === 'x'"><path d="M18 6 6 18M6 6l12 12" /></template>
    <template v-else-if="name === 'chevronUp'"><path d="m18 15-6-6-6 6" /></template>
    <template v-else-if="name === 'chevronDown'"><path d="m6 9 6 6 6-6" /></template>
    <template v-else-if="name === 'sort'"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></template>
    <template v-else-if="name === 'arrowRight'"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></template>
    <template v-else-if="name === 'inbox'"><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></template>
    <template v-else><circle cx="12" cy="12" r="3" /></template>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 16 }
})
</script>

<style scoped>
.dash-icon { flex: none; vertical-align: -0.15em; }
</style>
