<template>
  <div class="md-page">
    <section class="md-hero">
      <nav class="md-crumb" aria-label="Breadcrumb">
        <span>Data Master</span><span aria-hidden="true">/</span><b>{{ title }}</b>
      </nav>
      <div class="md-head">
        <div>
          <h1>{{ title }}</h1>
          <p v-if="description">{{ description }}</p>
        </div>
        <div class="md-spacer" />
        <slot name="actions" />
      </div>
    </section>
    <div class="md-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
// Kerangka halaman Data Master gaya "Dasbor KPI": kepala bergradasi + isi yang menumpuk ke atasnya.
import './md.css'

defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' }
})
</script>
