<template>
  <div ref="wrap" class="lc">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      width="100%"
      role="img"
      tabindex="0"
      :aria-label="ariaLabel"
      class="lc__svg"
      @pointermove="onMove"
      @pointerleave="active = null"
      @focus="active = active ?? rows.length - 1"
      @blur="active = null"
      @keydown="onKey"
    >
      <g v-for="t in ticks" :key="`t${t}`">
        <line :x1="PL" :x2="W - PR" :y1="y(t)" :y2="y(t)" class="lc__grid" />
        <text :x="PL - 6" :y="y(t) + 3" text-anchor="end" class="lc__axis">{{ formatNumber(t) }}</text>
      </g>
      <text v-for="(r, i) in rows" v-show="i % labelStep === 0 || i === rows.length - 1" :key="`d${r.date}`"
        :x="x(i)" :y="H - 6" text-anchor="middle" class="lc__axis">{{ formatDay(r.date) }}</text>
      <line v-if="active !== null" :x1="x(active)" :x2="x(active)" :y1="PT" :y2="H - PB" class="lc__cross" />
      <template v-for="s in visibleSeries" :key="s.key">
        <polyline fill="none" :stroke="s.color" stroke-width="2" stroke-linejoin="round" :points="points(s.key)" />
        <circle v-if="active !== null" :cx="x(active)" :cy="y(rows[active][s.key])" r="3.5" :fill="s.color" class="lc__dot" />
      </template>
    </svg>
    <div v-if="active !== null" class="lc__tip" :style="tipStyle" role="status">
      <strong>{{ formatDay(rows[active].date, true) }}</strong>
      <span v-for="s in visibleSeries" :key="s.key" class="lc__tip-row">
        <i :style="{ background: s.color }" aria-hidden="true"></i>{{ s.label }}: {{ formatNumber(rows[active][s.key]) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { formatDay, formatNumber } from '../dashboardData'

const props = defineProps({
  rows: { type: Array, required: true },
  series: { type: Array, required: true } // { key, label, color, visible }
})

const W = 640
const H = 200
const PL = 30
const PR = 10
const PT = 8
const PB = 22
const wrap = ref(null)
const active = ref(null)

const visibleSeries = computed(() => props.series.filter((s) => s.visible))
const maxValue = computed(() => {
  const m = Math.max(0, ...props.rows.flatMap((r) => visibleSeries.value.map((s) => r[s.key] || 0)))
  if (m <= 4) return 4
  const step = Math.ceil(m / 4)
  return step * 4
})
const ticks = computed(() => [0, 1, 2, 3, 4].map((i) => (maxValue.value / 4) * i))
const labelStep = computed(() => Math.max(1, Math.ceil(props.rows.length / 7)))

const x = (i) => PL + (i * (W - PL - PR)) / Math.max(1, props.rows.length - 1)
const y = (v) => H - PB - ((v || 0) / maxValue.value) * (H - PB - PT)
const points = (key) => props.rows.map((r, i) => `${x(i)},${y(r[key])}`).join(' ')

const ariaLabel = computed(() => {
  const totals = visibleSeries.value.map((s) => `${s.label} ${formatNumber(props.rows.reduce((t, r) => t + (r[s.key] || 0), 0))}`)
  return `Grafik garis sensus harian per kelompok, ${props.rows.length} hari. Total: ${totals.join(', ')}. Gunakan panah kiri dan kanan untuk membaca per hari.`
})

function onMove(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const px = ((event.clientX - rect.left) / rect.width) * W
  const i = Math.round(((px - PL) / (W - PL - PR)) * (props.rows.length - 1))
  active.value = Math.min(props.rows.length - 1, Math.max(0, i))
}

function onKey(event) {
  if (!props.rows.length) return
  if (event.key === 'ArrowLeft') active.value = Math.max(0, (active.value ?? 0) - 1)
  else if (event.key === 'ArrowRight') active.value = Math.min(props.rows.length - 1, (active.value ?? -1) + 1)
  else if (event.key === 'Escape') active.value = null
  else return
  event.preventDefault()
}

const tipStyle = computed(() => {
  const pct = (x(active.value) / W) * 100
  return pct > 60 ? { right: `${100 - pct + 2}%` } : { left: `${pct + 2}%` }
})
</script>

<style scoped>
.lc { position: relative; }
.lc__svg { display: block; overflow: visible; touch-action: pan-y; }
.lc__svg:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; border-radius: 4px; }
.lc__grid { stroke: var(--border); }
.lc__cross { stroke: var(--border-strong); stroke-dasharray: 3 3; }
.lc__dot { stroke: var(--surface); stroke-width: 1.5; }
.lc__axis { fill: var(--text-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
.lc__tip {
  position: absolute; top: 4px; pointer-events: none; z-index: 2;
  display: grid; gap: 2px; padding: 6px 8px; border-radius: 6px;
  background: var(--text); color: var(--bg); font-size: 12px; white-space: nowrap;
}
.lc__tip-row { display: flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; }
.lc__tip-row i { display: inline-block; width: 10px; height: 3px; border-radius: 2px; }
</style>
