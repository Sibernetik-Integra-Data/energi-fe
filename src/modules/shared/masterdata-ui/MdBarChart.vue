<template>
  <section class="md-panel md-chart" :aria-label="title">
    <div class="md-chart__h">
      <h2>{{ title }}</h2>
      <span v-if="subtitle">{{ subtitle }}</span>
      <div v-if="legend.length" class="md-legend">
        <span v-for="l in legend" :key="l.label"><i :style="{ background: l.color }" />{{ l.label }}</span>
      </div>
    </div>
    <div class="md-bars" role="group" :aria-label="t('mdui.filterOf', { title })">
      <button
        v-for="b in bars"
        :key="b.key"
        type="button"
        class="md-bar"
        :aria-pressed="String(selected.includes(b.key))"
        :aria-label="b.ariaLabel || b.label"
        :title="b.ariaLabel || b.label"
        @click="$emit('toggle', b.key)">
        <div class="md-bar__stack">
          <div
            v-for="(s, i) in b.segments.filter((x) => x.value > 0)"
            :key="i"
            :style="{ height: `${(s.value / max) * 92}px`, background: s.color }" />
        </div>
        <span class="md-bar__lbl">{{ b.label }}</span>
      </button>
    </div>
  </section>
</template>

<script setup>
// Grafik batang bertumpuk sederhana; batang bisa diklik sebagai filter (emit `toggle`).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  legend: { type: Array, default: () => [] }, // [{ label, color }]
  bars: { type: Array, default: () => [] }, // [{ key, label, ariaLabel, segments: [{ value, color }] }]
  selected: { type: Array, default: () => [] }
})
defineEmits(['toggle'])

const max = computed(() =>
  Math.max(1, ...props.bars.map((b) => b.segments.reduce((s, x) => s + (x.value || 0), 0)))
)
</script>
