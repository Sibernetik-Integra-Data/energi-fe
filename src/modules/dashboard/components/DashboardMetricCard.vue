<template>
  <article class="metric-card">
    <div class="metric-card__header">
      <div>
        <p class="metric-card__eyebrow">{{ metric.detail }}</p>
        <h3>{{ metric.title }}</h3>
      </div>
      <span class="metric-card__delta" :class="`metric-card__delta--${metricTone}`">{{ metric.delta }}</span>
    </div>

    <div class="metric-card__value-row">
      <strong>{{ metric.value }}</strong>
      <span>update</span>
    </div>

    <DashboardSparkline :points="metric.points" :tone="metricTone" />
  </article>
</template>

<script setup>
import { computed } from 'vue'
import DashboardSparkline from './DashboardSparkline.vue'

const props = defineProps({
  metric: {
    type: Object,
    required: true
  }
})

const metricTone = computed(() => props.metric.tone || 'orange')
</script>

<style scoped>
.metric-card {
  min-height: 142px;
  padding: 20px 20px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow);
  display: grid;
  gap: 8px;
}

.metric-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
}

.metric-card__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-soft);
}

.metric-card h3 {
  margin: 0;
  font-size: 16px;
  line-height: 22px;
}

.metric-card__delta {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.metric-card__delta--orange {
  background: var(--brand-soft);
  color: var(--brand);
}

.metric-card__delta--green {
  background: var(--success-soft);
  color: var(--success);
}

.metric-card__delta--blue {
  background: var(--info-soft);
  color: var(--info);
}

.metric-card__delta--amber {
  background: var(--warning-soft);
  color: var(--warning);
}

.metric-card__value-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.metric-card__value-row strong {
  font-size: 36px;
  line-height: 1;
  letter-spacing: -0.05em;
}

.metric-card__value-row span {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}
</style>