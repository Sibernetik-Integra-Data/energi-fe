<template>
  <aside :class="[
    'relative flex flex-col h-screen top-0 shrink-0 border-r border-(--border) bg-(--surface) transition-[width] duration-200 ease-in-out',
    isCollapsed ? 'w-17' : 'w-65',
  ]">
    <!-- Brand / Logo -->
    <div :class="[
      'flex items-center border-b border-(--border) h-15 shrink-0',
      isCollapsed ? 'justify-center px-3' : 'gap-3 px-4',
    ]">
      <div aria-hidden="true"
        class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-linear-to-br from-[#fb8c00] to-[#f59e0b] text-white shadow-[0_8px_20px_rgba(251,140,0,0.22)] ring-1 ring-white/30">
        <BaseIcon :name="brandIcon" :size="brandIconSize" class="justify-center items-center" />
      </div>

      <div v-show="!isCollapsed" class="flex items-baseline gap-1 min-w-0 overflow-hidden">
        <span class="text-[13px] font-bold uppercase tracking-[0.18em] text-(--text-soft) whitespace-nowrap">
          {{ brandLabel }}
        </span>
        <span class="truncate text-[18px] font-extrabold leading-tight tracking-[-0.02em] text-(--text)">
          {{ brandTitle }}
        </span>
      </div>
    </div>

    <!-- Nav (scrollable) -->
    <nav class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto px-3 py-3"
      :aria-label="navLabel">
      <div v-for="item in resolvedItems" :key="getItemKey(item)">
        <!-- Group item with children -->
        <template v-if="hasChildren(item)">
          <button type="button" :class="[
            'sidebar-item-button',
            'group relative flex w-full items-center appearance-none border-0 bg-transparent text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-orange-300 min-h-10 rounded-[10px] px-3 py-1.5 cursor-pointer',
            'text-(--text-muted) hover:bg-black/4 hover:text-(--text)',
            isItemActive(item) ? 'is-active' : '',
          ]" :title="isCollapsed ? item.label : ''" :aria-expanded="isExpanded(item)" @click="toggleGroup(item)">
            <span v-if="isItemActive(item)" aria-hidden="true"
              class="absolute left-0 top-2 bottom-2 w-0.75 rounded-full bg-(--brand)"></span>

            <span :class="['flex flex-1 items-center gap-2', isCollapsed ? 'justify-center' : '']">
              <span class="sidebar-icon grid h-7 w-7 shrink-0 place-items-center text-current">
                <BaseIcon :name="item.icon" :size="22" />
              </span>
              <span v-show="!isCollapsed"
                class="flex-1 truncate text-[15px] font-semibold leading-snug tracking-[-0.01em] text-current">{{
                item.label }}</span>
            </span>

            <span v-if="item.badge && !isCollapsed"
              class="ml-auto inline-grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{{
              item.badge }}</span>

            <span v-show="!isCollapsed"
              :class="['ml-1 inline-grid h-5 w-5 shrink-0 place-items-center text-(--text-muted) transition-transform duration-150', isExpanded(item) ? 'rotate-180' : 'rotate-0']">
              <BaseIcon name="chevron-down" :size="14" />
            </span>
          </button>

          <!-- Sub-items -->
          <div v-if="isExpanded(item) && !isCollapsed"
            class="mb-1 ml-9.5 mt-0.5 flex flex-col border-l border-black/8 pl-2">
            <button v-for="child in item.children" :key="getItemKey(child)" type="button" :class="[
              'sidebar-item-button',
              'group relative flex w-full appearance-none items-center gap-2 border-0 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-orange-300 min-h-8.5 rounded-lg px-3 py-1 cursor-pointer',
              isChildActive(child)
                ? 'bg-orange-100 text-(--brand)'
                : 'bg-transparent text-(--text-muted) hover:bg-black/4 hover:text-(--text)',
              isChildActive(child) ? 'is-active' : '',
            ]" @click="onNavigate(child)">
              <span v-if="child.icon" class="sidebar-icon grid h-6 w-6 shrink-0 place-items-center text-current">
                <BaseIcon :name="child.icon" :size="18" />
              </span>
              <span
                :class="['truncate text-[14px] font-medium leading-snug tracking-[-0.01em]', isChildActive(child) ? 'text-(--brand)' : 'text-current']">{{
                child.label }}</span>
            </button>
          </div>
        </template>

        <!-- Leaf item -->
        <button v-else type="button" :class="[
          'sidebar-item-button',
          'group relative flex w-full items-center appearance-none border-0 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-orange-300 min-h-10 rounded-[10px] px-3 py-1.5 cursor-pointer',
          isItemActive(item)
            ? 'bg-orange-100 text-(--brand)'
            : 'bg-transparent text-(--text-muted) hover:bg-black/4 hover:text-(--text)',
          isItemActive(item) ? 'is-active' : '',
        ]" :title="isCollapsed ? item.label : ''" @click="onNavigate(item)">
          <span v-if="isItemActive(item)" aria-hidden="true"
            class="absolute left-0 top-2 bottom-2 w-0.75 rounded-full bg-(--brand)"></span>

          <span :class="['flex flex-1 items-center gap-2', isCollapsed ? 'justify-center' : '']">
            <span class="sidebar-icon grid h-7 w-7 shrink-0 place-items-center text-current">
              <BaseIcon :name="item.icon" :size="22" />
            </span>
            <span v-show="!isCollapsed"
              :class="['flex-1 text-[15px] font-semibold leading-snug tracking-[-0.01em]', isItemActive(item) ? 'text-(--brand)' : 'text-current']">
              <template v-if="item.label === 'Pengiriman & Penerimaan'">
                <span class="block">Pengiriman &amp;</span>
                <span class="block">Penerimaan</span>
              </template>
              <span v-else class="truncate">{{ item.label }}</span>
            </span>
          </span>

          <span v-if="item.badge && !isCollapsed"
            class="ml-auto inline-grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{{
              item.badge }}</span>
        </button>
      </div>
    </nav>

    <div class="border-t border-black/6"></div>

    <!-- User footer -->
    <p v-show="!isCollapsed"
      class="mt-3 mb-1 ml-4 text-[11px] font-bold uppercase leading-none tracking-[0.18em] text-(--text-soft)">
      {{ footerLabel }}
    </p>
    <footer v-if="user" class="px-3 pb-4 pt-1">
      <div :class="[
        'flex items-center gap-2.5 rounded-xl border border-(--border) bg-(--surface-muted) p-2.5',
        isCollapsed ? 'justify-center' : '',
      ]">
        <div aria-hidden="true"
          class="flex h-9 w-9 min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-(--brand) text-[13px] font-bold leading-none text-white">
          {{ user.initials }}
        </div>
        <div v-show="!isCollapsed" class="min-w-0 flex-1 overflow-hidden">
          <strong class="block truncate text-[14px] font-bold leading-tight text-(--text)">{{ user.name }}</strong>
          <span class="block truncate text-[12px] leading-tight text-(--text-muted)">{{ user.jobs || footerRole
            }}</span>
        </div>
      </div>
    </footer>

    <!-- Collapse toggle (modern floating circular button) -->
    <button type="button"
      class="absolute top-1/2 -right-7 z-40 -translate-y-1/2 flex items-center justify-center h-10 w-10 rounded-full bg-(--surface-muted) border border-(--border) shadow-[0_8px_24px_rgba(2,6,23,0.16)] text-(--text) transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--brand) cursor-pointer"
      :aria-label="isCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'" :aria-pressed="isCollapsed"
      @click="isCollapsed = !isCollapsed" :title="isCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'">
      <BaseIcon :name="isCollapsed ? 'chevron-right' : 'chevron-left'" :size="16"
        class="transition-transform duration-200 text-(--text)" />
    </button>
  </aside>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseIcon from "../icon";
