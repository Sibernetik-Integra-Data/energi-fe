import { reactive } from 'vue'
import { loadStrapiSidebarNavigation } from '../sidebar/strapiNavigation'

// Module status managed in Strapi on each menu item (Sidebar Item -> moduleStatus).
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

function flatten(items, result = []) {
  for (const item of items || []) {
    if (item?.to) {
      result.push({
        to: item.to,
        label: item.label,
        status: item.moduleStatus || 'active',
        message: item.moduleMessage || ''
      })
    }
    if (Array.isArray(item?.children)) flatten(item.children, result)
  }
  return result
}

async function loadModules() {
  if (lastLoadedAt && Date.now() - lastLoadedAt < FRESH_MS) return lastKnownModules

  // Never block navigation for long: without an answer from the CMS the last
  // known statuses are used (all active on a first visit).
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), LOAD_TIMEOUT_MS))
  const items = await Promise.race([loadStrapiSidebarNavigation(), timeout])
  if (Array.isArray(items) && items.length > 0) {
    lastKnownModules = flatten(items)
    lastLoadedAt = Date.now()
  }
  return lastKnownModules
}

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
