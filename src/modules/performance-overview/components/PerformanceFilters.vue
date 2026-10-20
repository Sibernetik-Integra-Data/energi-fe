<template>
  <div class="flex flex-wrap gap-4">
    <label class="performance-select">
      <span class="sr-only">Bulan</span>
      <select :value="month" aria-label="Bulan" @change="$emit('update:month', Number($event.target.value))">
        <option v-for="(name, index) in months" :key="name" :value="index + 1">{{ name }}</option>
      </select>
      <BaseIcon name="chevron-down" :size="16" />
    </label>
    <label class="performance-select">
      <span class="sr-only">Tahun</span>
      <select :value="year" aria-label="Tahun" @change="$emit('update:year', Number($event.target.value))">
        <option v-for="item in years" :key="item" :value="item">{{ item }}</option>
      </select>
      <BaseIcon name="chevron-down" :size="16" />
    </label>
  </div>
</template>

<script setup>
import BaseIcon from '../../shared/icon'
import { PERFORMANCE_MONTHS as months } from '../model'

defineProps({
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  years: { type: Array, required: true }
})

defineEmits(['update:month', 'update:year'])
</script>

<style scoped>
.performance-select {
  position: relative;
  display: block;
  width: 200px;
  max-width: 100%;
}

.performance-select select {
  width: 100%;
  appearance: none;
  border: 0;
  border-radius: 8px;
  background: var(--surface-muted);
  color: var(--text);
  padding: 10px 36px 10px 12px;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.performance-select :deep(.base-icon-mask),
.performance-select :deep(svg),
.performance-select :deep(.base-icon-img) {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--text-muted);
}
</style>
