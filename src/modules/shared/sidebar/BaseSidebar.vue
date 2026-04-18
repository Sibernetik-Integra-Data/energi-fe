<template>
  <aside
    :class="[
      'relative flex flex-col h-screen sticky top-0 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] transition-[width] duration-200 ease-in-out pb-6',
      isCollapsed ? 'w-[68px]' : 'w-[260px]',
    ]"
  >
    <!-- Brand / Logo -->
    <div
      :class="[
        'flex flex-row items-center justify-start border-b border-[var(--border)] h-[60px] gap-5',
        isCollapsed ? 'px-3' : 'px-6',
      ]"
      style="padding: 14px; gap: 14px !important"
    >
      <div
        aria-hidden="true"
        class="grid h-10 w-10 mr-4 shrink-0 place-items-center rounded-[12px] bg-[linear-gradient(135deg,#fb8c00,#f59e0b)] text-white shadow-[0_8px_20px_rgba(251,140,0,0.22)] ring-1 ring-white/30"
      >
        <BaseIcon
          :name="brandIcon"
          :size="brandIconSize"
          class="justify-center items-center"
        />
      </div>

      <div
        v-show="!isCollapsed"
        class="flex flex-row gap-3 items-center min-w-0"
      >
        <p
          class="mb-1 text-[15px] font-bold uppercase tracking-[0.22em] text-[var(--text-soft)] whitespace-nowrap"
        >
          {{ brandLabel }}
        </p>
        <h2
          class="m-0 truncate p-0 text-[18px] font-bold leading-tight tracking-[-0.02em] text-[var(--text)]"
        >
          {{ brandTitle }}
        </h2>
      </div>
    </div>

    <!-- Nav (scrollable) -->
    <nav
      class="flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto px-3 py-3"
      :aria-label="navLabel"
    >
      <div v-for="item in items" :key="getItemKey(item)">
        <!-- Group item with children -->
        <template v-if="hasChildren(item)">
          <button
            type="button"
            :class="[
              'group relative flex w-full items-center appearance-none border-0 bg-transparent text-left outline-none ring-0 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[rgba(251,140,0,0.18)] min-h-[40px] rounded-[10px] px-3 py-1.5',
              'text-[var(--text-muted)] hover:bg-[rgba(15,23,42,0.04)] hover:text-[var(--text)]',
            ]"
            :title="isCollapsed ? item.label : ''"
            :aria-expanded="isExpanded(item)"
            @click="toggleGroup(item)"
          >
            <!-- Active indicator stripe -->
            <span
              v-if="isItemActive(item)"
              aria-hidden="true"
              class="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--brand)]"
            ></span>

            <span
              :class="[
                'flex flex-1 items-center',
                isCollapsed ? 'justify-center' : 'gap-4',
              ]"
              :style="isCollapsed ? '' : 'gap: 0.5rem !important'"
            >
              <span
                class="grid h-7 w-7 shrink-0 place-items-center text-current"
              >
                <BaseIcon :name="item.icon" :size="22" />
              </span>
              <span
                v-show="!isCollapsed"
                :class="[
                    'flex-1 truncate text-[16px] font-semibold leading-snug tracking-[-0.01em] text-current',
                  ]"
                >{{ item.label }}</span>
            </span>

            <span
              v-if="item.badge && !isCollapsed"
              class="ml-auto inline-grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-[#dc2626] px-1.5 text-[10px] font-bold text-white"
              >{{ item.badge }}</span>

            <span
              v-show="!isCollapsed"
              :class="[
                'ml-1 inline-grid h-5 w-5 shrink-0 place-items-center text-[var(--text-muted)] transition-transform duration-150',
                isExpanded(item) ? 'rotate-180' : 'rotate-0',
              ]"
            >
              <BaseIcon name="chevron-down" :size="14" />
            </span>
          </button>

          <!-- Sub-items -->
          <div
            v-if="isExpanded(item) && !isCollapsed"
            :class="[
              'mb-1 ml-[38px] mt-0.5 grid border-l border-[rgba(15,23,42,0.08)] pl-2',
              isItemActive(item) ? 'bg-[rgba(251,140,0,0.04)] rounded-[8px] p-2' : '',
            ]"
          >
            <button
              v-for="child in item.children"
              :key="getItemKey(child)"
              type="button"
              :class="[
                'group relative flex w-full appearance-none items-center gap-4 border-0 bg-transparent text-left outline-none ring-0 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[rgba(251,140,0,0.18)] min-h-[34px] rounded-[8px] px-3 py-1',
                isChildActive(child)
                  ? 'bg-[rgba(251,140,0,0.18)] text-[var(--brand)]'
                  : 'text-[var(--text-muted)] hover:bg-[rgba(15,23,42,0.04)] hover:text-[var(--text)]',
              ]"
              :style="[
                isChildActive(child)
                  ? 'background-color: rgba(251,140,0,0.18) !important'
                  : '',
                'gap: 0.5rem !important',
              ]"
              @click="onNavigate(child)"
            >
              <span
                v-if="child.icon"
                class="grid h-6 w-6 shrink-0 place-items-center text-current"
              >
                <BaseIcon :name="child.icon" :size="18" />
              </span>
              <span
                :class="[
                  'truncate text-[14px] font-medium leading-snug tracking-[-0.01em]',
                  isChildActive(child) ? 'text-[var(--brand)]' : 'text-current',
                ]"
                >{{ child.label }}</span>
            </button>
          </div>
        </template>

        <!-- Leaf item -->
        <button
          v-else
          type="button"
          :class="[
            'group relative flex w-full items-center appearance-none border-0 bg-transparent text-left outline-none ring-0 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[rgba(251,140,0,0.18)] min-h-[40px] rounded-[10px] px-3 py-1.5',
            isItemActive(item)
              ? 'bg-[rgba(251,140,0,0.22)] text-[var(--brand)]'
              : 'text-[var(--text-muted)] hover:bg-[rgba(15,23,42,0.04)] hover:text-[var(--text)]',
          ]"
          :title="isCollapsed ? item.label : ''"
          :style="
            isItemActive(item)
              ? 'background-color: rgba(251,140,0,0.22) !important'
              : ''
          "
          @click="onNavigate(item)"
        >
          <!-- Active indicator stripe -->
          <span
            v-if="isItemActive(item)"
            aria-hidden="true"
            class="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[var(--brand)]"
          ></span>

          <span
            :class="[
              'flex flex-1 items-center',
              isCollapsed ? 'justify-center' : 'gap-4',
            ]"
            :style="isCollapsed ? '' : 'gap: 0.5rem !important'"
          >
            <span class="grid h-7 w-7 shrink-0 place-items-center text-current">
              <BaseIcon :name="item.icon" :size="22" />
            </span>
            <span
              v-show="!isCollapsed"
              :class="[
                'flex-1 truncate text-[16px] font-semibold leading-snug tracking-[-0.01em]',
                isItemActive(item) ? 'text-[var(--brand)]' : 'text-current',
              ]"
              >{{ item.label }}</span
            >
          </span>

          <span
            v-if="item.badge && !isCollapsed"
            class="ml-auto inline-grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-[#dc2626] px-1.5 text-[10px] font-bold text-white"
            >{{ item.badge }}</span
          >
        </button>
      </div>
    </nav>

    <div class="border-t border-[rgba(15,23,42,0.06)]"></div>

    <!-- User footer -->
    <p
      v-show="!isCollapsed"
      class="mb-4 ml-4 text-[12px] font-bold uppercase leading-none tracking-[0.18em] text-[var(--text-soft)]"
      style="margin-left: 7px !important"
    >
      {{ footerLabel }}
    </p>
    <footer v-if="user" class="px-3 pb-4 pt-3">
      <div
        :class="[
          'flex items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface-muted)] py-3',
          isCollapsed ? 'justify-center px-2' : 'px-3',
        ]"
        style="padding: 10px; gap: 10px !important"
      >
        <div
          aria-hidden="true"
          class="flex h-10 w-10 min-h-[2.5rem] min-w-[2.5rem] shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-[14px] font-bold leading-none text-white"
        >
          {{ user.initials }}
        </div>
        <div v-show="!isCollapsed" class="min-w-0 flex-1 overflow-hidden">
          <strong
            class="block truncate text-[15px] font-bold leading-tight text-[var(--text)]"
            >{{ user.name }}</strong
          >
          <span
            class="block truncate text-[13px] leading-tight text-[var(--text-muted)]"
            >{{ user.jobs || footerRole }}</span
          >
        </div>
      </div>
    </footer>

    <button
      type="button"
      class="absolute top-1/2 -right-[28px] z-30 -translate-y-1/2 flex items-center justify-end pr-[6px] h-[72px] w-[28px] bg-[var(--surface)] border border-l-0 border-[var(--border)] rounded-r-[40px] shadow-[4px_0_12px_rgba(15,23,42,0.07)] text-[var(--text-muted)] transition-colors hover:bg-[rgba(251,140,0,0.05)] hover:text-[var(--brand)] focus-visible:outline-none"
      :aria-label="isCollapsed ? 'Tampilkan sidebar' : 'Sembunyikan sidebar'"
      :aria-pressed="isCollapsed"
      @click="isCollapsed = !isCollapsed"
    >
      <span
        class="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--surface)]"
        aria-hidden="true"
      ></span>

      <svg
        :style="{
          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          transition: 'transform 0.2s ease',
        }"
        xmlns="http://www.w3.org/2000/svg"
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </aside>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import BaseIcon from "../icon";

const isCollapsed = ref(false);
const router = useRouter();
const route = useRoute();
const expandedGroups = ref(new Set());

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
    default: "logo",
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
    router.push(item.to);
  }
}

function getItemKey(item) {
  return item?.key || item?.to || item?.label;
}

function hasChildren(item) {
  return Array.isArray(item?.children) && item.children.length > 0;
}

function isChildActive(child) {
  return Boolean(child?.to) && route.path === child.to;
}

function isItemActive(item) {
  if (hasChildren(item)) {
    return item.children.some(isChildActive);
  }
  return Boolean(item?.to) && route.path === item.to;
}

function isExpanded(item) {
  const key = getItemKey(item);
  return expandedGroups.value.has(key) || isItemActive(item);
}

function toggleGroup(item) {
  const key = getItemKey(item);
  const next = new Set(expandedGroups.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  expandedGroups.value = next;
}

watch(
  () => route.path,
  () => {
    const next = new Set(expandedGroups.value);
    props.items.forEach((item) => {
      if (!hasChildren(item)) return;
      if (item.defaultExpanded || isItemActive(item)) {
        next.add(getItemKey(item));
      }
    });
    expandedGroups.value = next;
  },
  { immediate: true },
);
</script>
