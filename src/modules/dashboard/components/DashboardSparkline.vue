<template>
  <svg class="sparkline" viewBox="0 0 240 72" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop :stop-color="toneColor" stop-opacity="0.28" offset="0%" />
        <stop :stop-color="toneColor" stop-opacity="0.02" offset="100%" />
      </linearGradient>
    </defs>

    <path :d="areaPath" :fill="`url(#${gradientId})`" />
    <path :d="linePath" :stroke="toneColor" stroke-width="2.4" fill="none" stroke-linecap="round" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  points: {
    type: Array,
    required: true
  },
  tone: {
    type: String,
    default: 'orange'
  }
})

const toneMap = {
  orange: '#fb8c00',
  green: '#16a34a',
  blue: '#2563eb',
  amber: '#d97706'
}

const toneColor = computed(() => toneMap[props.tone] ?? toneMap.orange)
const gradientId = computed(() => `sparkline-${props.tone}-${Math.abs(props.points.join('-').length)}`)

const geometry = computed(() => {
  const width = 240
  const height = 72
  const values = props.points.length > 1 ? props.points : [0, 0]
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)
  const step = width / (values.length - 1)

  const coords = values.map((value, index) => {
    const normalized = (value - min) / range
    const x = step * index
    const y = height - 14 - normalized * 42
    return { x, y }
  })

  const linePath = coords.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

  return { linePath, areaPath }
})

const linePath = computed(() => geometry.value.linePath)
const areaPath = computed(() => geometry.value.areaPath)
</script>

<style scoped>
.sparkline {
  width: 100%;
  height: 72px;
  display: block;
}
</style>