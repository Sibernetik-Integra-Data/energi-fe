<template>
  <div class="md-seg" role="radiogroup" :aria-label="ariaLabel" @keydown="onKey">
    <button
      v-for="o in options"
      :key="String(o.value)"
      type="button"
      role="radio"
      :aria-checked="String(modelValue === o.value)"
      :tabindex="modelValue === o.value || (!hasValue && o === options[0]) ? 0 : -1"
      @click="$emit('update:modelValue', o.value)">
      {{ o.label }}
    </button>
  </div>
</template>

<script setup>
// Pilihan bersegmen (radio). Panah kiri/kanan berpindah pilihan.
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, null], default: null },
  options: { type: Array, required: true }, // [{ value, label }]
  ariaLabel: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue'])
const hasValue = computed(() => props.options.some((o) => o.value === props.modelValue))

function onKey(e) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  e.preventDefault()
  const i = Math.max(0, props.options.findIndex((o) => o.value === props.modelValue))
  const n = e.key === 'ArrowRight' ? (i + 1) % props.options.length : (i - 1 + props.options.length) % props.options.length
  emit('update:modelValue', props.options[n].value)
  e.currentTarget.children[n]?.focus()
}
</script>
