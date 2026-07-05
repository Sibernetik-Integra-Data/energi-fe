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

    <div class="metric-card__chart">
      <apexchart
        :key="chartKey"
        :options="chartOptions"
        :series="chartSeries"
        type="area"
        height="72"
      />
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  metric: {
    type: Object,
    required: true
  }
})

const chartKey = ref(0)

const metricTone = computed(() => props.metric.tone || 'orange')
const chartLabels = computed(() => {
  if (Array.isArray(props.metric.pointLabels) && props.metric.pointLabels.length === (props.metric.points || []).length) {
    return props.metric.pointLabels
  }

  const points = props.metric.points || []
  return points.map((_, index) => `Data ${index + 1}`)
})

const toneColorMap = {
  orange: { color: '#fb8c00', light: 'rgba(251, 140, 0, 0.1)' },
  green: { color: '#16a34a', light: 'rgba(22, 163, 74, 0.1)' },
  blue: { color: '#2563eb', light: 'rgba(37, 99, 235, 0.1)' },
  amber: { color: '#d97706', light: 'rgba(217, 119, 6, 0.1)' }
}

const chartOptions = computed(() => {
  const tone = toneColorMap[metricTone.value] || toneColorMap.orange
  return {
    chart: {
      type: 'area',
      sparkline: {
        enabled: true
      },
      parentHeightOffset: 0,
      toolbar: {
        show: false
      }
    },
    markers: {
      size: 0,
      strokeWidth: 0,
      hover: {
        size: 6,
        sizeOffset: 1
      }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      colors: [tone.color]
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        colorStops: [
          {
            offset: 0,
            color: tone.color,
            opacity: 0.28
          },
          {
            offset: 100,
            color: tone.color,
            opacity: 0.02
          }
        ]
      }
    },
    grid: {
      show: false,
      padding: {
        top: 8,
        right: 10,
        bottom: 0,
        left: 10
      }
    },
    xaxis: {
      categories: chartLabels.value,
      crosshairs: {
        show: false
      },
      axisBorder: {
        show: false
      },
      labels: {
        show: false
      }
    },
    yaxis: {
      labels: {
        show: false
      }
    },
    tooltip: {
      enabled: true,
      theme: 'dark',
      x: {
        show: true,
        formatter: (_, opts) => {
          const pointIndex = opts?.dataPointIndex ?? 0
          return chartLabels.value[pointIndex] || `Minggu ke ${pointIndex + 1}`
        }
      },
      y: {
        formatter: (value) => {
          const label = props.metric.tooltipLabel || 'Total'
          return `${label}: ${Math.round(value)}`
        },
        title: {
          formatter: () => ''
        }
      },
      marker: {
        show: true
      },
      style: {
        fontSize: '12px',
        fontFamily: 'var(--font-family, system-ui, -apple-system, sans-serif)'
      }
    }
  }
})

const chartSeries = computed(() => {
  const points = props.metric.points || []
  return [
    {
      data: points
    }
  ]
})

// Re-render chart when metric points change
watch(() => props.metric.points, () => {
  chartKey.value += 1
}, { deep: true })

watch(() => props.metric.pointLabels, () => {
  chartKey.value += 1
}, { deep: true })
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
  overflow: hidden;
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

.metric-card__chart {
  width: 100%;
  min-width: 0;
  margin: 0;
  height: 82px;
  overflow: hidden;
}

.metric-card__chart :deep(.apexcharts-canvas),
.metric-card__chart :deep(.apexcharts-svg),
.metric-card__chart :deep(.apexcharts-inner),
.metric-card__chart :deep(.apexcharts-graphical),
.metric-card__chart :deep(svg) {
  width: 100% !important;
  max-width: 100% !important;
}

.metric-card__chart :deep(.apexcharts-tooltip) {
  pointer-events: none;
}
</style>