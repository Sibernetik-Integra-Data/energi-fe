const STRAPI_SIDEBAR_ENDPOINT = (import.meta.env.VITE_STRAPI_SIDEBAR_ENDPOINT || '/api/sidebar-navigation').trim()
const STRAPI_SIDEBAR_POPULATE = (import.meta.env.VITE_STRAPI_SIDEBAR_POPULATE || 'populate=icons').trim()
const STRAPI_SIDEBAR_MEDIA_ENDPOINT = (import.meta.env.VITE_STRAPI_SIDEBAR_MEDIA_ENDPOINT || '/api/sidebar-items').trim()
const STRAPI_SIDEBAR_MEDIA_POPULATE = (import.meta.env.VITE_STRAPI_SIDEBAR_MEDIA_POPULATE || 'pagination[pageSize]=250').trim()
const STRAPI_API_TOKEN = (import.meta.env.VITE_STRAPI_API_TOKEN || '').trim()

let sidebarNavigationPromise = null
let cachedNavigationItems = null

function cloneItem(item) {
  return {
    ...item,
    children: Array.isArray(item?.children) ? item.children.map(cloneItem) : []
  }
}

export function cloneNavigation(items = []) {
  return Array.isArray(items)
    ? items.map(cloneItem)
    : []
}

export function hasSidebarNavigationCache() {
  return Array.isArray(cachedNavigationItems) && cachedNavigationItems.length > 0
}

export function getCachedSidebarNavigation() {
  return hasSidebarNavigationCache()
    ? cloneNavigation(cachedNavigationItems)
    : null
}

export function preloadStrapiSidebarNavigation() {
  void loadStrapiSidebarNavigation()
}

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  return []
}

function extractEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  if (entry.attributes && typeof entry.attributes === 'object') {
    return {
      id: entry.id ?? entry.documentId ?? entry.attributes.id ?? null,
      attributes: entry.attributes
    }
  }

  return {
    id: entry.id ?? entry.documentId ?? null,
    attributes: entry
  }
}

function extractEntries(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.attributes?.items?.data)) return payload.data.attributes.items.data
  if (Array.isArray(payload?.data?.attributes?.navigation?.data)) return payload.data.attributes.navigation.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.navigation)) return payload.navigation
  return []
}

function toBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toText(value, fallback = '') {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function normalizeToken(value, fallback = '') {
  if (!hasText(value)) return fallback
  return value
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-')
    .replace(/\.svg$/i, '')
}

function toPathAndQuery(value = '') {
  if (!hasText(value)) return ''

  const trimmedValue = value.trim()
  if (!/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  const parsedUrl = new URL(trimmedValue)
  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
}

function resolveMediaUrl(url = '') {
  if (!hasText(url)) return ''
  return toPathAndQuery(url)
}

function extractMediaUrl(value) {
  if (!value) return ''

  const media = value?.data ?? value
  if (Array.isArray(media)) {
    for (const entry of media) {
      const url = extractMediaUrl(entry)
      if (url) return url
    }
    return ''
  }

  if (!media || typeof media !== 'object') {
    return typeof media === 'string' ? resolveMediaUrl(media) : ''
  }

  const attributes = media.attributes ?? media
  const directUrl =
    attributes?.url ??
    attributes?.formats?.thumbnail?.url ??
    attributes?.formats?.small?.url ??
    ''
  if (hasText(directUrl)) {
    return resolveMediaUrl(directUrl)
  }

  return ''
}

function buildStrapiHeaders() {
  const headers = {
    Accept: 'application/json'
  }

  if (STRAPI_API_TOKEN) {
    headers.Authorization = `Bearer ${STRAPI_API_TOKEN}`
  }

  return headers
}

function resolveStrapiEndpointUrl(endpoint = '') {
  const trimmedEndpoint = endpoint.trim()
  if (!trimmedEndpoint) return ''
  return toPathAndQuery(trimmedEndpoint)
}

function extractMediaEntries(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

function registerMediaLookup(map, lookupKey, iconUrl) {
  if (!lookupKey || !iconUrl || map.has(lookupKey)) return
  map.set(lookupKey, iconUrl)
}

function buildMediaLookupMap(entries = []) {
  const map = new Map()

  for (const entry of entries) {
    const unwrapped = extractEntry(entry)
    if (!unwrapped) continue

    const attributes = unwrapped.attributes ?? {}
    const iconUrl = extractMediaUrl(attributes.icons)
    if (!iconUrl) continue

    if (hasText(attributes.key)) {
      registerMediaLookup(map, `key:${attributes.key}`, iconUrl)
    }
    if (unwrapped.id != null && unwrapped.id !== '') {
      registerMediaLookup(map, `id:${String(unwrapped.id)}`, iconUrl)
    }
    if (hasText(attributes.documentId)) {
      registerMediaLookup(map, `documentId:${attributes.documentId}`, iconUrl)
    }
  }

  return map
}

function resolveIconUrlFromMap(item = {}, mediaMap = new Map()) {
  if (!mediaMap.size) return item.iconUrl || ''

  return (
    item.iconUrl ||
    (hasText(item.key) ? mediaMap.get(`key:${item.key}`) : '') ||
    (item.id != null ? mediaMap.get(`id:${String(item.id)}`) : '') ||
    (hasText(item.documentId) ? mediaMap.get(`documentId:${item.documentId}`) : '') ||
    ''
  )
}

function mergeSidebarIconMedia(items = [], mediaMap = new Map()) {
  if (!Array.isArray(items) || items.length === 0) return []

  return items.map((item) => {
    const iconUrl = resolveIconUrlFromMap(item, mediaMap)
    const nextItem = {
      ...item,
      ...(iconUrl ? { iconUrl } : {})
    }

    if (Array.isArray(item.children) && item.children.length > 0) {
      nextItem.children = mergeSidebarIconMedia(item.children, mediaMap)
    }

    return nextItem
  })
}

async function fetchSidebarMediaMap() {
  const requestUrl = appendQueryParams(
    resolveStrapiEndpointUrl(STRAPI_SIDEBAR_MEDIA_ENDPOINT),
    STRAPI_SIDEBAR_MEDIA_POPULATE
  )
  if (!requestUrl) return new Map()

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: buildStrapiHeaders()
    })

    if (!response.ok) {
      console.warn(`[Sidebar] Failed to load Strapi icon media (${response.status}).`)
      return new Map()
    }

    const payload = await response.json()
    return buildMediaLookupMap(extractMediaEntries(payload))
  } catch (error) {
    console.warn('[Sidebar] Failed to load Strapi icon media.', error)
    return new Map()
  }
}

