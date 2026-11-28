<template>
  <div class="flex h-screen bg-(--bg) text-(--text) max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader :eyebrow="t('bantuan.eyebrow')" :title="t('bantuan.title')" :notifications="0" :user="user" :on-logout="logoutFromKeycloak" />
      <main class="min-w-0 flex-1 overflow-y-auto bg-(--surface-muted) p-6 max-[920px]:p-4">
        <header class="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 class="m-0 text-2xl font-semibold">{{ t('bantuan.title') }}</h1>
            <p class="m-0 mt-1 text-sm text-(--text-muted)">{{ t('bantuan.subtitle') }}</p>
          </div>
          <label class="relative block w-full max-w-80">
            <span class="sr-only">{{ t('bantuan.searchLabel') }}</span>
            <input v-model="query" type="search" :placeholder="t('bantuan.searchPlaceholder')"
              class="h-10 w-full rounded-xl border border-(--border) bg-(--surface) px-3 text-sm text-(--text) outline-none focus:border-(--brand)" />
          </label>
        </header>

        <p v-if="loading" class="text-sm text-(--text-muted)">{{ t('bantuan.loading') }}</p>
        <p v-else-if="error" class="rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--text-muted)">
          {{ t('bantuan.loadError') }}
        </p>
        <p v-else-if="!groups.length" class="rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--text-muted)">
          {{ query ? t('bantuan.noMatch') : t('bantuan.empty') }}
        </p>

        <section v-for="group in groups" :key="group.category" class="mb-6">
          <h2 class="m-0 mb-3 text-xs font-bold uppercase tracking-wider text-(--text-soft)">{{ group.category }}</h2>
          <div class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            <RouterLink v-for="page in group.pages" :key="page.slug" :to="`/bantuan/${page.slug}`"
              class="block rounded-2xl border border-(--border) bg-(--surface) p-4 text-(--text) no-underline transition-colors hover:border-(--brand)">
              <h3 class="m-0 text-base font-semibold">{{ page.title }}</h3>
              <p v-if="page.summary" class="m-0 mt-1 text-sm leading-relaxed text-(--text-muted)">{{ page.summary }}</p>
            </RouterLink>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { computed, onMounted, ref } from 'vue'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { navigation as sharedNavigation } from '../shared/navigation'
import { fetchHelpPages } from './api'

const { t } = useI18n()
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation

const pages = ref([])
const loading = ref(true)
const error = ref(false)
const query = ref('')

const groups = computed(() => {
  const needle = query.value.trim().toLowerCase()
  const byCategory = new Map()
  for (const page of pages.value) {
    const haystack = `${page.title} ${page.summary} ${page.category}`.toLowerCase()
    if (needle && !haystack.includes(needle)) continue
    const category = page.category || t('bantuan.generalCategory')
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category).push(page)
  }
  return [...byCategory.entries()].map(([category, items]) => ({ category, pages: items }))
})

onMounted(async () => {
  try {
    pages.value = await fetchHelpPages()
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>
