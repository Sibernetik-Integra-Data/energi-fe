<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': isCollapsed }">
    <div class="sidebar__brand">
      <div class="sidebar__mark" aria-hidden="true">
        <BaseIcon :name="brandIcon" :size="brandIconSize" />
      </div>
      <div v-show="!isCollapsed" class="sidebar__brand-copy">
        <p class="sidebar__eyebrow">{{ brandLabel }}</p>
        <h2>{{ brandTitle }}</h2>
      </div>

      <button
        class="sidebar__toggle"
        type="button"
        :aria-label="isCollapsed ? 'Show sidebar' : 'Hide sidebar'"
        :aria-pressed="isCollapsed"
        @click="isCollapsed = !isCollapsed"
      >
        <BaseIcon :name="isCollapsed ? 'sidebar-expand' : 'sidebar-collapse'" size="16" />
      </button>
    </div>

    <nav class="sidebar__nav" :aria-label="navLabel">
      <button
        v-for="item in items"
        :key="item.label"
        type="button"
        class="sidebar__item"
        :class="{ 'sidebar__item--active': isActive(item) }"
        :title="isCollapsed ? item.label : ''"
        @click="onClick(item)"
      >
        <span class="sidebar__icon">
          <BaseIcon :name="item.icon" />
        </span>
        <span v-show="!isCollapsed" class="sidebar__label">{{ item.label }}</span>
        <span v-if="item.badge && !isCollapsed" class="sidebar__badge">{{ item.badge }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import BaseIcon from '../icon'
import { useRouter, useRoute } from 'vue-router'

const isCollapsed = ref(false)

const router = useRouter()
const route = useRoute()

function onClick(item) {
  if (item && item.to) {
    router.push(item.to)
  }
}

function isActive(item) {
  if (item && item.to) {
    // Consider exact match or nested routes (e.g. /sensus/detail)
    const itemPath = item.to
    return route.path === itemPath || route.path.startsWith(itemPath + '/')
  }
  return !!(item && item.active)
}

defineProps({
  items: {
    type: Array,
    required: true
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
  }
})
</script>

<style scoped>
.sidebar {
  width: 232px;
  min-height: 100vh;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 180ms ease;
}

.sidebar--collapsed {
  width: 76px;
}

.sidebar__brand {
  min-height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-bottom: 1px solid var(--border);
}

.sidebar--collapsed .sidebar__brand {
  padding: 0 14px;
  justify-content: center;
  gap: 10px;
}

.sidebar--collapsed .sidebar__mark {
  width: 52px;
}

.sidebar__mark {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #fb8c00;
  border: 1px solid rgba(251, 140, 0, 0.18);
  display: grid;
  place-items: center;
}

.sidebar__brand-copy {
  min-width: 0;
}

.sidebar__toggle {
  margin-left: auto;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--text-muted);
  display: inline-grid;
  place-items: center;
  cursor: pointer;
}

.sidebar__toggle:hover {
  background: rgba(15, 23, 42, 0.04);
  color: var(--text);
}

.sidebar__toggle svg {
  transform: translateX(5px);
}

.sidebar--collapsed .sidebar__toggle {
  margin-left: 0;
}

.sidebar__eyebrow {
  margin: 0 0 3px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-soft);
}

.sidebar__brand h2 {
  margin: 0;
  font-size: 18px;
  line-height: 24px;
  letter-spacing: -0.03em;
}

.sidebar__nav {
  padding: 16px 12px 24px;
  display: grid;
  gap: 4px;
  overflow: auto;
}

.sidebar--collapsed .sidebar__nav {
  padding: 16px 10px 24px;
}

.sidebar__item {
  appearance: none;
  border: 0;
  background: transparent;
  width: 100%;
  min-height: 48px;
  padding: 0 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-muted);
  text-align: left;
  cursor: pointer;
  transition: background-color 150ms ease, color 150ms ease, transform 150ms ease;
}

.sidebar--collapsed .sidebar__item {
  justify-content: center;
  padding: 0;
  gap: 0;
}

.sidebar__item:hover {
  background: rgba(15, 23, 42, 0.03);
  color: var(--text);
}

.sidebar__item--active {
  background: var(--brand-soft);
  color: var(--brand);
}

.sidebar__icon {
  width: 24px;
  height: 24px;
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  color: currentColor;
}

.sidebar__label {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.sidebar--collapsed .sidebar__label {
  display: none;
}

.sidebar__badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-grid;
  place-items: center;
}

.sidebar--collapsed .sidebar__badge {
  display: none;
}

@media (max-width: 920px) {
  .sidebar {
    width: 100%;
    min-height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .sidebar--collapsed {
    width: 100%;
  }

  .sidebar__nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sidebar--collapsed .sidebar__nav {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
}
</style>