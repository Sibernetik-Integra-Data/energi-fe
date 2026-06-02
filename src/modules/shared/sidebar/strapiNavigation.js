const STRAPI_BASE_URL = (import.meta.env.VITE_STRAPI_URL || '').trim()
const STRAPI_SIDEBAR_ENDPOINT = (import.meta.env.VITE_STRAPI_SIDEBAR_ENDPOINT || '/api/sidebar-navigation').trim()

let sidebarNavigationPromise = null

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

function extractRelationId(value) {
  const relation = value?.data ?? value
  if (Array.isArray(relation)) {
    const first = relation[0]
    return extractRelationId(first)
  }

  if (!relation || typeof relation !== 'object') {
    return relation ?? null
  }

  return relation.id ?? relation.documentId ?? null
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

  return {
    id: id ?? undefined,
    key: toText(key, ''),
    label: toText(attributes.label || attributes.title || attributes.name, 'Untitled'),
    icon: toText(attributes.icon, 'dashboard'),
    to: toText(attributes.to || attributes.path, ''),
    compact: toBoolean(attributes.compact),
    defaultExpanded: toBoolean(attributes.defaultExpanded),
    badge: attributes.badge ?? '',
    order: toNumber(attributes.order, 0),
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

function normalizeNestedItem(entry, seen = new Set()) {
  const unwrapped = extractEntry(entry)
  if (!unwrapped) return null

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
  const nodesById = new Map()
  const parentLinks = []

  for (const entry of entries) {
    const unwrapped = extractEntry(entry)
    if (!unwrapped) continue

    const node = createSidebarItem(unwrapped.attributes, unwrapped.id)
    let nodeId = node.key
    if (typeof node.id === 'string' || typeof node.id === 'number') {
      nodeId = String(node.id)
    }
    if (!nodeId) continue

    node.children = []
    nodesById.set(nodeId, node)

    const parentId = extractRelationId(unwrapped.attributes.parent)
    if (parentId != null && parentId !== '') {
      parentLinks.push([nodeId, String(parentId)])
    }
  }

  const childIds = new Set()
  for (const [nodeId, parentId] of parentLinks) {
    const node = nodesById.get(nodeId)
    const parent = nodesById.get(parentId)
    if (!node || !parent) continue

    parent.children.push(node)
    childIds.add(nodeId)
  }

  const roots = []
  for (const [nodeId, node] of nodesById.entries()) {
    if (!childIds.has(nodeId)) {
      roots.push(node)
    }
  }

  return sortNavigation(roots)
}

function normalizeSidebarPayload(payload) {
  const entries = extractEntries(payload)
  if (entries.length === 0) return []

  const hasNestedChildren = entries.some((entry) => toArray(extractEntry(entry)?.attributes?.children).length > 0)
  if (hasNestedChildren) {
    const seen = new Set()
    return sortNavigation(
      entries
        .map((entry) => normalizeNestedItem(entry, seen))
        .filter(Boolean)
    )
  }

  const hasParentRelations = entries.some((entry) => extractRelationId(extractEntry(entry)?.attributes?.parent) != null)
  if (hasParentRelations) {
    return normalizeFlatItems(entries)
  }

  return sortNavigation(
    entries
      .map((entry) => normalizeNestedItem(entry, new Set()))
      .filter(Boolean)
  )
}

function resolveStrapiUrl(endpoint = STRAPI_SIDEBAR_ENDPOINT) {
  const trimmedEndpoint = endpoint.trim()
  if (!trimmedEndpoint) return ''
  if (/^https?:\/\//i.test(trimmedEndpoint)) return trimmedEndpoint
  if (!STRAPI_BASE_URL) return trimmedEndpoint

  const normalizedBaseUrl = STRAPI_BASE_URL.replace(/\/$/, '')
  const normalizedEndpoint = trimmedEndpoint.startsWith('/') ? trimmedEndpoint : `/${trimmedEndpoint}`
  return `${normalizedBaseUrl}${normalizedEndpoint}`
}

async function fetchSidebarNavigation() {
  const requestUrl = resolveStrapiUrl()
  if (!requestUrl) return null

  const response = await fetch(requestUrl, {
    method: 'GET',
    cache: 'no-store',
    headers: {
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to load Strapi sidebar navigation (${response.status})`)
  }

  const payload = await response.json()
  return normalizeSidebarPayload(payload)
}

export async function loadStrapiSidebarNavigation() {
  if (!sidebarNavigationPromise) {
    sidebarNavigationPromise = (async () => {
      try {
        const items = await fetchSidebarNavigation()
        return Array.isArray(items) ? items : []
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
