<template>
  <aside :class="sidebarClasses">
    <div :class="brandClasses">
      <div aria-hidden="true" class="grid h-11 w-11 place-items-center rounded-[16px] bg-[linear-gradient(135deg,#fb8c00,#f59e0b)] text-white shadow-[0_10px_24px_rgba(251,140,0,0.22)] ring-1 ring-white/35">
        <BaseIcon :name="brandIcon" :size="brandIconSize" />
      </div>
      <div v-show="!isCollapsed" class="min-w-0">
        <p class="mb-0.5 text-[16px] font-bold uppercase tracking-[0.18em] text-[var(--text-soft)]">{{ brandLabel }}</p>
        <h2 class="m-0 text-[16px] font-bold leading-6 tracking-[-0.03em] text-[var(--text)]">{{ brandTitle }}</h2>
      </div>

      <button
        class="ml-auto inline-grid h-8 w-8 shrink-0 place-items-center rounded-full border-0 bg-transparent text-[var(--text-soft)] outline-none transition-colors hover:bg-[rgba(15,23,42,0.04)] hover:text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[rgba(251,140,0,0.25)]"
        type="button"
        :aria-label="isCollapsed ? 'Show sidebar' : 'Hide sidebar'"
        :aria-pressed="isCollapsed"
        @click="isCollapsed = !isCollapsed"
      >
        <BaseIcon :name="isCollapsed ? 'sidebar-expand' : 'sidebar-collapse'" size="16" />
      </button>
    </div>
    <div class="flex min-h-0 flex-1 flex-col">
      <nav :class="navClasses" :aria-label="navLabel">
        <div v-for="item in items" :key="getItemKey(item)" class="grid gap-1.5">
          <div v-if="hasChildren(item)" class="relative">
            <button
              type="button"
              :class="getItemClasses(item)"
              :title="isCollapsed ? item.label : ''"
              :aria-expanded="isExpanded(item)"
              @click="toggleGroup(item)"
            >
              <span class="flex flex-1 items-center justify-start gap-8">
                <span class="grid h-5 w-5 shrink-0 place-items-center text-current opacity-90">
                  <BaseIcon :name="item.icon" :size="18" />
                </span>
                <span v-show="!isCollapsed" :class="getItemTitleClasses(item)">{{ item.label }}</span>
              </span>
              <span v-if="item.badge && !isCollapsed" class="ml-auto inline-grid h-5 min-w-5 place-items-center rounded-full bg-[#dc2626] px-1.5 text-[11px] font-bold text-white shadow-[0_6px_12px_rgba(220,38,38,0.18)]">
                {{ item.badge }}
              </span>
              <span v-show="!isCollapsed" class="ml-auto inline-grid h-6 w-6 shrink-0 place-items-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[rgba(15,23,42,0.04)] hover:text-[var(--text)]" :class="getChevronClasses(item)">
                <BaseIcon name="chevron-down" :size="16" />
              </span>
            </button>
          </div>

          <button
            v-else
            type="button"
            :class="getItemClasses(item)"
            :title="isCollapsed ? item.label : ''"
            @click="onNavigate(item)"
          >
            <span class="flex flex-1 items-center justify-start gap-8">
              <span class="grid h-5 w-5 shrink-0 place-items-center text-current opacity-90">
                <BaseIcon :name="item.icon" :size="18" />
              </span>
              <span v-show="!isCollapsed" :class="getItemTitleClasses(item)">{{ item.label }}</span>
            </span>
            <span v-if="item.badge && !isCollapsed" class="ml-auto inline-grid h-5 min-w-5 place-items-center rounded-full bg-[#dc2626] px-1.5 text-[11px] font-bold text-white shadow-[0_6px_12px_rgba(220,38,38,0.18)]">
              {{ item.badge }}
            </span>
          </button>

          <div v-if="hasChildren(item) && isExpanded(item) && !isCollapsed" class="ml-4 grid max-w-[calc(100%-1rem)] gap-1 border-l border-[rgba(15,23,42,0.08)] pl-4 pt-1">
            <button
              v-for="child in item.children"
              :key="getItemKey(child)"
              type="button"
              :class="getSubitemClasses(child)"
              @click="onNavigate(child)"
            >
              <span v-if="child.icon" class="grid h-5 w-5 shrink-0 place-items-center text-current opacity-80">
                <BaseIcon :name="child.icon" :size="16" />
              </span>
              <span :class="getSubitemTitleClasses(child)">{{ child.label }}</span>
            </button>
          </div>
        </div>
      </nav>

      <footer v-if="user" class="border-t border-[rgba(15,23,42,0.06)] px-4 pb-4 pt-3.5 max-[920px]:pb-3.5 max-[920px]:pt-3">
        <p v-show="!isCollapsed" class="mb-2.5 text-[16px] font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">{{ footerLabel }}</p>
        <div :class="userCardClasses">
          <div class="sidebar__user-avatar" aria-hidden="true">{{ user.initials }}</div>
          <div v-show="!isCollapsed" class="grid min-w-0 gap-0.5">
            <strong class="text-[16px] font-bold leading-[18px] text-[var(--text)]">{{ user.name }}</strong>
            <span class="text-[16px] leading-4 text-[var(--text-muted)]">{{ user.jobs || footerRole }}</span>
          </div>
        </div>
      </footer>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseIcon from '../icon'

