<template>
  <div class="bg-white py-3 px-4 rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.04)] min-w-35">
    <div class="text-xs text-(--text-muted) mb-1.5">{{ title }}</div>
    <div class="text-xl font-bold">{{ value }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  value: { type: [String, Number], default: '' }
})
</script>