import { cloneNavigation, loadStrapiSidebarNavigation } from "./strapiNavigation";

const isCollapsed = ref(false);
const router = useRouter();
const route = useRoute();
const expandedGroups = ref(new Set());
/** Groups the user explicitly collapsed — wins over auto-expand when a child route is active. */
const userCollapsedGroups = ref(new Set());
const resolvedItems = ref([]);
const hasLoadedRemoteNavigation = ref(false);
let refreshTimerId = null;
let lastNavigationSignature = "";

function navigationSignature(items = []) {
  return JSON.stringify(
    (Array.isArray(items) ? items : []).map((item) => ({
      key: item?.key ?? "",
      label: item?.label ?? "",
      to: item?.to ?? "",
      order: item?.order ?? 0,
      icon: item?.icon ?? "",
      iconUrl: item?.iconUrl ?? "",
      defaultExpanded: Boolean(item?.defaultExpanded),
      badge: item?.badge ?? "",
      children: Array.isArray(item?.children)
        ? item.children.map((child) => ({
            key: child?.key ?? "",
            label: child?.label ?? "",
            to: child?.to ?? "",
            order: child?.order ?? 0,
            icon: child?.icon ?? "",
            iconUrl: child?.iconUrl ?? "",
            badge: child?.badge ?? "",
          }))
        : [],
    })),
  );
}

