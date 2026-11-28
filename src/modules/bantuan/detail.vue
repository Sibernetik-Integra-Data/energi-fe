<template>
  <div class="flex h-screen bg-(--bg) text-(--text) max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader :eyebrow="t('bantuan.title')" :title="page?.title || t('bantuan.guide')" :notifications="0" :user="user"
        :on-logout="logoutFromKeycloak" />
      <main class="min-w-0 flex-1 overflow-y-auto bg-(--surface-muted) p-6 max-[920px]:p-4">
        <RouterLink to="/bantuan" class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-(--brand) no-underline">
          <span aria-hidden="true">←</span> {{ t('bantuan.allGuides') }}
        </RouterLink>

        <p v-if="loading" class="text-sm text-(--text-muted)">{{ t('bantuan.loading') }}</p>
        <p v-else-if="error" class="rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--text-muted)">
          {{ t('bantuan.loadError') }}
        </p>
        <p v-else-if="!page" class="rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--text-muted)">
          {{ t('bantuan.notFound') }}
        </p>

        <article v-else class="help-article max-w-3xl rounded-2xl border border-(--border) bg-(--surface) p-6 max-[920px]:p-4">
          <p v-if="page.category" class="m-0 text-xs font-bold uppercase tracking-wider text-(--brand)">{{ page.category }}</p>
          <h1 class="m-0 mt-1 text-2xl font-semibold">{{ page.title }}</h1>
          <p v-if="page.summary" class="m-0 mt-2 text-(--text-muted)">{{ page.summary }}</p>
          <p v-if="updatedText" class="m-0 mt-2 text-xs text-(--text-soft)">{{ t('bantuan.updated', { date: updatedText }) }}</p>

          <div class="mt-5 flex flex-col gap-4">
            <template v-for="(section, index) in page.body" :key="index">
              <HelpRichText v-if="section.type === 'text'" :content="section.content" />

              <aside v-else-if="section.type === 'callout'" :class="['help-callout', `help-callout--${section.level}`]">
                <strong v-if="section.title" class="block">{{ section.title }}</strong>
                <span class="whitespace-pre-line">{{ section.text }}</span>
              </aside>

              <figure v-else-if="section.type === 'image' && mediaUrl(section.image)" class="m-0">
                <img :src="mediaUrl(section.image)" :alt="section.image.alternativeText || section.caption || ''" loading="lazy"
                  class="block h-auto max-w-full rounded-xl border border-(--border)" />
                <figcaption v-if="section.caption" class="mt-2 text-sm text-(--text-muted)">{{ section.caption }}</figcaption>
              </figure>

              <a v-else-if="section.type === 'file' && mediaUrl(section.file)" :href="mediaUrl(section.file)" download
                target="_blank" rel="noopener noreferrer"
                class="flex items-center gap-3 rounded-xl border border-(--border) bg-(--surface-muted) p-3 text-(--text) no-underline hover:border-(--brand)">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-(--brand-soft) text-xs font-bold text-(--brand)">
                  {{ fileBadge(section.file) }}
                </span>
                <span class="min-w-0">
                  <span class="block truncate font-semibold">{{ section.label }}</span>
                  <span class="block text-xs text-(--text-muted)">{{ t('bantuan.download') }}{{ section.file.sizeKb ? ` · ${formatFileSize(section.file.sizeKb)}` : '' }}</span>
                </span>
              </a>
            </template>
          </div>
        </article>
      </main>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { navigation as sharedNavigation } from '../shared/navigation'
import { currentIntlLocale } from '../../i18n'
import HelpRichText from './components/HelpRichText'
import { fetchHelpPage, formatFileSize, safeMediaUrl } from './api'

const route = useRoute()
const { t, locale } = useI18n()
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation

const page = ref(null)
const loading = ref(true)
const error = ref(false)

const updatedText = computed(() => {
  void locale.value
  const date = page.value?.updatedAt ? new Date(page.value.updatedAt) : null
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(currentIntlLocale(), { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
})

function mediaUrl(media) {
  return safeMediaUrl(media?.url)
}

function fileBadge(file) {
  const fromName = (file?.name || '').split('.').pop()
  return (fromName && fromName.length <= 4 ? fromName : 'FILE').toUpperCase()
}

watch(() => route.params.slug, async (slug) => {
  loading.value = true
  error.value = false
  try {
    page.value = await fetchHelpPage(slug)
  } catch {
    error.value = true
    page.value = null
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.help-callout {
  --tone: var(--info);
  border-left: 4px solid var(--tone);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--tone) 12%, transparent);
  padding: 12px 14px;
  line-height: 1.6;
}

.help-callout--warning {
  --tone: var(--warning);
}

.help-callout--danger {
  --tone: var(--danger);
}

.help-article :deep(.help-rt) {
  line-height: 1.7;
}

.help-article :deep(.help-rt > * + *) {
  margin-top: 0.75em;
}

.help-article :deep(.help-rt h2) {
  font-size: 1.25rem;
  font-weight: 700;
  margin-top: 1.25em;
}

.help-article :deep(.help-rt h3),
.help-article :deep(.help-rt h4),
.help-article :deep(.help-rt h5),
.help-article :deep(.help-rt h6) {
  font-size: 1.05rem;
  font-weight: 700;
  margin-top: 1em;
}

.help-article :deep(.help-rt p),
.help-article :deep(.help-rt h2),
.help-article :deep(.help-rt h3) {
  margin-bottom: 0;
}

.help-article :deep(.help-rt ul) {
  list-style: disc;
  padding-left: 1.5em;
}

.help-article :deep(.help-rt ol) {
  list-style: decimal;
  padding-left: 1.5em;
}

.help-article :deep(.help-rt blockquote) {
  border-left: 3px solid var(--border-strong);
  padding-left: 12px;
  color: var(--text-muted);
}

.help-article :deep(.help-rt pre) {
  overflow-x: auto;
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  padding: 12px;
  font-size: 0.875rem;
}

.help-article :deep(.help-rt__code-inline) {
  border-radius: 4px;
  background: var(--surface-muted);
  padding: 0 4px;
  font-size: 0.9em;
}

.help-article :deep(.help-rt__link) {
  color: var(--brand);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.help-article :deep(.help-rt__image) {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
}
</style>
