import { reactive, ref } from 'vue'
import { currentLocaleCode, onLocaleChange, withLocale } from '../i18n'

// Colours and logo managed in Strapi (single type "Theme Setting").
// The defaults stay in src/index.css; a value from the CMS overrides one token.
const THEME_ENDPOINT = (import.meta.env.VITE_STRAPI_THEME_ENDPOINT || '/api/theme-setting').trim()
// One cache per language ('energi-cms-theme:en'): app name, browser title and logo text are translated.
const CACHE_PREFIX = 'energi-cms-theme'
const cacheKey = (locale) => `${CACHE_PREFIX}:${locale}`
const STYLE_ID = 'cms-theme'

const TOKEN_VARIABLES = {
  brand: '--brand',
  bg: '--bg',
  surface: '--surface',
  surfaceMuted: '--surface-muted',
  border: '--border',
  borderStrong: '--border-strong',
  text: '--text',
  textMuted: '--text-muted',
  textSoft: '--text-soft'
}

// Same alpha as --brand-soft in src/index.css.
const BRAND_SOFT_ALPHA = { light: 0.12, dark: 0.18 }

const HEX_COLOR = /^#[0-9a-f]{6}$/i

const FAVICON_ID = 'cms-favicon'
// Whatever index.html ships with; used when the CMS has no browser title.
const DEFAULT_DOCUMENT_TITLE = typeof document !== 'undefined' ? document.title : ''

/** Brand from the CMS; empty strings mean "use the built-in value". */
export const cmsBrand = reactive({
  appLabel: '',
  appName: '',
  logoUrl: '',
  logoDarkUrl: '',
  logoAlt: ''
})

// Bumped whenever token values may have changed: a CMS theme was applied or
// light/dark mode was toggled (class on <html>).
const themeRevision = ref(0)

if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
  new MutationObserver(() => { themeRevision.value += 1 })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

/**
 * Current value of a CSS token, e.g. cssVar('--brand') -> '#fb8c00'.
 * For places that cannot take var(--x) (chart libraries, SVG attributes).
 * Reactive: a computed() using it re-runs when the theme or mode changes.
 */
export function cssVar(name, fallback = '') {
  void themeRevision.value
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function hexToRgba(hex, alpha) {
  const value = Number.parseInt(hex.slice(1), 16)
  const red = (value >> 16) & 255
  const green = (value >> 8) & 255
  const blue = value & 255
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function paletteDeclarations(palette, mode) {
  if (!palette || typeof palette !== 'object') return []

  const declarations = []
  for (const [key, variable] of Object.entries(TOKEN_VARIABLES)) {
    const value = palette[key]
    // Values end up inside a <style> element, so anything but a hex colour is dropped.
    if (typeof value === 'string' && HEX_COLOR.test(value)) {
      declarations.push(`${variable}: ${value};`)
    }
  }

  if (typeof palette.brand === 'string' && HEX_COLOR.test(palette.brand)) {
    declarations.push(`--brand-soft: ${hexToRgba(palette.brand, BRAND_SOFT_ALPHA[mode])};`)
  }

  return declarations
}

function buildThemeCss(theme) {
  const light = paletteDeclarations(theme?.light, 'light')
  const dark = paletteDeclarations(theme?.dark, 'dark')
  const rules = []

  // Scoped per mode so a light value never leaks into dark mode (and vice versa).
  if (light.length) rules.push(`:root:not(.theme-dark) { ${light.join(' ')} }`)
  if (dark.length) rules.push(`:root.theme-dark { ${dark.join(' ')} }`)

  return rules.join('\n')
}

function safeMediaUrl(media) {
  const url = typeof media?.url === 'string' ? media.url.trim() : ''
  if (url.startsWith('/uploads/') || /^https:\/\//i.test(url)) return url
  return ''
}

function safeText(value, maxLength) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

function applyFavicon(media) {
  const url = safeMediaUrl(media)
  let link = document.getElementById(FAVICON_ID)

  if (!url) {
    link?.remove()
    return
  }

  if (!link) {
    link = document.createElement('link')
    link.id = FAVICON_ID
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  link.href = url
  const mime = typeof media?.mime === 'string' ? media.mime : ''
  if (mime.startsWith('image/')) link.type = mime
  else link.removeAttribute('type')
}

function applyCmsTheme(theme) {
  let style = document.getElementById(STYLE_ID)
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = buildThemeCss(theme)
  themeRevision.value += 1

  cmsBrand.appLabel = safeText(theme?.appLabel, 40)
  cmsBrand.appName = safeText(theme?.appName, 40)
  document.title = safeText(theme?.browserTitle, 80) || DEFAULT_DOCUMENT_TITLE
  applyFavicon(theme?.favicon)

  cmsBrand.logoUrl = safeMediaUrl(theme?.logo)
  cmsBrand.logoDarkUrl = safeMediaUrl(theme?.logoDark)
  cmsBrand.logoAlt = typeof theme?.logo?.alternativeText === 'string' ? theme.logo.alternativeText : ''
}

function readCachedTheme(locale) {
  try {
    const cached = localStorage.getItem(cacheKey(locale))
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function writeCachedTheme(theme, locale) {
  try {
    localStorage.setItem(cacheKey(locale), JSON.stringify(theme))
  } catch {
    // storage blocked or full; the theme still applies for this visit
  }
}

async function fetchCmsTheme(locale) {
  const response = await fetch(withLocale(THEME_ENDPOINT, locale), {
    method: 'GET',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
  if (!response.ok) throw new Error(`Failed to load CMS theme (${response.status})`)

  const payload = await response.json()
  return payload?.data ?? null
}

/**
 * Call once on startup, after initTheme(). Applies the last known CMS theme right
 * away (no flash of default colours), then refreshes it from the CMS.
 * If the CMS is unreachable, the cached or built-in theme stays.
 */
let themeRequestId = 0
let localeWatchStarted = false

function loadCmsTheme() {
  const locale = currentLocaleCode()
  const cached = readCachedTheme(locale)
  if (cached) applyCmsTheme(cached)

  if (!THEME_ENDPOINT) return

  const id = ++themeRequestId
  fetchCmsTheme(locale)
    .then((theme) => {
      if (!theme) return
      writeCachedTheme(theme, locale)
      // A newer request (language switched meanwhile) wins.
      if (id === themeRequestId) applyCmsTheme(theme)
    })
    .catch((error) => {
      console.warn('[Theme] Failed to load CMS theme, keeping the current one.', error)
    })
}

export function initCmsTheme() {
  loadCmsTheme()
  // Language switch: cached texts of that language at once, then fresh ones.
  if (!localeWatchStarted) {
    localeWatchStarted = true
    onLocaleChange(() => loadCmsTheme())
  }
}
