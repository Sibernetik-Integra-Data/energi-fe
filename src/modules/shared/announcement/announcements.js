import { computed, ref } from 'vue'
import i18n, { currentLocaleCode, onLocaleChange, withLocale } from '../../../i18n'

// Announcements managed in Strapi (collection "Announcement"). The CMS decides
// which ones are active (switch + schedule, server clock); this module fetches,
// refreshes and remembers which ones the user closed.
const ENDPOINT = (import.meta.env.VITE_STRAPI_ANNOUNCEMENTS_ENDPOINT || '/api/announcements/active').trim()
const REFRESH_MS = 5 * 60 * 1000
const DISMISSED_KEY = 'energi-dismissed-announcements'
const LEVELS = new Set(['info', 'warning', 'danger'])
const SAFE_LINK = /^(https:\/\/\S+|\/\S*)$/

const announcements = ref([])
const dismissed = ref(readDismissed())
let started = false
let inFlight = null
let inFlightLocale = ''

function readDismissed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((key) => typeof key === 'string') : [])
  } catch {
    return new Set()
  }
}

function writeDismissed(keys) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...keys]))
  } catch {
    // storage blocked: the banner stays closed for this visit only
  }
}

// An edited announcement (new updatedAt) shows again even if the old one was closed.
function dismissKey(item) {
  return `${item.id}:${item.updatedAt || ''}`
}

function normalize(item) {
  if (!item || typeof item !== 'object' || typeof item.id !== 'string') return null
  const title = typeof item.title === 'string' ? item.title.trim() : ''
  if (!title) return null
  const linkUrl = typeof item.linkUrl === 'string' && SAFE_LINK.test(item.linkUrl) ? item.linkUrl : ''
  return {
    id: item.id,
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : '',
    title,
    message: typeof item.message === 'string' ? item.message.trim() : '',
    level: LEVELS.has(item.level) ? item.level : 'info',
    dismissible: item.dismissible !== false,
    linkUrl,
    linkLabel: linkUrl ? (typeof item.linkLabel === 'string' && item.linkLabel.trim()) || i18n.global.t('announcement.readMore') : '',
    isInternalLink: linkUrl.startsWith('/'),
  }
}

async function refresh() {
  const locale = currentLocaleCode()
  if (!ENDPOINT) return null
  // One request per language; a request for the previous language is ignored when it lands.
  if (inFlight && inFlightLocale === locale) return inFlight
  inFlightLocale = locale
  const request = (async () => {
    try {
      const response = await fetch(withLocale(ENDPOINT, locale), { cache: 'no-store', headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const payload = await response.json()
      if (locale !== currentLocaleCode()) return
      const items = Array.isArray(payload?.data) ? payload.data.map(normalize).filter(Boolean) : []
      announcements.value = items

      // Forget dismissals of announcements that are no longer active.
      const activeKeys = new Set(items.map(dismissKey))
      const kept = new Set([...dismissed.value].filter((key) => activeKeys.has(key)))
      if (kept.size !== dismissed.value.size) {
        dismissed.value = kept
        writeDismissed(kept)
      }
    } catch (error) {
      // CMS unreachable: keep what is shown; no banner is better than an error.
      console.warn('[Announcement] Failed to load announcements.', error)
    } finally {
      if (inFlight === request) inFlight = null
    }
  })()
  inFlight = request
  return request
}

function start() {
  if (started) return
  started = true
  void refresh()
  onLocaleChange(() => { void refresh() })
  setInterval(() => { void refresh() }, REFRESH_MS)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refresh()
  })
}

export function dismissAnnouncement(item) {
  if (!item?.dismissible) return
  const next = new Set(dismissed.value)
  next.add(dismissKey(item))
  dismissed.value = next
  writeDismissed(next)
}

/** Visible announcements (active and not closed by this user). Starts polling on first use. */
export function useAnnouncements() {
  start()
  return computed(() => announcements.value.filter((item) => !dismissed.value.has(dismissKey(item))))
}