function createSidebarItem(attributes = {}, id = null) {
  let key = ''
  if (hasText(attributes.key)) key = attributes.key
  else if (hasText(attributes.slug)) key = attributes.slug
  else if (hasText(attributes.to)) key = attributes.to
  else if (hasText(attributes.path)) key = attributes.path
  else if (hasText(attributes.label)) key = attributes.label
  else if (hasText(attributes.title)) key = attributes.title
  else if (hasText(attributes.name)) key = attributes.name
  else if (typeof id === 'string' || typeof id === 'number') key = String(id)

  const iconUrl = extractMediaUrl(attributes.icons)
  const icon = hasText(attributes.icon)
    ? normalizeToken(attributes.icon)
    : (iconUrl ? '' : 'dashboard')

  return {
    id: id ?? undefined,
    documentId: hasText(attributes.documentId) ? attributes.documentId : undefined,
    key: toText(key, ''),
    label: toText(attributes.label || attributes.title || attributes.name, 'Untitled'),
    icon,
    iconUrl,
    to: toText(attributes.to || attributes.path, ''),
    compact: toBoolean(attributes.compact),
    defaultExpanded: toBoolean(attributes.defaultExpanded),
    badge: attributes.badge ?? '',
    order: toNumber(attributes.order, 0),
    isVisible: attributes.isVisible === undefined ? true : toBoolean(attributes.isVisible),
    children: []
  }
}

function sortNavigation(items = []) {
  return [...items]
    .sort((left, right) => {
      if (left.order !== right.order) return left.order - right.order
      return left.label.localeCompare(right.label, 'id', { sensitivity: 'base' })
    })
    .map((item) => ({
      ...item,
      children: Array.isArray(item.children) ? sortNavigation(item.children) : []
    }))
}

function registerNodeAliases(map, node, aliases = []) {
  for (const alias of aliases) {
    if (alias == null || alias === '') continue
    map.set(String(alias), node)
  }
}

function extractParentLookupIds(value) {
  const relation = value?.data ?? value
  if (Array.isArray(relation)) {
    return relation.flatMap((entry) => extractParentLookupIds(entry))
  }

  if (!relation || typeof relation !== 'object') {
    return relation == null || relation === '' ? [] : [String(relation)]
  }

  return [
    relation.id,
    relation.documentId,
    relation.key,
    relation.attributes?.id,
    relation.attributes?.documentId,
    relation.attributes?.key
  ]
    .filter((entry) => entry != null && entry !== '')
    .map(String)
}

function isSidebarItemVisible(attributes = {}) {
  if (attributes.isVisible === undefined || attributes.isVisible === null) return true
  return toBoolean(attributes.isVisible)
}

