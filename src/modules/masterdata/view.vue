<template>
  <div class="flex h-screen bg-transparent max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader
        eyebrow="Master Data"
        title="Master Data"
        :notifications="0"
        :user="user"
        :on-logout="logoutFromKeycloak"
      />

      <main class="master-data-page flex-1 min-w-0 overflow-y-auto p-6 max-[920px]:p-4.5">
        <section class="master-data-hero">
          <div>
            <p class="master-data-kicker">Kelola referensi sistem</p>
            <h2>Pilih data yang ingin dikelola</h2>
            <p class="master-data-description">
              Akses seluruh halaman master data dalam satu tempat untuk menjaga data operasional tetap rapi dan konsisten.
            </p>
          </div>
          <div class="master-data-hero-icon" aria-hidden="true">
            <BaseIcon name="database" :size="32" />
          </div>
        </section>

        <section class="master-data-section" aria-labelledby="master-data-list-title">
          <div class="master-data-section-heading">
            <div>
              <h3 id="master-data-list-title">Daftar halaman</h3>
              <p>{{ masterDataItems.length }} halaman tersedia</p>
            </div>
          </div>

          <div class="master-data-grid">
            <button
              v-for="item in masterDataItems"
              :key="item.to"
              type="button"
              class="master-data-card"
              @click="goTo(item.to)"
            >
              <span class="master-data-card-icon" aria-hidden="true">
                <BaseIcon :name="item.icon || 'database'" :size="23" />
              </span>
              <span class="master-data-card-copy">
                <span class="master-data-card-title">{{ item.label }}</span>
                <span class="master-data-card-caption">Kelola {{ item.label.toLowerCase() }}</span>
              </span>
              <span class="master-data-card-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseIcon from '../shared/icon'
import BaseSidebar from '../shared/sidebar'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { navigation as sharedNavigation } from '../shared/navigation'

const router = useRouter()
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation
const masterDataItems = computed(() => {
  const masterData = navigation.find((item) => item.key === 'master-data' || item.to === '/master-data')
  return Array.isArray(masterData?.children) ? masterData.children.filter((item) => item?.to) : []
})

function goTo(path) {
  router.push(path).catch(() => {})
}
</script>

<style scoped>
.master-data-page {
  background: transparent;
}

.master-data-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--surface) 0%, var(--surface-muted) 100%);
  box-shadow: var(--shadow);
}

.master-data-kicker {
  margin: 0 0 0.55rem;
  color: var(--brand);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.master-data-hero h2 {
  margin: 0;
  color: var(--text);
  font-size: clamp(1.5rem, 2.5vw, 2.1rem);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.master-data-description {
  max-width: 42rem;
  margin: 0.7rem 0 0;
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.65;
}

.master-data-hero-icon,
.master-data-card-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  color: var(--brand);
  background: var(--brand-soft);
}

.master-data-hero-icon {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 1.25rem;
}

.master-data-section {
  margin-top: 1.75rem;
}

.master-data-section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin-bottom: 0.9rem;
}

.master-data-section-heading h3 {
  margin: 0;
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 800;
}

.master-data-section-heading p {
  margin: 0.3rem 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.master-data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: 0.9rem;
}

.master-data-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text);
  background: var(--surface);
  box-shadow: 0 5px 18px rgba(15, 23, 42, 0.035);
  text-align: left;
  cursor: pointer;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, background-color 160ms ease;
}

.master-data-card:hover {
  border-color: color-mix(in srgb, var(--brand) 55%, var(--border));
  background: var(--surface-muted);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}

.master-data-card:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.master-data-card-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.85rem;
}

.master-data-card-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
}

.master-data-card-title {
  overflow: hidden;
  font-size: 0.92rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.master-data-card-caption {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.master-data-card-arrow {
  color: var(--text-soft);
  font-size: 1.25rem;
  transition: color 160ms ease, transform 160ms ease;
}

.master-data-card:hover .master-data-card-arrow {
  color: var(--brand);
  transform: translateX(3px);
}

@media (max-width: 560px) {
  .master-data-hero {
    align-items: flex-start;
    padding: 1.35rem;
  }

  .master-data-hero-icon {
    width: 3.25rem;
    height: 3.25rem;
  }
}
</style>
