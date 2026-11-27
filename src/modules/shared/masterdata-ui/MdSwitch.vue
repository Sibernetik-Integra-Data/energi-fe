<template>
  <button type="button" class="md-toggle" role="switch" :aria-checked="String(modelValue)" @click="$emit('update:modelValue', !modelValue)">
    <span class="md-switch" />
    <span>
      <b>{{ label }}</b>
      <small v-if="description">{{ description }}</small>
    </span>
  </button>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
  description: { type: String, default: '' }
})
defineEmits(['update:modelValue'])
</script>
