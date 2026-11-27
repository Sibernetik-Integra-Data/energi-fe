<template>
  <span class="md-badge" :class="`md-badge--${tone}`"><slot /></span>
</template>

<script setup>
// Badge status; selalu berisi teks (warna bukan satu-satunya penanda).
defineProps({ tone: { type: String, default: 'neutral' } }) // success | warning | info | danger | neutral
</script>
