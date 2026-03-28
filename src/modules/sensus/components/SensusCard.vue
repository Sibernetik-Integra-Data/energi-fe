<template>
  <div class="sensus-card">
    <div class="title">{{ title }}</div>
    <div class="value">{{ value }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, default: '' },
  value: { type: [String, Number], default: '' }
})
</script>

<style scoped>
.sensus-card { background:#fff; padding:12px 16px; border-radius:12px; box-shadow:0 4px 10px rgba(0,0,0,0.04); min-width:140px }
.sensus-card .title { font-size:12px; color:var(--text-muted); margin-bottom:6px }
.sensus-card .value { font-size:20px; font-weight:700 }
</style>
