<template>
  <div class="flex h-screen bg-(--bg) text-(--text) max-[920px]:flex-col">
    <BaseSidebar :items="navigation" :user="user" />
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <BaseHeader :eyebrow="t('auditLog.eyebrow')" :title="t('auditLog.detail.title')" :notifications="0" :user="user" :on-logout="logoutFromKeycloak" />
      <main class="min-w-0 flex-1 overflow-y-auto bg-(--surface-muted) p-6 max-[920px]:p-4">
        <button type="button" class="mb-5 inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500" @click="router.push('/audit-log')"><span aria-hidden="true">←</span> {{ t('auditLog.detail.back') }}</button>
        <header class="mb-5">
          <p class="m-0 text-xs font-semibold uppercase tracking-wider text-teal-700">{{ t('auditLog.kicker') }}</p>
          <h1 class="m-0 mt-1 text-2xl font-semibold">{{ t('auditLog.detail.title') }}</h1>
          <p class="m-0 mt-1 break-all font-mono text-xs text-(--text-muted)">{{ route.params.id }}</p>
        </header>

        <div v-if="loading" class="rounded-xl bg-(--surface) px-4 py-12 text-center text-sm text-(--text-muted)">{{ t('auditLog.detail.loading') }}</div>
        <div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700" role="alert">{{ error }}</div>
        <template v-else-if="event">
          <section class="mb-5 rounded-2xl border border-(--border) bg-(--surface) p-4 sm:p-5">
            <h2 class="mb-4 mt-0 text-base font-semibold">{{ t('auditLog.detail.eventInfo') }}</h2>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoField :label="t('auditLog.field.createdAt')">{{ formatAuditDate(event.created_at) }}</InfoField>
              <InfoField :label="t('auditLog.field.occurredAt')">{{ formatAuditDate(event.occurred_at) }}</InfoField>
              <InfoField :label="t('auditLog.field.schemaVersion')">{{ event.schema_version }}</InfoField>
              <InfoField :label="t('auditLog.field.module')">{{ event.module }}</InfoField>
              <InfoField :label="t('auditLog.field.action')">{{ event.action }}</InfoField>
              <InfoField :label="t('auditLog.field.outcome')"><span class="capitalize">{{ event.outcome }}</span></InfoField>
              <InfoField :label="t('auditLog.field.entityType')">{{ event.entity_type }}</InfoField>
              <InfoField :label="t('auditLog.field.entityId')" :mono="true">{{ event.entity_id }}</InfoField>
              <InfoField :label="t('auditLog.field.reasonCode')">{{ event.reason_code }}</InfoField>
              <InfoField :label="t('auditLog.field.reason')" class="xl:col-span-3">{{ event.reason }}</InfoField>
            </div>
          </section>

          <section class="mb-5 rounded-2xl border border-(--border) bg-(--surface) p-4 sm:p-5">
            <h2 class="mb-4 mt-0 text-base font-semibold">{{ t('auditLog.detail.actor') }}</h2>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoField :label="t('auditLog.field.actorType')">{{ event.actor_type }}</InfoField>
              <InfoField :label="t('auditLog.field.actorId')" :mono="true">{{ event.actor_id }}</InfoField>
              <InfoField :label="t('auditLog.field.issuer')">{{ event.actor_issuer }}</InfoField>
              <InfoField :label="t('auditLog.field.emailSnapshot')">{{ event.user_email }}</InfoField>
              <InfoField :label="t('auditLog.field.accessSnapshot')">{{ event.user_access }}</InfoField>
              <InfoField :label="t('auditLog.field.rolesSnapshot')"><JsonValue :value="event.user_roles" /></InfoField>
            </div>
          </section>

          <section class="mb-5 rounded-2xl border border-(--border) bg-(--surface) p-4 sm:p-5">
            <h2 class="mb-4 mt-0 text-base font-semibold">{{ t('auditLog.detail.requestContext') }}</h2>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoField :label="t('auditLog.field.requestId')" :mono="true">{{ event.request_id }}</InfoField>
              <InfoField :label="t('auditLog.field.correlationId')" :mono="true">{{ event.correlation_id }}</InfoField>
              <InfoField :label="t('auditLog.field.operationId')" :mono="true">{{ event.operation_id }}</InfoField>
              <InfoField :label="t('auditLog.field.ipAddress')" :mono="true">{{ event.ip_address }}</InfoField>
              <InfoField :label="t('auditLog.field.source')">{{ event.source }}</InfoField>
              <InfoField :label="t('auditLog.field.changedFields')"><JsonValue :value="event.changed_fields" /></InfoField>
            </div>
          </section>

          <section class="mb-5 rounded-2xl border border-(--border) bg-(--surface) p-4 sm:p-5">
            <h2 class="mb-4 mt-0 text-base font-semibold">{{ t('auditLog.detail.dataChanges') }}</h2>
            <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div><h3 class="mb-2 mt-0 text-sm font-semibold text-(--text-muted)">{{ t('auditLog.detail.before') }}</h3><JsonValue :value="event.old_value" block /></div>
              <div><h3 class="mb-2 mt-0 text-sm font-semibold text-(--text-muted)">{{ t('auditLog.detail.after') }}</h3><JsonValue :value="event.new_value" block /></div>
            </div>
          </section>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import BaseHeader from '../shared/header'
import BaseSidebar from '../shared/sidebar'
import { logoutFromKeycloak, profileToUser, getAuthenticatedUser } from '../../auth/keycloak'
import { useAppStore } from '../../stores'
import { navigation as sharedNavigation } from '../shared/navigation'
import { displayValue, formatAuditDate } from './model'

const props = defineProps({ controller: { type: Object, required: true } })
const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const user = computed(() => profileToUser(appStore.profile) || getAuthenticatedUser())
const navigation = sharedNavigation
const event = ref(null)
const loading = ref(true)
const error = ref('')

const InfoField = defineComponent({
  props: { label: String, mono: Boolean },
  setup(fieldProps, { slots }) {
    return () => h('div', { class: 'min-w-0 rounded-xl bg-(--surface-muted) p-3 ' + (fieldProps.mono ? 'font-mono' : '') }, [
      h('p', { class: 'm-0 mb-1 text-xs font-medium text-(--text-muted)' }, fieldProps.label),
      h('div', { class: 'min-w-0 break-words text-sm text-(--text)' }, slots.default?.() || '—')
    ])
  }
})

const JsonValue = defineComponent({
  props: { value: null, block: Boolean },
  setup(valueProps) {
    return () => {
      const empty = valueProps.value === null || valueProps.value === undefined
      const content = empty ? '—' : typeof valueProps.value === 'object'
        ? JSON.stringify(valueProps.value, null, 2)
        : displayValue(valueProps.value)
      return h(valueProps.block ? 'pre' : 'div', {
        class: valueProps.block
          ? 'm-0 max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-[#f1f5f9] whitespace-pre-wrap break-all'
          : 'max-h-28 overflow-auto whitespace-pre-wrap break-all text-sm text-(--text)'
      }, content)
    }
  }
})

onMounted(async () => {
  const createdAt = String(route.query.created_at || '')
  if (!route.params.id || !createdAt) {
    error.value = t('auditLog.detail.incomplete')
    loading.value = false
    return
  }
  try {
    event.value = await props.controller.fetchEvent(String(route.params.id), createdAt)
    if (!event.value) error.value = t('auditLog.detail.notFound')
  } catch (cause) {
    error.value = cause?.message || cause?.error || t('auditLog.detail.loadError')
  } finally { loading.value = false }
})
</script>
