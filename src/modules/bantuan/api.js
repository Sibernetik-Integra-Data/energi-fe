import { withLocale } from '../../i18n'

// Help / SOP pages from Strapi (collection "Help Page"); public, read-only.
const LIST_ENDPOINT = (import.meta.env.VITE_STRAPI_HELP_ENDPOINT || '/api/help-pages').trim()
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

async function getJson(url) {
  const response = await fetch(withLocale(url), { cache: 'no-store', headers: { Accept: 'application/json' } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const payload = await response.json()
  return payload?.data ?? null
}

export async function fetchHelpPages() {
  const data = await getJson(LIST_ENDPOINT)
  return Array.isArray(data) ? data : []
}

/** Returns the page, or null when it does not exist (or is not published). */
export async function fetchHelpPage(slug) {
  if (!SLUG.test(String(slug || ''))) return null
  return getJson(`${LIST_ENDPOINT}/${slug}`)
}

/** Only links the CMS is allowed to produce; anything else is rendered as text. */
export function safeLinkUrl(url) {
  if (typeof url !== 'string') return ''
  const value = url.trim()
  if (/^https?:\/\/\S+$/i.test(value) || /^mailto:\S+$/i.test(value)) return value
  if (/^\/(?!\/)\S*$/.test(value)) return value
  return ''
}

export function safeMediaUrl(url) {
  if (typeof url !== 'string') return ''
  const value = url.trim()
  return value.startsWith('/uploads/') || /^https:\/\/\S+$/i.test(value) ? value : ''
}

export function formatFileSize(sizeKb) {
  if (!Number.isFinite(sizeKb)) return ''
  return sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(sizeKb))} KB`
}
