<template>
  <header class="header">
    <div class="header__title">
      <p class="header__eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
    </div>

    <div class="header__actions">
      <!-- Notification button intentionally hidden until notifications are supported. -->
      <!-- <button class="header__button" type="button" aria-label="Notifications">
        <span class="header__button-icon">
          <BaseIcon name="notifications" />
        </span>
        <span class="header__button-badge">{{ notifications }}</span>
      </button> -->

      <span class="header__divider" aria-hidden="true"></span>

      <div ref="userMenuRef" class="header__user-menu" :class="{ 'is-open': isUserMenuOpen }">
        <button class="header__user-trigger" type="button" @click="toggleUserMenu" :aria-expanded="isUserMenuOpen" aria-haspopup="menu">
          <div class="header__avatar">
            <img
              v-if="user.avatarUrl"
              :src="user.avatarUrl"
              :alt="user.name"
              class="header__avatar-img"
            />
            <span v-else>{{ user.initials }}</span>
          </div>
          <div class="header__user-copy">
            <strong>{{ user.name }}</strong>
            <span v-if="user.jobs">{{ user.jobs }}</span>
          </div>
          <span class="header__user-chevron">
            <BaseIcon name="chevron-down" :size="14" />
          </span>
        </button>

        <div v-if="isUserMenuOpen" class="header__user-menu-panel" role="menu" aria-label="User actions" @keydown.esc.stop="closeUserMenu">
          <!-- Compact profile card -->
          <div class="header__profile-card">
            <div class="header__profile-avatar-wrap">
              <img
                v-if="user.avatarUrl"
                :src="user.avatarUrl"
                :alt="user.name"
                class="header__profile-avatar-img"
              />
              <div v-else class="header__profile-avatar-initials">{{ user.initials }}</div>
            </div>
            <p class="header__profile-name">{{ user.name }}</p>
            <p v-if="user.jobs" class="header__profile-job">{{ user.jobs }}</p>
            <p v-if="user.userId" class="header__profile-id">ID{{ user.userId }}</p>
          </div>

          <div class="header__user-menu-divider" role="separator"></div>

          <button class="header__user-menu-item" type="button" role="menuitem" @click="handleProfile">
            <span class="header__user-menu-item-icon">
              <BaseIcon name="profile" :size="16" />
            </span>
            Profile
          </button>

          <button v-if="isOwner" class="header__user-menu-item" type="button" role="menuitem" @click="handleUserManagement">
            <span class="header__user-menu-item-icon">
              <BaseIcon name="users" :size="16" />
            </span>
            User Management
          </button>

          <button
            class="header__user-menu-item"
            type="button"
            role="menuitem"
            :aria-pressed="isDarkMode"
            @click="handleToggleTheme"
          >
            <span class="header__user-menu-item-icon">
              <BaseIcon :name="isDarkMode ? 'sun' : 'moon'" :size="16" />
            </span>
            <span class="header__user-menu-item-label">{{ isDarkMode ? 'Light mode' : 'Dark mode' }}</span>
            <span class="header__theme-pill" :class="isDarkMode ? 'is-dark' : 'is-light'">
              {{ isDarkMode ? 'ON' : 'OFF' }}
            </span>
          </button>

          <div v-if="onLogout" class="header__user-menu-divider" role="separator"></div>

          <button v-if="onLogout" class="header__user-menu-item" type="button" role="menuitem" @click="handleLogout">
            <span class="header__user-menu-item-icon">
              <BaseIcon name="logout" :size="16" />
            </span>
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseIcon from '../icon'
import { isDark as isDarkFn, toggleTheme } from '../../../utils/theme'
import { isOwnerAccess } from '../../../auth/access'

const props = defineProps({
  eyebrow: {
    type: String,
    default: 'Dashboard'
  },
  title: {
    type: String,
    required: true
  },
  notifications: {
    type: [Number, String],
    default: 0
  },
  user: {
    type: Object,
    required: true
  },
  onLogout: {
    type: Function,
    default: null
  }
  ,
  onProfile: {
    type: Function,
    default: null
  }
})

const isUserMenuOpen = ref(false)
const userMenuRef = ref(null)
const isDarkMode = ref(isDarkFn())
const router = useRouter()
const isOwner = computed(() => isOwnerAccess(props.user))