function applyResolvedItems(items, { fromRemote = false } = {}) {
  const nextItems = Array.isArray(items) ? items : [];
  const signature = navigationSignature(nextItems);
  if (signature === lastNavigationSignature) return false;

  lastNavigationSignature = signature;
  resolvedItems.value = nextItems;
  if (fromRemote) {
    hasLoadedRemoteNavigation.value = true;
  }
  return true;
}

function refreshRemoteNavigation() {
  hydrateRemoteNavigation();
}

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  user: {
    type: Object,
    default: null,
  },
  brandLabel: {
    type: String,
    default: "Kebun",
  },
  brandTitle: {
    type: String,
    default: "Energi",
  },
  brandIcon: {
    type: String,
    default: "plan-logo",
  },
  brandIconSize: {
    type: [Number, String],
    default: 32,
  },
  navLabel: {
    type: String,
    default: "Navigasi utama",
  },
  footerLabel: {
    type: String,
    default: "Masuk sebagai: ",
  },
  footerRole: {
    type: String,
    default: "Assistant Kebun",
  },
});

function onNavigate(item) {
  if (item?.to) {
    router.push(item.to).catch(() => { });
  }
}

function getItemKey(item) {
  return item?.key || item?.to || item?.label;
}

function hasChildren(item) {
  return Array.isArray(item?.children) && item.children.length > 0;
}

function pathMatches(base, p) {
  if (!base || typeof base !== 'string') return false;
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = p || '';
  return normalizedPath === normalizedBase || normalizedPath.startsWith(normalizedBase + '/');
}

function isChildActive(child) {
  return Boolean(child?.to) && pathMatches(child.to, route.path);
}

function isItemActive(item) {
  if (hasChildren(item)) {
    if (item?.to && pathMatches(item.to, route.path)) return true;
    return item.children.some(isChildActive);
  }
  return Boolean(item?.to) && pathMatches(item.to, route.path);
}

function isExpanded(item) {
  const key = getItemKey(item);
  if (userCollapsedGroups.value.has(key)) return false;
  return expandedGroups.value.has(key);
}

function toggleGroup(item) {
  const key = getItemKey(item);
  const nextExpanded = new Set(expandedGroups.value);
  const nextCollapsed = new Set(userCollapsedGroups.value);

  if (isExpanded(item)) {
    nextExpanded.delete(key);
    nextCollapsed.add(key);
  } else {
    nextExpanded.add(key);
    nextCollapsed.delete(key);
  }

  expandedGroups.value = nextExpanded;
  userCollapsedGroups.value = nextCollapsed;
}

watch(
  () => props.items,
  (items) => {
    if (!hasLoadedRemoteNavigation.value) {
      applyResolvedItems(cloneNavigation(items));
    }
  },
  { immediate: true, deep: true }
)

async function hydrateRemoteNavigation() {
  const remoteItems = await loadStrapiSidebarNavigation()
  if (Array.isArray(remoteItems) && remoteItems.length > 0) {
    applyResolvedItems(remoteItems, { fromRemote: true })
  }
}

onMounted(() => {
  hydrateRemoteNavigation()

  window.addEventListener('focus', refreshRemoteNavigation)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  refreshTimerId = globalThis.setInterval(() => {
    if (!document.hidden) {
      refreshRemoteNavigation()
    }
  }, 15000)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', refreshRemoteNavigation)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  if (refreshTimerId !== null) {
    globalThis.clearInterval(refreshTimerId)
    refreshTimerId = null
  }
})

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    refreshRemoteNavigation()
  }
}

watch(
  [() => route.path, resolvedItems],
  () => {
    const nextExpanded = new Set(expandedGroups.value);
    const nextCollapsed = new Set(userCollapsedGroups.value);

    resolvedItems.value.forEach((item) => {
      if (!hasChildren(item)) return;

      const key = getItemKey(item);
      const active = isItemActive(item);

      // Leaving a section clears the manual collapse so the next visit can auto-open.
      if (!active) {
        nextCollapsed.delete(key);
      }

      if (item.defaultExpanded || (active && !nextCollapsed.has(key))) {
        nextExpanded.add(key);
      }
    });

    expandedGroups.value = nextExpanded;
    userCollapsedGroups.value = nextCollapsed;
  },
  { immediate: true },
);
</script>

<style scoped>
:global(.theme-dark) .sidebar-item-button.is-active .sidebar-icon {
  color: #ffffff;
}

:global(.theme-dark) .sidebar-item-button:not(.is-active) .sidebar-icon {
  color: var(--text-muted);
}

:global(html:not(.theme-dark)) .sidebar-item-button.is-active .sidebar-icon {
  color: var(--brand);
}

:global(html:not(.theme-dark)) .sidebar-item-button:not(.is-active) .sidebar-icon {
  color: var(--text-muted);
}
</style>
