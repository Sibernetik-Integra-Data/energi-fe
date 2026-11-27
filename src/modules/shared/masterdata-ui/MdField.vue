<template>
  <div class="md-field" :class="{ 'md-field--full': full }">
    <label v-if="label" :for="forId">{{ label }} <span v-if="required" class="md-req" aria-hidden="true">*</span></label>
    <slot />
    <span v-if="error" class="md-field__err" role="alert">{{ error }}</span>
    <span v-else-if="hint" class="md-field__hint">{{ hint }}</span>
  </div>
</template>

<script setup>
// Pembungkus isian: label di atas, tanda wajib, petunjuk, dan pesan galat di tempat.
defineProps({
  label: { type: String, default: '' },
  forId: { type: String, default: undefined },
  required: { type: Boolean, default: false },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  full: { type: Boolean, default: false }
})
</script>