function closeUserMenu() {
  isUserMenuOpen.value = false
}

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function handleToggleTheme() {
  isDarkMode.value = toggleTheme()
}

function handleLogout() {
  closeUserMenu()
  if (typeof props.onLogout === 'function') {
    void props.onLogout()
  }
}

function handleProfile() {
  closeUserMenu()
  if (typeof props.onProfile === 'function') {
    void props.onProfile()
    return
  }
  void router.push('/profile').catch(() => {})
}

function handleUserManagement() {
  closeUserMenu()
  void router.push('/user-management').catch(() => {})
}

function handleDocumentClick(event) {
  if (!isUserMenuOpen.value) return
  const menu = userMenuRef.value
  if (menu && !menu.contains(event.target)) {
    closeUserMenu()
  }
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape') closeUserMenu()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
})
</script>

<style scoped>
.header {
  min-height: 60px;
  padding: 0 20px 0 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.header__title {
  min-width: 0;
}

.header__eyebrow {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-soft);
}

.header h1 {
  margin: 0;
  font-size: 15px;
  line-height: 20px;
  font-weight: 700;
}

.header__actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 0 0 auto;
}

.header__button {
  position: relative;
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  display: inline-grid;
  place-items: center;
  color: var(--text-muted);
}

.header__button-icon {
  width: 17px;
  height: 17px;
}

.header__button-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: 999px;
  background: #b91c1c;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: inline-grid;
  place-items: center;
}

.header__divider {
  width: 1px;
  height: 24px;
  background: var(--border);
}

.header__user {
  position: relative;
  display: flex;
  align-items: center;
}

.header__user-menu {
  position: relative;
}

.header__user-trigger {
  appearance: none;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 14px;
  cursor: pointer;
  color: inherit;
}

.header__user-trigger:hover,
.header__user-menu.is-open .header__user-trigger {
  background: var(--surface-muted);
}

.header__avatar {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #15803d;
  color: #fff;
  display: inline-grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  overflow: hidden;
}

.header__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.header__user-copy {
  display: grid;
  gap: 1px;
  justify-items: start;
  text-align: left;
}

.header__user-copy strong {
  font-size: 15px;
  line-height: 18px;
  font-weight: 700;
}

.header__user-copy span {
  font-size: 11px;
  line-height: 14px;
  color: var(--text-muted);
}

.header__user-chevron {
  display: inline-grid;
  place-items: center;
  color: var(--text-muted);
}

.header__user-menu-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 210px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12);
  z-index: 100;
}

/* Compact profile card inside dropdown */
.header__profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 14px 12px 12px;
}

.header__profile-avatar-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.header__profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.header__profile-avatar-initials {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #15803d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0;
}

.header__profile-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  text-align: center;
}

.header__profile-job {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.header__profile-id {
  margin: 0;
  font-size: 11px;
  color: var(--text-soft);
  text-align: center;
}

.header__user-menu-item {
  width: 100%;
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--text);
  border-radius: 12px;
  height: 38px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 700;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.header__user-menu-item-label {
  flex: 1;
}

.header__theme-pill {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 999px;
}

.header__theme-pill.is-dark {
  background: var(--brand-soft);
  color: var(--brand);
}

.header__theme-pill.is-light {
  background: var(--surface-muted);
  color: var(--text-soft);
}

.header__user-menu-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 0;
}

.header__user-menu-item:hover {
  background: var(--surface-muted);
}

.header__user-menu-item-icon {
  display: inline-grid;
  place-items: center;
  color: var(--text-muted);
}

:global(.theme-dark) .header__user-menu-panel {
  background: var(--surface);
  border-color: var(--border);
  color: var(--text);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.42);
}

:global(.theme-dark) .header__user-trigger:hover,
:global(.theme-dark) .header__user-menu.is-open .header__user-trigger {
  background: var(--surface-muted);
}

:global(.theme-dark) .header__user-menu-item {
  color: var(--text);
}

@media (max-width: 720px) {
  .header {
    min-height: 60px;
    padding: 12px 18px;
    align-items: flex-start;
    flex-direction: column;
  }

  .header__actions {
    width: 100%;
    justify-content: space-between;
  }

  .header__user {
    margin-left: auto;
  }
}
</style>
