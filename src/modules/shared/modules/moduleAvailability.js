import { reactive, shallowRef } from 'vue'
import { loadStrapiSidebarNavigation } from '../sidebar/strapiNavigation'
import { currentLocaleCode, onLocaleChange } from '../../../i18n'

// Per-module settings managed in Strapi on each menu item (Sidebar Item):
// - moduleStatus / moduleMessage: module on/off (notice page instead of the module);
// - pageEyebrow / pageTitle / pageNote / helpPage: header texts and contextual help.
// This only changes what the web app shows; the backend API is not affected.
const LOAD_TIMEOUT_MS = 2500
// The sidebar already fetches the menu on every page; reuse a recent answer
// instead of adding a request to each navigation.
const FRESH_MS = 30 * 1000

// Result per path, decided before the navigation is confirmed. Keyed by path so
// the page on screen is always judged by its own path: while leaving a closed
// module, the old route is still current and must keep showing the notice.
const resultsByPath = reactive(new Map())
const MAX_RESULTS = 50

let lastKnownModules = []
let lastLoadedAt = 0
// Language of lastKnownModules; texts of one language are never kept as fresh for another.
let lastLoadedLocale = ''
// Same list, reactive, for the header (page texts and help link).
const knownModules = shallowRef([])

function flatten(items, result = []) {
  for (const item of items || []) {
    if (item?.to) {
      result.push({
        to: item.to,
        label: item.label,
        status: item.moduleStatus || 'active',
        message: item.moduleMessage || '',
        pageEyebrow: item.pageEyebrow || '',
        pageTitle: item.pageTitle || '',
        pageNote: item.pageNote || '',
        helpPage: item.helpPage || null
      })
    }
    if (Array.isArray(item?.children)) flatten(item.children, result)
  }
  return result
}

async function loadModules() {
  const locale = currentLocaleCode()
  if (lastLoadedAt && lastLoadedLocale === locale && Date.now() - lastLoadedAt < FRESH_MS) return lastKnownModules

  // Never block navigation for long: without an answer from the CMS the last
  // known statuses are used (all active on a first visit).
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), LOAD_TIMEOUT_MS))
  const items = await Promise.race([loadStrapiSidebarNavigation(locale), timeout])
  // The language may have changed while waiting: drop the outdated answer.
  if (locale === currentLocaleCode() && Array.isArray(items) && items.length > 0) {
    lastKnownModules = flatten(items)
    lastLoadedAt = Date.now()
    lastLoadedLocale = locale
    knownModules.value = lastKnownModules
  }
  return lastKnownModules
}

// Language switch: reload the page texts (header) in the new language right away.
onLocaleChange(() => {
  lastLoadedAt = 0
  void loadModules().catch(() => {})
})

function normalizePath(path) {
  const trimmed = (path || '/').replace(/\/+$/, '')
  return trimmed || '/'
}

// A menu entry covers its own path and everything below it (/panen covers
// /panen/123, /master-data covers /master-data/blocks). The path is unavailable
// when any covering entry is; the most specific one supplies the message.
function findUnavailableModule(modules, path) {
  const target = normalizePath(path)
  let best = null
  for (const module of modules) {
    if (module.status === 'active') continue
    const base = normalizePath(module.to)
    if (base === '/') continue
    if ((target === base || target.startsWith(`${base}/`)) && (!best || base.length > normalizePath(best.to).length)) {
      best = module
    }
  }
  return best
}

/**
 * Called by the router before each navigation (awaited), so the answer exists
 * before the page mounts and a closed module's code never runs.
 */
export async function resolveModuleAvailability(path) {
  let module = null
  try {
    module = findUnavailableModule(await loadModules(), path)
  } catch {
    module = null
  }
  const key = normalizePath(path)
  // Re-insert so the Map stays ordered by last use; drop the oldest beyond the cap
  // (never the route on screen, which was resolved most recently).
  resultsByPath.delete(key)
  resultsByPath.set(key, module ? { ...module } : null)
  while (resultsByPath.size > MAX_RESULTS) resultsByPath.delete(resultsByPath.keys().next().value)
}

/** The unavailable module for this path (App.vue shows a notice instead), or null. */
export function unavailableModuleFor(path) {
  return resultsByPath.get(normalizePath(path)) ?? null
}

// Most specific menu entry covering the path that has a value for `field`.
function mostSpecificWith(modules, path, field) {
  const target = normalizePath(path)
  let best = null
  for (const module of modules) {
    if (!module[field]) continue
    const base = normalizePath(module.to)
    if (base === '/') continue
    if ((target === base || target.startsWith(`${base}/`)) && (!best || base.length > normalizePath(best.to).length)) {
      best = module
    }
  }
  return best
}

/**
 * Header settings for a path, from the menu item data (reactive):
 * - eyebrow / title: only on the exact menu path, so detail pages keep their own
 *   (often dynamic) titles;
 * - note / help: for the module and every page below it.
 * Empty values mean "keep what the page shows".
 */
export function pageSettingsFor(path) {
  const modules = knownModules.value
  const target = normalizePath(path)
  const exact = modules.find((module) => normalizePath(module.to) === target) || null
  return {
    eyebrow: exact?.pageEyebrow || '',
    title: exact?.pageTitle || '',
    note: mostSpecificWith(modules, path, 'pageNote')?.pageNote || '',
    helpPage: mostSpecificWith(modules, path, 'helpPage')?.helpPage || null
  }
}
