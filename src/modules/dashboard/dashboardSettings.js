import { ref } from 'vue'
import { currentLocaleCode, onLocaleChange, withLocale } from '../../i18n'

// Dashboard presentation managed in Strapi (single type "Dashboard Setting"):
// intro texts, quick links and the "Menunggu verifikasi" panel (pending). Metric
// cards were removed with the p08 redesign. The data itself still comes from the backend (model.js).
const ENDPOINT = (import.meta.env.VITE_STRAPI_DASHBOARD_ENDPOINT || '/api/dashboard-setting').trim()
// One cache per language ('energi-cms-dashboard:en'), so a switch shows the right texts at once.
const CACHE_PREFIX = 'energi-cms-dashboard'
const cacheKey = (locale) => `${CACHE_PREFIX}:${locale}`
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
    pending: section(data.pending),
    recent: section(data.recent)
  }
}

function readCache(locale) {
  try {
    return normalize(JSON.parse(localStorage.getItem(cacheKey(locale)) || 'null'))
  } catch {
    return null
  }
}

/** Settings ref: the cached value right away (no flash), then the fresh one. null = built-in dashboard. */
export function useDashboardSettings() {
  const settings = ref(readCache(currentLocaleCode()))
  let latest = 0
  function load() {
    if (!ENDPOINT) return
    const locale = currentLocaleCode()
    const id = ++latest
    fetch(withLocale(ENDPOINT, locale), { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((payload) => {
        try {
          localStorage.setItem(cacheKey(locale), JSON.stringify(payload?.data ?? null))
        } catch {
          // storage blocked: settings still apply for this visit
        }
        // Only the latest request (current language) updates the screen.
        if (id === latest) settings.value = normalize(payload?.data)
      })
      .catch((error) => console.warn('[Dashboard] Failed to load CMS settings, keeping the current ones.', error))
  }
  load()
  // Language switch (while the dashboard is mounted): cached texts at once, then fresh ones.
  onLocaleChange((locale) => {
    const cached = readCache(locale)
    if (cached) settings.value = cached
    load()
  })
  return settings
}
