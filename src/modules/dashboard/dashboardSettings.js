import { ref } from 'vue'

// Dashboard presentation managed in Strapi (single type "Dashboard Setting"):
// intro texts, quick links, metric card order / visibility / texts, and the two
// table sections. The data itself still comes from the backend (model.js).
const ENDPOINT = (import.meta.env.VITE_STRAPI_DASHBOARD_ENDPOINT || '/api/dashboard-setting').trim()
const CACHE_KEY = 'energi-cms-dashboard'
const METRICS = new Set(['sensus', 'pembersihan', 'pemupukan', 'panen'])
const TONES = new Set(['orange', 'green', 'blue', 'amber'])
const SAFE_LINK = /^(https:\/\/\S+|\/(?!\/)\S*)$/

const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

function normalize(data) {
  if (!data || typeof data !== 'object') return null
  const section = (value) => ({
    isVisible: value?.isVisible !== false,
    title: text(value?.title, 80),
    subtitle: text(value?.subtitle, 160)
  })
  return {
    intro: { title: text(data.intro?.title, 80), description: text(data.intro?.description, 300) },
    quickLinks: (Array.isArray(data.quickLinks) ? data.quickLinks : [])
      .filter((link) => text(link?.label, 40) && SAFE_LINK.test(link?.url || ''))
      .slice(0, 6)
      .map((link) => ({ label: text(link.label, 40), url: link.url, description: text(link.description, 80), isInternal: link.url.startsWith('/') })),
    metrics: (Array.isArray(data.metrics) ? data.metrics : [])
      .filter((item) => METRICS.has(item?.metric))
      .map((item) => ({
        metric: item.metric,
        isVisible: item.isVisible !== false,
        title: text(item.title, 40),
        detail: text(item.detail, 60),
        tone: TONES.has(item.tone) ? item.tone : '',
        tooltipLabel: text(item.tooltipLabel, 40)
      })),
    pending: section(data.pending),
    recent: section(data.recent)
  }
}

function readCache() {
  try {
    return normalize(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'))
  } catch {
    return null
  }
}

/** Settings ref: the cached value right away (no flash), then the fresh one. null = built-in dashboard. */
export function useDashboardSettings() {
  const settings = ref(readCache())
  if (ENDPOINT) {
    fetch(ENDPOINT, { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((payload) => {
        settings.value = normalize(payload?.data)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(payload?.data ?? null))
        } catch {
          // storage blocked: settings still apply for this visit
        }
      })
      .catch((error) => console.warn('[Dashboard] Failed to load CMS settings, keeping the current ones.', error))
  }
  return settings
}

/**
 * Applies the CMS card settings to the metrics built by the model: order from the
 * CMS list, hidden cards removed, texts and colour overridden when set. Cards the
 * CMS does not mention keep their place after the configured ones.
 */
export function applyMetricSettings(metrics, metricSettings) {
  if (!Array.isArray(metricSettings) || metricSettings.length === 0) return metrics
  const byKey = new Map(metrics.map((metric) => [metric.key, metric]))
  const result = []
  for (const setting of metricSettings) {
    const metric = byKey.get(setting.metric)
    if (!metric) continue
    byKey.delete(setting.metric)
    if (!setting.isVisible) continue
    result.push({
      ...metric,
      title: setting.title || metric.title,
      detail: setting.detail || metric.detail,
      tone: setting.tone || metric.tone,
      tooltipLabel: setting.tooltipLabel || metric.tooltipLabel
    })
  }
  return [...result, ...byKey.values()]
}
