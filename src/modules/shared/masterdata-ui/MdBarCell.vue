<template>
  <div v-if="value != null && value !== ''" class="md-barcell">
    <div class="md-barcell__track"><div class="md-barcell__fill" :style="{ width: `${pct}%` }" /></div>
    <span class="md-num">{{ formatted }}</span>
  </div>
  <span v-else class="md-muted">{{ emptyText }}</span>
</template>

<script setup>
// Angka dengan bar proporsi terhadap nilai terbesar di tabel.
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: null },
  max: { type: Number, default: 1 },
  emptyText: { type: String, default: 'Belum diisi' }
})
const pct = computed(() => Math.min(100, Math.round(((props.value || 0) / Math.max(1, props.max)) * 100)))
const formatted = computed(() => Number(props.value).toLocaleString('id-ID'))
</script>