function normalizeNestedItem(entry, seen = new Set()) {
  const unwrapped = extractEntry(entry)
  if (!unwrapped) return null
  if (!isSidebarItemVisible(unwrapped.attributes)) return null

  const item = createSidebarItem(unwrapped.attributes, unwrapped.id)
  if (item.key && seen.has(item.key)) {
    return null
  }

  const nextSeen = new Set(seen)
  if (item.key) nextSeen.add(item.key)

  const children = toArray(unwrapped.attributes.children)
    .map((child) => normalizeNestedItem(child, nextSeen))
    .filter(Boolean)

  item.children = children
  return item
}

function normalizeFlatItems(entries) {
  const nodesByLookup = new Map()
  const nodes = []
  const parentLinks = []

  for (const entry of entries) {
    const unwrapped = extractEntry(entry)
    if (!unwrapped) continue
    if (!isSidebarItemVisible(unwrapped.attributes)) continue

    const node = createSidebarItem(unwrapped.attributes, unwrapped.id)
    if (!node.key && node.id == null && !node.documentId) continue

    node.children = []
    nodes.push(node)
    registerNodeAliases(nodesByLookup, node, [
      node.key,
      node.id,
      node.documentId,
      unwrapped.attributes?.documentId
    ])

    const parentIds = extractParentLookupIds(unwrapped.attributes.parent)
    if (parentIds.length > 0) {
      parentLinks.push([node, parentIds])
    }
  }

  const childNodes = new Set()
  for (const [node, parentIds] of parentLinks) {
    let parent = null
    for (const parentId of parentIds) {
      parent = nodesByLookup.get(parentId)
      if (parent) break
    }
    if (!parent || parent === node) continue

    parent.children.push(node)
    childNodes.add(node)
  }

  const roots = nodes.filter((node) => !childNodes.has(node))
  return sortNavigation(roots)
}

function normalizeSidebarPayload(payload) {
  const entries = extractEntries(payload)
  if (entries.length === 0) return []

  // Prefer parent relations so CMS `order` wins over relation drag-order / API entry order.
  // Mixing nested `children` with flat sibling entries previously shuffled Master Data items.
  const hasParentRelations = entries.some((entry) => {
    const attributes = extractEntry(entry)?.attributes
    return extractParentLookupIds(attributes?.parent).length > 0
  })
  if (hasParentRelations) {
    return normalizeFlatItems(entries)
  }

  const hasNestedChildren = entries.some((entry) => toArray(extractEntry(entry)?.attributes?.children).length > 0)
  if (hasNestedChildren) {
    const seen = new Set()
    return sortNavigation(
      entries
        .map((entry) => normalizeNestedItem(entry, seen))
        .filter(Boolean)
    )
  }

  return sortNavigation(
    entries
      .map((entry) => normalizeNestedItem(entry, new Set()))
      .filter(Boolean)
  )
}

function appendQueryParams(url, queryString = '') {
  const trimmedQuery = queryString.trim().replace(/^\?/, '')
  if (!trimmedQuery) return url

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}${trimmedQuery}`
}

function resolveStrapiUrl(endpoint = STRAPI_SIDEBAR_ENDPOINT) {
  return appendQueryParams(resolveStrapiEndpointUrl(endpoint), STRAPI_SIDEBAR_POPULATE)
}

async function fetchSidebarNavigation() {
  const requestUrl = resolveStrapiUrl()
  if (!requestUrl) return null

  const [navigationResponse, mediaMap] = await Promise.all([
    fetch(requestUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: buildStrapiHeaders()
    }),
    fetchSidebarMediaMap()
  ])

  if (!navigationResponse.ok) {
    throw new Error(`Failed to load Strapi sidebar navigation (${navigationResponse.status})`)
  }

  const payload = await navigationResponse.json()
  const items = normalizeSidebarPayload(payload)
  return mergeSidebarIconMedia(items, mediaMap)
}

export async function loadStrapiSidebarNavigation() {
  if (!sidebarNavigationPromise) {
    sidebarNavigationPromise = (async () => {
      try {
        const items = await fetchSidebarNavigation()
        const normalizedItems = Array.isArray(items) ? items : []
        if (normalizedItems.length > 0) {
          cachedNavigationItems = normalizedItems
        }
        return normalizedItems
      } catch (error) {
        console.warn('[Sidebar] Failed to load Strapi navigation, using fallback menu.', error)
        return []
      } finally {
        sidebarNavigationPromise = null
      }
    })()
  }

  const items = await sidebarNavigationPromise
  return cloneNavigation(items)
}