const isCollapsed = ref(false)
const router = useRouter()
const route = useRoute()
const expandedGroups = ref(new Set())

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  user: {
    type: Object,
    default: null
  },
  brandLabel: {
    type: String,
    default: 'Kebun'
  },
  brandTitle: {
    type: String,
    default: 'Energi'
  },
  brandIcon: {
    type: String,
    default: 'logo'
  },
  brandIconSize: {
    type: [Number, String],
    default: 24
  },
  navLabel: {
    type: String,
    default: 'Navigasi utama'
  },
  footerLabel: {
    type: String,
    default: 'Masuk sebagai'
  },
  footerRole: {
    type: String,
    default: 'Assistant Kebun'
  }
})

function onNavigate(item) {
  if (item?.to) {
    router.push(item.to)
  }
}

const sidebarClasses = computed(() => [
  'flex min-h-screen flex-col border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-[180ms] max-[920px]:w-full max-[920px]:min-h-auto max-[920px]:border-r-0 max-[920px]:border-b',
  isCollapsed.value ? 'w-[72px]' : 'w-[232px]'
])

const brandClasses = computed(() => [
  'flex min-h-[72px] items-center gap-3.5 border-b border-[var(--border)] px-4',
  isCollapsed.value ? 'justify-center px-3.5' : ''
])

const navClasses = computed(() => [
  'flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto px-1.5 py-2.5',
  isCollapsed.value ? 'px-1.5 pt-2.5 pb-3' : ''
])

const userCardClasses = computed(() => [
  'flex min-h-14 items-center gap-2.5 rounded-[16px] border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2',
  isCollapsed.value ? 'justify-center p-2.5' : ''
])

function getItemKey(item) {
  return item?.key || item?.to || item?.label
}

function hasChildren(item) {
  return Array.isArray(item?.children) && item.children.length > 0
}

function isChildActive(child) {
  return Boolean(child?.to) && route.path === child.to
}

function isItemActive(item) {
  if (hasChildren(item)) {
    return item.children.some(isChildActive)
  }

  return Boolean(item?.to) && route.path === item.to
}

function isExpanded(item) {
  const key = getItemKey(item)
  return expandedGroups.value.has(key) || isItemActive(item)
}

function toggleGroup(item) {
  const key = getItemKey(item)
  const next = new Set(expandedGroups.value)

  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }

  expandedGroups.value = next
}

function getItemClasses(item) {
  const classes = [
    'group relative flex w-[calc(100%-0.25rem)] appearance-none border-0 bg-transparent text-left outline-none ring-0 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[rgba(251,140,0,0.18)]',
    isCollapsed.value ? 'justify-center px-0 gap-0' : '',
    'min-h-[38px] rounded-[12px] px-2 py-1.5 text-[15px] font-medium leading-5 text-[var(--text-muted)]'
  ]

  if (isItemActive(item)) {
    classes.push(
      "bg-[rgba(251,140,0,0.12)] text-[var(--brand)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-[var(--brand)] before:content-['']"
    )
  } else {
    classes.push('hover:bg-[rgba(15,23,42,0.03)] hover:text-[var(--text)]')
  }

  return classes.join(' ')
}

function getItemTitleClasses(item) {
  return [
    'text-[16px] font-medium leading-5 tracking-[-0.01em]',
    isItemActive(item) ? 'text-[var(--brand)]' : 'text-current'
  ].join(' ')
}

function getChevronClasses(item) {
  return [
    'inline-grid place-items-center text-current/70 transition-transform duration-150',
    isExpanded(item) ? 'rotate-180' : ''
  ].join(' ')
}

function getSubitemClasses(child) {
  return [
    'group relative ml-1 flex w-[calc(100%-1rem)] appearance-none items-center gap-2 border-0 bg-transparent text-left outline-none ring-0 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[rgba(251,140,0,0.18)]',
    isChildActive(child)
      ? "min-h-[30px] rounded-[12px] pl-4 pr-2.5 py-1.5 text-[13px] font-medium leading-5 text-[var(--brand)]"
      : 'min-h-[30px] rounded-[12px] pl-4 pr-2.5 py-1.5 text-[13px] font-medium leading-5 text-[var(--text-muted)] hover:bg-[rgba(15,23,42,0.03)] hover:text-[var(--text)]'
  ].join(' ')
}

function getSubitemTitleClasses(child) {
  return [
    'text-[16px] font-medium leading-5 tracking-[-0.01em]',
    isChildActive(child) ? 'text-[var(--brand)]' : 'text-current'
  ].join(' ')
}

function getUserCardClasses() {
  return userCardClasses.value
}

watch(
  () => route.path,
  () => {
    const next = new Set(expandedGroups.value)

    props.items.forEach((item) => {
      if (!hasChildren(item)) return
      if (item.defaultExpanded || isItemActive(item)) {
        next.add(getItemKey(item))
      }
    })

    expandedGroups.value = next
  },
  { immediate: true }
)
</script>
