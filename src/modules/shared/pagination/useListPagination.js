import { computed, ref, unref, watch } from 'vue'

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20]

export function buildVisiblePages(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = [1]
  if (currentPage > 3) pages.push('...')
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
    pages.push(i)
  }
  if (currentPage < totalPages - 2) pages.push('...')
  pages.push(totalPages)
  return pages
}

export function useServerPagination(totalItems, currentPage, pageSize) {
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(unref(totalItems) / unref(pageSize)))
  )

  const visiblePages = computed(() =>
    buildVisiblePages(totalPages.value, unref(currentPage))
  )

  watch(totalPages, (value) => {
    if (unref(currentPage) > value) {
      currentPage.value = value
    }
  })

  return {
    totalPages,
    visiblePages,
  }
}

export function useListPagination(items, { resetWatchSources = [] } = {}) {
  const currentPage = ref(1)
  const pageSize = ref(10)

  const totalItems = computed(() => (unref(items) || []).length)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  )

  const paginatedItems = computed(() => {
    const list = unref(items) || []
    const start = (currentPage.value - 1) * pageSize.value
    return list.slice(start, start + pageSize.value)
  })

  const visiblePages = computed(() =>
    buildVisiblePages(totalPages.value, currentPage.value)
  )

  watch(resetWatchSources, () => {
    currentPage.value = 1
  })

  watch(pageSize, () => {
    currentPage.value = 1
  })

  watch(totalPages, (value) => {
    if (currentPage.value > value) currentPage.value = value
  })

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    visiblePages,
  }
}
